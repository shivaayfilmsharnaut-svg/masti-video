import { useCallback, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

export type PullPhase = 'idle' | 'pulling' | 'release' | 'refreshing';

const RELEASE_THRESHOLD = 80; // px of overscroll needed to trigger a refresh on release

/**
 * Drives a premium, minimal pull-to-refresh UX on top of a normal
 * ScrollView/FlatList `refreshControl`. The native RefreshControl still owns
 * the actual pull *gesture* (proven, doesn't fight FlatList paging), but we
 * hide its default spinner and render our own RotateCw indicator instead,
 * fed by `phase`/`progress` computed here from scroll position + refreshing state.
 *
 * Usage:
 *   const ptr = usePullToRefresh(async () => { ...refetch... });
 *   <FlatList
 *     onScroll={ptr.onScroll}
 *     scrollEventThrottle={16}
 *     refreshControl={<RefreshControl refreshing={ptr.refreshing} onRefresh={ptr.onRefresh}
 *       tintColor="transparent" colors={['transparent']} progressBackgroundColor="transparent" />}
 *   />
 *   <PullToRefreshIndicator phase={ptr.phase} progress={ptr.progress} />
 */
export function usePullToRefresh(onRefreshAsync: () => Promise<void> | void) {
  const [refreshing, setRefreshing] = useState(false);
  const [phase, setPhase] = useState<PullPhase>('idle');
  const [progress, setProgress] = useState(0);
  const inFlightRef = useRef(false); // ✅ prevents overlapping refresh calls

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (inFlightRef.current) return; // already refreshing — don't fight the "refreshing" phase
      const y = e.nativeEvent.contentOffset.y;
      const pulled = Math.max(0, -y);
      if (pulled <= 0) {
        if (phase !== 'idle') setPhase('idle');
        if (progress !== 0) setProgress(0);
        return;
      }
      setProgress(Math.min(pulled / RELEASE_THRESHOLD, 1));
      setPhase(pulled >= RELEASE_THRESHOLD ? 'release' : 'pulling');
    },
    [phase, progress]
  );

  const onRefresh = useCallback(async () => {
    if (inFlightRef.current) return; // ✅ prevent multiple concurrent refresh requests
    inFlightRef.current = true;
    setRefreshing(true);
    setPhase('refreshing');
    setProgress(1);
    try {
      await onRefreshAsync();
    } catch (err) {
      // ✅ graceful handling of slow/failed network — never leave the spinner stuck
      console.warn('Pull-to-refresh failed:', err);
    } finally {
      setRefreshing(false);
      setPhase('idle');
      setProgress(0);
      inFlightRef.current = false;
    }
  }, [onRefreshAsync]);

  return { refreshing, phase, progress, onScroll, onRefresh };
}
