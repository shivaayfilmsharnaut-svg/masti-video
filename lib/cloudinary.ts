/**
 * Masti Video — Cloudinary Video Upload Service
 *
 * Config:
 *   Cloud Name  : hvia6qo9
 *   Upload Preset: masti_video_unsigned  (unsigned, no API secret needed)
 *   Upload URL  : https://api.cloudinary.com/v1_1/hvia6qo9/video/upload
 *
 * Uses XMLHttpRequest (not fetch) so we get real upload progress events.
 * Never touches Firebase Storage or Firestore — only Firebase Auth is used
 * elsewhere in this project.
 *
 * IMPORTANT platform quirk (this is what was silently breaking uploads):
 * React Native's `{ uri, type, name }` FormData file trick only works on
 * native runtimes (iOS/Android). On web (react-native-web — which is what
 * the Replit preview actually runs), FormData requires a real Blob/File
 * object; passing the RN-style object there serializes into a near-empty
 * body, so the "upload" finishes in a couple hundred milliseconds no matter
 * how large the source video is, Cloudinary never receives real bytes, and
 * nothing shows up in the Media Library — while the old code still resolved
 * as if it worked. We now branch by platform and fetch a real Blob on web.
 */

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

const CLOUD_NAME   = 'hvia6qo9';
const UPLOAD_PRESET = 'masti_video_unsigned';
const UPLOAD_URL   = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`;

export interface CloudinaryUploadResult {
  secure_url: string;   // ← store this in your backend/DB
  public_id: string;
  duration: number;     // seconds
  width: number;
  height: number;
  format: string;       // e.g. "mp4"
  bytes: number;
  resource_type: string;
  thumbnail_url: string; // derived — auto-generated first-frame JPEG
}

/**
 * Cloudinary auto-generates a first-frame JPEG for every uploaded video,
 * reachable at the same delivery path with the extension swapped to `.jpg`.
 * No extra upload/transformation call needed.
 */
export function getCloudinaryVideoThumbnail(secureUrl: string): string {
  return secureUrl.replace(/\.[a-zA-Z0-9]+(\?.*)?$/, '.jpg');
}

function guessMimeAndExt(uri: string): { type: string; ext: string } {
  const match = /\.([a-zA-Z0-9]+)(\?.*)?$/.exec(uri);
  const ext = (match?.[1] || 'mp4').toLowerCase();
  const type = ext === 'mov' ? 'video/quicktime' : `video/${ext}`;
  return { type, ext };
}

/**
 * Verifies the local video actually exists (and is non-empty) before we
 * spend any time uploading it, and returns its size in bytes for logging /
 * comparison against what Cloudinary reports back.
 *
 * - Native (iOS/Android): checked via expo-file-system against the file:// URI.
 * - Web: the "file" is a blob:/data: URL from the picker — the only reliable
 *   way to check it is to actually fetch it into a Blob, so we do that here
 *   and hand the Blob back to the caller to reuse for the real upload
 *   (avoids fetching the same blob twice).
 */
async function verifyLocalVideo(localUri: string): Promise<{ size: number; webBlob?: Blob }> {
  if (Platform.OS === 'web') {
    let resp: Response;
    try {
      resp = await fetch(localUri);
    } catch (e) {
      throw new Error('Could not read the recorded video file. Please try recording again.');
    }
    if (!resp.ok) {
      throw new Error(`Could not read the recorded video file (HTTP ${resp.status}).`);
    }
    const blob = await resp.blob();
    if (!blob || blob.size === 0) {
      throw new Error('The selected video file is empty or unreadable. Please try again.');
    }
    return { size: blob.size, webBlob: blob };
  }

  const file = new FileSystem.File(localUri);
  if (!file.exists) {
    throw new Error('The recorded video file could not be found on this device. Please try again.');
  }
  const size = file.size ?? 0;
  if (!size) {
    throw new Error('The recorded video file is empty. Please try recording again.');
  }
  return { size };
}

/**
 * Upload a local video URI to Cloudinary.
 *
 * @param localUri   - file:// (native) or blob:/data: (web) URI from expo-camera / expo-image-picker
 * @param onProgress - called with 0–100 as bytes are sent; only reaches 100
 *                     once Cloudinary has confirmed the upload with a valid secure_url.
 * @returns          - CloudinaryUploadResult with secure_url + metadata
 */
export async function uploadVideoToCloudinary(
  localUri: string,
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> {
  console.log('[Cloudinary] Verifying local video before upload:', localUri, 'platform =', Platform.OS);
  const { size: fileSize, webBlob } = await verifyLocalVideo(localUri);
  console.log(`[Cloudinary] File verified. size = ${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    const { type, ext } = guessMimeAndExt(localUri);

    if (Platform.OS === 'web' && webBlob) {
      // Real Blob required on web — the RN `{uri,type,name}` object silently
      // fails to attach real bytes here.
      formData.append('file', webBlob, `masti_upload.${ext}`);
    } else {
      // React Native (iOS/Android) FormData accepts { uri, type, name } for file parts.
      formData.append('file', {
        uri: localUri,
        type,
        name: `masti_upload.${ext}`,
      } as unknown as Blob);
    }

    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('cloud_name', CLOUD_NAME);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', UPLOAD_URL);
    xhr.timeout = 5 * 60 * 1000; // 5 minutes max

    const startedAt = Date.now();
    let sawRealProgress = false;

    // ── Real upload progress ──────────────────────────────────────────────
    // Cap at 95 while uploading; jump to 100 only after server confirms
    // AND the response contains a valid secure_url (see xhr.onload below).
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        sawRealProgress = true;
        const pct = Math.min(Math.floor((e.loaded / e.total) * 95), 95);
        onProgress(pct);
      }
    };

    // ── Success / failure ────────────────────────────────────────────────
    xhr.onload = () => {
      const elapsedMs = Date.now() - startedAt;
      console.log(
        `[Cloudinary] Upload request finished in ${elapsedMs}ms — HTTP ${xhr.status}` +
        (sawRealProgress ? '' : ' (WARNING: no upload progress events fired — body may not have contained real file bytes)')
      );
      console.log('[Cloudinary] xhr.status:', xhr.status);
      console.log('[Cloudinary] xhr.responseText:', xhr.responseText?.slice(0, 2000));

      if (xhr.status < 200 || xhr.status >= 300) {
        let detail = '';
        try {
          const err = JSON.parse(xhr.responseText);
          detail = err?.error?.message || '';
        } catch { /* ignore — responseText wasn't JSON */ }
        console.error(`[Cloudinary] Upload failed (HTTP ${xhr.status}): ${detail}`);
        reject(new Error(`Cloudinary upload failed (HTTP ${xhr.status})${detail ? ': ' + detail : ''}`));
        return;
      }

      let data: CloudinaryUploadResult;
      try {
        data = JSON.parse(xhr.responseText);
      } catch (e) {
        console.error('[Cloudinary] Upload returned HTTP 200 but the response body was not valid JSON:', xhr.responseText);
        reject(new Error('Cloudinary returned an unexpected response. Please try again.'));
        return;
      }

      // Never trust a "success" that doesn't actually include a playable URL.
      if (!data.secure_url) {
        console.error('[Cloudinary] Upload response is missing secure_url — treating as a failure:', data);
        reject(new Error('Cloudinary did not return a video URL. The upload did not complete — please try again.'));
        return;
      }

      // Sanity-check that Cloudinary actually received the real file, not a
      // near-empty body — this is the exact failure mode that used to slip
      // through silently on web.
      if (typeof data.bytes === 'number' && data.bytes > 0 && data.bytes < fileSize * 0.5) {
        console.error(
          `[Cloudinary] Uploaded size (${data.bytes} bytes) is far smaller than the source file (${fileSize} bytes) — upload likely truncated.`
        );
        reject(new Error('The upload appears to be incomplete or corrupted. Please try again.'));
        return;
      }

      data.thumbnail_url = getCloudinaryVideoThumbnail(data.secure_url);
      onProgress?.(100);
      console.log('[Cloudinary] Upload succeeded:', {
        secure_url: data.secure_url,
        public_id: data.public_id,
        thumbnail_url: data.thumbnail_url,
        duration: data.duration,
        bytes: data.bytes,
        elapsedMs,
      });
      resolve(data);
    };

    xhr.onerror = () => {
      console.error('[Cloudinary] Network error during upload. xhr.status:', xhr.status, 'responseText:', xhr.responseText);
      reject(new Error('Network error — check your internet connection.'));
    };
    xhr.ontimeout = () => {
      console.error('[Cloudinary] Upload timed out after', Date.now() - startedAt, 'ms');
      reject(new Error('Upload timed out — try again on a faster connection.'));
    };

    console.log('[Cloudinary] Starting upload to', UPLOAD_URL, `(${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
    xhr.send(formData);
  });
}
