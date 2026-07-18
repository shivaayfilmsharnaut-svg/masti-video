// @ts-nocheck
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Animated,
  
  
TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  TextInput,
  Image,
  ScrollView,
  FlatList,
  Linking,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Share,
  RefreshControl,
  Alert,
  PanResponder,
  Switch,
  Easing,
  StatusBar,
} from 'react-native';

import { Video, Audio } from 'expo-av';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons, Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { Camera, useCameraDevice, useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle } from 'react-native-svg';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import PullToRefreshIndicator from '../components/PullToRefreshIndicator';
import LoginBottomSheet from '../components/LoginBottomSheet';
import { onAuthStateChanged } from 'firebase/auth';
import { firebaseAuth } from '../lib/firebase';
import { uploadVideoToCloudinary } from '../lib/cloudinary';
import { useQueryClient } from '@tanstack/react-query';
const { height, width } = Dimensions.get('window');
const HEADER_WIDTH = 220;
const TAB_WIDTH = HEADER_WIDTH / 2;
const LINE_WIDTH = 30;
const LINE_CENTER_OFFSET = (TAB_WIDTH - LINE_WIDTH) / 2;

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const DUMMY_VIDEOS = [
  { id: '1', user: '@MastiIndia', name: 'Masti India', userId: '@MastiIndia', bio: 'India Entertainment 🔥', profileImage: 'https://i.pravatar.cc/300?img=1', followers: 12500, following: 180, likes: 100, desc: 'India Entertainment #viral', url: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4', musicCover: 'https://i.pravatar.cc/300?img=5', youtube: 'https://youtube.com/@mastiindia', instagram: 'https://instagram.com/mastiindia', facebook: 'https://facebook.com/mastiindia' },
  { id: '2', user: '@comedy_king', name: 'Comedy King', userId: '@comedy_king', bio: 'Hasi nahi rukegi 😂', profileImage: 'https://i.pravatar.cc/300?img=2', followers: 5420, following: 95, likes: 245, desc: 'Hasi nahi rukegi 😂', url: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4', musicCover: 'https://i.pravatar.cc/300?img=6', youtube: '', instagram: 'https://instagram.com/comedyking', facebook: '' },
  { id: '3', user: '@dance_queen', name: 'Dance Queen', userId: '@dance_queen', bio: 'New trend alert 💃', profileImage: 'https://i.pravatar.cc/300?img=3', followers: 9800, following: 210, likes: 89, desc: 'New trend alert 💃', url: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4', musicCover: 'https://i.pravatar.cc/300?img=7', youtube: 'https://youtube.com/@dancequeen', instagram: '', facebook: 'https://facebook.com/dancequeen' },
  { id: '4', user: '@tech_guru', name: 'Tech Guru', userId: '@tech_guru', bio: 'Latest tech tips 📱', profileImage: 'https://i.pravatar.cc/300?img=4', followers: 32000, following: 150, likes: 512, desc: 'iPhone 17 tips #tech', url: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4', musicCover: 'https://i.pravatar.cc/300?img=8', youtube: 'https://youtube.com/@techguru', instagram: 'https://instagram.com/techguru', facebook: '' },
  { id: '5', user: '@food_lover', name: 'Food Lover', userId: '@food_lover', bio: 'Street food king 🍔', profileImage: 'https://i.pravatar.cc/300?img=9', followers: 8900, following: 320, likes: 178, desc: 'Delhi street food #food', url: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4', musicCover: 'https://i.pravatar.cc/300?img=10', youtube: '', instagram: 'https://instagram.com/foodlover', facebook: 'https://facebook.com/foodlover' },
];

// ✅ BUG FIX: key used to persist app state (likes/followers/following/posts/profile) in AsyncStorage
const STORAGE_KEY = '@masti_video_app_state_v1';

const DUMMY_COMMENTS = [
  { id: '1', username: 'silent.s.k.y', profilePic: 'https://i.pravatar.cc/300?img=10', comment: 'मेरे पास तो कोई भाई भी नहीं है😢', time: '3h', likes: 20, isAuthor: false },
  { id: '2', username: 'diamond__patell', profilePic: 'https://i.pravatar.cc/300?img=11', comment: 'Main hun na😍❤️', time: '2h', likes: 10, isAuthor: true, authorBadge: 'Author' },
];

const SHARE_OPTIONS = [
  { id: '1', name: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
  { id: '2', name: 'Instagram', icon: 'logo-instagram', color: '#E1306C' },
  { id: '3', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
  { id: '4', name: 'Copy Link', icon: 'link', color: '#fff' },
];

const FILTERS_LIST = ['Normal', 'Vintage', 'B&W', 'Warm', 'Cool', 'Vibrant'];

const SH = (n: number) => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;
const SONGS_LIST = [
  // ── Bollywood Hits ──
  { id: 's1',  title: 'Kesariya',              artist: 'Arijit Singh',       duration: '4:28', cover: 'https://i.pravatar.cc/80?img=11', genre: 'Bollywood',     audioUrl: SH(1)  },
  { id: 's2',  title: 'Tum Hi Ho',             artist: 'Arijit Singh',       duration: '4:10', cover: 'https://i.pravatar.cc/80?img=12', genre: 'Bollywood',     audioUrl: SH(2)  },
  { id: 's3',  title: 'Balam Pichkari',        artist: 'Vishal-Shekhar',     duration: '3:52', cover: 'https://i.pravatar.cc/80?img=13', genre: 'Bollywood',     audioUrl: SH(3)  },
  { id: 's4',  title: 'Galliyan',              artist: 'Ankit Tiwari',       duration: '4:55', cover: 'https://i.pravatar.cc/80?img=14', genre: 'Bollywood',     audioUrl: SH(4)  },
  { id: 's5',  title: 'Raataan Lambiyan',      artist: 'Jubin Nautiyal',     duration: '3:36', cover: 'https://i.pravatar.cc/80?img=15', genre: 'Bollywood',     audioUrl: SH(5)  },
  { id: 's6',  title: 'Dil Diyaan Gallan',     artist: 'Atif Aslam',         duration: '4:12', cover: 'https://i.pravatar.cc/80?img=16', genre: 'Bollywood',     audioUrl: SH(6)  },
  { id: 's7',  title: 'Tera Ban Jaunga',       artist: 'Akhil',              duration: '3:48', cover: 'https://i.pravatar.cc/80?img=17', genre: 'Bollywood',     audioUrl: SH(7)  },
  { id: 's8',  title: 'Hawayein',              artist: 'Arijit Singh',       duration: '4:36', cover: 'https://i.pravatar.cc/80?img=20', genre: 'Bollywood',     audioUrl: SH(8)  },
  { id: 's9',  title: 'Lut Gaye',              artist: 'Jubin Nautiyal',     duration: '3:55', cover: 'https://i.pravatar.cc/80?img=21', genre: 'Bollywood',     audioUrl: SH(9)  },
  { id: 's10', title: 'Phir Bhi Tumko Chahungaa', artist: 'Arijit Singh',   duration: '5:01', cover: 'https://i.pravatar.cc/80?img=19', genre: 'Bollywood',     audioUrl: SH(10) },
  { id: 's11', title: 'Dil Se Re',             artist: 'AR Rahman',          duration: '5:20', cover: 'https://i.pravatar.cc/80?img=30', genre: 'Bollywood',     audioUrl: SH(11) },
  { id: 's12', title: 'Channa Mereya',         artist: 'Arijit Singh',       duration: '4:49', cover: 'https://i.pravatar.cc/80?img=31', genre: 'Bollywood',     audioUrl: SH(12) },
  { id: 's13', title: 'Mere Rashke Qamar',     artist: 'Nusrat Fateh Ali',   duration: '4:15', cover: 'https://i.pravatar.cc/80?img=32', genre: 'Bollywood',     audioUrl: SH(13) },
  { id: 's14', title: 'Dilbaro',               artist: 'Harshdeep Kaur',     duration: '3:40', cover: 'https://i.pravatar.cc/80?img=33', genre: 'Bollywood',     audioUrl: SH(14) },
  { id: 's15', title: 'Ik Vaari Aa',           artist: 'Arijit Singh',       duration: '4:02', cover: 'https://i.pravatar.cc/80?img=34', genre: 'Bollywood',     audioUrl: SH(15) },
  { id: 's16', title: 'Kabira',                artist: 'Rekha Bhardwaj',     duration: '3:55', cover: 'https://i.pravatar.cc/80?img=35', genre: 'Bollywood',     audioUrl: SH(16) },
  { id: 's17', title: 'Tujhe Kitna Chahne Lage', artist: 'Arijit Singh',    duration: '4:30', cover: 'https://i.pravatar.cc/80?img=36', genre: 'Bollywood',     audioUrl: SH(17) },
  { id: 's18', title: 'Khairiyat',             artist: 'Arijit Singh',       duration: '3:28', cover: 'https://i.pravatar.cc/80?img=37', genre: 'Bollywood',     audioUrl: SH(1)  },
  { id: 's19', title: 'Bekhayali',             artist: 'Sachet Tandon',      duration: '5:10', cover: 'https://i.pravatar.cc/80?img=38', genre: 'Bollywood',     audioUrl: SH(2)  },
  { id: 's20', title: 'Teri Mitti',            artist: 'B Praak',            duration: '4:05', cover: 'https://i.pravatar.cc/80?img=39', genre: 'Bollywood',     audioUrl: SH(3)  },
  // ── Punjabi ──
  { id: 's21', title: 'Pasoori',               artist: 'Ali Sethi',          duration: '3:30', cover: 'https://i.pravatar.cc/80?img=18', genre: 'Punjabi',       audioUrl: SH(4)  },
  { id: 's22', title: 'Brown Munde',           artist: 'AP Dhillon',         duration: '3:10', cover: 'https://i.pravatar.cc/80?img=40', genre: 'Punjabi',       audioUrl: SH(5)  },
  { id: 's23', title: 'Excuses',               artist: 'AP Dhillon',         duration: '2:58', cover: 'https://i.pravatar.cc/80?img=41', genre: 'Punjabi',       audioUrl: SH(6)  },
  { id: 's24', title: 'Lover',                 artist: 'Diljit Dosanjh',     duration: '3:45', cover: 'https://i.pravatar.cc/80?img=42', genre: 'Punjabi',       audioUrl: SH(7)  },
  { id: 's25', title: 'Putt Jatt Da',          artist: 'Diljit Dosanjh',     duration: '4:00', cover: 'https://i.pravatar.cc/80?img=43', genre: 'Punjabi',       audioUrl: SH(8)  },
  // ── International ──
  { id: 's26', title: 'Photograph',            artist: 'Ed Sheeran',         duration: '4:19', cover: 'https://i.pravatar.cc/80?img=22', genre: 'International', audioUrl: SH(9)  },
  { id: 's27', title: 'Shape of You',          artist: 'Ed Sheeran',         duration: '3:53', cover: 'https://i.pravatar.cc/80?img=44', genre: 'International', audioUrl: SH(10) },
  { id: 's28', title: 'Dynamite',              artist: 'BTS',                duration: '3:19', cover: 'https://i.pravatar.cc/80?img=45', genre: 'K-Pop',         audioUrl: SH(11) },
  { id: 's29', title: 'Butter',                artist: 'BTS',                duration: '2:44', cover: 'https://i.pravatar.cc/80?img=46', genre: 'K-Pop',         audioUrl: SH(12) },
  { id: 's30', title: 'Levitating',            artist: 'Dua Lipa',           duration: '3:23', cover: 'https://i.pravatar.cc/80?img=47', genre: 'International', audioUrl: SH(13) },
  // ── Devotional ──
  { id: 's31', title: 'Jai Shri Ram',          artist: 'Traditional',        duration: '5:00', cover: 'https://i.pravatar.cc/80?img=48', genre: 'Devotional',    audioUrl: SH(14) },
  { id: 's32', title: 'Hanuman Chalisa',       artist: 'Hariharan',          duration: '7:30', cover: 'https://i.pravatar.cc/80?img=49', genre: 'Devotional',    audioUrl: SH(15) },
  // ── Dialogues / Viral Sounds ──
  { id: 's33', title: 'Pushpa - Jhukega Nahi', artist: 'Movie Dialogue',     duration: '0:15', cover: 'https://i.pravatar.cc/80?img=50', genre: 'Dialogue',      audioUrl: SH(16) },
  { id: 's34', title: 'RRR - Naatu Naatu',     artist: 'MM Keeravani',       duration: '3:47', cover: 'https://i.pravatar.cc/80?img=51', genre: 'Dialogue',      audioUrl: SH(17) },
  { id: 's35', title: 'KGF - Ek Dum Solid',    artist: 'Movie Sound',        duration: '0:30', cover: 'https://i.pravatar.cc/80?img=52', genre: 'Dialogue',      audioUrl: SH(1)  },
  // ── Bhojpuri ──
  { id: 's36', title: 'Lollypop Lagelu',        artist: 'Pawan Singh',        duration: '3:45', cover: 'https://i.pravatar.cc/80?img=53', genre: 'Bhojpuri',      audioUrl: SH(2)  },
  { id: 's37', title: 'Kamar Tore Da',          artist: 'Pawan Singh',        duration: '4:00', cover: 'https://i.pravatar.cc/80?img=54', genre: 'Bhojpuri',      audioUrl: SH(3)  },
  { id: 's38', title: 'Piya Ghar Aaja',         artist: 'Khesari Lal',        duration: '4:10', cover: 'https://i.pravatar.cc/80?img=55', genre: 'Bhojpuri',      audioUrl: SH(4)  },
  { id: 's39', title: 'Patna Se Chali',         artist: 'Khesari Lal',        duration: '3:55', cover: 'https://i.pravatar.cc/80?img=56', genre: 'Bhojpuri',      audioUrl: SH(5)  },
  { id: 's40', title: 'Tohara Bina Jiya Na Lage', artist: 'Ritesh Pandey',   duration: '4:20', cover: 'https://i.pravatar.cc/80?img=57', genre: 'Bhojpuri',      audioUrl: SH(6)  },
  { id: 's41', title: 'Devara Bada Satawela',   artist: 'Nirahua',            duration: '3:30', cover: 'https://i.pravatar.cc/80?img=58', genre: 'Bhojpuri',      audioUrl: SH(7)  },
  { id: 's42', title: 'Aara Hile Chhapra Hile', artist: 'Pawan Singh',       duration: '3:50', cover: 'https://i.pravatar.cc/80?img=59', genre: 'Bhojpuri',      audioUrl: SH(8)  },
  // ── Marathi ──
  { id: 's43', title: 'Zingaat',                artist: 'Ajay-Atul',          duration: '3:10', cover: 'https://i.pravatar.cc/80?img=60', genre: 'Marathi',       audioUrl: SH(9)  },
  { id: 's44', title: 'Ye G Baya',              artist: 'Avadhoot Gupte',     duration: '4:05', cover: 'https://i.pravatar.cc/80?img=61', genre: 'Marathi',       audioUrl: SH(10) },
  { id: 's45', title: 'Natrang - Khel Mandala', artist: 'Ajay-Atul',          duration: '4:30', cover: 'https://i.pravatar.cc/80?img=62', genre: 'Marathi',       audioUrl: SH(11) },
  { id: 's46', title: 'Apsara Aali',            artist: 'Siddharth Mahadevan',duration: '3:48', cover: 'https://i.pravatar.cc/80?img=63', genre: 'Marathi',       audioUrl: SH(12) },
  { id: 's47', title: 'Popat Zala',             artist: 'Bela Shende',        duration: '3:22', cover: 'https://i.pravatar.cc/80?img=64', genre: 'Marathi',       audioUrl: SH(13) },
  { id: 's48', title: 'Vaat Majhi Bagh',        artist: 'Vaishali Made',      duration: '4:00', cover: 'https://i.pravatar.cc/80?img=65', genre: 'Marathi',       audioUrl: SH(14) },
  // ── Hindi ──
  { id: 's49', title: 'Ik Pal Ka Jeena',        artist: 'Udit Narayan',       duration: '4:15', cover: 'https://i.pravatar.cc/80?img=66', genre: 'Hindi',         audioUrl: SH(15) },
  { id: 's50', title: 'Kuch Kuch Hota Hai',     artist: 'Udit Narayan',       duration: '5:10', cover: 'https://i.pravatar.cc/80?img=67', genre: 'Hindi',         audioUrl: SH(16) },
  { id: 's51', title: 'Tere Bina Zindagi Se',   artist: 'Kishore Kumar',      duration: '4:55', cover: 'https://i.pravatar.cc/80?img=68', genre: 'Hindi',         audioUrl: SH(17) },
  { id: 's52', title: 'Pehla Nasha',            artist: 'Udit Narayan',       duration: '5:30', cover: 'https://i.pravatar.cc/80?img=69', genre: 'Hindi',         audioUrl: SH(1)  },
  { id: 's53', title: 'Dil Hai Ke Manta Nahin', artist: 'Kumar Sanu',         duration: '4:40', cover: 'https://i.pravatar.cc/80?img=70', genre: 'Hindi',         audioUrl: SH(2)  },
  { id: 's54', title: 'Teri Yaad Aa Rahi Hai',  artist: 'Altaf Raja',         duration: '4:00', cover: 'https://i.pravatar.cc/80?img=71', genre: 'Hindi',         audioUrl: SH(3)  },
];



const TEXT_COLORS   = ['#FFFFFF','#000000','#FE2C55','#FFD700','#00C6FF','#A78BFA','#34D399','#FB923C'];
const VOICE_EFFECTS = ['None','Chipmunk','Deep','Echo','Robot','Reverb'];
const STICKER_EMOJIS = ['🔥','❤️','😂','👑','💯','✨','🎉','🥳','😍','🤩','💪','🙌','🎵','🌟','👏','💕','😎','🤣','🥰','💥','🎯','🏆','🦋','🌈','💫','🍀','⚡','🎸','🌸','😜','💃','🕺','👻','🤯','🔮','🎪'];
const EFFECTS_LIST = ['None', 'Sparkle', 'Blur', 'Glow', 'Zoom', 'Shake'];

const DUMMY_ACTIVITY = [
  { id: '1', type: 'like', user: '@comedy_king', avatar: 'https://i.pravatar.cc/300?img=2', text: 'liked your video', time: '2h' },
  { id: '2', type: 'comment', user: '@dance_queen', avatar: 'https://i.pravatar.cc/300?img=3', text: 'commented: "New trend alert 💃"', time: '5h' },
  { id: '3', type: 'follow', user: '@tech_guru', avatar: 'https://i.pravatar.cc/300?img=4', text: 'started following you', time: '1d' },
  { id: '4', type: 'like', user: '@food_lover', avatar: 'https://i.pravatar.cc/300?img=9', text: 'liked your video', time: '2d' },
  { id: '5', type: 'mention', user: '@MastiIndia', avatar: 'https://i.pravatar.cc/300?img=1', text: 'mentioned you in a comment', time: '3d' },
];

const BottomNav = ({ activeScreen, handleHomePress, setShowFriends, setShowInbox, setIsProfile, setSelectedUser, setShowCamera, requireAuth }) => (
  <View style={styles.bottomNav}>
    <TouchableOpacity style={styles.navItem} onPress={handleHomePress}>
      <Ionicons name="home" size={28} color={activeScreen === 'home'? 'white' : '#666'} />
      <Text style={[styles.navLabel, { color: activeScreen === 'home'? 'white' : '#666' }]}>Home</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.navItem} onPress={() => { setShowFriends(true); setIsProfile(false); setShowInbox(false); }}>
      <Ionicons name="people" size={28} color={activeScreen === 'friends'? 'white' : '#666'} />
      <Text style={[styles.navLabel, { color: activeScreen === 'friends'? 'white' : '#666' }]}>Friends</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.addButtonContainer} onPress={() => requireAuth(() => setShowCamera(true))}>
      <View style={styles.addButtonWrapper}>
        <View style={[styles.addButton, { backgroundColor: '#25F4EE', position: 'absolute', left: 0 }]} />
        <View style={[styles.addButton, { backgroundColor: '#FE2C55', position: 'absolute', right: 0 }]} />
        <View style={[styles.addButton, { backgroundColor: 'white', width: 56, justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="add" size={34} color="black" />
        </View>
      </View>
    </TouchableOpacity>
    <TouchableOpacity style={styles.navItem} onPress={() => requireAuth(() => { setShowInbox(true); setIsProfile(false); setShowFriends(false); })}>
      <Ionicons name="chatbubble-ellipses" size={28} color={activeScreen === 'inbox'? 'white' : '#666'} />
      <Text style={[styles.navLabel, { color: activeScreen === 'inbox'? 'white' : '#666' }]}>Inbox</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.navItem} onPress={() => requireAuth(() => { setSelectedUser(null); setIsProfile(true); setShowFriends(false); setShowInbox(false); })}>
      <Ionicons name="person" size={28} color={activeScreen === 'profile'? 'white' : '#666'} />
      <Text style={[styles.navLabel, { color: activeScreen === 'profile'? 'white' : '#666' }]}>Profile</Text>
    </TouchableOpacity>
  </View>
);

// ─── Draggable + Pinch-zoomable overlay (sticker / text) ────────────────────
const DraggableOverlay = ({
  id, x, y, size, onUpdate, onDelete, children,
}: {
  id: string; x: number; y: number; size: number;
  onUpdate: (id: string, u: { x?: number; y?: number; size?: number }) => void;
  onDelete: (id: string) => void;
  children: React.ReactNode;
}) => {
  const latestProps = React.useRef({ x, y, size });
  latestProps.current = { x, y, size };

  const basePos    = React.useRef({ x, y });
  const baseSize   = React.useRef(size);
  const pinchDist0 = React.useRef(0);
  const prevTouches = React.useRef(0);
  const tapStart   = React.useRef(0);
  const didMove    = React.useRef(false);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture:  () => false,

      onPanResponderGrant: (evt) => {
        basePos.current  = { x: latestProps.current.x, y: latestProps.current.y };
        baseSize.current = latestProps.current.size;
        prevTouches.current = evt.nativeEvent.touches.length;
        didMove.current  = false;
        tapStart.current = Date.now();

        if (evt.nativeEvent.touches.length === 2) {
          const t  = evt.nativeEvent.touches;
          const dx = t[1].pageX - t[0].pageX;
          const dy = t[1].pageY - t[0].pageY;
          pinchDist0.current = Math.sqrt(dx * dx + dy * dy) || 1;
        }
      },

      onPanResponderMove: (evt, gs) => {
        const touches = evt.nativeEvent.touches;

        if (touches.length === 2) {
          // — init pinch when second finger first arrives —
          if (prevTouches.current !== 2) {
            const dx0 = touches[1].pageX - touches[0].pageX;
            const dy0 = touches[1].pageY - touches[0].pageY;
            pinchDist0.current = Math.sqrt(dx0 * dx0 + dy0 * dy0) || 1;
            baseSize.current   = latestProps.current.size;
          }
          prevTouches.current = 2;

          const dx   = touches[1].pageX - touches[0].pageX;
          const dy   = touches[1].pageY - touches[0].pageY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const scale = dist / pinchDist0.current;
          const newSize = Math.max(16, Math.min(144, baseSize.current * scale));
          onUpdate(id, { size: newSize });
        } else {
          prevTouches.current = 1;
          didMove.current = true;
          onUpdate(id, {
            x: basePos.current.x + gs.dx,
            y: basePos.current.y + gs.dy,
          });
        }
      },

      onPanResponderRelease: (evt, gs) => {
        basePos.current = {
          x: basePos.current.x + gs.dx,
          y: basePos.current.y + gs.dy,
        };
        prevTouches.current = 0;
      },

      onPanResponderTerminate: () => { prevTouches.current = 0; },
    })
  ).current;

  return (
    <View
      style={{ position: 'absolute', top: y, left: x, zIndex: 50 }}
      {...panResponder.panHandlers}
    >
      {children}
    </View>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isProfile, setIsProfile] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showCamera,setShowCamera] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showEffects, setShowEffects] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterModalTempFilter, setFilterModalTempFilter] = useState('Normal');
  const { hasPermission: _cameraHasPermission, requestPermission: _requestCameraPermission } = useCameraPermission();
  const { hasPermission: _micHasPermission, requestPermission: _requestMicPermission } = useMicrophonePermission();
  // Compatibility shims: preserve all existing permission checks unchanged
  const permission = { granted: _cameraHasPermission };
  const requestPermission = async () => { await _requestCameraPermission(); return { granted: _cameraHasPermission }; };
  const micPermission = { granted: _micHasPermission };
  const requestMicPermission = async () => { await _requestMicPermission(); return { granted: _micHasPermission }; };
  const cameraRef = useRef<any>(null);
  
  const startY = useRef(0);
const startZoom = useRef(0);

// ✅ Instagram-Reels-style record button state
const isRecordingRef = useRef(false);
const pressStartTimeRef = useRef(0);
const wasRecordingBeforePressRef = useRef(false);
const didDragRef = useRef(false);
const LONG_PRESS_THRESHOLD = 300; // ms — below this on release = "tap"
  
  const [followingUsers, setFollowingUsers] = useState(['@comedy_king']);
  const [activeTab, setActiveTab] = useState(false);
  const [pendingScrollVideoId, setPendingScrollVideoId] = useState(null); // ✅ id of just-uploaded video waiting to be scrolled into view
  const [likedVideos, setLikedVideos] = useState({});
  const [savedVideos, setSavedVideos] = useState({});
  const [drafts, setDrafts] = useState([]);
  const [showDrafts, setShowDrafts] = useState(false);

  // ── Persist likedVideos & savedVideos & drafts across restarts ─────────────
  useEffect(() => {
    AsyncStorage.getItem('@masti_liked_videos').then(val => {
      if (val) { try { setLikedVideos(JSON.parse(val)); } catch (_) {} }
    });
    AsyncStorage.getItem('@masti_saved_videos').then(val => {
      if (val) { try { setSavedVideos(JSON.parse(val)); } catch (_) {} }
    });
    AsyncStorage.getItem('@masti_drafts').then(val => {
      if (val) { try { setDrafts(JSON.parse(val)); } catch (_) {} }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('@masti_liked_videos', JSON.stringify(likedVideos)).catch(() => {});
  }, [likedVideos]);

  useEffect(() => {
    AsyncStorage.setItem('@masti_saved_videos', JSON.stringify(savedVideos)).catch(() => {});
  }, [savedVideos]);

  useEffect(() => {
    AsyncStorage.setItem('@masti_drafts', JSON.stringify(drafts)).catch(() => {});
  }, [drafts]);
  const [editProfile, setEditProfile] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [videoComments, setVideoComments] = useState({ '1': DUMMY_COMMENTS });
  const [commentText, setCommentText] = useState('');
  const [shareCounts, setShareCounts] = useState({ '1': 48, '2': 312, '3': 97, '4': 1200, '5': 203 });
  const [saveCounts, setSaveCounts] = useState({ '1': 34, '2': 189, '3': 56, '4': 820, '5': 145 });
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentVideoItem, setCurrentVideoItem] = useState(DUMMY_VIDEOS[0]);
  const [profileImage, setProfileImage] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [name, setName] = useState("New User");
  const [userId, setUserId] = useState("@newuser");
  const [bio, setBio] = useState("");
  const [youtube, setYoutube] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginSheet, setShowLoginSheet] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const [videos, setVideos] = useState(DUMMY_VIDEOS);
  const [feedLoadError, setFeedLoadError] = useState<string | null>(null);

  // ─── Backend persistence (Postgres via our API) ─────────────────────────
  // Cloudinary stores the actual video file; our backend only stores the
  // resulting secure_url + lightweight metadata (never Firebase Storage/Firestore).
  const queryClient = useQueryClient();
  const backendVideos: any[] | undefined = undefined;
  const isBackendVideosError = false;
  const backendVideosError = null;
  const refetchBackendVideos = async () => {};
  const createVideoMutation = {
    mutateAsync: async (args: any) => ({ id: Date.now().toString() + Math.random().toString(36).substr(2, 9) }),
  };

  const mapBackendVideo = useCallback((v: any) => ({
    id: `db-${v.id}`,
    user: v.userId,
    name: v.userName || v.userId,
    userId: v.userId,
    bio: '',
    profileImage: 'https://i.pravatar.cc/300?img=8',
    followers: 0,
    following: 0,
    likes: 0,
    desc: v.description || 'New video #masti',
    url: v.cloudinaryUrl,
    thumbnail: v.thumbnailUrl || null,
    musicCover: 'https://i.pravatar.cc/300?img=5',
    song: null,
    youtube: '',
    instagram: '',
    facebook: '',
    privacy: v.privacy || 'public',
  }), []);

  // Sync backend-posted videos into the feed every time the list query
  // resolves — on first load (persists posts across app restarts), after a
  // successful new post (via the invalidate below), and on manual refresh.
  // Re-running (rather than "merge once") is what lets a freshly-posted
  // video that already appears optimistically get reconciled with its real
  // backend id without ever duplicating it in the feed.
  useEffect(() => {
    if (!backendVideos) return;
    console.log('[Feed] Backend videos loaded:', backendVideos.length);
    setFeedLoadError(null);

    const mapped = backendVideos.slice().reverse().map(mapBackendVideo);
    const mappedIds = new Set(mapped.map((m) => m.id));

    setVideos((prev) => {
      // Drop any stale db-prefixed entries — they're superseded by this
      // fresh fetch (e.g. one we already inserted optimistically right
      // after posting, using the same canonical `db-<id>`).
      const rest = prev.filter((v) => !mappedIds.has(v.id) && !String(v.id).startsWith('db-'));
      return [...mapped, ...rest];
    });
  }, [backendVideos, mapBackendVideo]);

  useEffect(() => {
    if (isBackendVideosError) {
      console.error('[Feed] Failed to load videos from backend:', backendVideosError);
      setFeedLoadError('Could not load saved posts. Pull down to retry.');
    }
  }, [isBackendVideosError, backendVideosError]);
  const [recordTime, setRecordTime] = useState('15s');
  const recordTimeRef = useRef('15s');
  const [cameraTab, setCameraTab] = useState('Camera');
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const device = useCameraDevice(facing);
  const [flash, setFlash] = useState('off');
  const [speed, setSpeed] = useState('1x');
  const [isRecording, setIsRecording] = useState(false);

// keep a ref in sync with isRecording so the PanResponder always reads the latest value
useEffect(() => {
  isRecordingRef.current = isRecording;
}, [isRecording]);

// ✅ Recording Timer
const [recordSeconds, setRecordSeconds] = useState(0);

// ✅ Circular Progress Animation
const progress = useRef(new Animated.Value(0)).current;

// ✅ Timer Ref
const timerRef = useRef(null);

// ✅ Circle Settings
const radius = 42;
const strokeWidth = 5;
const circumference = 2 * Math.PI * radius;

// ✅ Animated Circle
const strokeDashoffset = progress.interpolate({
  inputRange: [0, 1],
  outputRange: [circumference, 0],
});

const rotateAnim = useRef(new Animated.Value(0)).current;

const [selectedFilter, setSelectedFilter] = useState('Normal');
const [selectedEffect, setSelectedEffect] = useState('None');
const [profileTabIndex, setProfileTabIndex] = useState(0);
  
  const [recordedVideoUri, setRecordedVideoUri] = useState(null);
  
  const [ownFollowers, setOwnFollowers] = useState(12);
  const fadeAnim = useRef(new Animated.Value(0.4)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const tabFlatListRef = useRef(null);
  const feedFlatListRef = useRef(null);
  const profileTabsFlatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const profileScrollX = useRef(new Animated.Value(0)).current;
  const musicSoundRef = useRef<Audio.Sound | null>(null);


  const likeScale = useRef(new Animated.Value(1)).current;
  const bigHeartScale = useRef(new Animated.Value(0)).current;
  const [showBigHeart, setShowBigHeart] = useState(false);
  const lastTapRef = useRef(0);
  
  const onViewableItemsChangedRef = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentVideoIndex(viewableItems[0].index);
      setCurrentVideoItem(viewableItems[0].item);
      setFeedPlaybackProgress(0);
    }
  });
  const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: 50, minimumViewTime: 100 });
  
  const [activityFeed] = useState(DUMMY_ACTIVITY);
  
  // ─── NEW: Recording flow state ───────────────────────────────────────────
  const [recordingFlowStep, setRecordingFlowStep] = useState(null); // null | 'review' | 'editor' | 'upload'
  const [uploadTitle, setUploadTitle] = useState('');
  const [privacySetting, setPrivacySetting] = useState('public');
  const [allowLikes, setAllowLikes] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [allowShares, setAllowShares] = useState(true);
  const [hideLikeCount, setHideLikeCount] = useState(false);
  const [hideCommentCount, setHideCommentCount] = useState(false);
  const [hideShareCount, setHideShareCount] = useState(false);
  const [schedulePost, setSchedulePost] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [editorActiveTool, setEditorActiveTool] = useState(null);
  const [textOverlays, setTextOverlays] = useState([]);
  const [stickerOverlays, setStickerOverlays] = useState([]);
  const [editorTextInput, setEditorTextInput] = useState('');
  const [editorTextColor, setEditorTextColor] = useState('#FFFFFF');
  const [editorTextSize, setEditorTextSize] = useState(24);
  const [showTextInput, setShowTextInput] = useState(false);
  const [editorVolume, setEditorVolume] = useState(80);
  const [editorVoiceEffect, setEditorVoiceEffect] = useState('None');
  const [originalSoundVol, setOriginalSoundVol] = useState(80); // 0-100
  const [musicVol, setMusicVol] = useState(0);                  // 0-100
  const [showMixAudio, setShowMixAudio] = useState(false);
  const [mixPanelPlaying, setMixPanelPlaying] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalPlaying, setEditModalPlaying] = useState(true);
  const [editModalPosition, setEditModalPosition] = useState(0);
  const [showStickerModal, setShowStickerModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [textModalInput, setTextModalInput] = useState('');
  const [textModalColor, setTextModalColor] = useState('#fff');
  const [textModalAlign, setTextModalAlign] = useState<'left'|'center'|'right'>('center');
  const [textModalFont, setTextModalFont] = useState(0);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [feedPlaybackProgress, setFeedPlaybackProgress] = useState(0);
  const [showDotsMenu, setShowDotsMenu] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(1);
  const editorVideoRef = useRef(null);
  const editModalVideoRef = useRef(null);
  const videoRefs = useRef({}); // ✅ id -> feed <Video> ref, so we can force-play the item that should be current
  const [videoDurationMs, setVideoDurationMs] = useState(0);
  const videoDurationMsRef = useRef(0);
  const [cameraZoom, setCameraZoom] = useState(0);
  const [focusPoint, setFocusPoint] = useState(null);
  const [isLongPressMode, setIsLongPressMode] = useState(false);
  const [showZoomLabel, setShowZoomLabel] = useState(false);
  const [showCoverSelection, setShowCoverSelection] = useState(false);
  const [coverFramePosition, setCoverFramePosition] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingVideoId, setProcessingVideoId] = useState(null);
  const [allowHighQuality, setAllowHighQuality] = useState(true);
  const [allowDuet, setAllowDuet] = useState(true);
  const [allowStitch, setAllowStitch] = useState(true);
  const [brandedContent, setBrandedContent] = useState(false);
  const [saveToDeviceEnabled, setSaveToDeviceEnabled] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showPrivacySheet, setShowPrivacySheet] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [previewingSongId, setPreviewingSongId] = useState(null);
  const [itunesResults, setItunesResults] = useState<any[]>([]);
  const [itunesSearching, setItunesSearching] = useState(false);
  const [showBeautyPanel, setShowBeautyPanel] = useState(false);
  const [beautySmooth, setBeautySmooth] = useState(50);
  const [beautyBright, setBeautyBright] = useState(30);
  const [beautySlim, setBeautySlim] = useState(20);
  const [beautyEye, setBeautyEye] = useState(20);
  const [selectedSong, setSelectedSong] = useState(null);
  const [musicSearchQuery, setMusicSearchQuery] = useState('');
  const [customSongs, setCustomSongs] = useState([]);
  const [musicTab, setMusicTab] = useState('all');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerCountdown, setTimerCountdown] = useState(0);
  const countdownRef = useRef(null);
  const [activeDescTab, setActiveDescTab] = useState('Hashtags');
  const [showVideoPickerModal, setShowVideoPickerModal] = useState(false);

  // Upload processing animation refs
  const uploadPulseAnim = useRef(new Animated.Value(1)).current;
  const uploadGlowAnim  = useRef(new Animated.Value(0)).current;
  const uploadDotsAnim  = useRef(new Animated.Value(0)).current;

  // Refs for camera gestures
  const cameraZoomRef = useRef(0);
  const pinchInitialDistanceRef = useRef(0);
  const zoomLabelTimerRef = useRef(null);
  const pinchInitialZoomRef = useRef(0);
  const lastCameraTapRef = useRef(0);
const focusTimerRef = useRef(null);

const recordButtonResponder = useRef(
  PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,

    onPanResponderGrant: (evt) => {
      startY.current = evt.nativeEvent.pageY;
      startZoom.current = cameraZoomRef.current;

      pressStartTimeRef.current = Date.now();
      didDragRef.current = false;

      // Record whether we were already recording before this touch
      wasRecordingBeforePressRef.current = isRecordingRef.current;

      // First tap or hold -> Start recording
      if (!isRecordingRef.current) {
        startRecording();
      }
    },

    onPanResponderMove: (evt) => {
      const moveY = startY.current - evt.nativeEvent.pageY;

      if (Math.abs(moveY) > 5) {
        didDragRef.current = true;
      }

      // Instagram-style vertical zoom (1x–10x mapped to 0–1 native range)
      // Each pixel of drag = ~0.003 zoom units; smooth and responsive
      let zoom = startZoom.current + moveY * 0.008;
      zoom = Math.max(0, Math.min(1, zoom));

      cameraZoomRef.current = zoom;
      setCameraZoom(zoom);

      // Show zoom label while dragging
      if (zoomLabelTimerRef.current) clearTimeout(zoomLabelTimerRef.current);
      setShowZoomLabel(true);
      zoomLabelTimerRef.current = setTimeout(() => setShowZoomLabel(false), 1500);
    },

    onPanResponderRelease: () => {
      const wasDrag = didDragRef.current;

      if (!wasRecordingBeforePressRef.current && wasDrag) {
        // Press+hold+drag (zoom gesture, started recording this touch) → Instagram style: stop on release
        stopRecording();
      } else if (wasRecordingBeforePressRef.current && !wasDrag) {
        // Clean tap while already recording → tap-to-toggle stop
        stopRecording();
      }
      // Was already recording + drag → just zoomed, keep recording
      // First clean tap → keep recording (tap-to-toggle start)
    },

    onPanResponderTerminate: () => {
      // System took over gesture — reset zoom label but keep recording
      if (zoomLabelTimerRef.current) clearTimeout(zoomLabelTimerRef.current);
      setShowZoomLabel(false);
    },
  })
).current;

 // ─────────────────────────────────────────────────────────────────────────

const filteredVideos = useMemo(() => {
  const visibleVideos = videos.filter(v => {
    if (v.privacy === 'private') return v.user === userId;
    if (v.privacy === 'friends') return v.user === userId || followingUsers.includes(v.user);
    return true;
  });
  if (activeTab) return visibleVideos.filter(v => followingUsers.includes(v.user));
  return visibleVideos;
}, [activeTab, followingUsers, videos, userId]);

// ✅ Once a just-uploaded video actually appears in the (recomputed) feed list,
//    scroll straight to it so it's visible and starts playing automatically.
useEffect(() => {
  if (!pendingScrollVideoId) return;
  const idx = filteredVideos.findIndex(v => v.id === pendingScrollVideoId);
  if (idx === -1) return; // not in this list yet (e.g. tab hasn't switched) — wait for next recompute
  tabFlatListRef.current?.scrollToIndex({ index: 1, animated: false });
  requestAnimationFrame(() => {
    // Smooth forward scroll — the new video is right after the one being watched,
    // so it slides into view naturally instead of jumping to the top of the feed.
    feedFlatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0 });
    setCurrentVideoIndex(idx);
    setCurrentVideoItem(filteredVideos[idx]);
  });
  setPendingScrollVideoId(null);
}, [filteredVideos, pendingScrollVideoId]);

// ✅ Whenever the "current" video changes (swipe, tab switch, or a just-uploaded
//    video sliding into view), explicitly play it and pause every other loaded
//    video — don't rely solely on the `shouldPlay` prop reacting on its own.
useEffect(() => {
  if (showCamera || recordedVideoUri || isUploading) return;
  const currentItem = filteredVideos[currentVideoIndex];
  if (!currentItem) return;
  Object.entries(videoRefs.current).forEach(([id, ref]) => {
    if (!ref) return;
    if (id === currentItem.id) {
      ref.playAsync?.();
    } else {
      ref.pauseAsync?.();
    }
  });
}, [currentVideoIndex, filteredVideos, showCamera, recordedVideoUri, isUploading]);

useEffect(() => {
  Animated.loop(
    Animated.timing(spin, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: true,
    })
  ).start();
}, []);

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0.4, duration: 500, useNativeDriver: true }),
    ])).start();
    setTimeout(() => setShowSplash(false), 3500);
  }, []);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);
  
  const requireAuth = useCallback((action: () => void) => {
    if (isLoggedIn) {
      action();
    } else {
      pendingActionRef.current = action;
      setShowLoginSheet(true);
    }
  }, [isLoggedIn]);

  // Firebase auth state listener — sets isLoggedIn whenever Firebase user changes
  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsub();
  }, []);

  // ── Music preview playback ──
  // Jab bhi previewingSongId badalta hai, uss song ka audio play/stop karo
  useEffect(() => {
    let mounted = true;
    const loadAndPlay = async () => {
      // Pehle purana sound band karo
      if (musicSoundRef.current) {
        try {
          await musicSoundRef.current.stopAsync();
          await musicSoundRef.current.unloadAsync();
        } catch (_) {}
        musicSoundRef.current = null;
      }
      if (!previewingSongId) return;

      const allSongs = [...(customSongs || []), ...SONGS_LIST, ...itunesResults];
      const song = allSongs.find(s => s.id === previewingSongId);
      if (!song?.audioUrl) return;

      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
        const { sound } = await Audio.Sound.createAsync(
          { uri: song.audioUrl },
          { shouldPlay: true, isLooping: false, volume: 1.0 }
        );
        if (!mounted) { sound.unloadAsync(); return; }
        musicSoundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) setPreviewingSongId(null);
        });
      } catch (err) {
        console.log('Music preview error:', err);
      }
    };
    loadAndPlay();
    return () => {
      mounted = false;
      if (musicSoundRef.current) {
        musicSoundRef.current.stopAsync().catch(() => {});
        musicSoundRef.current.unloadAsync().catch(() => {});
        musicSoundRef.current = null;
      }
    };
  }, [previewingSongId]);

  // ── Jab selectedSong set ho, musicVol auto-set karo 70 agar abhi 0 hai ──
  useEffect(() => {
    if (selectedSong && musicVol === 0) {
      setMusicVol(70);
    }
    // Naya song add hone par auto-play shuru karo mixer mein
    if (selectedSong) {
      setMixPanelPlaying(true);
    }
    // Jab mix panel close ho ya song hata do, playing band karo
    if (!selectedSong) {
      setMixPanelPlaying(false);
      setPreviewingSongId(null);
    }
  }, [selectedSong]);

  // ── Mix panel play/pause control ──
  useEffect(() => {
    if (mixPanelPlaying && selectedSong) {
      setPreviewingSongId(selectedSong.id);
    } else if (!mixPanelPlaying) {
      setPreviewingSongId(null);
    }
  }, [mixPanelPlaying]);

  // ── iTunes live search — user ke type karne par real songs fetch karo ──
  useEffect(() => {
    const q = musicSearchQuery.trim();
    if (q.length < 2) { setItunesResults([]); setItunesSearching(false); return; }
    setItunesSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=30&country=in`
        );
        const data = await res.json();
        const mapped = (data.results || [])
          .filter((r: any) => r.previewUrl)
          .map((r: any) => ({
            id: 'itunes_' + r.trackId,
            title: r.trackName,
            artist: r.artistName,
            duration: r.trackTimeMillis
              ? Math.floor(r.trackTimeMillis / 60000) + ':' + String(Math.floor((r.trackTimeMillis % 60000) / 1000)).padStart(2, '0')
              : '—',
            cover: (r.artworkUrl100 || r.artworkUrl60 || '').replace('100x100', '200x200'),
            genre: r.primaryGenreName || 'Music',
            audioUrl: r.previewUrl,
            isItunes: true,
          }));
        setItunesResults(mapped);
      } catch (e) {
        setItunesResults([]);
      } finally {
        setItunesSearching(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [musicSearchQuery]);

  const handleLoginSuccess = useCallback(() => {
    // Firebase onAuthStateChanged will update isLoggedIn automatically.
    // We just close the sheet and execute the queued action.
    setShowLoginSheet(false);
    setTimeout(() => {
      if (pendingActionRef.current) {
        pendingActionRef.current();
        pendingActionRef.current = null;
      }
    }, 350);
  }, []);

  const openUserProfile = (user) => {
    setSelectedUser(user);
    // NOTE: global youtube/instagram/facebook state nahi badhate —
    // har user ka data uske apne video object se aata hai (displayUser)
    setIsProfile(true);
    setProfileTabIndex(0);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],   // SDK 54 — MediaTypeOptions deprecated
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets?.[0]) setProfileImage(result.assets[0].uri);
  };

  const pickVideoFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],          // SDK 54 — MediaTypeOptions deprecated
        allowsEditing: false,
        quality: 1,                      // HD quality
        videoMaxDuration: 0,             // 0 = no limit (allows up to 2GB)
        videoExportPreset: ImagePicker.VideoExportPreset?.HighestQuality ?? undefined,
      });
      if (!result.canceled && result.assets?.[0]) {
        setRecordedVideoUri(result.assets[0].uri);
        setRecordingFlowStep('review');
        setShowCamera(true);
      }
    } catch (e) {
      console.warn('Gallery pick error:', e);
      Alert.alert('Error', 'Video load nahi ho paya. Dobara try karo.');
    }
  };

  
  const startRecording = async () => {
  if (!cameraRef.current || isRecordingRef.current) return;

  if (!permission?.granted) {
    const { granted } = await requestPermission();
    if (!granted) {
      Alert.alert('Error', 'Camera permission required');
      return;
    }
  }

  if (!micPermission?.granted) {
    const { granted } = await requestMicPermission();
    if (!granted) {
      Alert.alert('Error', 'Microphone permission required');
      return;
    }
  }

  isRecordingRef.current = true;
  setIsRecording(true);
setRecordSeconds(0);

// ✅ Start Rotating Ring
rotateAnim.setValue(0);

Animated.loop(
  Animated.timing(rotateAnim, {
    toValue: 1,
    duration: 1200,
    easing: Easing.linear,
    useNativeDriver: true,
  })
).start();

const duration =
  recordTimeRef.current === "3m"
    ? 180
    : recordTimeRef.current === "60s"
    ? 60
    : 15;

  // Start Circle Animation
  progress.setValue(0);

  Animated.timing(progress, {
    toValue: 1,
    duration: duration * 1000,
    useNativeDriver: false,
  }).start();

  // Start Timer
  timerRef.current = setInterval(() => {
    setRecordSeconds(prev => {
      const next = prev + 1;

      if (next >= duration) {
        stopRecording();
        return duration;
      }

      return next;
    });
  }, 1000);

  const _finishRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    progress.stopAnimation();
    rotateAnim.stopAnimation();
    rotateAnim.setValue(0);
    isRecordingRef.current = false;
    setIsRecording(false);
  };

  try {
    cameraRef.current.startRecording({
      onRecordingFinished: (video) => {
        const uri = video.path.startsWith('file://') ? video.path : 'file://' + video.path;
        setRecordedVideoUri(uri);
        setRecordingFlowStep("review");
        _finishRecording();
      },
      onRecordingError: (error) => {
        console.log('Recording error:', error);
        _finishRecording();
      },
    });
  } catch (e) {
    console.log(e);
    _finishRecording();
  }
};

const stopRecording = () => {
  if (timerRef.current) {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }

  progress.stopAnimation();

  rotateAnim.stopAnimation();
  rotateAnim.setValue(0);

  if (cameraRef.current && isRecordingRef.current) {
    cameraRef.current.stopRecording();
  }

  isRecordingRef.current = false;
  setIsRecording(false);
};

const postRecordedVideo = () => {
  if (!recordedVideoUri) return;
    
    
    const myProfileVideo = videos.find(v => v.user === userId);
    const newVideo = {
      id: Date.now().toString(),
      user: userId,
      name: name,
      userId: userId,
      bio: bio,
      profileImage: profileImage || 'https://i.pravatar.cc/300?img=8',
      followers: myProfileVideo? myProfileVideo.followers : ownFollowers,
      following: followingUsers.length,
      likes: 0,
      desc: 'Recorded video #masti',
      url: recordedVideoUri,
      musicCover: 'https://i.pravatar.cc/300?img=5',
      youtube: youtube,
      instagram: instagram,
      facebook: facebook
    };
    setVideos(prev => [newVideo, ...prev]);
    setRecordedVideoUri(null);
    setShowCamera(false);
    Alert.alert('Success', 'Video posted!');
  };

  
  const discardRecordedVideo = () => {
    setRecordedVideoUri(null);
    setRecordingFlowStep(null);
  };

  const saveVideoToDevice = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission chahiye', 'Gallery access do video save karne ke liye');
        return;
      }
      if (!recordedVideoUri) {
        Alert.alert('Error', 'Save karne ke liye koi video nahi mili');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(recordedVideoUri);
      Alert.alert('✅ Saved!', 'Video gallery mein save ho gayi');
    } catch (e) {
      Alert.alert('Error', 'Video save nahi ho payi. Dobara try karo.');
    }
  };

  // ─── Post video from Upload screen ──────────────────────────────────────
  const uploadIntervalRef = useRef(null);
  const pendingVideoRef   = useRef(null);   // holds the video object while processing

  const postVideoToFeed = useCallback(async () => {
    if (!recordedVideoUri) return;

    // Capture all values before state resets
    const capturedUri     = recordedVideoUri;
    const capturedPrivacy = privacySetting;
    const myProfileVideo  = videos.find(v => v.user === userId);

    const pendingVideo = {
      id: Date.now().toString(),
      user: userId,
      name: name,
      userId: userId,
      bio: bio,
      profileImage: profileImage || 'https://i.pravatar.cc/300?img=8',
      followers: myProfileVideo ? myProfileVideo.followers : ownFollowers,
      following: followingUsers.length,
      likes: 0,
      desc: uploadTitle.trim() || 'New video #masti',
      url: capturedUri, // replaced with Cloudinary secure_url on success
      musicCover: selectedSong?.cover || 'https://i.pravatar.cc/300?img=5',
      song: selectedSong || null,
      youtube: youtube,
      instagram: instagram,
      facebook: facebook,
      privacy: capturedPrivacy,
    };

    // ── STEP 1: Close upload screen immediately ──────────────────────────
    pendingVideoRef.current = pendingVideo;
    setRecordingFlowStep(null);
    setShowCamera(false);
    setRecordedVideoUri(null);
    setUploadTitle('');
    setPrivacySetting('public');
    setLocationEnabled(false);
    setCoverFramePosition(0);

    // ── STEP 2: Show real Cloudinary upload with live progress ───────────
    setIsUploading(true);
    setUploadProgress(0);

    let cloudinaryResult: Awaited<ReturnType<typeof uploadVideoToCloudinary>> | null = null;

    try {
      // ── STEP 2a: Upload to Cloudinary — progress updates 0→95% during
      // transfer, then jumps to 100% once the server confirms. ─────────────
      console.log('[Upload] Starting Cloudinary upload for', capturedUri);
      cloudinaryResult = await uploadVideoToCloudinary(capturedUri, (pct) => {
        setUploadProgress(pct);
      });
      console.log('[Upload] Cloudinary upload complete:', cloudinaryResult.secure_url);
    } catch (err: any) {
      // Cloudinary upload failed — nothing was posted, tell the user plainly.
      console.error('[Upload] Cloudinary upload failed:', err);
      pendingVideoRef.current = null;
      setIsUploading(false);
      setUploadProgress(0);
      Alert.alert(
        'Upload Failed',
        err?.message || 'Video upload to Cloudinary failed. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    const result = cloudinaryResult;

    // ── STEP 2b: Save the Cloudinary URL + metadata to the backend/database.
    // This must succeed before we tell the user the post went through — a
    // video that only exists in Cloudinary but never made it to the database
    // would vanish from the feed on the next app restart. ─────────────────
    let savedVideo: Awaited<ReturnType<typeof createVideoMutation.mutateAsync>> | null = null;
    try {
      console.log('[Backend] Saving video metadata to database for user', userId);
      savedVideo = await createVideoMutation.mutateAsync({
        data: {
          userId: pendingVideo.userId,
          userName: pendingVideo.name,
          description: pendingVideo.desc,
          privacy: pendingVideo.privacy || 'public',
          cloudinaryUrl: result.secure_url,
          cloudinaryPublicId: result.public_id,
          thumbnailUrl: result.thumbnail_url,
          format: result.format,
          duration: result.duration,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        },
      });
      console.log('[Backend] Video saved successfully, id =', savedVideo?.id);
    } catch (err: any) {
      // Backend save failed — the video is safely on Cloudinary but was NOT
      // recorded, so do not pretend the post succeeded or add it to the feed.
      console.error('[Backend] Failed to save video to database:', err);
      pendingVideoRef.current = null;
      setIsUploading(false);
      setUploadProgress(0);
      Alert.alert(
        'Post Failed',
        'Your video uploaded, but we could not save the post. Please try posting again.',
        [{ text: 'OK' }]
      );
      return;
    }

    // ── STEP 3: Both Cloudinary + backend confirmed → add to feed now ─────
    if (pendingVideoRef.current) {
      const videoToAdd = {
        ...pendingVideoRef.current,
        id: `db-${savedVideo.id}`,
        url: result.secure_url,
        thumbnail: result.thumbnail_url,
      };
      pendingVideoRef.current = null;

      // Insert RIGHT AFTER the currently-watched video so it lands in front
      // of the user instead of forcing a scroll back to the top.
      setVideos(prev => {
        const watchingId  = currentVideoItem?.id;
        const watchingIdx = prev.findIndex(v => v.id === watchingId);
        if (watchingIdx === -1) return [videoToAdd, ...prev];
        const next = [...prev];
        next.splice(watchingIdx + 1, 0, videoToAdd);
        return next;
      });

      // Refresh the backend-sourced list in the background so the feed stays
      // consistent (and correct after a restart) without a second round-trip
      // blocking the UI — the video is already visible from the line above.
      console.log('[Feed] Invalidating video list cache after successful post');
      queryClient.invalidateQueries({ queryKey: ['videos'] });

      // Switch away from "Following" tab so the new post is visible
      if (activeTab) setActiveTab(false);
      setPendingScrollVideoId(videoToAdd.id);
    }

    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(0);
    }, 600);
  }, [recordedVideoUri, videos, userId, name, bio, profileImage, ownFollowers, followingUsers, uploadTitle, youtube, instagram, facebook, selectedSong, createVideoMutation, queryClient, currentVideoItem, activeTab]);
  // ─────────────────────────────────────────────────────────────────────────

  const changeTab = (isFollowing) => {
    setActiveTab(isFollowing);
    tabFlatListRef.current?.scrollToIndex({ index: isFollowing? 0 : 1, animated: false });
  };

  const changeProfileTab = (index) => {
    setProfileTabIndex(index);
    profileTabsFlatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const handleShare = async (item) => {
    setShowShare(false);
    try {
      const result = await Share.share({
        message: `${item.desc} - Dekho Masti Video par! 🔥`,
        url: item.url || 'https://mastivideo.app',
      });
      if (result.action === Share.sharedAction) {
        setShareCounts(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
      }
    } catch (error) { console.log(error); }
  };

  // ─── Pull-to-Refresh hooks (TikTok-style, premium) ──────────────────────
  const homeRefreshAsync = useCallback(async () => {
    // minimum 900ms so the spinning indicator is visibly seen
    const [refreshResult] = await Promise.all([
      refetchBackendVideos(),
      new Promise(r => setTimeout(r, 900)),
    ]);
    if (refreshResult.isError) {
      console.error('[Feed] Manual refresh failed:', refreshResult.error);
    } else {
      console.log('[Feed] Manual refresh succeeded');
    }
    const shuffled = [...videos].sort(() => Math.random() - 0.5);
    setVideos(shuffled);
    setCurrentVideoIndex(0);
    setCurrentVideoItem(shuffled[0]);
    feedFlatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [videos, refetchBackendVideos]);
  const homePTR = usePullToRefresh(homeRefreshAsync);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const friendsPTR = usePullToRefresh(useCallback(async () => { await new Promise(r => setTimeout(r, 600)); }, []));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const inboxPTR = usePullToRefresh(useCallback(async () => { await new Promise(r => setTimeout(r, 600)); }, []));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const profilePTR = usePullToRefresh(useCallback(async () => { await new Promise(r => setTimeout(r, 600)); }, []));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const searchPTR = usePullToRefresh(useCallback(async () => { await new Promise(r => setTimeout(r, 600)); }, []));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const commentsPTR = usePullToRefresh(useCallback(async () => { await new Promise(r => setTimeout(r, 600)); }, []));

  const handleHomePress = () => {
    homePTR.onRefresh();
    setIsProfile(false);
    setShowFriends(false);
    setShowInbox(false);
    setShowSearch(false);
  };
  
  
  const toggleCameraFacing = () => {
    setFacing(prev => (prev === 'back' ? 'front' : 'back'));
  };
  
    
  const toggleFlash = () => {
    setFlash(prev => (prev === 'off' ? 'on' : 'off'));
  };

  const changeSpeed = () => {
    const speeds = ['0.5x', '1x', '2x', '3x'];
    const currentIndex = speeds.indexOf(speed);
    setSpeed(speeds[(currentIndex + 1) % speeds.length]);
  };

  
  const toggleFollow = (userName) => {
    setVideos(prev => prev.map(v => {
      if(v.user === userName) {
        const isFollowing = followingUsers.includes(userName);
        return {...v, followers: isFollowing? v.followers - 1 : v.followers + 1};
      }
      return v;
    }));

    if(followingUsers.includes(userName)) {
      setFollowingUsers(followingUsers.filter(u => u!== userName));
    } else {
      setFollowingUsers([...followingUsers, userName]);
    }
  };


  const handleLike = (item) => {
    const isLiked = likedVideos[item.id] || false;
    setLikedVideos(prev => ({...prev, [item.id]:!isLiked}));
    
    setVideos(prev => prev.map(v => v.id === item.id ? { ...v, likes: Math.max(0, (v.likes || 0) + (isLiked? -1 : 1)) } : v));
    if (!isLiked) {
      Animated.sequence([
        Animated.spring(likeScale, { toValue: 1.4, friction: 3, useNativeDriver: true }),
        Animated.spring(likeScale, { toValue: 1, friction: 3, useNativeDriver: true }),
      ]).start();
    }
  };

  
  const triggerBigHeart = () => {
    setShowBigHeart(true);
    bigHeartScale.setValue(0);
    Animated.sequence([       
    Animated.timing(bigHeartScale, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setShowBigHeart(false));
  };

  const handleVideoTap = (item) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      requireAuth(() => {
        if (!likedVideos[item.id]) {
          handleLike(item);
        }
        triggerBigHeart();
      });
    }
    lastTapRef.current = now;
  };

  const handleSave = (item) => {
    const isSaved = savedVideos[item.id] || false;
    setSaveCounts(prev => ({ ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) + (isSaved ? -1 : 1)) }));
    setSavedVideos(prev => ({...prev, [item.id]:!isSaved}));
  };

  // ─── NEW: Camera gesture handlers ─────────────────────────────────────────
  const handleCameraTap = useCallback((evt) => {
    const now = Date.now();
    const { locationX, locationY } = evt.nativeEvent;
    if (now - lastCameraTapRef.current < 300) {
      // Double tap → flip camera
      toggleCameraFacing();
    } else {
      // Single tap → show focus reticle
      setFocusPoint({ x: locationX, y: locationY });
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      focusTimerRef.current = setTimeout(() => setFocusPoint(null), 1500);
    }
    lastCameraTapRef.current = now;
  }, []);

  const cameraPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 2,
    onMoveShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length === 2,
    onPanResponderGrant: (evt) => {
      if (evt.nativeEvent.touches.length === 2) {
        const [t1, t2] = evt.nativeEvent.touches;
        const dx = t2.pageX - t1.pageX;
        const dy = t2.pageY - t1.pageY;
        pinchInitialDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
        pinchInitialZoomRef.current = cameraZoomRef.current;
      }
    },
    onPanResponderMove: (evt) => {
      if (evt.nativeEvent.touches.length === 2) {
        const [t1, t2] = evt.nativeEvent.touches;
        const dx = t2.pageX - t1.pageX;
        const dy = t2.pageY - t1.pageY;
        const currentDist = Math.sqrt(dx * dx + dy * dy);
        const scale = currentDist / (pinchInitialDistanceRef.current || 1);
        const newZoom = Math.max(0, Math.min(1, pinchInitialZoomRef.current + (scale - 1) * 0.35));
        cameraZoomRef.current = newZoom;
        setCameraZoom(newZoom);
        // Show zoom label during pinch
        if (zoomLabelTimerRef.current) clearTimeout(zoomLabelTimerRef.current);
        setShowZoomLabel(true);
        zoomLabelTimerRef.current = setTimeout(() => setShowZoomLabel(false), 1500);
      }
    },
  }), []);
  // ─────────────────────────────────────────────────────────────────────────

  // ─── NEW: Trim timeline PanResponder ─────────────────────────────────────
  const timelineWidth = width - 32;
  const trimStartRef = useRef(0);
  const trimEndRef = useRef(1);

  // keep trim refs always in sync with state so cross-handle reads are accurate
  useEffect(() => { trimStartRef.current = trimStart; }, [trimStart]);
  useEffect(() => { trimEndRef.current  = trimEnd;   }, [trimEnd]);

  // seek video to new start when trim start changes while trim panel is open
  useEffect(() => {
    if (editorVideoRef.current && videoDurationMsRef.current > 0 && editorActiveTool === 'edit') {
      editorVideoRef.current.setPositionAsync(trimStart * videoDurationMsRef.current);
    }
  }, [trimStart, editorActiveTool]);

  const leftHandlePan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { trimStartRef.current = trimStart; },
    onPanResponderMove: (evt, gs) => {
      const delta = gs.dx / timelineWidth;
      const newStart = Math.max(0, Math.min(trimEndRef.current - 0.05, trimStartRef.current + delta));
      setTrimStart(newStart);
    },
  }), [trimStart, timelineWidth]);

  const rightHandlePan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { trimEndRef.current = trimEnd; },
    onPanResponderMove: (evt, gs) => {
      const delta = gs.dx / timelineWidth;
      const newEnd = Math.max(trimStartRef.current + 0.05, Math.min(1, trimEndRef.current + delta));
      setTrimEnd(newEnd);
    },
  }), [trimEnd, timelineWidth]);
  // ─────────────────────────────────────────────────────────────────────────

  const CameraModalOverlay = () => {
    if (!showCamera) return null;

    // ─── NEW: Review Screen ───────────────────────────────────────────────
    if (recordedVideoUri && recordingFlowStep === 'review') {
      return (
        <View style={styles.cameraContainer}>
          {/* Cinematic black bars — same as camera screen */}
          <View style={[flowStyles.cinematicBar, { top: 0, height: 62 }]} />
          <View style={[flowStyles.cinematicBar, { bottom: 0, height: 80 }]} />

          {/* Top bar: X | flash | ••• */}
          <View style={flowStyles.rvTopBar}>
            <TouchableOpacity onPress={discardRecordedVideo} style={flowStyles.rvTopBtn}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={flowStyles.rvTopBtn} onPress={toggleFlash}>
              <Ionicons name={flash === 'off' ? 'flash-off' : 'flash'} size={22} color={flash === 'off' ? '#fff' : '#FFD700'} />
            </TouchableOpacity>
            <TouchableOpacity style={flowStyles.rvTopBtn}>
              <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Full 9:16 video — centered, no crop */}
          <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
            <Video
              key={recordedVideoUri}
              source={{ uri: recordedVideoUri }}
              style={{ width: width, height: width * (16 / 9) > height ? height : width * (16 / 9) }}
              resizeMode="contain"
              shouldPlay
              isLooping
              useNativeControls={false}
            />
          </View>

          {/* Right-side options — camera style overlay */}
          <View style={[styles.cameraRightOptions, { top: 115 }]}>
            {[
              { icon: 'musical-notes', label: 'Add music',    action: () => setShowMusicModal(true) },
              { icon: 'speedometer',   label: speed,           action: changeSpeed },
              { icon: 'sparkles',      label: 'Effects',       action: () => setShowEffects(true) },
              { icon: 'color-filter',  label: 'Filter',        action: () => setShowFilters(true) },
            ].map((opt) => (
              <TouchableOpacity key={opt.label} style={styles.cameraOptionItem} onPress={opt.action}>
                <Ionicons name={opt.icon} size={26} color="#fff" />
                <Text style={styles.cameraOptionText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bottom bar: Delete | Camera record button (re-record) | Next > */}
          <View style={flowStyles.rvBottomBar}>
            <TouchableOpacity style={flowStyles.rvDeleteBtn} onPress={discardRecordedVideo}>
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={flowStyles.rvDeleteText}>Delete</Text>
            </TouchableOpacity>

            {/* Camera-style record button → taps discard so user re-records */}
            <TouchableOpacity style={styles.recordBtn} onPress={discardRecordedVideo}>
              <View style={styles.recordBtnInner} />
            </TouchableOpacity>
            <TouchableOpacity
              style={flowStyles.rvNextBtn}
              onPress={() => setRecordingFlowStep('editor')}
            >
              <Text style={flowStyles.rvNextText}>Next</Text>
              <Ionicons name="chevron-forward" size={18} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // ─── Editor Screen ────────────────────────────────────────────────────
    if (recordedVideoUri && recordingFlowStep === 'editor') {
      return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.cameraContainer}>
          <View style={styles.cameraContainer}>

            {/* 9:16 video — bigger top black bar, video sits lower */}
            <Video
              ref={editorVideoRef}
              source={{ uri: recordedVideoUri }}
              style={{ position: 'absolute', top: 15, left: 0, width: width, height: width * (16 / 9) }}
              resizeMode="contain"
              shouldPlay
              isLooping={false}
              useNativeControls={false}
              isMuted={showMixAudio || showEditModal}
              onPlaybackStatusUpdate={(status) => {
                if (!status.isLoaded) return;
                if (status.durationMillis && videoDurationMsRef.current === 0) {
                  videoDurationMsRef.current = status.durationMillis;
                  setVideoDurationMs(status.durationMillis);
                }
                if (status.durationMillis && status.durationMillis > 0) {
                  setPlaybackProgress((status.positionMillis || 0) / status.durationMillis);
                }
                if (status.isPlaying && videoDurationMsRef.current > 0) {
                  const endMs   = trimEndRef.current   * videoDurationMsRef.current;
                  const startMs = trimStartRef.current * videoDurationMsRef.current;
                  if (status.positionMillis >= endMs - 200) {
                    editorVideoRef.current?.setPositionAsync(startMs);
                  }
                }
                if (!status.isPlaying && status.didJustFinish) {
                  editorVideoRef.current?.setPositionAsync(trimStartRef.current * videoDurationMsRef.current);
                  editorVideoRef.current?.playAsync();
                }
              }}
            />

            {/* Progress bar — thin white line right at the top edge of the black toolbar, fills L→R with playback */}
            <View style={{ position: 'absolute', top: 62 + width * (16 / 9) - 50, left: 0, width: width, height: 3, backgroundColor: 'rgba(255,255,255,0.18)', zIndex: 110 }}>
              <View style={{ height: 3, width: width * playbackProgress, backgroundColor: '#fff', borderRadius: 1.5 }} />
            </View>

            {/* Text overlays on video — draggable + pinch-zoomable */}
            {textOverlays.map((ov) => (
              <DraggableOverlay
                key={ov.id}
                id={ov.id}
                x={ov.x}
                y={ov.y}
                size={ov.size}
                onUpdate={(id, u) => setTextOverlays(prev => prev.map(t => t.id === id ? { ...t, ...u } : t))}
                onDelete={(id) => setTextOverlays(prev => prev.filter(t => t.id !== id))}
              >
                <Text style={{ color: ov.color, fontSize: ov.size, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }}>{ov.text}</Text>
              </DraggableOverlay>
            ))}

            {/* Sticker overlays on video — draggable + pinch-zoomable */}
            {stickerOverlays.map((s) => (
              <DraggableOverlay
                key={s.id}
                id={s.id}
                x={s.x}
                y={s.y}
                size={s.size}
                onUpdate={(id, u) => setStickerOverlays(prev => prev.map(st => st.id === id ? { ...st, ...u } : st))}
                onDelete={(id) => setStickerOverlays(prev => prev.filter(st => st.id !== id))}
              >
                <Text style={{ fontSize: s.size }}>{s.emoji}</Text>
              </DraggableOverlay>
            ))}

            {/* ── STATUS BAR PATTI (only) ── */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight ?? 24), backgroundColor: '#000', zIndex: 101 }} />

            {/* ── TOP BAR — transparent, sits right below patti ── */}
            <View style={[flowStyles.edTopBar, { top: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight ?? 24) }]}>
              <TouchableOpacity onPress={() => setRecordingFlowStep('review')} style={flowStyles.edBackBtn}>
                <Ionicons name="chevron-back" size={28} color="#fff" />
              </TouchableOpacity>

              {/* Selected song banner */}
              {selectedSong && (
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, marginHorizontal: 8 }}>
                  <Ionicons name="musical-note" size={14} color="#FE2C55" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#fff', fontSize: 12, flex: 1 }} numberOfLines={1}>{selectedSong.title}</Text>
                </View>
              )}

              <TouchableOpacity style={flowStyles.edDotsBtn} onPress={() => setShowDotsMenu(v => !v)}>
                <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Dots menu */}
            {showDotsMenu && (
              <View style={{ position: 'absolute', top: 56, right: 14, backgroundColor: '#1A1A1A', borderRadius: 12, overflow: 'hidden', zIndex: 200, minWidth: 170 }}>
                {[
                  { icon: 'save-outline',    label: 'Draft Save karo',  action: () => { Alert.alert('Saved!', 'Draft save ho gaya'); setShowDotsMenu(false); } },
                  { icon: 'share-social-outline', label: 'Share karo', action: () => { setShowDotsMenu(false); handleShare({ desc: uploadTitle, url: recordedVideoUri, id: 'draft' }); } },
                  { icon: 'trash-outline',   label: 'Discard karo',     action: () => { setShowDotsMenu(false); discardRecordedVideo(); } },
                ].map((item, i) => (
                  <TouchableOpacity key={i} onPress={item.action} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: i > 0 ? 0.5 : 0, borderTopColor: '#333' }}>
                    <Ionicons name={item.icon} size={18} color="#fff" style={{ marginRight: 12 }} />
                    <Text style={{ color: '#fff', fontSize: 14 }}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* ══ TOOL PANELS (above bottom bar) ══ */}

            {/* ── EDIT / TRIM panel ── */}
            {editorActiveTool === 'edit' && (
              <View style={{ position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 88, left: 0, right: 0, backgroundColor: '#0D0D0D', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, zIndex: 90, borderTopWidth: 1, borderTopColor: '#222' }}>

                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 }}>Trim</Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (editorVideoRef.current && videoDurationMsRef.current > 0) {
                        editorVideoRef.current.setPositionAsync(trimStartRef.current * videoDurationMsRef.current);
                      }
                      setEditorActiveTool(null);
                    }}
                    style={{ backgroundColor: '#FFD700', paddingHorizontal: 18, paddingVertical: 6, borderRadius: 20 }}
                  >
                    <Text style={{ color: '#000', fontSize: 13, fontWeight: '800' }}>✓ Apply</Text>
                  </TouchableOpacity>
                </View>

                {/* Filmstrip timeline */}
                <View style={{ height: 58, borderRadius: 10, overflow: 'hidden', backgroundColor: '#1A1A1A', marginBottom: 12 }}>
                  {/* Film frames */}
                  <View style={{ flex: 1, flexDirection: 'row' }}>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <View key={i} style={{ flex: 1, borderRightWidth: 1, borderRightColor: '#0D0D0D', alignItems: 'center', justifyContent: 'center', backgroundColor: i % 2 === 0 ? '#1E1E1E' : '#171717' }}>
                        <View style={{ width: 2, height: 10, backgroundColor: '#2E2E2E', borderRadius: 1 }} />
                      </View>
                    ))}
                  </View>

                  {/* Dimmed — left of selection */}
                  <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${trimStart * 100}%`, backgroundColor: 'rgba(0,0,0,0.7)' }} />
                  {/* Dimmed — right of selection */}
                  <View style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: `${(1 - trimEnd) * 100}%`, backgroundColor: 'rgba(0,0,0,0.7)' }} />
                  {/* Selected region top+bottom border */}
                  <View style={{ position: 'absolute', top: 0, bottom: 0, left: `${trimStart * 100}%`, right: `${(1 - trimEnd) * 100}%`, borderTopWidth: 3, borderBottomWidth: 3, borderColor: '#FFD700' }} />

                  {/* Left handle */}
                  <View {...leftHandlePan.panHandlers} style={{ position: 'absolute', top: 0, bottom: 0, left: `${trimStart * 100}%`, width: 24, backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }}>
                    <Text style={{ color: '#000', fontSize: 11, fontWeight: '900', lineHeight: 13 }}>{'|'}{'\n'}{'|'}</Text>
                  </View>
                  {/* Right handle */}
                  <View {...rightHandlePan.panHandlers} style={{ position: 'absolute', top: 0, bottom: 0, right: `${(1 - trimEnd) * 100}%`, width: 24, backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center', borderTopRightRadius: 8, borderBottomRightRadius: 8 }}>
                    <Text style={{ color: '#000', fontSize: 11, fontWeight: '900', lineHeight: 13 }}>{'|'}{'\n'}{'|'}</Text>
                  </View>
                </View>

                {/* Time row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ color: '#777', fontSize: 10, marginBottom: 2 }}>Start</Text>
                    <Text style={{ color: '#FFD700', fontSize: 13, fontWeight: '700' }}>
                      {videoDurationMs > 0 ? `${(trimStart * videoDurationMs / 1000).toFixed(1)}s` : `${(trimStart * 60).toFixed(1)}s`}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => { setTrimStart(0); setTrimEnd(1); }} style={{ paddingHorizontal: 16, paddingVertical: 5, backgroundColor: '#222', borderRadius: 20 }}>
                    <Text style={{ color: '#777', fontSize: 12 }}>Reset</Text>
                  </TouchableOpacity>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: '#777', fontSize: 10, marginBottom: 2 }}>End</Text>
                    <Text style={{ color: '#FFD700', fontSize: 13, fontWeight: '700' }}>
                      {videoDurationMs > 0 ? `${(trimEnd * videoDurationMs / 1000).toFixed(1)}s` : `${(trimEnd * 60).toFixed(1)}s`}
                    </Text>
                  </View>
                </View>

              </View>
            )}

            {/* ── EFFECTS / FILTER panel ── */}
            {/* Effects panel removed — now opens full-screen Filter Modal */}

            {/* ── MIX YOUR AUDIO — full-screen Modal (reference image style) ── */}
            <Modal visible={showMixAudio} animationType="slide" transparent={false} onRequestClose={() => setShowMixAudio(false)}>
              <View style={{ flex: 1, backgroundColor: '#000' }}>

                {/* ── Top bar: Cancel (left) · Done (right) — NO title in middle ── */}
                <View style={{ paddingTop: Platform.OS === 'ios' ? 54 : 36, paddingHorizontal: 20, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <TouchableOpacity onPress={() => setShowMixAudio(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 20 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '500' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowMixAudio(false)} hitSlop={{ top: 10, bottom: 10, left: 20, right: 10 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Done</Text>
                  </TouchableOpacity>
                </View>

                {/* ── Video preview — smaller, centered, with black bars ── */}
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
                  {(() => {
                    const vw = width * 0.52;
                    const vh = vw * (16 / 9);
                    return (
                      <>
                        <Video
                          source={{ uri: recordedVideoUri }}
                          style={{ width: vw, height: vh, borderRadius: 10 }}
                          resizeMode="cover"
                          shouldPlay
                          isLooping
                          useNativeControls={false}
                          isMuted={originalSoundVol === 0}
                          volume={originalSoundVol / 100}
                        />
                        {selectedSong && (
                          <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(56,151,240,0.18)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#3897F0', maxWidth: vw }}>
                            <Ionicons name="musical-note" size={12} color="#3897F0" style={{ marginRight: 5 }} />
                            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }} numberOfLines={1}>{selectedSong.title}</Text>
                          </View>
                        )}
                      </>
                    );
                  })()}
                </View>

                {/* ── Mix audio panel — compact ── */}
                <View style={{ backgroundColor: '#1C1C1E', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 6, paddingBottom: Platform.OS === 'ios' ? 30 : 16, paddingHorizontal: 16 }}>
                  {/* Handle */}
                  <View style={{ width: 32, height: 4, backgroundColor: '#444', borderRadius: 2, alignSelf: 'center', marginBottom: 14 }} />

                  {/* "Mix your audio" title + info */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Mix your audio</Text>
                    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#777', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#777', fontSize: 11, fontWeight: '700' }}>i</Text>
                    </View>
                  </View>

                  {/* Original Sound Slider */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="volume-medium" size={16} color="#fff" />
                    </View>
                    <View style={{ flex: 1, height: 36, justifyContent: 'center' }}
                      onStartShouldSetResponder={() => true}
                      onResponderGrant={(e) => {
                        const tw = width - 32 - 30 - 10 - 52 - 10;
                        setOriginalSoundVol(Math.round(Math.max(0, Math.min(100, (e.nativeEvent.locationX / tw) * 100))));
                      }}
                      onResponderMove={(e) => {
                        const tw = width - 32 - 30 - 10 - 52 - 10;
                        setOriginalSoundVol(Math.round(Math.max(0, Math.min(100, (e.nativeEvent.locationX / tw) * 100))));
                      }}
                    >
                      <View style={{ height: 4, backgroundColor: '#3A3A3C', borderRadius: 2 }}>
                        <View style={{ height: 4, width: `${originalSoundVol}%`, backgroundColor: '#3897F0', borderRadius: 2 }} />
                      </View>
                      <View style={{ position: 'absolute', left: `${Math.min(originalSoundVol, 96)}%`, top: 10, width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff', elevation: 4 }} />
                    </View>
                    <TouchableOpacity style={{ width: 48, alignItems: 'flex-end' }} onPress={() => setOriginalSoundVol(v => v > 0 ? 0 : 80)}>
                      <Text style={{ color: originalSoundVol === 0 ? '#FE2C55' : '#3897F0', fontSize: 13, fontWeight: '600' }}>
                        {originalSoundVol === 0 ? 'Muted' : 'Mute'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Music Volume Slider (generic — only when NO song selected) */}
                  {!selectedSong && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="musical-note" size={16} color="#fff" />
                      </View>
                      <View style={{ flex: 1, height: 32, justifyContent: 'center' }}
                        onStartShouldSetResponder={() => true}
                        onResponderGrant={(e) => {
                          const tw = width - 32 - 30 - 10 - 52 - 10;
                          setMusicVol(Math.round(Math.max(0, Math.min(100, (e.nativeEvent.locationX / tw) * 100))));
                        }}
                        onResponderMove={(e) => {
                          const tw = width - 32 - 30 - 10 - 52 - 10;
                          setMusicVol(Math.round(Math.max(0, Math.min(100, (e.nativeEvent.locationX / tw) * 100))));
                        }}
                      >
                        <View style={{ height: 4, backgroundColor: '#3A3A3C', borderRadius: 2 }}>
                          <View style={{ height: 4, width: `${musicVol}%`, backgroundColor: '#3897F0', borderRadius: 2 }} />
                        </View>
                        <View style={{ position: 'absolute', left: `${Math.min(musicVol, 96)}%`, top: 8, width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff', elevation: 4 }} />
                      </View>
                      <TouchableOpacity style={{ width: 48, alignItems: 'flex-end' }} onPress={() => setMusicVol(v => v > 0 ? 0 : 60)}>
                        <Text style={{ color: musicVol === 0 ? '#FE2C55' : '#3897F0', fontSize: 13, fontWeight: '600' }}>
                          {musicVol === 0 ? 'Off' : 'On'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* ── Music track row — shows when song IS selected ── */}
                  {selectedSong && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      {/* Song thumbnail with play/pause overlay */}
                      <TouchableOpacity
                        style={{ width: 30, height: 30, borderRadius: 6, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
                        onPress={() => setMixPanelPlaying(v => !v)}
                        activeOpacity={0.8}
                      >
                        {selectedSong.cover
                          ? <Image source={{ uri: selectedSong.cover }} style={{ width: 30, height: 30 }} />
                          : <Ionicons name="musical-notes" size={14} color="#3897F0" />
                        }
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name={mixPanelPlaying ? 'pause' : 'play'} size={13} color="#fff" />
                        </View>
                      </TouchableOpacity>
                      {/* Blue slider for music volume */}
                      <View style={{ flex: 1, height: 32, justifyContent: 'center' }}
                        onStartShouldSetResponder={() => true}
                        onResponderGrant={(e) => {
                          const tw = width - 32 - 30 - 10 - 48 - 10;
                          setMusicVol(Math.round(Math.max(0, Math.min(100, (e.nativeEvent.locationX / tw) * 100))));
                        }}
                        onResponderMove={(e) => {
                          const tw = width - 32 - 30 - 10 - 48 - 10;
                          setMusicVol(Math.round(Math.max(0, Math.min(100, (e.nativeEvent.locationX / tw) * 100))));
                        }}
                      >
                        <View style={{ height: 4, backgroundColor: '#3A3A3C', borderRadius: 2 }}>
                          <View style={{ height: 4, width: `${musicVol}%`, backgroundColor: '#3897F0', borderRadius: 2 }} />
                        </View>
                        <View style={{ position: 'absolute', left: `${Math.min(musicVol, 96)}%`, top: 8, width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff', elevation: 4 }} />
                      </View>
                      {/* Edit — opens music modal again */}
                      <TouchableOpacity
                        style={{ width: 40, alignItems: 'flex-end' }}
                        onPress={() => { setShowMixAudio(false); setTimeout(() => setShowMusicModal(true), 300); }}
                      >
                        <Text style={{ color: '#3897F0', fontSize: 13, fontWeight: '600' }}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Buttons */}
                  {/* Add music — only when NO song selected */}
                  {!selectedSong && (
                    <TouchableOpacity
                      onPress={() => { setShowMixAudio(false); setTimeout(() => setShowMusicModal(true), 300); }}
                      style={{ backgroundColor: '#3897F0', borderRadius: 8, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 8 }}
                    >
                      <Ionicons name="musical-notes" size={16} color="#fff" />
                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Add music</Text>
                    </TouchableOpacity>
                  )}

                  {/* Add voiceover — always visible */}
                  <TouchableOpacity
                    onPress={() => Alert.alert('Add Voiceover', 'Coming soon!')}
                    style={{ backgroundColor: '#3897F0', borderRadius: 8, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                  >
                    <Ionicons name="mic" size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Add voiceover</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* ── EDIT MODAL — full-screen (screenshot 2 style) ── */}
            <Modal visible={showEditModal} animationType="slide" transparent={false} onRequestClose={() => setShowEditModal(false)}>
              <View style={{ flex: 1, backgroundColor: '#000' }}>

                {/* Top bar: Cancel | Done */}
                <View style={{ paddingTop: Platform.OS === 'ios' ? 54 : 36, paddingHorizontal: 20, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <TouchableOpacity onPress={() => setShowEditModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 20 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '500' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowEditModal(false)} hitSlop={{ top: 10, bottom: 10, left: 20, right: 10 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Done</Text>
                  </TouchableOpacity>
                </View>

                {/* Video preview — smaller, centered */}
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
                  {(() => {
                    const vw = width * 0.52;
                    const vh = vw * (16 / 9);
                    return (
                      <Video
                        ref={editModalVideoRef}
                        source={{ uri: recordedVideoUri }}
                        style={{ width: vw, height: vh, borderRadius: 10 }}
                        resizeMode="cover"
                        shouldPlay={editModalPlaying}
                        isLooping
                        useNativeControls={false}
                        isMuted={false}
                        onPlaybackStatusUpdate={(status: any) => {
                          if (!status.isLoaded) return;
                          if (status.positionMillis != null && videoDurationMs > 0) {
                            setEditModalPosition(status.positionMillis / 1000);
                          }
                        }}
                      />
                    );
                  })()}
                </View>

                {/* Playback controls: ← | ▶/⏸ | ↩ | ↪ */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 44, paddingVertical: 12 }}>
                  {/* Back to start */}
                  <TouchableOpacity
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    onPress={async () => {
                      try { await editModalVideoRef.current?.setPositionAsync(0); } catch(_) {}
                    }}
                  >
                    <Ionicons name="play-skip-back" size={26} color="#fff" />
                  </TouchableOpacity>
                  {/* Play / Pause */}
                  <TouchableOpacity
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    onPress={async () => {
                      try {
                        if (editModalPlaying) {
                          await editModalVideoRef.current?.pauseAsync();
                        } else {
                          await editModalVideoRef.current?.playAsync();
                        }
                        setEditModalPlaying(p => !p);
                      } catch(_) {}
                    }}
                  >
                    <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={editModalPlaying ? 'pause' : 'play'} size={26} color="#fff" />
                    </View>
                  </TouchableOpacity>
                  {/* Undo trim */}
                  <TouchableOpacity
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    onPress={() => { setTrimStart(0); setTrimEnd(1); }}
                  >
                    <Ionicons name="arrow-undo" size={26} color="#fff" />
                  </TouchableOpacity>
                  {/* Redo (placeholder) */}
                  <TouchableOpacity
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={{ opacity: 0.4 }}
                  >
                    <Ionicons name="arrow-redo" size={26} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Time display: current / total */}
                <View style={{ alignItems: 'center', paddingBottom: 10 }}>
                  <Text style={{ fontSize: 17, fontWeight: '600' }}>
                    <Text style={{ color: '#fff' }}>{editModalPosition.toFixed(1)}</Text>
                    <Text style={{ color: '#555' }}>{' / '}{videoDurationMs > 0 ? (videoDurationMs / 1000).toFixed(1) : '0.0'}</Text>
                  </Text>
                </View>

                {/* Tool icons row: Audio | Edit | Effects | Text */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 24, paddingBottom: 12 }}>
                  {[
                    { id: 'audio',   icon: 'musical-notes',  label: 'Audio'   },
                    { id: 'edit',    icon: 'cut-outline',    label: 'Edit'    },
                    { id: 'effects', icon: 'color-filter',   label: 'Effects' },
                    { id: 'text',    icon: 'text-outline',   label: 'Text'    },
                  ].map(t => (
                    <TouchableOpacity key={t.id} style={{ alignItems: 'center', gap: 5 }}
                      onPress={() => {
                        if (t.id === 'audio') { setShowEditModal(false); setTimeout(() => setShowMixAudio(true), 300); }
                        else if (t.id === 'effects') { setFilterModalTempFilter(selectedFilter); setShowFilterModal(true); }
                        else if (t.id === 'text') { setShowEditModal(false); setTimeout(() => setShowTextModal(true), 300); }
                      }}
                    >
                      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: t.id === 'edit' ? '#2A2A2A' : '#1C1C1E', alignItems: 'center', justifyContent: 'center', borderWidth: t.id === 'edit' ? 1.5 : 0, borderColor: '#fff' }}>
                        <Ionicons name={t.icon as any} size={22} color="#fff" />
                      </View>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: t.id === 'edit' ? '700' : '400' }}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Filmstrip timeline with yellow handles */}
                <View style={{ paddingHorizontal: 12, paddingBottom: 10 }}>
                  <View style={{ height: 60, borderRadius: 10, overflow: 'hidden', backgroundColor: '#1A1A1A' }}>
                    {/* Film frames */}
                    <View style={{ flex: 1, flexDirection: 'row' }}>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <View key={i} style={{ flex: 1, borderRightWidth: 1, borderRightColor: '#0D0D0D', alignItems: 'center', justifyContent: 'center', backgroundColor: i % 2 === 0 ? '#1E1E1E' : '#171717' }}>
                          <View style={{ width: 2, height: 10, backgroundColor: '#2E2E2E', borderRadius: 1 }} />
                        </View>
                      ))}
                    </View>
                    {/* Dimmed — left of selection */}
                    <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${trimStart * 100}%`, backgroundColor: 'rgba(0,0,0,0.7)' }} />
                    {/* Dimmed — right of selection */}
                    <View style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: `${(1 - trimEnd) * 100}%`, backgroundColor: 'rgba(0,0,0,0.7)' }} />
                    {/* Selected region border */}
                    <View style={{ position: 'absolute', top: 0, bottom: 0, left: `${trimStart * 100}%`, right: `${(1 - trimEnd) * 100}%`, borderTopWidth: 3, borderBottomWidth: 3, borderColor: '#FFD700' }} />
                    {/* Left handle */}
                    <View {...leftHandlePan.panHandlers} style={{ position: 'absolute', top: 0, bottom: 0, left: `${trimStart * 100}%`, width: 24, backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }}>
                      <Text style={{ color: '#000', fontSize: 11, fontWeight: '900', lineHeight: 13 }}>{'|'}{'\n'}{'|'}</Text>
                    </View>
                    {/* Right handle */}
                    <View {...rightHandlePan.panHandlers} style={{ position: 'absolute', top: 0, bottom: 0, right: `${(1 - trimEnd) * 100}%`, width: 24, backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center', borderTopRightRadius: 8, borderBottomRightRadius: 8 }}>
                      <Text style={{ color: '#000', fontSize: 11, fontWeight: '900', lineHeight: 13 }}>{'|'}{'\n'}{'|'}</Text>
                    </View>
                  </View>

                  {/* Time row */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <Text style={{ color: '#FFD700', fontSize: 12, fontWeight: '600' }}>
                      {videoDurationMs > 0 ? `${(trimStart * videoDurationMs / 1000).toFixed(1)}s` : '0.0s'}
                    </Text>
                    <TouchableOpacity onPress={() => { setTrimStart(0); setTrimEnd(1); }} style={{ paddingHorizontal: 14, paddingVertical: 4, backgroundColor: '#222', borderRadius: 20 }}>
                      <Text style={{ color: '#777', fontSize: 12 }}>Reset</Text>
                    </TouchableOpacity>
                    <Text style={{ color: '#FFD700', fontSize: 12, fontWeight: '600' }}>
                      {videoDurationMs > 0 ? `${(trimEnd * videoDurationMs / 1000).toFixed(1)}s` : '0.0s'}
                    </Text>
                  </View>
                </View>

                {/* Music track row (if song selected) */}
                {selectedSong && (
                  <View style={{ marginHorizontal: 12, marginBottom: 8, backgroundColor: '#1C1C1E', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {selectedSong.cover ? (
                      <Image source={{ uri: selectedSong.cover }} style={{ width: 32, height: 32, borderRadius: 6 }} />
                    ) : (
                      <View style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="musical-note" size={18} color="#3897F0" />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                        {selectedSong.title} • {selectedSong.artist}
                      </Text>
                      {/* Fake waveform */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 5 }}>
                        {Array.from({ length: 36 }).map((_, i) => {
                          const h = [6,10,14,8,12,16,9,13,7,11,15,6,10,14,8,12,16,9,13,7,11,15,6,10,14,8,12,16,9,13,7,11,15,6,10,14][i];
                          return <View key={i} style={{ width: 3, height: h, backgroundColor: '#3897F0', borderRadius: 1.5, opacity: 0.85 }} />;
                        })}
                      </View>
                    </View>
                  </View>
                )}

                {/* + Text row */}
                <TouchableOpacity
                  onPress={() => { setShowEditModal(false); setTimeout(() => setShowTextModal(true), 300); }}
                  style={{ marginHorizontal: 12, marginBottom: Platform.OS === 'ios' ? 30 : 16, borderWidth: 1.5, borderColor: '#444', borderStyle: 'dashed', borderRadius: 10, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Ionicons name="add" size={20} color="#aaa" />
                  <Text style={{ color: '#aaa', fontSize: 14, fontWeight: '600' }}>Text</Text>
                </TouchableOpacity>

              </View>
            </Modal>

            {/* ── TEXT panel ── */}
            {/* ── TEXT MODAL — Instagram full-screen style ── */}
            <Modal visible={showTextModal} animationType="fade" transparent onRequestClose={() => setShowTextModal(false)}>
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)' }}>

                {/* Top toolbar */}
                <View style={{ paddingTop: Platform.OS === 'ios' ? 56 : 38, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
                    {/* Alignment */}
                    <TouchableOpacity onPress={() => setTextModalAlign(a => a === 'left' ? 'center' : a === 'center' ? 'right' : 'left')} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
                      <Ionicons name={textModalAlign === 'left' ? 'text-outline' : textModalAlign === 'center' ? 'reorder-three-outline' : 'reorder-two-outline'} size={24} color="#fff" />
                    </TouchableOpacity>
                    {/* Color wheel */}
                    <TouchableOpacity hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
                      <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2.5, borderColor: '#fff', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: textModalColor, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' }} />
                      </View>
                    </TouchableOpacity>
                    {/* Font toggle Aa */}
                    <TouchableOpacity onPress={() => setTextModalFont(f => (f + 1) % 4)} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: textModalFont === 0 ? '#fff' : 'transparent', borderWidth: textModalFont !== 0 ? 1.5 : 0, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: textModalFont === 0 ? '#000' : '#fff', fontSize: 15, fontWeight: '700' }}>Aa</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  {/* Done */}
                  <TouchableOpacity
                    onPress={() => {
                      if (textModalInput.trim()) {
                        setTextOverlays(prev => [...prev, { id: Date.now().toString(), text: textModalInput.trim(), color: textModalColor, size: 24, x: width / 2 - 80, y: height / 2 - 40 }]);
                      }
                      setTextModalInput('');
                      setShowTextModal(false);
                    }}
                    style={{ backgroundColor: '#2A2A2A', borderRadius: 8, paddingHorizontal: 18, paddingVertical: 8 }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Done</Text>
                  </TouchableOpacity>
                </View>

                {/* Center: text input overlay */}
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
                  <TextInput
                    style={{
                      color: textModalColor,
                      fontSize: 28,
                      fontWeight: '700',
                      textAlign: textModalAlign,
                      minWidth: 120,
                      maxWidth: width - 48,
                      textShadowColor: 'rgba(0,0,0,0.6)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 4,
                      fontFamily: textModalFont === 1 ? 'serif' : textModalFont === 2 ? 'monospace' : undefined,
                      fontStyle: textModalFont === 3 ? 'italic' : 'normal',
                    }}
                    placeholder="Start typing"
                    placeholderTextColor="rgba(255,255,255,0.55)"
                    value={textModalInput}
                    onChangeText={setTextModalInput}
                    autoFocus
                    multiline
                    autoCorrect={false}
                    maxLength={80}
                    returnKeyType="done"
                  />
                </View>

                {/* Font style row */}
                <View style={{ paddingBottom: 8 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12, alignItems: 'center', paddingVertical: 8 }}>
                    {[
                      { label: 'Aa', font: 0, style: { fontWeight: '700' as const } },
                      { label: 'Aa', font: 1, style: { fontFamily: 'serif', fontWeight: '700' as const } },
                      { label: 'Aa', font: 2, style: { fontFamily: 'monospace' } },
                      { label: 'Aa', font: 3, style: { fontStyle: 'italic' as const, fontWeight: '700' as const } },
                    ].map((f, i) => (
                      <TouchableOpacity key={i} onPress={() => setTextModalFont(f.font)}>
                        <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: textModalFont === f.font ? '#fff' : 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: textModalFont === f.font ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                          <Text style={[{ color: textModalFont === f.font ? '#000' : '#fff', fontSize: 16 }, f.style]}>{f.label}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                    {/* Color dots */}
                    {TEXT_COLORS.map(col => (
                      <TouchableOpacity key={col} onPress={() => setTextModalColor(col)}>
                        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: col, borderWidth: textModalColor === col ? 3 : 1.5, borderColor: textModalColor === col ? '#fff' : 'rgba(255,255,255,0.3)' }} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

              </View>
            </Modal>

            {/* ── STICKER MODAL — Instagram bottom sheet style ── */}
            <Modal visible={showStickerModal} animationType="slide" transparent onRequestClose={() => { setShowStickerModal(false); setEditorActiveTool(null); }}>
              <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => { setShowStickerModal(false); setEditorActiveTool(null); }} />
              <View style={{ backgroundColor: '#1C1C1E', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: height * 0.72 }}>
                {/* Handle */}
                <View style={{ width: 36, height: 4, backgroundColor: '#444', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 14 }} />

                {/* Category pills */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 10, paddingBottom: 12 }}>
                  {[
                    { icon: 'location-outline',   label: 'Location' },
                    { icon: 'time-outline',        label: 'Time'     },
                    { icon: 'images-outline',      label: 'GIF'      },
                    { icon: 'musical-notes',       label: 'Music'    },
                    { icon: 'person-circle-outline', label: 'Avatar' },
                  ].map(cat => (
                    <TouchableOpacity key={cat.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2C2C2E', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9 }}>
                      <Ionicons name={cat.icon as any} size={16} color="#fff" />
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500' }}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: '#2C2C2E', marginHorizontal: 0 }} />

                {/* Sticker grid — scrollable */}
                <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 30 }}>
                  {/* Section: Limited time */}
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 10 }}>Limited time</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                    {['⚽🔥','🎯','💙','🎺','🌟','🎉'].map((emoji, i) => (
                      <TouchableOpacity key={`lt-${i}`}
                        style={{ width: (width - 28 - 40) / 4, height: (width - 28 - 40) / 4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2C2C2E', borderRadius: 12 }}
                        onPress={() => { setStickerOverlays(prev => [...prev, { id: Date.now().toString() + i, emoji, size: 44, x: 60 + (i % 3) * 60, y: 140 + Math.floor(i / 3) * 70 }]); setShowStickerModal(false); setEditorActiveTool(null); }}
                      >
                        <Text style={{ fontSize: 36 }}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Section: Popular */}
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 10 }}>Popular</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {STICKER_EMOJIS.map((emoji, i) => (
                      <TouchableOpacity key={`st-${i}`}
                        style={{ width: (width - 28 - 40) / 4, height: (width - 28 - 40) / 4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2C2C2E', borderRadius: 12 }}
                        onPress={() => { setStickerOverlays(prev => [...prev, { id: Date.now().toString() + i, emoji, size: 44, x: 60 + (i % 4) * 55, y: 140 + Math.floor(i / 4) * 70 }]); setShowStickerModal(false); setEditorActiveTool(null); }}
                      >
                        <Text style={{ fontSize: 34 }}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </Modal>

            {/* ── FILTER MODAL — full-screen Instagram style ── */}
            <Modal visible={showFilterModal} animationType="fade" transparent onRequestClose={() => setShowFilterModal(false)}>
              <View style={{ flex: 1, backgroundColor: 'transparent' }}>

                {/* ── STATUS BAR PATTI (only) ── */}
                <View style={{ position: 'absolute', top: -40, left: 0, right: 0, height: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight ?? 24), backgroundColor: '#000', zIndex: 22 }} />

                {/* ── BACK + DONE — transparent, sits right below patti ── */}
                <View style={{
                  position: 'absolute',
                  top: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight ?? 24),
                  left: 0, right: 0,
                  zIndex: 21,
                  height: 0,
                  paddingHorizontal: 14,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: 'transparent',
                }}>
                  <TouchableOpacity
                    onPress={() => setShowFilterModal(false)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { setSelectedFilter(filterModalTempFilter); setShowFilterModal(false); }}
                    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#3897F0', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ionicons name="checkmark" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* ── Filter colour overlay over editing video (shows through transparent modal) ── */}
                <View style={{ flex: 1 }} pointerEvents="none">
                  {filterModalTempFilter !== 'Normal' && (
                    <View style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor:
                        filterModalTempFilter === 'B&W'     ? 'rgba(0,0,0,0.01)'      :
                        filterModalTempFilter === 'Vintage' ? 'rgba(139,100,20,0.35)'  :
                        filterModalTempFilter === 'Warm'    ? 'rgba(192,97,43,0.28)'   :
                        filterModalTempFilter === 'Cool'    ? 'rgba(43,123,192,0.28)'  :
                        filterModalTempFilter === 'Vibrant' ? 'rgba(192,43,217,0.20)'  :
                        filterModalTempFilter === 'Drama'   ? 'rgba(0,0,0,0.38)'       :
                        filterModalTempFilter === 'Fade'    ? 'rgba(180,180,180,0.30)' : 'transparent',
                    }} pointerEvents="none" />
                  )}
                </View>

                {/* ── BOTTOM: filter name + circular thumbnails ── */}
                <View style={{ backgroundColor: 'rgba(0,0,0,0.75)', paddingTop: 14, paddingBottom: Platform.OS === 'ios' ? 36 : 20 }}>
                  <Text style={{ color: '#fff', textAlign: 'center', fontSize: 15, fontWeight: '600', marginBottom: 14 }}>
                    {filterModalTempFilter}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 14, alignItems: 'center' }}>
                    {[
                      { name: 'Normal',  bg: '#444' },
                      { name: 'B&W',     bg: '#222',    tint: '#aaa'    },
                      { name: 'Vintage', bg: '#6B4A1A', tint: '#C8903A' },
                      { name: 'Warm',    bg: '#8B2B00', tint: '#FF7340' },
                      { name: 'Cool',    bg: '#0D3A6B', tint: '#5BA3E0' },
                      { name: 'Vibrant', bg: '#5B0068', tint: '#E040FB' },
                      { name: 'Drama',   bg: '#0A0A0A', tint: '#555'    },
                      { name: 'Fade',    bg: '#666',    tint: '#B0B0B0' },
                    ].map((f: any) => {
                      const isSelected = filterModalTempFilter === f.name;
                      return (
                        <TouchableOpacity key={f.name} onPress={() => setFilterModalTempFilter(f.name)} style={{ alignItems: 'center', gap: 6 }}>
                          <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: f.bg, alignItems: 'center', justifyContent: 'center', borderWidth: isSelected ? 3 : 2, borderColor: isSelected ? '#fff' : 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
                            {f.tint && <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: f.tint, opacity: 0.55 }} />}
                            {f.name === 'Normal'  && <Ionicons name="ban-outline"      size={26} color="rgba(255,255,255,0.7)" />}
                            {f.name === 'B&W'     && <Ionicons name="contrast-outline" size={26} color="#fff" />}
                            {f.name === 'Vintage' && <Ionicons name="image-outline"    size={24} color="#fff" />}
                            {f.name === 'Warm'    && <Ionicons name="sunny-outline"    size={24} color="#fff" />}
                            {f.name === 'Cool'    && <Ionicons name="snow-outline"     size={24} color="#fff" />}
                            {f.name === 'Vibrant' && <Ionicons name="sparkles-outline" size={24} color="#fff" />}
                            {f.name === 'Drama'   && <Ionicons name="moon-outline"     size={24} color="#fff" />}
                            {f.name === 'Fade'    && <Ionicons name="water-outline"    size={24} color="#fff" />}
                          </View>
                          <Text style={{ color: isSelected ? '#fff' : 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: isSelected ? '700' : '400' }}>{f.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

              </View>
            </Modal>

            {/* ── BOTTOM TOOLBAR ── */}
            <View style={flowStyles.edBottomBar}>
              {[
                { id: 'audio',    icon: 'musical-notes',   label: 'Audio'    },
                { id: 'edit',     icon: 'cut-outline',     label: 'Edit'     },
                { id: 'effects',  icon: 'color-filter',    label: 'Effects'  },
                { id: 'text',     icon: 'text',            label: 'Text'     },
                { id: 'stickers', icon: 'happy',           label: 'Stickers' },
              ].map((tool) => (
                <TouchableOpacity
                  key={tool.id}
                  style={flowStyles.edToolItem}
                  onPress={() => {
                    setShowDotsMenu(false);
                    if (tool.id === 'audio') {
                      setShowMixAudio(true);
                    } else if (tool.id === 'edit') {
                      setEditModalPlaying(true);
                      setEditModalPosition(0);
                      setShowEditModal(true);
                    } else if (tool.id === 'effects') {
                      setFilterModalTempFilter(selectedFilter);
                      setShowFilterModal(true);
                    } else if (tool.id === 'text') {
                      setTextModalInput('');
                      setShowTextModal(true);
                    } else if (tool.id === 'stickers') {
                      setShowStickerModal(true);
                    } else {
                      setEditorActiveTool(prev => prev === tool.id ? null : tool.id);
                    }
                  }}
                >
                  <View style={[flowStyles.edToolIconCircle, (tool.id === 'audio' ? showMixAudio : editorActiveTool === tool.id) && { backgroundColor: '#FE2C55' }]}>
                    <Ionicons
                      name={tool.icon}
                      size={22}
                      color="#fff"
                    />
                  </View>
                  <Text style={[flowStyles.edToolLabel, (tool.id === 'audio' ? showMixAudio : editorActiveTool === tool.id) && { color: '#FE2C55', fontWeight: '700' }]}>
                    {tool.label}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={{ alignItems: 'center', justifyContent: 'center', gap: 4 }}
                onPress={() => setRecordingFlowStep('upload')}
              >
                <View style={flowStyles.edNextCircle}>
                  <Ionicons name="arrow-forward" size={24} color="#fff" />
                </View>
                <Text style={flowStyles.edToolLabel}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      );
    }

    // ─── Upload / Post Screen (TikTok-style) ─────────────────────────────────
    if (recordedVideoUri && recordingFlowStep === 'upload') {
      return (
        <View style={[styles.cameraContainer, { backgroundColor: '#111' }]}>

          {/* ── TOP BAR ── */}
          <View style={flowStyles.uploadTopBar}>
            <TouchableOpacity onPress={() => setRecordingFlowStep('editor')} hitSlop={{top:12,bottom:12,left:12,right:12}}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={[flowStyles.editorTitle, { color: '#fff' }]}>Post</Text>
            <TouchableOpacity onPress={() => { setShowCamera(false); setRecordingFlowStep(null); setRecordedVideoUri(null); }} hitSlop={{top:12,bottom:12,left:12,right:12}}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={0}>
            <ScrollView style={{ flex: 1, marginTop: Platform.OS === 'ios' ? 96 : 84 }} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* ── DESCRIPTION ROW: input left, thumb right ── */}
              <View style={flowStyles.ttDescRow}>
                <View style={{ flex: 1, minWidth: 0, marginRight: 14 }}>
                  <TextInput
                    style={flowStyles.ttDescInput}
                    placeholder="Add a caption, hashtags, tags, etc."
                    placeholderTextColor="#aaa"
                    value={uploadTitle}
                    onChangeText={setUploadTitle}
                    multiline
                    maxLength={4000}
                  />
                  {/* Tabs */}
                  <View style={flowStyles.ttTabRow}>
                    {[
                      { key: '#Hashtags', icon: 'pricetag-outline' },
                      { key: '@Mention',  icon: 'at-outline'       },
                      { key: 'Videos',    icon: 'videocam-outline' },
                    ].map(tab => {
                      const on = activeDescTab === tab.key;
                      return (
                        <TouchableOpacity
                          key={tab.key}
                          onPress={() => {
                            setActiveDescTab(tab.key);
                            if (tab.key === '#Hashtags') {
                              setUploadTitle(prev => prev + '#');
                            } else if (tab.key === '@Mention') {
                              setUploadTitle(prev => prev + '@');
                            } else if (tab.key === 'Videos') {
                              setShowVideoPickerModal(true);
                            }
                          }}
                          style={[flowStyles.ttTab, on && flowStyles.ttTabActive]}
                        >
                          <Ionicons name={tab.icon} size={10} color={on ? '#fff' : '#777'} style={{ marginRight: 2 }} />
                          <Text style={[flowStyles.ttTabText, on && flowStyles.ttTabTextActive]}>{tab.key}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
                {/* Thumbnail with Select cover badge */}
                <TouchableOpacity style={flowStyles.ttThumb} onPress={() => setShowCoverSelection(true)} activeOpacity={0.85}>
                  {recordedVideoUri ? <Video source={{ uri: recordedVideoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" shouldPlay={false} positionMillis={coverFramePosition * 1000} useNativeControls={false} /> : <View style={{ width: '100%', height: '100%', backgroundColor: '#222' }} />}
                  <View style={flowStyles.ttSelectCoverBadge}>
                    <Text style={flowStyles.ttSelectCoverText}>Select cover</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* ── LIST ROWS ── */}
              <View style={flowStyles.ttListCard}>

                {/* Tag people */}
                <TouchableOpacity style={flowStyles.ttRow} onPress={() =>
                  Alert.alert('Tag People', 'Apne doston ko tag karo', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Search', onPress: () => {} },
                  ])
                }>
                  <Ionicons name="person-outline" size={20} color="#fff" style={flowStyles.ttRowIcon} />
                  <Text style={flowStyles.ttRowLabel}>Tag people</Text>
                  <Ionicons name="chevron-forward" size={18} color="#bbb" />
                </TouchableOpacity>
                <View style={flowStyles.ttDivider} />

                {/* Add link */}
                <TouchableOpacity style={flowStyles.ttRow} onPress={() =>
                  Alert.alert('Add Link', 'Video mein link add karo', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Add', onPress: () => {} },
                  ])
                }>
                  <Ionicons name="add-circle-outline" size={20} color="#fff" style={flowStyles.ttRowIcon} />
                  <Text style={flowStyles.ttRowLabel}>Add link</Text>
                  <Ionicons name="chevron-forward" size={18} color="#bbb" />
                </TouchableOpacity>
                <View style={flowStyles.ttDivider} />

                {/* Who can watch this video */}
                <TouchableOpacity
                  style={flowStyles.ttRow}
                  onPress={() => setShowPrivacySheet(true)}
                >
                  <Ionicons name="eye-outline" size={20} color="#fff" style={flowStyles.ttRowIcon} />
                  <Text style={flowStyles.ttRowLabel}>Who can watch this video</Text>
                  <Text style={flowStyles.ttRowSub}>
                    {privacySetting === 'public' ? 'Everyone' : privacySetting === 'friends' ? 'Friends' : 'Only Me'}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#bbb" />
                </TouchableOpacity>
                <View style={flowStyles.ttDivider} />

                {/* Hide like */}
                <View style={flowStyles.ttRow}>
                  <Ionicons name="heart-outline" size={20} color="#fff" style={flowStyles.ttRowIcon} />
                  <Text style={flowStyles.ttRowLabel}>Hide like</Text>
                  <Switch
                    value={!allowLikes}
                    onValueChange={v => setAllowLikes(!v)}
                    trackColor={{ false: '#3a3a3a', true: '#FE2C55' }}
                    thumbColor="#fff"
                    ios_backgroundColor="#3a3a3a"
                  />
                </View>
                <View style={flowStyles.ttDivider} />

                {/* Hide comment */}
                <View style={flowStyles.ttRow}>
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" style={flowStyles.ttRowIcon} />
                  <Text style={flowStyles.ttRowLabel}>Hide comment</Text>
                  <Switch
                    value={!allowComments}
                    onValueChange={v => setAllowComments(!v)}
                    trackColor={{ false: '#3a3a3a', true: '#FE2C55' }}
                    thumbColor="#fff"
                    ios_backgroundColor="#3a3a3a"
                  />
                </View>
                <View style={flowStyles.ttDivider} />

                {/* Hide save */}
                <View style={flowStyles.ttRow}>
                  <Ionicons name="bookmark-outline" size={20} color="#fff" style={flowStyles.ttRowIcon} />
                  <Text style={flowStyles.ttRowLabel}>Hide save</Text>
                  <Switch
                    value={hideLikeCount}
                    onValueChange={setHideLikeCount}
                    trackColor={{ false: '#3a3a3a', true: '#FE2C55' }}
                    thumbColor="#fff"
                    ios_backgroundColor="#3a3a3a"
                  />
                </View>
                <View style={flowStyles.ttDivider} />

                {/* Hide share */}
                <View style={flowStyles.ttRow}>
                  <Ionicons name="share-social-outline" size={20} color="#fff" style={flowStyles.ttRowIcon} />
                  <Text style={flowStyles.ttRowLabel}>Hide share</Text>
                  <Switch
                    value={!allowShares}
                    onValueChange={v => setAllowShares(!v)}
                    trackColor={{ false: '#3a3a3a', true: '#FE2C55' }}
                    thumbColor="#fff"
                    ios_backgroundColor="#3a3a3a"
                  />
                </View>
                <View style={flowStyles.ttDivider} />

                {/* More options */}
                <TouchableOpacity style={flowStyles.ttRow} onPress={() => setShowMoreOptions(true)}>
                  <Ionicons name="ellipsis-horizontal-circle-outline" size={20} color="#fff" style={flowStyles.ttRowIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={flowStyles.ttRowLabel}>More options</Text>
                    <Text style={flowStyles.ttRowSubLine}>
                      {allowHighQuality ? '✅ High quality on' : 'Manage upload quality'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#bbb" />
                </TouchableOpacity>
                <View style={flowStyles.ttDivider} />

                {/* Automatically share to */}
                <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 18 }}>
                  <Text style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>Automatically share to:</Text>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity style={flowStyles.ttShareBtn} onPress={() =>
                      Alert.alert('Messages', 'Message mein share karo', [{ text: 'OK' }])
                    }>
                      <Ionicons name="chatbubble-outline" size={20} color="#ccc" />
                    </TouchableOpacity>
                    <TouchableOpacity style={flowStyles.ttShareBtn} onPress={() =>
                      Alert.alert('Instagram', 'Instagram pe share karo', [{ text: 'OK' }])
                    }>
                      <Ionicons name="logo-instagram" size={20} color="#E1306C" />
                    </TouchableOpacity>
                    <TouchableOpacity style={flowStyles.ttShareBtn} onPress={() =>
                      Alert.alert('Share', 'Aur options pe share karo', [{ text: 'OK' }])
                    }>
                      <Ionicons name="ellipsis-horizontal-circle-outline" size={20} color="#ccc" />
                    </TouchableOpacity>
                    <TouchableOpacity style={flowStyles.ttShareBtn} onPress={() =>
                      Alert.alert('Snapchat', 'Snapchat pe share karo', [{ text: 'OK' }])
                    }>
                      <FontAwesome name="snapchat-ghost" size={20} color="#FFFC00" />
                    </TouchableOpacity>
                  </View>
                </View>

              </View>

            </ScrollView>
          </KeyboardAvoidingView>

          {/* ── BOTTOM BAR (fixed) ── */}
          <View style={flowStyles.uploadBottomBar}>
            <TouchableOpacity style={flowStyles.ttDraftsBtn} onPress={() =>
              Alert.alert('Drafts', 'Video draft mein save karein?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Save Draft', onPress: () => {
                  const newDraft = {
                    id: Date.now().toString(),
                    uri: recordedVideoUri,
                    title: uploadTitle || 'Draft',
                    savedAt: new Date().toISOString(),
                  };
                  setDrafts(prev => [newDraft, ...prev]);
                  setRecordingFlowStep(null);
                  setShowCamera(false);
                  setRecordedVideoUri(null);
                  Alert.alert('✅ Saved', 'Video draft mein save ho gaya!');
                }},
              ])
            }>
              <Ionicons name="albums-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={flowStyles.ttDraftsBtnText}>Drafts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={flowStyles.uploadPostBtn} onPress={postVideoToFeed}>
              <Text style={flowStyles.uploadPostText}>Post</Text>
            </TouchableOpacity>
          </View>

          {/* ── MORE OPTIONS BOTTOM SHEET ── */}
          <Modal visible={showMoreOptions} animationType="slide" transparent onRequestClose={() => setShowMoreOptions(false)}>
            <TouchableOpacity style={flowStyles.ttModalOverlay} activeOpacity={1} onPress={() => setShowMoreOptions(false)}>
              <TouchableOpacity activeOpacity={1} style={flowStyles.ttMoreSheet}>
                <View style={flowStyles.ttSheetHandle} />
                <View style={flowStyles.ttSheetHeader}>
                  <TouchableOpacity onPress={() => setShowMoreOptions(false)} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                    <Ionicons name="close" size={22} color="#fff" />
                  </TouchableOpacity>
                  <Text style={flowStyles.ttSheetTitle}>More options</Text>
                  <View style={{ width: 22 }} />
                </View>

                {/* Save to device */}
                <TouchableOpacity
                  style={flowStyles.ttSheetRow}
                  onPress={() => { setShowMoreOptions(false); setTimeout(saveVideoToDevice, 300); }}
                  activeOpacity={0.75}
                >
                  <Ionicons name="download-outline" size={20} color="#ccc" style={{ marginRight: 14 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={flowStyles.ttSheetRowLabel}>Save to device</Text>
                  </View>
                  <Switch
                    value={saveToDeviceEnabled}
                    onValueChange={(v) => { setSaveToDeviceEnabled(v); if (v) { setTimeout(saveVideoToDevice, 300); } }}
                    trackColor={{ false: '#3a3a3a', true: '#4CD964' }}
                    thumbColor="#fff"
                    ios_backgroundColor="#3a3a3a"
                  />
                </TouchableOpacity>
                <View style={{ height: 0.5, backgroundColor: '#2A2A2A', marginLeft: 20 }} />

                {/* Allow high-quality uploads */}
                <TouchableOpacity
                  activeOpacity={0.75}
                  style={flowStyles.ttSheetRow}
                  onPress={() => setAllowHighQuality(v => !v)}
                >
                  <Ionicons name="diamond-outline" size={20} color="#ccc" style={{ marginRight: 14 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={flowStyles.ttSheetRowLabel}>Allow high-quality uploads</Text>
                    <Text style={flowStyles.ttSheetRowSub}>Higher quality videos may take longer to process.</Text>
                  </View>
                  <Switch
                    value={allowHighQuality}
                    onValueChange={setAllowHighQuality}
                    trackColor={{ false: '#3a3a3a', true: '#4CD964' }}
                    thumbColor="#fff"
                    ios_backgroundColor="#3a3a3a"
                  />
                </TouchableOpacity>
                <View style={{ height: 0.5, backgroundColor: '#2A2A2A', marginLeft: 20 }} />

                {/* Branded content */}
                <TouchableOpacity
                  style={flowStyles.ttSheetRow}
                  onPress={() => setBrandedContent(v => !v)}
                  activeOpacity={0.75}
                >
                  <Ionicons name="megaphone-outline" size={20} color="#ccc" style={{ marginRight: 14 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={flowStyles.ttSheetRowLabel}>Branded content</Text>
                    <Text style={flowStyles.ttSheetRowSub}>Disclose the content created as sponsored content.</Text>
                  </View>
                  <Switch
                    value={brandedContent}
                    onValueChange={setBrandedContent}
                    trackColor={{ false: '#3a3a3a', true: '#4CD964' }}
                    thumbColor="#fff"
                    ios_backgroundColor="#3a3a3a"
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>

          {/* ── PRIVACY SHEET ── */}
          <Modal visible={showPrivacySheet} animationType="slide" transparent onRequestClose={() => setShowPrivacySheet(false)}>
            <TouchableOpacity style={flowStyles.ttModalOverlay} activeOpacity={1} onPress={() => setShowPrivacySheet(false)}>
              <TouchableOpacity activeOpacity={1} style={flowStyles.ttMoreSheet}>
                <View style={flowStyles.ttSheetHandle} />
                <View style={flowStyles.ttSheetHeader}>
                  <TouchableOpacity onPress={() => setShowPrivacySheet(false)} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                    <Ionicons name="close" size={22} color="#fff" />
                  </TouchableOpacity>
                  <Text style={flowStyles.ttSheetTitle}>Who can watch this video</Text>
                  <View style={{ width: 22 }} />
                </View>

                {[
                  { key: 'public',   label: 'Everyone', icon: 'earth-outline' },
                  { key: 'friends',  label: 'Friends',  icon: 'people-outline' },
                  { key: 'private',  label: 'Private',  icon: 'lock-closed-outline' },
                ].map((opt, idx, arr) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[flowStyles.ttSheetRow, { paddingVertical: 18 }]}
                    activeOpacity={0.75}
                    onPress={() => { setPrivacySetting(opt.key); setShowPrivacySheet(false); }}
                  >
                    <Ionicons name={opt.icon} size={22} color="#ccc" style={{ marginRight: 16 }} />
                    <Text style={[flowStyles.ttSheetRowLabel, { fontSize: 16 }]}>{opt.label}</Text>
                    {privacySetting === opt.key && (
                      <Ionicons name="checkmark" size={22} color="#FE2C55" style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>
                ))}
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>

          {/* ── VIDEO PICKER MODAL ── */}
          <Modal visible={showVideoPickerModal} animationType="slide" transparent onRequestClose={() => setShowVideoPickerModal(false)}>
            <TouchableOpacity style={flowStyles.ttModalOverlay} activeOpacity={1} onPress={() => setShowVideoPickerModal(false)}>
              <TouchableOpacity activeOpacity={1} style={[flowStyles.ttMoreSheet, { maxHeight: '75%' }]}>
                <View style={flowStyles.ttSheetHandle} />
                <View style={flowStyles.ttSheetHeader}>
                  <TouchableOpacity onPress={() => setShowVideoPickerModal(false)} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                    <Ionicons name="close" size={22} color="#fff" />
                  </TouchableOpacity>
                  <Text style={flowStyles.ttSheetTitle}>Apne Videos</Text>
                  <View style={{ width: 22 }} />
                </View>
                <FlatList
                  data={videos.filter(v => v.user === userId)}
                  keyExtractor={item => item.id}
                  style={{ width: '100%' }}
                  ListEmptyComponent={
                    <Text style={{ color: '#aaa', textAlign: 'center', marginTop: 24 }}>Koi video nahi mila</Text>
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[flowStyles.ttSheetRow, { paddingVertical: 14, alignItems: 'center' }]}
                      activeOpacity={0.75}
                      onPress={() => {
                        const link = `masti.app/video/${item.id}`;
                        setUploadTitle(prev => prev ? prev + ' ' + link : link);
                        setShowVideoPickerModal(false);
                      }}
                    >
                      <View style={{ width: 56, height: 72, backgroundColor: '#222', borderRadius: 8, marginRight: 14, overflow: 'hidden', flexShrink: 0 }}>
                        {item.profileImage ? (
                          <Image source={{ uri: item.profileImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        ) : null}
                        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 2, alignItems: 'center' }}>
                          <Ionicons name="videocam" size={14} color="#fff" />
                        </View>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[flowStyles.ttSheetRowLabel, { fontSize: 14 }]} numberOfLines={2}>{item.desc || item.name || 'Video'}</Text>
                        <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>masti.app/video/{item.id}</Text>
                      </View>
                      <Ionicons name="link-outline" size={18} color="#FE2C55" style={{ marginLeft: 10 }} />
                    </TouchableOpacity>
                  )}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>

          {/* ── COVER SELECTION MODAL ── */}
          <Modal visible={showCoverSelection} animationType="slide" transparent onRequestClose={() => setShowCoverSelection(false)}>
            <View style={flowStyles.coverModalBg}>
              <View style={flowStyles.coverModalContent}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={flowStyles.coverModalTitle}>Select Cover Frame</Text>
                  <TouchableOpacity onPress={() => setShowCoverSelection(false)}>
                    <Ionicons name="close" size={26} color="#fff" />
                  </TouchableOpacity>
                </View>
                <Video
                  source={{ uri: recordedVideoUri }}
                  style={{ width: width * 0.52, height: width * 0.52 * (16 / 9), alignSelf: 'center', borderRadius: 12, backgroundColor: '#000' }}
                  resizeMode="cover"
                  shouldPlay
                  isLooping
                  positionMillis={coverFramePosition * 1000}
                  useNativeControls={false}
                />
                <Text style={flowStyles.coverSliderLabel}>Drag to pick a frame</Text>
                <View style={flowStyles.coverSliderTrack}>
                  <View
                    style={[flowStyles.coverSliderThumb, { left: (coverFramePosition / 15) * (width - 80) - 12 }]}
                    {...PanResponder.create({
                      onStartShouldSetPanResponder: () => true,
                      onPanResponderMove: (evt, gs) => {
                        const pct = Math.max(0, Math.min(1, (gs.moveX - 16) / (width - 80)));
                        setCoverFramePosition(pct * 15);
                      },
                    }).panHandlers}
                  />
                </View>
                <TouchableOpacity style={flowStyles.coverSaveBtn} onPress={() => setShowCoverSelection(false)}>
                  <Text style={flowStyles.coverSaveBtnText}>Save Cover</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

        </View>
      );
    }
    // ─────────────────────────────────────────────────────────────────────────

    if (!permission) {
      return (
        <View style={styles.cameraContainer}>
          <Text style={{ color: '#fff', textAlign: 'center', marginTop: 100 }}>Loading camera...</Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.cameraContainer}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Ionicons name="camera" size={80} color="#555" />
            <Text style={{ color: '#fff', fontSize: 18, marginTop: 20, textAlign: 'center' }}>
              Camera permission required
            </Text>
            <TouchableOpacity 
              onPress={requestPermission} 
              style={{ backgroundColor: '#FE2C55', padding: 15, borderRadius: 10, marginTop: 20 }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowCamera(false)} style={{ marginTop: 20 }}>
              <Text style={{ color: '#999' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        {/* Cinematic black bars */}
        <View style={[flowStyles.cinematicBar, { top: 0 }]} />
        <View style={[flowStyles.cinematicBar, { bottom: 0, height: 80 }]} />

        {device ? (
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            device={device}
            isActive={showCamera}
            video={true}
            audio={true}
            torch={flash === 'on' ? 'on' : 'off'}
            zoom={device ? Math.min(device.maxZoom, Math.max(device.minZoom, 1 + cameraZoom * 9)) : 1}
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#111' }]} />
        )}
        {/* Gesture overlay: pinch-to-zoom + double-tap-to-flip + tap-to-focus */}
        <TouchableWithoutFeedback onPress={handleCameraTap}>
          <View
            style={StyleSheet.absoluteFillObject}
            {...cameraPanResponder.panHandlers}
          >
            {focusPoint && (
              <View
                style={[
                  flowStyles.focusReticle,
                  { top: focusPoint.y - 30, left: focusPoint.x - 30 },
                ]}
              />
            )}
          </View>
        </TouchableWithoutFeedback>

{/* Top Bar */}
{!isRecording && (
  <View style={styles.cameraTopBar}>
    <TouchableOpacity onPress={() => setShowCamera(false)}>
      <Ionicons name="close" size={32} color="#fff" />
    </TouchableOpacity>

    <TouchableOpacity style={styles.addSoundBtn} onPress={() => setShowMusicModal(true)}>
      <Ionicons name="musical-notes" size={18} color="#fff" />
      <Text style={styles.addSoundText}>{selectedSong ? selectedSong.title : 'Add sound'}</Text>
    </TouchableOpacity>

    <View style={{ width: 32 }} />
  </View>
)}

{/* Recording Timer - top-right pink pill */}
{isRecording && (
  <View
    style={{
      position: "absolute",
      top: 54,
      right: 16,
      backgroundColor: "#FF2D55",
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      zIndex: 999,
    }}
  >
    <Text
      style={{
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
      }}
    >
      {`0:${String(recordSeconds).padStart(2, "0")}`}
    </Text>
  </View>
)}

{/* Right Side Options */}
{!isRecording && (
  <View style={styles.cameraRightOptions}>
    <View style={styles.cameraRightDivider} />

    <TouchableOpacity
      style={styles.cameraOptionItem}
      onPress={toggleCameraFacing}
    >
      <Ionicons name="camera-reverse" size={28} color="#fff" />
      <Text style={styles.cameraOptionText}>Flip</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.cameraOptionItem}
      onPress={changeSpeed}
    >
      <Ionicons name="speedometer" size={28} color="#fff" />
      <Text style={styles.cameraOptionText}>{speed}</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.cameraOptionItem}
      onPress={() => setShowFilters(true)}
    >
      <Ionicons name="color-filter" size={28} color="#fff" />
      <Text style={styles.cameraOptionText}>Filter</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.cameraOptionItem}
      onPress={() => setShowEffects(true)}
    >
      <Ionicons name="sparkles" size={28} color="#fff" />
      <Text style={styles.cameraOptionText}>Enhance</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.cameraOptionItem}
      onPress={() => {
        Alert.alert('Timer', 'Countdown chunno', [
          { text: 'Off', onPress: () => setTimerSeconds(0) },
          { text: '3s', onPress: () => setTimerSeconds(3) },
          { text: '5s', onPress: () => setTimerSeconds(5) },
          { text: '10s', onPress: () => setTimerSeconds(10) },
        ]);
      }}
    >
      <Ionicons name="timer-outline" size={28} color="#fff" />
      <Text style={styles.cameraOptionText}>Timer</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.cameraOptionItem}
      onPress={toggleFlash}
    >
      <Ionicons
        name={flash === "off" ? "flash-off" : "flash"}
        size={28}
        color={flash === "off" ? "#fff" : "#FFD700"}
      />
      <Text style={styles.cameraOptionText}>Flash</Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.cameraOptionItem}
      onPress={() => setShowBeautyPanel(true)}
    >
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: showBeautyPanel ? '#FE2C55' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="flower-outline" size={26} color={beautySmooth > 0 || beautyBright > 0 ? '#FFB6C1' : '#fff'} />
      </View>
      <Text style={[styles.cameraOptionText, (beautySmooth > 0 || beautyBright > 0) && { color: '#FFB6C1' }]}>Beauty</Text>
    </TouchableOpacity>
  </View>
)}

{/* ── Beauty Panel ── */}
{showBeautyPanel && !isRecording && (
  <View style={{
    position: 'absolute', left: 0, right: 0, bottom: 160,
    backgroundColor: 'rgba(0,0,0,0.82)', paddingHorizontal: 20, paddingVertical: 16,
    borderTopLeftRadius: 20, borderTopRightRadius: 20, zIndex: 999,
  }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>✨ Beauty Camera</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity onPress={() => { setBeautySmooth(0); setBeautyBright(0); setBeautySlim(0); setBeautyEye(0); }}>
          <Text style={{ color: '#aaa', fontSize: 13 }}>Reset</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowBeautyPanel(false)}>
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
    {[
      { label: '💆 Smooth Skin', value: beautySmooth, setter: setBeautySmooth, color: '#FF6EB4' },
      { label: '☀️ Brightness',  value: beautyBright, setter: setBeautyBright, color: '#FFD700' },
      { label: '🪄 Slim Face',   value: beautySlim,   setter: setBeautySlim,   color: '#A78BFA' },
      { label: '👁️ Big Eyes',    value: beautyEye,    setter: setBeautyEye,    color: '#60A5FA' },
    ].map(({ label, value, setter, color }) => (
      <View key={label} style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ color: '#ddd', fontSize: 13 }}>{label}</Text>
          <Text style={{ color: color, fontSize: 13, fontWeight: '700' }}>{value}</Text>
        </View>
        <View style={{ height: 4, backgroundColor: '#333', borderRadius: 2 }}>
          <View style={{ height: 4, width: `${value}%`, backgroundColor: color, borderRadius: 2 }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          <TouchableOpacity onPress={() => setter(Math.max(0, value - 10))} style={{ padding: 4 }}>
            <Ionicons name="remove-circle-outline" size={22} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setter(Math.min(100, value + 10))} style={{ padding: 4 }}>
            <Ionicons name="add-circle-outline" size={22} color={color} />
          </TouchableOpacity>
        </View>
      </View>
    ))}
  </View>
)}

{/* Zoom Level Indicator */}
{showZoomLabel && !isRecording && (
  <View
    style={{
      position: "absolute",
      bottom: 185,
      alignSelf: "center",
      backgroundColor: "rgba(0,0,0,0.55)",
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      zIndex: 999,
    }}
  >
    <Text
      style={{
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
        letterSpacing: 0.5,
      }}
    >
      {`${Math.max(1, Math.min(10, Math.round(1 + cameraZoom * 9)))}x`}
    </Text>
  </View>
)}

<View style={styles.cameraBottomSection}>

  {!isRecording && (
    <>
      <View style={styles.timerOptions}>
        <TouchableOpacity onPress={() => { setRecordTime('3m'); recordTimeRef.current = '3m'; }}>
          <Text style={[styles.timerText, recordTime === '3m' && styles.timerTextActive]}>3m</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setRecordTime('60s'); recordTimeRef.current = '60s'; }}>
          <Text style={[styles.timerText, recordTime === '60s' && styles.timerTextActive]}>60s</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { setRecordTime('15s'); recordTimeRef.current = '15s'; }}
          style={recordTime === '15s' ? styles.timerSelected : null}
        >
          <Text style={[styles.timerText, recordTime === '15s' && styles.timerTextActive]}>
            15s
          </Text>
        </TouchableOpacity>
      </View>
    </>
  )}

  <View style={styles.recordButtonsRow}>

    {!isRecording && (
      <TouchableOpacity style={styles.sideBtn} onPress={() => setShowEffects(true)}>
        <View style={styles.sideBtnBox}>
          <Ionicons name="sparkles" size={24} color="white" />
        </View>
        <Text style={styles.sideBtnText}>Effects</Text>
      </TouchableOpacity>
    )}

<View style={{ alignItems: 'center', justifyContent: 'center' }}>

  <Animated.View
    style={{
      position: "absolute",
      transform: [
        {
          rotate: rotateAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "360deg"],
          }),
        },
      ],
    }}
  >
    <Svg
      width={100}
      height={100}
    >
      <Circle
        cx="50"
        cy="50"
        r={radius}
        stroke="#FE2C55"
        strokeWidth={5}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
      />
  </Svg>
</Animated.View>

  
<View
  {...recordButtonResponder.panHandlers}
  style={styles.recordBtn}
>
  <View
    style={[
      styles.recordBtnInner,
      isRecording && {
        backgroundColor: "#FF0000",
        width: 26,
        height: 26,
        borderRadius: 6,
      },
    ]}
  />
</View>

</View>

{!isRecording && (
  <TouchableOpacity
    style={styles.sideBtn}
    onPress={pickVideoFromGallery}
  >
    <View style={styles.sideBtnBox}>
      <Ionicons
        name="images"
        size={24}
        color="white"
      />
    </View>
    <Text style={styles.sideBtnText}>Upload</Text>
  </TouchableOpacity>
)}

</View>

{isRecording && <View style={{ height: 44 }} />}
{!isRecording && <View style={styles.cameraTabs}>

  <TouchableOpacity
    style={{ width: 110, alignItems: "center" }}
    onPress={() => setCameraTab("Templates")}
  >
    <Text
      numberOfLines={1}
      style={[
        styles.cameraTabText,
        cameraTab === "Templates" && styles.cameraTabActive,
      ]}
    >
      Templates
    </Text>
    {cameraTab === "Templates" ? (
      <View style={styles.cameraTabDot} />
    ) : (
      <View style={{ height: 9 }} />
    )}
  </TouchableOpacity>

  <TouchableOpacity
  style={{
    width: 110,
    alignItems: "center",
    marginLeft: -30,
  }}
  onPress={() => setCameraTab("Camera")}
>
    <Text
      style={[
        styles.cameraTabText,
        cameraTab === "Camera" && styles.cameraTabActive,
      ]}
    >
      Camera
    </Text>
    {cameraTab === "Camera" ? (
      <View style={styles.cameraTabDot} />
    ) : (
      <View style={{ height: 9 }} />
    )}
  </TouchableOpacity>
  
  <TouchableOpacity
    style={{ width: 80, alignItems: "center" }}
    onPress={() => setCameraTab("Live")}
  >
    <Text
      style={[
        styles.cameraTabText,
        cameraTab === "Live" && styles.cameraTabActive,
      ]}
    >
      Live
    </Text>
    {cameraTab === "Live" ? (
      <View style={styles.cameraTabDot} />
    ) : (
      <View style={{ height: 9 }} />
    )}
  </TouchableOpacity>

</View>}
      </View>
    </View>
  );
  };

const FiltersModal = () => (
    <Modal visible={showFilters} animationType="slide" transparent onRequestClose={() => setShowFilters(false)}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={{flex: 1}} onPress={() => setShowFilters(false)} />
        <View style={[styles.shareModalContent, { height: 300 }]}>
          <View style={styles.shareDragHandle} />
          <Text style={styles.shareTitle}>Filters</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 20 }}>
            {FILTERS_LIST.map((filter) => (
              <TouchableOpacity key={filter} style={{ marginRight: 15, alignItems: 'center' }} onPress={() => { setSelectedFilter(filter); setShowFilters(false); }}>
                <View style={[styles.filterCircle, selectedFilter === filter && styles.filterActive]}>
                  <Text style={{ fontSize: 30 }}>🎨</Text>
                </View>
                <Text style={{ color: selectedFilter === filter? '#FE2C55' : '#fff', fontSize: 12, marginTop: 8 }}>{filter}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const EffectsModal = () => (
    <Modal visible={showEffects} animationType="slide" transparent onRequestClose={() => setShowEffects(false)}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={{flex: 1}} onPress={() => setShowEffects(false)} />
        <View style={[styles.shareModalContent, { height: 300 }]}>
          <View style={styles.shareDragHandle} />
          <Text style={styles.shareTitle}>Effects</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 20 }}>
            {EFFECTS_LIST.map((effect) => (
              <TouchableOpacity key={effect} style={{ marginRight: 15, alignItems: 'center' }} onPress={() => { setSelectedEffect(effect); setShowEffects(false); }}>
                <View style={[styles.filterCircle, selectedEffect === effect && styles.filterActive]}>
                  <Text style={{ fontSize: 30 }}>✨</Text>
                </View>
             <Text style={{ color: selectedEffect === effect? '#FE2C55' : '#fff', fontSize: 12, marginTop: 8 }}>{effect}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const FollowersModal = ({ visible, type, onClose }) => {
    const currentUser = selectedUser || { user: userId, name, followers: 12, following: 2 };
    const displayUser = videos.find(v => v.user === currentUser.user) || currentUser;
    const users = type === 'followers'? videos : videos.filter(u => followingUsers.includes(u.user));

    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {/* ── STICKY HEADER — fixed at very top, does not scroll ── */}
          <View style={{ paddingTop: Platform.OS === 'ios' ? 54 : 32, paddingBottom: 14, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: '#333', backgroundColor: '#000' }}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 15 }}>
              {displayUser.name}
            </Text>
          </View>
          {/* ── SCROLLABLE LIST below the fixed header ── */}
          <ScrollView style={{ flex: 1, marginBottom: 10 }}>
            {users.map((item) => {
              const isFollowing = followingUsers.includes(item.user);
              return (
                <View key={item.id} style={{ flexDirection: 'row', padding: 15, alignItems: 'center' }}>
                  <TouchableOpacity style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }} onPress={() => { onClose(); openUserProfile(item); }}>
                    <Image source={{ uri: item.profileImage }} style={{ width: 50, height: 50, borderRadius: 25, marginRight: 15 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{item.name}</Text>
                      <Text style={{ color: '#999', fontSize: 13 }}>{item.userId}</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.followBtnBlue, isFollowing && styles.followBtnGray]}
                    onPress={() => toggleFollow(item.user)}
                  >
                    <MaterialCommunityIcons
                      name={isFollowing ? "account-check" : "account-plus"}
                      size={18}
                      color={isFollowing ? '#fff' : '#fff'}
                    />
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', marginLeft: 6 }}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    );
  };
  const MusicModal = () => {
    const allSongs = [...customSongs, ...SONGS_LIST];
    const q = musicSearchQuery.trim().toLowerCase();

    // Jab search ho: pehle local results, phir iTunes live results
    const localFiltered = q
      ? allSongs.filter(s =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q) ||
          (s.genre || '').toLowerCase().includes(q)
        )
      : musicTab === 'all'    ? allSongs
      : musicTab === 'Custom' ? customSongs
      : allSongs.filter(s => s.genre === musicTab);

    // iTunes results deduplicate karo
    const itunesDeduped = itunesResults.filter(
      ir => !localFiltered.some(l => l.title.toLowerCase() === ir.title.toLowerCase() && l.artist.toLowerCase() === ir.artist.toLowerCase())
    );

    const filtered = q ? [...localFiltered, ...itunesDeduped] : localFiltered;

    const addCustom = () => {
      if (!musicSearchQuery.trim()) return;
      const custom = {
        id: 'c_' + Date.now(),
        title: musicSearchQuery.trim(),
        artist: 'Custom / Original',
        duration: '—',
        cover: 'https://i.pravatar.cc/80?img=' + (53 + customSongs.length),
        genre: 'Custom',
        isCustom: true,
      };
      setCustomSongs(prev => [custom, ...prev]);
      setSelectedSong(custom);
      setMusicSearchQuery('');
      setShowMusicModal(false);
    };

    const TABS = [
      { id: 'all',           label: '🎵 Sab'          },
      { id: 'Bollywood',     label: '🎬 Bollywood'    },
      { id: 'Hindi',         label: '🎙️ Hindi'        },
      { id: 'Bhojpuri',      label: '🪘 Bhojpuri'     },
      { id: 'Marathi',       label: '🥁 Marathi'      },
      { id: 'Punjabi',       label: '🔥 Punjabi'      },
      { id: 'International', label: '🌍 International' },
      { id: 'Devotional',    label: '🙏 Devotional'   },
      { id: 'Dialogue',      label: '🎭 Dialogue'     },
      { id: 'Custom',        label: '✏️ My Sounds'    },
    ];

    return (
      <Modal visible={showMusicModal} animationType="slide" transparent={false} onRequestClose={() => { setShowMusicModal(false); setMusicSearchQuery(''); setPreviewingSongId(null); }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#000' }}>

          {/* ── TikTok-style Header ── */}
          <View style={{ backgroundColor: '#000', paddingTop: Platform.OS === 'ios' ? 54 : 32, paddingBottom: 0 }}>
            {/* Top row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 14 }}>
              <TouchableOpacity onPress={() => { setShowMusicModal(false); setMusicSearchQuery(''); setPreviewingSongId(null); }} style={{ marginRight: 12 }}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', flex: 1 }}>Sounds</Text>
              {selectedSong && (
                <TouchableOpacity onPress={() => setSelectedSong(null)}>
                  <Text style={{ color: '#FE2C55', fontSize: 13, fontWeight: '600' }}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* TikTok-style Search bar */}
            <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#1A1A1A', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="search" size={18} color="#888" style={{ marginRight: 10 }} />
              <TextInput
                style={{ flex: 1, color: '#fff', fontSize: 15 }}
                placeholder="Gaane, artist ya koi dialog..."
                placeholderTextColor="#555"
                value={musicSearchQuery}
                onChangeText={setMusicSearchQuery}
                returnKeyType="search"
                autoCorrect={false}
              />
              {musicSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setMusicSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#555" />
                </TouchableOpacity>
              )}
            </View>

            {/* Category tabs — horizontal scroll */}
            {!musicSearchQuery && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingBottom: 12 }}>
                {TABS.map(tab => (
                  <TouchableOpacity
                    key={tab.id}
                    onPress={() => setMusicTab(tab.id)}
                    style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                      backgroundColor: musicTab === tab.id ? '#FE2C55' : '#1A1A1A',
                      borderWidth: musicTab === tab.id ? 0 : 1, borderColor: '#333' }}
                  >
                    <Text style={{ color: musicTab === tab.id ? '#fff' : '#aaa', fontSize: 13, fontWeight: '600' }}>{tab.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Selected song strip */}
            {selectedSong && (
              <View style={{ marginHorizontal: 16, marginBottom: 10, backgroundColor: 'rgba(254,44,85,0.14)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#FE2C55' }}>
                <Ionicons name="musical-note" size={16} color="#FE2C55" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{selectedSong.title}</Text>
                  <Text style={{ color: '#aaa', fontSize: 11 }}>{selectedSong.artist}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedSong(null)}>
                  <Ionicons name="close-circle" size={20} color="#FE2C55" />
                </TouchableOpacity>
              </View>
            )}

            {/* Custom add buttons */}
            {musicSearchQuery.trim().length > 0 && (
              <TouchableOpacity
                style={{ marginHorizontal: 16, marginBottom: 8, backgroundColor: filtered.length === 0 ? '#FE2C55' : 'rgba(254,44,85,0.15)', borderRadius: 10, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: filtered.length > 0 ? 1 : 0, borderColor: '#FE2C55' }}
                onPress={addCustom}
              >
                <Ionicons name="add-circle" size={18} color={filtered.length === 0 ? '#fff' : '#FE2C55'} />
                <Text style={{ color: filtered.length === 0 ? '#fff' : '#FE2C55', fontWeight: '700', fontSize: 14 }}>
                  "{musicSearchQuery.trim()}" — Custom add karo
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Song list ── */}
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            style={{ flex: 1, backgroundColor: '#000' }}
            ListHeaderComponent={itunesSearching ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 }}>
                <Text style={{ color: '#FE2C55', fontSize: 13 }}>🔍 Searching live...</Text>
              </View>
            ) : null}
            ListEmptyComponent={
              itunesSearching ? null : (
                <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                  <Text style={{ fontSize: 48 }}>🎵</Text>
                  <Text style={{ color: '#555', fontSize: 15, marginTop: 12 }}>Koi sound nahi mila</Text>
                  <Text style={{ color: '#444', fontSize: 12, marginTop: 6 }}>Upar se custom add kar sakte ho</Text>
                </View>
              )
            }
            ItemSeparatorComponent={() => <View style={{ height: 0.5, backgroundColor: '#1A1A1A', marginLeft: 78 }} />}
            renderItem={({ item: song }) => {
              const isSelected = selectedSong?.id === song.id;
              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: isSelected ? 'rgba(254,44,85,0.08)' : '#000' }}
                  onPress={() => { setSelectedSong(isSelected ? null : song); if (!isSelected) { setShowMusicModal(false); setMusicSearchQuery(''); setPreviewingSongId(null); } }}
                >
                  {/* Cover art with Play/Pause button */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={(e) => {
                      e.stopPropagation();
                      setPreviewingSongId(prev => prev === song.id ? null : song.id);
                    }}
                    style={{ width: 50, height: 50, borderRadius: 6, overflow: 'hidden', backgroundColor: '#1A1A1A' }}
                  >
                    <Image source={{ uri: song.cover }} style={{ width: 50, height: 50 }} />
                    {/* Selected overlay — original musical-note */}
                    {isSelected && previewingSongId !== song.id && (
                      <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(254,44,85,0.55)', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="musical-note" size={22} color="#fff" />
                      </View>
                    )}
                    {/* Play / Pause overlay */}
                    {previewingSongId === song.id ? (
                      <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="pause" size={22} color="#fff" />
                      </View>
                    ) : (
                      previewingSongId !== song.id && !isSelected && (
                        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.30)', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="play" size={20} color="#fff" />
                        </View>
                      )
                    )}
                    {song.isCustom && (
                      <View style={{ position: 'absolute', top: 2, right: 2, backgroundColor: '#FE2C55', borderRadius: 4, paddingHorizontal: 3, paddingVertical: 1 }}>
                        <Text style={{ color: '#fff', fontSize: 7, fontWeight: '700' }}>MY</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Info */}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: isSelected ? '#FE2C55' : '#fff', fontSize: 15, fontWeight: '600' }} numberOfLines={1}>{song.title}</Text>
                    <Text style={{ color: '#777', fontSize: 12, marginTop: 3 }}>{song.artist}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 10 }}>
                      {song.genre && <Text style={{ color: '#444', fontSize: 10, backgroundColor: '#1A1A1A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>{song.genre}</Text>}
                      <Text style={{ color: '#444', fontSize: 10 }}>{song.duration}</Text>
                    </View>
                  </View>

                  {/* Right: use button or check */}
                  {isSelected ? (
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FE2C55', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: '#333', alignItems: 'center', justifyContent: 'center' }}
                      onPress={() => { setSelectedSong(song); setShowMusicModal(false); setMusicSearchQuery(''); setPreviewingSongId(null); }}
                    >
                      <Ionicons name="add" size={20} color="#aaa" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </KeyboardAvoidingView>
      </Modal>
    );
  };

     const ShareModal = () => (
    <Modal visible={showShare} animationType="slide" transparent onRequestClose={() => setShowShare(false)}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={{flex: 1}} onPress={() => setShowShare(false)} />
        <View style={styles.shareModalContent}>
          <View style={styles.shareDragHandle} />
          <Text style={styles.shareTitle}>Share • {shareCounts[currentVideoItem?.id] || 0}</Text>
          <View style={styles.shareGrid}>
          {SHARE_OPTIONS.map((item) => (
              <TouchableOpacity key={item.id} style={styles.shareItem} onPress={() => handleShare(currentVideoItem)}>
                <View style={[styles.shareIconCircle, {backgroundColor: item.color}]}>
                  <Ionicons name={item.icon} size={28} color={item.id === '4'? '#000' : '#fff'} />
                </View>
                <Text style={styles.shareText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.shareCancelBtn} onPress={() => setShowShare(false)}>
            <Text style={styles.shareCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const CommentsModal = () => (
    <Modal visible={showComments} animationType="slide" transparent onRequestClose={() => setShowComments(false)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios'? 'padding' : 'height'} style={{flex: 1}} keyboardVerticalOffset={0}>
        <View style={styles.commentModalContainer}>
          <TouchableOpacity style={{flex: 1}} onPress={() => setShowComments(false)} />
          <View style={styles.commentModalContent}>
            <View style={styles.commentHeader}>
              <View style={styles.commentDragHandle} />
              <Text style={styles.commentTitle}>{(videoComments[currentVideoItem?.id] || []).length} Comments</Text>
            </View>
            <PullToRefreshIndicator phase={commentsPTR.phase} progress={commentsPTR.progress} top={0} />
            <FlatList
              data={videoComments[currentVideoItem?.id] || []}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={[styles.commentItem, item.isReply && styles.commentReply]}>
                  <Image source={{ uri: item.profilePic }} style={styles.commentAvatar} />
                  <View style={styles.commentBody}>
                    <Text style={styles.commentUsername}>
                      {item.username}
                      <Text style={styles.commentTime}> {item.time}</Text>
                      {item.authorBadge && <Text style={styles.authorBadge}> · {item.authorBadge}</Text>}
                    </Text>
            <Text style={styles.commentText}>{item.comment}</Text>
                    <TouchableOpacity><Text style={styles.replyBtn}>Reply</Text></TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.commentLike} onPress={() => {
                    setVideoComments(prev => ({
                      ...prev,
                      [currentVideoItem?.id]: (prev[currentVideoItem?.id] || []).map(cm =>
                        cm.id === item.id ? { ...cm, likes: cm.likes + 1 } : cm
                      ),
                    }));
                  }}>
                    <Ionicons name={item.likes > 0? "heart" : "heart-outline"} size={16} color={item.likes > 0? "red" : "#999"} />
                    {item.likes > 0 && <Text style={styles.likeCount}>{item.likes}</Text>}
                  </TouchableOpacity>
                </View>
              )}
              style={styles.commentList}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="none"
              refreshControl={
                <RefreshControl
                  refreshing={commentsPTR.refreshing}
                  onRefresh={commentsPTR.onRefresh}
                  tintColor="transparent"
                  colors={['transparent']}
                  progressBackgroundColor="transparent"
                />
              }
              onScroll={commentsPTR.onScroll}
              scrollEventThrottle={16}
            />
            <View style={styles.commentInputContainer}>
              <View style={styles.emojiRow}>
                <TouchableOpacity onPress={() => setCommentText(commentText + '❤️')}><Text style={styles.emoji}>❤️</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setCommentText(commentText + '🙌')}><Text style={styles.emoji}>🙌</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setCommentText(commentText + '🔥')}><Text style={styles.emoji}>🔥</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setCommentText(commentText + '👏')}><Text style={styles.emoji}>👏</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setCommentText(commentText + '😢')}><Text style={styles.emoji}>😢</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setCommentText(commentText + '😍')}><Text style={styles.emoji}>😍</Text></TouchableOpacity>
              </View>
              <View style={styles.inputRow}>
                <Image source={{ uri: 'https://i.pravatar.cc/300?img=8' }} style={styles.inputAvatar} />
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  placeholderTextColor="#999"
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  maxLength={500}
                  blurOnSubmit={false}
                />
                <TouchableOpacity onPress={() => {
                  if(commentText.trim()) {
                    const newCmt = { id: Date.now().toString(), username: name || 'you', profilePic: profileImage || 'https://i.pravatar.cc/300?img=8', comment: commentText, time: 'now', likes: 0 };
                    setVideoComments(prev => ({
                      ...prev,
                      [currentVideoItem?.id]: [...(prev[currentVideoItem?.id] || []), newCmt],
                    }));
                    setCommentText('');
                  }
                }}>
                  <Ionicons name="send" size={24} color={commentText.trim()? "#0095f6" : "#555"} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const SearchModal = () => (
    <Modal visible={showSearch} animationType="slide" onRequestClose={() => setShowSearch(false)}>
      <View style={{flex: 1, backgroundColor: '#000', paddingTop: 50}}>
        <View style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15}}>
          <TouchableOpacity onPress={() => setShowSearch(false)}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <TextInput
            style={{flex: 1, backgroundColor: '#2A2A2A', borderRadius: 10, padding: 10, marginLeft: 10, color: 'white'}}
            placeholder="Search"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
        <ScrollView
            style={{ flex: 1, marginTop: 20 }}
            overScrollMode="always"
            alwaysBounceVertical
            refreshControl={
              <RefreshControl
                refreshing={searchPTR.refreshing}
                onRefresh={searchPTR.onRefresh}
                tintColor="transparent"
                colors={['transparent']}
                progressBackgroundColor="transparent"
                progressViewOffset={56}
              />
            }
            onScroll={searchPTR.onScroll}
            scrollEventThrottle={16}
          >
            <Text style={{color: 'white', textAlign: 'center', marginTop: 50}}>Search: {searchQuery}</Text>
          </ScrollView>
          <PullToRefreshIndicator phase={searchPTR.phase} progress={searchPTR.progress} top={70} />
      </View>
    </Modal>
  );

  // ✅ Like aur Save alag - Instagram jaisa
  const renderVideoItem = useCallback(({ item, index }) => {
    if (!item || !item.id) return null;
    const isLiked = likedVideos[item.id] || false;
    const isSaved = savedVideos[item.id] || false;
    return (
      <View style={styles.videoFullScreen}>
        {/* ✅ ADDED: double-tap-to-like wrapper around the video */}
        <TouchableWithoutFeedback onPress={() => handleVideoTap(item)}>
          <View style={StyleSheet.absoluteFillObject}>
            {item.url ? (
              <Video
                ref={(ref) => {
                  if (ref) videoRefs.current[item.id] = ref;
                  else delete videoRefs.current[item.id];
                }}
                source={{ uri: item.url }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
                shouldPlay={currentVideoIndex === index && !showCamera && !recordedVideoUri && !isUploading}
                isLooping
                isMuted={false}
                useNativeControls={false}
                rate={1.0}
                volume={1.0}
                onError={(e) => console.warn('Video error:', item.id, e)}
                onLoad={() => {
                  // ✅ Freshly-mounted video (e.g. just-uploaded one scrolled into view) —
                  //    force play explicitly in case the shouldPlay prop alone doesn't
                  //    kick playback off on first mount.
                  if (currentVideoIndex === index && !showCamera && !recordedVideoUri && !isUploading) {
                    videoRefs.current[item.id]?.playAsync?.();
                  }
                }}
                onPlaybackStatusUpdate={(status) => {
                  if (!status.isLoaded || currentVideoIndex !== index) return;
                  if (status.durationMillis && status.durationMillis > 0) {
                    setFeedPlaybackProgress((status.positionMillis || 0) / status.durationMillis);
                  }
                }}
              />
            ) : null}
          </View>
        </TouchableWithoutFeedback>
        
        {showBigHeart && (
          <Animated.View
            pointerEvents="none"
            style={[styles.bigHeartOverlay, { transform: [{ scale: bigHeartScale }] }]}
          >
            <Ionicons name="heart" size={120} color="#fff" />
          </Animated.View>
        )}
        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.profileCircle} onPress={() => requireAuth(() => openUserProfile(item))}>
            {item.profileImage ? (
              <Image source={{ uri: item.profileImage }} style={{width: 45, height: 45, borderRadius: 25}} />
            ) : (
              <View style={{width: 45, height: 45, borderRadius: 25, backgroundColor: '#444'}} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={() => requireAuth(() => handleLike(item))}>
            {/* ✅ ADDED: like icon bounce animation */}
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
              <Ionicons name={isLiked? "heart" : "heart-outline"} size={35} color={isLiked? "red" : "white"} />
            </Animated.View>
            <Text style={styles.actionText}>{item.likes || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={() => requireAuth(() => { setCurrentVideoItem(item); setShowComments(true); })}>
            <Ionicons name="chatbubble-sharp" size={30} color="white" />
            <Text style={styles.actionText}>{(videoComments[item.id] || []).length}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={() => requireAuth(() => handleSave(item))}>
            <Ionicons name={isSaved? "bookmark" : "bookmark-outline"} size={30} color={isSaved? "#FE2C55" : "white"} />
            <Text style={styles.actionText}>{saveCounts[item.id] || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={() => { setCurrentVideoItem(item); setShowShare(true); }}>
            <Ionicons name="paper-plane" size={30} color="white" />
            <Text style={styles.actionText}>{shareCounts[item.id] || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.musicDiscContainer} onPress={() => { setCurrentVideoItem(item); setShowMusicModal(true); }}>
            {(item.song?.cover || item.musicCover) ? (
              <Animated.Image source={{ uri: item.song?.cover || item.musicCover }} style={[styles.musicDisc, { transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] }]} />
            ) : (
              <Animated.View style={[styles.musicDisc, { backgroundColor: '#333', transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] }]} />
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.userInfo}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity onPress={() => requireAuth(() => openUserProfile(item))}>
              <Text style={styles.username}>{item.user}</Text>
            </TouchableOpacity>
          <TouchableOpacity style={styles.followButton} onPress={() => requireAuth(() => toggleFollow(item.user))}>
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 12 }}>{followingUsers.includes(item.user)? "Following" : "Follow"}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subText}>{item.desc}</Text>
          <Text style={styles.songName}>🎵 {item.song ? item.song.title + ' - ' + item.song.artist : 'Original Audio'} • {selectedFilter}</Text>
        </View>
      </View>
    );
  }, [likedVideos, savedVideos, followingUsers, currentVideoIndex, selectedFilter, selectedEffect, videoComments, shareCounts, saveCounts, showCamera, recordedVideoUri, isUploading, requireAuth]);
  
    if (showSplash) {
    return (
      <>
        {CameraModalOverlay()}
        {FiltersModal()}
        {EffectsModal()}
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
          <Animated.Text style={{ fontSize: 110, opacity: fadeAnim }}>🔥</Animated.Text>
          <Text style={{ color: '#ff4d00', fontSize: 50, fontWeight: '900' }}>Masti Video</Text>
          <Text style={{ color: '#fff', fontSize: 20, marginTop: 5, fontWeight: 'bold' }}>India Entertainment</Text>
        </View>
      </>
    );
  }

  if (editProfile) {
    return (
      <>
        {CameraModalOverlay()}
        {FiltersModal()}
        {EffectsModal()}
        <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
          <View style={{ padding: 20, marginTop: 40 }}>
            <TouchableOpacity onPress={() => setEditProfile(false)}><Text style={{ fontSize: 18, fontWeight: "bold" }}>← Back</Text></TouchableOpacity>
            <Text style={{ fontSize: 24, fontWeight: "bold", textAlign: "center", marginTop: 15 }}>Edit Profile</Text>
            <TouchableOpacity onPress={pickImage} style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: "#ddd", alignSelf: "center", marginTop: 20, justifyContent: "center", alignItems: "center" }}>
              {profileImage? <Image source={{ uri: profileImage }} style={{ width: 120, height: 120, borderRadius: 60 }} /> : <Ionicons name="camera" size={40} color="black" />}
            </TouchableOpacity>
            <Text style={{ marginTop: 20 }}>Add Name</Text>
            <TextInput value={name} onChangeText={setName} style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginTop: 5 }} />
            <Text style={{ marginTop: 15 }}>User Name</Text>
            <TextInput value={userId} onChangeText={setUserId} style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginTop: 5 }} />
            <Text style={{ marginTop: 15 }}>Bio</Text>
            <TextInput value={bio} onChangeText={setBio} maxLength={150} multiline style={{ borderWidth:1, borderColor:"#ddd", borderRadius:10, padding:12, height:80, marginTop:5, fontSize:12, textAlignVertical:"top" }} />
            <Text style={{ color:"#777", fontSize:12, textAlign:"right", marginTop:2 }}>{bio.length}/150</Text>
            <Text style={{ marginTop: 15 }}>YouTube</Text>
            <TextInput value={youtube} onChangeText={setYoutube} placeholder="YouTube Link" style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginTop: 5 }} />
            <Text style={{ marginTop: 15 }}>Facebook</Text>
            <TextInput value={facebook} onChangeText={setFacebook} placeholder="Facebook Link" style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginTop: 5 }} />
            <Text style={{ marginTop: 15 }}>Instagram</Text>
                      <TextInput value={instagram} onChangeText={setInstagram} placeholder="Instagram Link" style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginTop: 5 }} />
            <TouchableOpacity onPress={() => setEditProfile(false)} style={{ backgroundColor: "#FE2C55", padding: 15, borderRadius: 10, marginTop: 25, marginBottom: 50 }}>
              <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>Save Profile</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </>
    );
  }

  const FriendsScreen = () => (
    <>
      {CameraModalOverlay()}
      {FiltersModal()}
      {EffectsModal()}
      {MusicModal()}
      <View style={{ flex: 1, backgroundColor: '#000', paddingTop: 50 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingBottom: 15, borderBottomWidth: 0.5, borderBottomColor: '#333' }}>
          <TouchableOpacity onPress={() => setShowFriends(false)}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 15 }}>Friends</Text>
        </View>
        <ScrollView
            style={{ flex: 1, marginBottom: 90 }}
            overScrollMode="always"
            alwaysBounceVertical
            refreshControl={
              <RefreshControl
                refreshing={friendsPTR.refreshing}
                onRefresh={friendsPTR.onRefresh}
                tintColor="transparent"
                colors={['transparent']}
                progressBackgroundColor="transparent"
                progressViewOffset={56}
              />
            }
            onScroll={friendsPTR.onScroll}
            scrollEventThrottle={16}
          >
            {videos.map((item) => (
              <TouchableOpacity key={item.id} style={{ flexDirection: 'row', padding: 15, alignItems: 'center' }} onPress={() => requireAuth(() => { setShowFriends(false); openUserProfile(item); })}>
                <Image source={{ uri: item.profileImage }} style={{ width: 50, height: 50, borderRadius: 25, marginRight: 15 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{item.name}</Text>
                  <Text style={{ color: '#999', fontSize: 13 }}>{item.userId}</Text>
                </View>
                <TouchableOpacity style={{ borderWidth: 1, borderColor: '#fff', paddingHorizontal: 10, paddingVertical: 22, borderRadius: 8 }} onPress={() => requireAuth(() => {})}>
                  <Text style={{ color: '#fff', fontSize: 15 }}>Message</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <PullToRefreshIndicator phase={friendsPTR.phase} progress={friendsPTR.progress} top={56} />
        <BottomNav
          activeScreen='friends'
          handleHomePress={handleHomePress}
          setShowFriends={setShowFriends}
          setShowInbox={setShowInbox}
          setIsProfile={setIsProfile}
          setSelectedUser={setSelectedUser}
          setShowCamera={setShowCamera}
          requireAuth={requireAuth}
        />
        <LoginBottomSheet
          visible={showLoginSheet}
          onClose={() => { setShowLoginSheet(false); pendingActionRef.current = null; }}
          onLogin={handleLoginSuccess}
        />
      </View>
    </>
  );
  
  const InboxScreen = () => (
    <>
      {CameraModalOverlay()}
      {FiltersModal()}
      {EffectsModal()}
      {MusicModal()}
      <View style={{ flex: 1, backgroundColor: '#000', paddingTop: 50 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingBottom: 15, borderBottomWidth: 0.5, borderBottomColor: '#333' }}>
          <TouchableOpacity onPress={() => setShowInbox(false)}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginLeft: 15 }}>Inbox</Text>
        </View>
        <Text style={{ color: '#999', fontSize: 13, fontWeight: '600', paddingHorizontal: 15, paddingTop: 15, paddingBottom: 5 }}>All activity</Text>
        <FlatList
          data={activityFeed}
          keyExtractor={(item) => item.id}
          style={{ flex: 1, marginBottom: 90 }}
          overScrollMode="always"
          refreshControl={
            <RefreshControl
              refreshing={inboxPTR.refreshing}
              onRefresh={inboxPTR.onRefresh}
              tintColor="transparent"
              colors={['transparent']}
              progressBackgroundColor="transparent"
              progressViewOffset={56}
            />
          }
          onScroll={inboxPTR.onScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12 }}>
              <Image source={{ uri: item.avatar }} style={{ width: 46, height: 46, borderRadius: 23, marginRight: 12 }} />
              <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 14 }}>
                  <Text style={{ fontWeight: 'bold' }}>{item.user}</Text> {item.text}
                </Text>
                <Text style={{ color: '#777', fontSize: 12, marginTop: 2 }}>{item.time}</Text>
              </View>
              <Ionicons
                name={item.type === 'like' ? 'heart' : item.type === 'comment' ? 'chatbubble' : item.type === 'follow' ? 'person-add' : 'at'}
                size={20}
                color={item.type === 'like' ? '#FE2C55' : '#888'}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 }}>
              <Ionicons name="chatbubbles-outline" size={80} color="#555" />
              <Text style={{ color: '#999', fontSize: 16, marginTop: 20 }}>No activity yet</Text>
            </View>
          }
        />
        <PullToRefreshIndicator phase={inboxPTR.phase} progress={inboxPTR.progress} top={56} />
        <BottomNav
          activeScreen='inbox'
          handleHomePress={handleHomePress}
          setShowFriends={setShowFriends}
          setShowInbox={setShowInbox}
          setIsProfile={setIsProfile}
          setSelectedUser={setSelectedUser}
          setShowCamera={setShowCamera}
          requireAuth={requireAuth}
        />
      </View>
    </>
  );

  if (showFriends) return FriendsScreen();
  if (showInbox) return InboxScreen();

  if (isProfile) {
    const profileTabsData = [
      { key: 'posts', icon: 'grid-outline' },
      { key: 'private', icon: 'lock-closed-outline' },
      { key: 'saved', icon: 'bookmark-outline' },
      { key: 'liked', icon: 'heart-outline' },
    ];

    // ✅ Har user ka apna data — own profile vs dusre ka profile alag
    const isOwnProfile = !selectedUser || selectedUser.user === userId;

    // Own profile → global state se (latest DP, name, bio, social links)
    // Dusre ka profile → unke video object se
    const ownProfileData = { user: userId, name, userId, bio, profileImage: profileImage || '', followers: ownFollowers, following: followingUsers.length, youtube, instagram, facebook };
    const currentProfileUser = isOwnProfile ? ownProfileData : selectedUser;
    const displayUser = isOwnProfile
      ? { ...(videos.find(v => v.user === userId) || {}), ...ownProfileData }
      : videos.find(v => v.user === currentProfileUser.user) || currentProfileUser;

    const userVideos = videos.filter(v => v.user === displayUser.user);

    // Liked/Saved sirf apne profile mein dikhao — dusre ke profile mein nahi
    const userLikedVideos = isOwnProfile ? videos.filter(v => likedVideos[v.id]) : [];
    const userSavedVideos = isOwnProfile ? videos.filter(v => savedVideos[v.id]) : [];

    const postCount = userVideos.length;

    return (
      <>
        {CameraModalOverlay()}
        {FiltersModal()}
        {EffectsModal()}
        {FollowersModal({ visible: showFollowers, type: "followers", onClose: () => setShowFollowers(false) })}
        {FollowersModal({ visible: showFollowing, type: "following", onClose: () => setShowFollowing(false) })}
        {/* ── Drafts List Screen ── */}
        <Modal visible={showDrafts} animationType="slide" onRequestClose={() => setShowDrafts(false)}>
          <View style={{ flex: 1, backgroundColor: '#1c1c1c' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 22, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: '#222' }}>
              <TouchableOpacity onPress={() => setShowDrafts(false)} style={{ marginRight: 14 }}>
                <Ionicons name="arrow-back" size={26} color="#fff" />
              </TouchableOpacity>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', flex: 1, letterSpacing: 0.2 }}>Reels drafts</Text>
            </View>

            {/* Drafts list */}
            <FlatList
              data={drafts}
              keyExtractor={(item) => item.id}
              style={{ flex: 1, backgroundColor: '#1c1c1c' }}
              contentContainerStyle={{ paddingTop: 4 }}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingVertical: 100 }}>
                  <Ionicons name="albums-outline" size={64} color="#333" />
                  <Text style={{ color: '#555', marginTop: 16, fontSize: 16 }}>Koi draft nahi mila</Text>
                </View>
              }
              renderItem={({ item }) => {
                const date = new Date(item.savedAt);
                const month = date.toLocaleDateString('en-IN', { month: 'short' });
                const day = date.getDate();
                const time = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                const isEdited = !!item.title;
                const dateStr = `${isEdited ? 'Edited' : 'Created'} ${month} ${day}, ${time}`;
                const sizeStr = item.size ? `${(item.size / (1024 * 1024)).toFixed(1)} MB` : '';
                const durationStr = item.duration ? `0:${String(Math.round(item.duration)).padStart(2, '0')}` : '0:15';
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' }}
                    onPress={() => {
                      setShowDrafts(false);
                      setRecordedVideoUri(item.uri);
                      setRecordingFlowStep('upload');
                      setShowCamera(true);
                      if (item.title) setUploadTitle(item.title);
                    }}
                  >
                    {/* Thumbnail — portrait style like Reels */}
                    <View style={{ width: 64, height: 86, borderRadius: 4, backgroundColor: '#1a1a1a', overflow: 'hidden', marginRight: 14 }}>
                      {item.uri ? (
                        <Image source={{ uri: item.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                          <Ionicons name="videocam-outline" size={26} color="#444" />
                        </View>
                      )}
                    </View>
                    {/* Info */}
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, marginBottom: 5 }} numberOfLines={1}>
                        {item.title || 'Draft video'}
                      </Text>
                      <Text style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>{dateStr}</Text>
                      <Text style={{ color: '#666', fontSize: 13 }}>
                        {durationStr}{sizeStr ? `  |  ${sizeStr}` : ''}
                      </Text>
                    </View>
                    {/* Edit + more icons */}
                    <TouchableOpacity
                      style={{ padding: 10 }}
                      onPress={() => {
                        setShowDrafts(false);
                        setRecordedVideoUri(item.uri);
                        setRecordingFlowStep('editor');
                        setShowCamera(true);
                        if (item.title) setUploadTitle(item.title);
                      }}
                    >
                      <Ionicons name="pencil-outline" size={20} color="#bbb" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ padding: 10 }}
                      onPress={() => Alert.alert('Draft', item.title || 'Draft video', [
                        { text: 'Delete', style: 'destructive', onPress: () => setDrafts(prev => prev.filter(d => d.id !== item.id)) },
                        { text: 'Cancel', style: 'cancel' },
                      ])}
                    >
                      <Ionicons name="ellipsis-horizontal" size={20} color="#bbb" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Modal>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={styles.topGradient} pointerEvents="none" />
          
          {/* ✅ STICKY TABS - stickyHeaderIndices=[1] se tabs upar chipak jayenge */}
          <ScrollView
            style={{ flex: 1, backgroundColor: '#000' }}
            contentContainerStyle={{ paddingBottom: 135 }}
            showsVerticalScrollIndicator={false}
            bounces={true}
            overScrollMode="always"
            nestedScrollEnabled={true}
            stickyHeaderIndices={[1]}
            onScroll={profilePTR.onScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={profilePTR.refreshing}
                onRefresh={profilePTR.onRefresh}
                tintColor="transparent"
                colors={['transparent']}
                progressBackgroundColor="transparent"
                progressViewOffset={56}
              />
            }
          >
            
            <View>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => { setSelectedUser(null); setIsProfile(false); }} style={{ marginRight: 12 }}>
                  <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={() => Alert.alert("Menu", "Coming soon")}><Feather name="menu" size={26} color="white" /></TouchableOpacity>
              </View>
              <View style={styles.profileContent}>
                <View style={styles.avatarContainer}>
                  {displayUser?.profileImage
                    ? <Image source={{ uri: displayUser.profileImage }} style={styles.avatar} />
                    : <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#2a2a2a' }]}>
                        <Ionicons name="person" size={52} color="#666" />
                      </View>
                  }
                  <View style={styles.avatarPlusBadge}><Ionicons name="add" size={14} color="white" /></View>
                </View>
                <Text style={styles.usernameText}>{displayUser.name}</Text>
                <Text style={{ color: "#999", fontSize: 14, marginTop: 4 }}>{displayUser.userId}</Text>
                
              
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{postCount}</Text>
                    <Text style={styles.statLabel}>Posts</Text>
                  </View>
                  <TouchableOpacity style={styles.statItem} onPress={() => setShowFollowers(true)}>
                    <Text style={styles.statNumber}>{displayUser.followers}</Text>
                    <Text style={styles.statLabel}>Followers</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.statItem} onPress={() => setShowFollowing(true)}>
                    <Text style={styles.statNumber}>{displayUser.following}</Text>
                    <Text style={styles.statLabel}>Following</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.buttonGroupRow}>
                  {selectedUser? (
                    <>
                      <TouchableOpacity 
                        style={{ backgroundColor: followingUsers.includes(selectedUser.user) ? '#222' : '#1877F2', paddingVertical: 10, borderRadius: 8, marginHorizontal: 22, flex: 1, alignItems: "center", justifyContent: "center", flexDirection: 'row' }} 
                        onPress={() => toggleFollow(selectedUser.user)}
                      >
                        <MaterialCommunityIcons 
                          name={followingUsers.includes(selectedUser.user)? "account-check" : "account-plus"} 
                          size={20} 
                          color="white" 
                        />
                        <Text style={{ fontWeight: "bold", fontSize: 15, color: "#fff", marginLeft: 8 }}>
                          {followingUsers.includes(selectedUser.user)? "Following" : "Follow"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.grayButton} onPress={() => Alert.alert("Message", "Coming soon")}>
                        <Text style={{ fontWeight: "bold", fontSize: 15, color: "#fff" }}>Message</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity style={styles.grayButton} onPress={() => setEditProfile(true)}>
                        <Text style={{ fontWeight: "bold", fontSize: 15, color: "#fff" }}>Edit profile</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.grayButton} onPress={() => Alert.alert("Share Profile", "Coming soon")}>
                        <Text style={{ fontWeight: "bold", fontSize: 15, color: "#fff" }}>Share Profile</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
                {displayUser.bio? (
                  <View style={{ marginTop: 12, paddingHorizontal: 20 }}>
                    <Text style={{ color: "#fff", fontSize: 14, textAlign: "center", fontWeight: '500' }}>{displayUser.bio}</Text>
                  </View>
                ) : null}

                {(displayUser?.youtube || displayUser?.instagram || displayUser?.facebook)? (
                  <View style={styles.socialIconsRow}>
                    {displayUser?.youtube? (
           <TouchableOpacity onPress={() => Linking.openURL(displayUser.youtube)}>
                        <FontAwesome name="youtube-play" size={22} color="#FF0000" />
                      </TouchableOpacity>
                    ) : null}
                    {displayUser?.instagram? (
                      <TouchableOpacity onPress={() => Linking.openURL(displayUser.instagram)}>
                        <FontAwesome name="instagram" size={22} color="#E1306C" />
                      </TouchableOpacity>
                    ) : null}
                    {displayUser?.facebook? (
                      <TouchableOpacity onPress={() => Linking.openURL(displayUser.facebook)}>
                        <FontAwesome name="facebook-square" size={22} color="#1877F2" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>

    
            <View style={{ backgroundColor: "#111111" }}>
              <View style={styles.contentTabsBar}>
                {profileTabsData.map((tab, index) => (
                  <TouchableOpacity 
                    key={tab.key} 
                    style={styles.contentTabItem}
                    onPress={() => changeProfileTab(index)}
                  >
                    <Ionicons
  name={tab.icon}
  size={24}
  color={profileTabIndex === index ? "white" : "#888"}
/>
</TouchableOpacity>
))}

<Animated.View
  style={[
    styles.profileTabLine,
    {
      transform: [
        {
          translateX: profileScrollX.interpolate({
            inputRange: [0, width, width * 2, width * 3],
            outputRange: [
              (width / 8) - 20,
              (width / 8) + (width / 4) - 20,
              (width / 8) + (width / 2) - 20,
              (width / 8) + (width * 3 / 4) - 20,
            ],
            extrapolate: "clamp",
          }),
        },
      ],
    },
  ]}
/>

</View>

<View style={{ height: 1, backgroundColor: "#333" }} />
</View>
          
   <AnimatedFlatList
  ref={profileTabsFlatListRef}
  data={profileTabsData}
  horizontal
  pagingEnabled
  showsHorizontalScrollIndicator={false}
  scrollEventThrottle={16}
  onScroll={Animated.event(
    [{ nativeEvent: { contentOffset: { x: profileScrollX } } }],
    { useNativeDriver: true }
  )}
  onMomentumScrollEnd={(e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setProfileTabIndex(index);
  }}
  getItemLayout={(data, index) => ({
    length: width,
    offset: width * index,
    index,
  })}
  renderItem={({ item, index }) => (
                <View style={{ width: width, backgroundColor: "#000", minHeight: 400 }}>
                  {index === 0 && (
                    <View style={styles.videoGrid}>
                      {/* ── Drafts Folder — sirf apne profile mein, jab drafts hon ── */}
                      {isOwnProfile && drafts.length > 0 && (
                        <TouchableOpacity
                          key="drafts-folder"
                          style={styles.videoItem}
                          onPress={() => setShowDrafts(true)}
                        >
                          {drafts[0]?.uri ? (
                            <Image source={{ uri: drafts[0].uri }} style={{ flex: 1, backgroundColor: '#222' }} resizeMode="cover" />
                          ) : (
                            <View style={{ flex: 1, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' }}>
                              <Ionicons name="albums-outline" size={36} color="#aaa" />
                            </View>
                          )}
                          {/* Dark overlay */}
                          <View pointerEvents="none" style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)' }} />
                          {/* Drafts label at bottom */}
                          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 6, paddingBottom: 5 }}>
                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Drafts</Text>
                            <Text style={{ color: '#ccc', fontSize: 11 }}>{drafts.length} video{drafts.length > 1 ? 's' : ''}</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                      {(isOwnProfile ? userVideos : userVideos.filter(v => v.privacy !== 'private')).length === 0 && !(isOwnProfile && drafts.length > 0) && (
                        <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center', paddingVertical: 80 }}>
                          <Ionicons name="videocam-outline" size={60} color="#555" />
                          <Text style={{ color: '#999', marginTop: 15 }}>Koi video nahi</Text>
                        </View>
                      )}
                      {(isOwnProfile ? userVideos : userVideos.filter(v => v.privacy !== 'private')).map((item) => (
                        <TouchableOpacity key={item.id} style={styles.videoItem} onPress={() => { const idx = filteredVideos.findIndex(v => v.id === item.id); if (idx !== -1) { feedFlatListRef.current?.scrollToIndex({ index: idx, animated: false }); setCurrentVideoIndex(idx); setCurrentVideoItem(filteredVideos[idx]); } setIsProfile(false); }}>
                          <Image source={{ uri: item.thumbnail || item.url }} style={{ flex: 1, backgroundColor: '#111' }} resizeMode="cover" />
                          <View style={styles.videoViews}><Ionicons name="play" size={14} color="white" /><Text style={styles.viewsText}>{item.likes || 0}</Text></View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {index === 1 && (
                    <View style={styles.videoGrid}>
                      {isOwnProfile && userVideos.filter(v => v.privacy === 'private').length === 0 && (
                        <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center', paddingVertical: 80 }}>
                          <Ionicons name="lock-closed" size={60} color="#555" />
                          <Text style={{ color: '#999', marginTop: 15 }}>Koi private video nahi</Text>
                        </View>
                      )}
                      {isOwnProfile && userVideos.filter(v => v.privacy === 'private').map((item) => (
                        <TouchableOpacity key={item.id} style={styles.videoItem} onPress={() => { const idx = filteredVideos.findIndex(v => v.id === item.id); if (idx !== -1) { feedFlatListRef.current?.scrollToIndex({ index: idx, animated: false }); setCurrentVideoIndex(idx); setCurrentVideoItem(filteredVideos[idx]); } setIsProfile(false); }}>
                          <Image source={{ uri: item.thumbnail || item.url }} style={{ flex: 1, backgroundColor: '#111' }} resizeMode="cover" />
                          <View style={styles.videoViews}><Ionicons name="lock-closed" size={14} color="white" /></View>
                        </TouchableOpacity>
                      ))}
                      {!isOwnProfile && (
                        <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center', paddingVertical: 80 }}>
                          <Ionicons name="lock-closed" size={60} color="#555" />
                          <Text style={{ color: '#999', marginTop: 15 }}>Private videos</Text>
                        </View>
                      )}
                    </View>
                  )}
                  {index === 2 && (
                    <View style={styles.videoGrid}>
                      {userSavedVideos.length === 0 && (
                        <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center', paddingVertical: 80 }}>
                          <Ionicons name="bookmark-outline" size={60} color="#555" />
                          <Text style={{ color: '#999', marginTop: 15 }}>Koi saved video nahi</Text>
                        </View>
                      )}
                      {userSavedVideos.map((item) => (
                        <TouchableOpacity key={item.id} style={styles.videoItem} onPress={() => { const idx = filteredVideos.findIndex(v => v.id === item.id); if (idx !== -1) { feedFlatListRef.current?.scrollToIndex({ index: idx, animated: false }); setCurrentVideoIndex(idx); setCurrentVideoItem(filteredVideos[idx]); } setIsProfile(false); }}>
                          <Image source={{ uri: item.thumbnail || item.url }} style={{ flex: 1, backgroundColor: '#111' }} resizeMode="cover" />
                          <View style={styles.videoViews}><Ionicons name="bookmark" size={14} color="white" /></View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {index === 3 && (
                    <View style={styles.videoGrid}>
                      {userLikedVideos.length === 0 && (
                        <View style={{ width: '100%', justifyContent: 'center', alignItems: 'center', paddingVertical: 80 }}>
                          <Ionicons name="heart-outline" size={60} color="#555" />
                          <Text style={{ color: '#999', marginTop: 15 }}>Koi liked video nahi</Text>
                        </View>
                      )}
                      {userLikedVideos.map((item) => (
                        <TouchableOpacity key={item.id} style={styles.videoItem} onPress={() => { const idx = filteredVideos.findIndex(v => v.id === item.id); if (idx !== -1) { feedFlatListRef.current?.scrollToIndex({ index: idx, animated: false }); setCurrentVideoIndex(idx); setCurrentVideoItem(filteredVideos[idx]); } setIsProfile(false); }}>
                          <Image source={{ uri: item.thumbnail || item.url }} style={{ flex: 1, backgroundColor: '#111' }} resizeMode="cover" />
                          <View style={styles.videoViews}><Ionicons name="heart" size={14} color="#fe2c55" /></View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
              keyExtractor={item => item.key}
            />
          </ScrollView>
          <PullToRefreshIndicator phase={profilePTR.phase} progress={profilePTR.progress} top={52} />
          <BottomNav
            activeScreen='profile'
            handleHomePress={handleHomePress}
            setShowFriends={setShowFriends}
            setShowInbox={setShowInbox}
            setIsProfile={setIsProfile}
            setSelectedUser={setSelectedUser}
            setShowCamera={setShowCamera}
            requireAuth={requireAuth}
          />
        </View>
      </>
    );
  }
  
    // Main Feed - Home Screen
  return (
    <>
      {CameraModalOverlay()}
      {FiltersModal()}
      {EffectsModal()}
      {MusicModal()}

      {/* ── Drafts List Screen ── */}
      <Modal visible={showDrafts} animationType="slide" onRequestClose={() => setShowDrafts(false)}>
        <View style={{ flex: 1, backgroundColor: '#1c1c1c' }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 22, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: '#222' }}>
            <TouchableOpacity onPress={() => setShowDrafts(false)} style={{ marginRight: 14 }}>
              <Ionicons name="arrow-back" size={26} color="#fff" />
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', flex: 1, letterSpacing: 0.2 }}>Reels drafts</Text>
          </View>

          {/* Drafts list */}
          <FlatList
            data={drafts}
            keyExtractor={(item) => item.id}
            style={{ flex: 1, backgroundColor: '#1c1c1c' }}
            contentContainerStyle={{ paddingTop: 4 }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: 100 }}>
                <Ionicons name="albums-outline" size={64} color="#333" />
                <Text style={{ color: '#555', marginTop: 16, fontSize: 16 }}>Koi draft nahi mila</Text>
              </View>
            }
            renderItem={({ item }) => {
              const date = new Date(item.savedAt);
              const month = date.toLocaleDateString('en-IN', { month: 'short' });
              const day = date.getDate();
              const time = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
              const isEdited = !!item.title;
              const dateStr = `${isEdited ? 'Edited' : 'Created'} ${month} ${day}, ${time}`;
              const sizeStr = item.size ? `${(item.size / (1024 * 1024)).toFixed(1)} MB` : '';
              const durationStr = item.duration ? `0:${String(Math.round(item.duration)).padStart(2, '0')}` : '0:15';
              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#1a1a1a' }}
                  onPress={() => {
                    setShowDrafts(false);
                    setRecordedVideoUri(item.uri);
                    setRecordingFlowStep('upload');
                    setShowCamera(true);
                    if (item.title) setUploadTitle(item.title);
                  }}
                >
                  {/* Thumbnail — portrait style like Reels */}
                  <View style={{ width: 64, height: 86, borderRadius: 4, backgroundColor: '#1a1a1a', overflow: 'hidden', marginRight: 14 }}>
                    {item.uri ? (
                      <Image source={{ uri: item.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="videocam-outline" size={26} color="#444" />
                      </View>
                    )}
                  </View>
                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, marginBottom: 5 }} numberOfLines={1}>
                      {item.title || 'Draft video'}
                    </Text>
                    <Text style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>{dateStr}</Text>
                    <Text style={{ color: '#666', fontSize: 13 }}>
                      {durationStr}{sizeStr ? `  |  ${sizeStr}` : ''}
                    </Text>
                  </View>
                  {/* Edit + more icons */}
                  <TouchableOpacity
                    style={{ padding: 10 }}
                    onPress={() => {
                      setShowDrafts(false);
                      setRecordedVideoUri(item.uri);
                      setRecordingFlowStep('editor');
                      setShowCamera(true);
                      if (item.title) setUploadTitle(item.title);
                    }}
                  >
                    <Ionicons name="pencil-outline" size={20} color="#bbb" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ padding: 10 }}
                    onPress={() => Alert.alert('Draft', item.title || 'Draft video', [
                      { text: 'Delete', style: 'destructive', onPress: () => setDrafts(prev => prev.filter(d => d.id !== item.id)) },
                      { text: 'Cancel', style: 'cancel' },
                    ])}
                  >
                    <Ionicons name="ellipsis-horizontal" size={20} color="#bbb" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
      <View style={styles.container}>

        {/* ── PROCESSING INDICATOR — photo jaisa circular ring, top-left ── */}
        {isUploading && (() => {
          const R = 26;
          const CIRC = 2 * Math.PI * R;
          const offset = CIRC * (1 - uploadProgress / 100);
          return (
            <View
              pointerEvents="none"
              style={{ position: 'absolute', top: 108, left: 10, zIndex: 9999, alignItems: 'center' }}
            >
              {/* Circle + % */}
              <View style={{
                width: 68, height: 68, borderRadius: 34,
                backgroundColor: 'rgba(0,0,0,0.60)',
                justifyContent: 'center', alignItems: 'center',
              }}>
                <Svg width={68} height={68} style={{ position: 'absolute', top: 0, left: 0 }}>
                  {/* faint track */}
                  <Circle cx={34} cy={34} r={R}
                    stroke="rgba(255,255,255,0.20)" strokeWidth={4} fill="none"
                  />
                  {/* coloured arc — starts from top (rotation -90) */}
                  <Circle cx={34} cy={34} r={R}
                    stroke={uploadProgress >= 100 ? '#00FF88' : '#25F4EE'}
                    strokeWidth={4} fill="none"
                    strokeDasharray={CIRC}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    rotation={-90}
                    originX={34}
                    originY={34}
                  />
                </Svg>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', zIndex: 1 }}>
                  {uploadProgress}%
                </Text>
              </View>
              {/* label */}
              <Text style={{
                color: '#fff', fontSize: 10, fontWeight: '700', marginTop: 4,
                textShadowColor: 'rgba(0,0,0,1)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
              }}>
                {uploadProgress >= 100 ? 'Done! ✓' : 'Processing...'}
              </Text>
            </View>
          );
        })()}
        <AnimatedFlatList
          ref={tabFlatListRef}
          data={[{key: 'following'}, {key: 'foryou'}]}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={true}
          initialScrollIndex={1}
          scrollEventThrottle={1}
          getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            changeTab(index === 0);
          }}
          renderItem={({ index }) => (
            <View style={{ width: width, height: height }}>
              <FlatList
                ref={index === 1? feedFlatListRef : null}
                data={filteredVideos}
                renderItem={renderVideoItem}
                keyExtractor={(item) => item.id + '_' + index}
                pagingEnabled
                snapToInterval={height}
                snapToAlignment="start"
                decelerationRate="fast"
                disableIntervalMomentum={true}
                removeClippedSubviews={true}
                windowSize={5}
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                updateCellsBatchingPeriod={16}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={homePTR.refreshing}
                    onRefresh={homePTR.onRefresh}
                    tintColor="transparent"
                    colors={['transparent']}
                    progressBackgroundColor="transparent"
                    progressViewOffset={60}
                  />
                }
                onScroll={homePTR.onScroll}
                scrollEventThrottle={16}
                overScrollMode="always"
                getItemLayout={(data, idx) => ({ length: height, offset: height * idx, index: idx })}
                onScrollToIndexFailed={(info) => {
                  feedFlatListRef.current?.scrollToOffset({
                    offset: info.averageItemLength * info.index,
                    animated: true,
                  });
                }}
                onViewableItemsChanged={onViewableItemsChangedRef.current}
                viewabilityConfig={viewabilityConfigRef.current}
              />
            </View>
          )}
          keyExtractor={item => item.key}
        />
        <View style={styles.topGradient} pointerEvents="none" />
        <View style={styles.topMenuContainer}>
          <View style={styles.headerWrapperInner}>
            <View style={styles.tabsWrapper}>
              <TouchableOpacity onPress={() => changeTab(true)} style={styles.tabButton}>
                <Text style={[styles.topText, activeTab && styles.activeTopText]}>Following</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => changeTab(false)} style={styles.tabButton}>
                <Text style={[styles.topText,!activeTab && styles.activeTopText]}>For You</Text>
              </TouchableOpacity>
              <View style={styles.separatorWrapper}><Text style={styles.separator}>|</Text></View>
              <Animated.View style={[styles.activeLine, {
            transform: [{
                  translateX: scrollX.interpolate({
                    inputRange: [0, width],
                    outputRange: [LINE_CENTER_OFFSET, TAB_WIDTH + LINE_CENTER_OFFSET],
                    extrapolate: 'clamp'
                  })
                }]
              }]} />
            </View>
          </View>
          <TouchableOpacity style={styles.searchIcon} onPress={() => requireAuth(() => setShowSearch(true))}>
            <Ionicons name="search" size={26} color="white" />
          </TouchableOpacity>
        </View>

        <PullToRefreshIndicator phase={homePTR.phase} progress={homePTR.progress} top={92} />

        {feedLoadError && (
          <TouchableOpacity
            style={styles.feedErrorBanner}
            onPress={() => { setFeedLoadError(null); refetchBackendVideos(); }}
            activeOpacity={0.85}
          >
            <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
            <Text style={styles.feedErrorBannerText}>{feedLoadError} Tap to retry.</Text>
          </TouchableOpacity>
        )}

        {/* Progress bar — thin white line just above the bottom nav, fills L→R with playback (Instagram-style) */}
        <View style={styles.feedProgressTrack} pointerEvents="none">
          <View style={[styles.feedProgressFill, { width: width * feedPlaybackProgress }]} />
        </View>

        {!recordingFlowStep && !showCamera && (
          <BottomNav
            activeScreen='home'
            handleHomePress={handleHomePress}
            setShowFriends={setShowFriends}
            setShowInbox={setShowInbox}
            setIsProfile={setIsProfile}
            setSelectedUser={setSelectedUser}
            setShowCamera={setShowCamera}
            requireAuth={requireAuth}
          />
        )}

        {CommentsModal()}
        {ShareModal()}
        {SearchModal()}
        <LoginBottomSheet
          visible={showLoginSheet}
          onClose={() => {
            setShowLoginSheet(false);
            pendingActionRef.current = null;
          }}
          onLogin={handleLoginSuccess}
        />
      </View>
    </>
  );
}
   
const styles = StyleSheet.create({
         
    container: { flex: 1, backgroundColor: '#000' },
  videoFullScreen: { height: height, width: width, backgroundColor: '#000' },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 38, zIndex: 5, backgroundColor: '#1D1E22' },
  topMenuContainer: { position: 'absolute', top: 50, width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  headerWrapperInner: { width: HEADER_WIDTH, alignItems: 'center', justifyContent: 'center' },
  tabsWrapper: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', position: 'relative', paddingBottom: 6 },
  tabButton: { width: TAB_WIDTH, alignItems: 'center', justifyContent: 'center', paddingVertical: 5 },
  topText: { color: '#8a8a8a', fontSize: 18, fontWeight: '600' },
  activeTopText: { color: '#fff', fontWeight: 'bold' },
  separatorWrapper: { position: 'absolute', left: '50%', marginLeft: -3, top: 6, zIndex: 5 },
  separator: { color: '#333', fontSize: 16, opacity: 0.7 },
  activeLine: { height: 2, backgroundColor: 'white', width: LINE_WIDTH, position: 'absolute', bottom: -2, borderRadius: 1, left: 0 },
  searchIcon: { position: 'absolute', right: 20 },
  rightActions: { position: 'absolute', right: 10, bottom: 100, alignItems: 'center', zIndex: 20 },
  actionItem: { alignItems: 'center', marginBottom: 15 },
  actionText: { color: 'white', fontSize: 12, marginTop: 2, fontWeight: '600' },
  musicDiscContainer: { marginTop: 0, alignItems: "center" },
  musicDisc: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: "#fff" },
  profileCircle: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'white', marginBottom: 15, overflow: 'hidden' },
  userInfo: { position: 'absolute', bottom: 100, left: 15, zIndex: 20, maxWidth: width - 80 },
  username: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  followButton: { borderWidth: 1, borderColor: "white", paddingHorizontal: 15, paddingVertical: 4, borderRadius: 5, marginLeft: 20 },
  followBtnBlue: {
    backgroundColor: '#1877F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 9,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 26
  },
  followBtnGray: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#555',
  },
  subText: { color: '#fff', fontSize: 14, marginVertical: 4 },
  songName: { color: 'white', fontSize: 13 },
  bottomNav: { position: 'absolute', bottom: 0, width: '100%', height: 90, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#000', zIndex: 30, borderTopWidth: 0.5, borderTopColor: '#222', paddingBottom: 10 },
  feedProgressTrack: { position: 'absolute', bottom: 90, left: 0, width: '100%', height: 2, backgroundColor: 'rgba(255,255,255,0.25)', zIndex: 31 },
  feedErrorBanner: { position: 'absolute', top: 96, left: 16, right: 16, backgroundColor: 'rgba(200,30,30,0.92)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 40 },
  feedErrorBannerText: { color: '#fff', fontSize: 12, fontWeight: '600', flex: 1 },
  feedProgressFill: { height: 2, backgroundColor: '#fff' },
  navItem: { alignItems: 'center', justifyContent: 'center' },
  navLabel: { color: 'white', fontSize: 11, marginTop: 4, fontWeight: 'bold' },
  addButtonContainer: { width: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  addButtonWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: 64, height: 48 },
  addButton: { width: 54, height: 48, borderRadius: 12 },
  header: { position: "absolute", top: 40, left: 10, right: 0, height: 50, zIndex: 99999, elevation: 70, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal:15, backgroundColor: "transparent" },
  profileContent: { alignItems: "center", justifyContent: "center", marginTop: 40, width: "100%", backgroundColor: "#111111", paddingVertical: 10 },
  avatarContainer: { width: 100, height: 100, position: "relative", alignSelf: "center", justifyContent: "center", alignItems: "center" },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#D85CD5" },
  avatarPlusBadge: { position: "absolute", bottom: 0, right: 10, backgroundColor: "#25F4EE", width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#fff" },
  usernameText: { fontWeight: "bold", marginTop: 12, fontSize: 18, color: "#fff", textAlign: "center" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 8
  },
  statItem: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 2
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center"
  },
  statLabel: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
    textAlign: "center"
  },
  buttonGroupRow: { flexDirection: "row", width: "100%", paddingHorizontal: 30, justifyContent: "center", alignItems: "center", marginTop: 16 },
  grayButton: { backgroundColor: "#222", paddingVertical: 10, borderRadius: 8, marginHorizontal: 22, flex: 1, alignItems: "center", justifyContent: "center" },
  socialIconsRow: { flexDirection: 'row', marginTop: 12, justifyContent: 'center', gap: 24, alignItems: 'center' },
  contentTabsBar: { flexDirection: "row", width: "100%", marginTop: 45, backgroundColor: "#101010", zIndex: 10, position: 'relative' },
  contentTabItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  profileTabLine: { height: 2, backgroundColor: 'white', width: 40, position: 'absolute', bottom: 0 },
  videoGrid: { flexDirection: "row", flexWrap: "wrap", width: "100%", backgroundColor: "#000", marginTop: 1 },
  videoItem: { width: "33.33%", aspectRatio: 9/16, backgroundColor: "#1A1A1A", borderWidth: 0.5, borderColor: "#000", overflow: 'hidden' },
  videoViews: { position: "absolute", bottom: 6, left: 6, flexDirection: 'row', alignItems: 'center' },
  viewsText: { color: "#fff", fontSize: 12, fontWeight: "600", marginLeft: 4 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  shareModalContent: { backgroundColor: '#1A1A1A', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 20 },
  shareDragHandle: { width: 40, height: 4, backgroundColor: '#555', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 15 },
  shareTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  shareGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', paddingHorizontal: 20 },
  shareItem: { alignItems: 'center', width: '25%', marginBottom: 20 },
  shareIconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  shareText: { color: '#fff', fontSize: 12 },
  shareCancelBtn: { backgroundColor: '#2A2A2A', marginHorizontal: 20, padding: 15, borderRadius: 10, marginTop: 10 },
  shareCancelText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: '600' },
  commentModalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  commentModalContent: { backgroundColor: '#1A1A1A', borderTopLeftRadius: 15, borderTopRightRadius: 15, height: height * 0.65, paddingBottom: Platform.OS === 'ios'? 20 : 0 },
  commentHeader: { alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#333' },
  commentDragHandle: { width: 40, height: 4, backgroundColor: '#555', borderRadius: 2, marginBottom: 10 },
  commentTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  commentList: { flex: 1, paddingHorizontal: 15 },
  commentItem: { flexDirection: 'row', paddingVertical: 12, alignItems: 'flex-start' },
  commentReply: { marginLeft: 50 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  commentBody: { flex: 1 },
  commentUsername: { color: '#fff', fontSize: 13, fontWeight: '600' },
  commentTime: { color: '#777', fontWeight: 'normal' },
  authorBadge: { color: '#999', fontWeight: 'normal', fontSize: 12 },
  commentText: { color: '#fff', fontSize: 14, marginBottom: 6 },
  replyBtn: { color: '#777', fontSize: 12, fontWeight: '600' },
  commentLike: { alignItems: 'center', marginLeft: 10, paddingTop: 2 },
  likeCount: { color: '#777', fontSize: 11, marginTop: 2 },
  commentInputContainer: { borderTopWidth: 0.5, borderTopColor: '#333', paddingTop: 10, paddingBottom: Platform.OS === 'ios'? 10 : 10, paddingHorizontal: 15, backgroundColor: '#1A1A1A' },
  emojiRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12, paddingHorizontal: 5 },
  emoji: { fontSize: 26 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  inputAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  commentInput: { flex: 1, backgroundColor: '#2A2A2A', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, color: '#fff', fontSize: 14, maxHeight: 100 },
  
  filterCircle: { 
    width: 70, 
    height: 70, 
    borderRadius: 35, 
    backgroundColor: '#333', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  filterActive: {
    borderColor: '#FE2C55'
  },
  
  cameraContainer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#000", zIndex: 9999 },
  cameraTopBar: { position: "absolute", top: 50, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, zIndex: 100 },
  addSoundBtn: { backgroundColor: "#2A2A2A", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, flexDirection: "row", alignItems: "center" },
  addSoundText: { color: "#fff", marginLeft: 8, fontWeight: "600", fontSize: 15 },
  cameraRightOptions: { position: "absolute", right: 15, top: 95, alignItems: "center" },
  cameraRightDivider: { position: 'absolute', right: -8, top: 0, bottom: 0, width: 1, backgroundColor: '#333' },
  cameraOptionItem: { alignItems: "center", marginBottom: 22 },
  cameraOptionText: { color: "#fff", fontSize: 12, marginTop: 4 },
  cameraBottomSection: { position: "absolute", bottom: 40, width: "100%", alignItems: "center" },
  timerOptions: { flexDirection: "row", marginBottom: 20 },
  timerText: { color: "#777", marginHorizontal: 18, fontSize: 15 },
  timerTextActive: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  timerSelected: { backgroundColor: "#444", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 15 },
  recordButtonsRow: { flexDirection: "row", width: "100%", justifyContent: "space-evenly", alignItems: "center", marginBottom: 15 },
  sideBtn: { alignItems: "center" },
  sideBtnBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: "#2A2A2A", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#444" },
  sideBtnText: { color: "#fff", marginTop: 5, fontSize: 12 },
  recordBtn: { width: 88, height: 88, borderRadius: 44, backgroundColor: "transparent", borderWidth: 6, borderColor: "#fff", justifyContent: "center", alignItems: "center" },
  recordBtnInner: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#fff" },
  cameraTabs: {
  flexDirection: "row",
  justifyContent: "space-evenly",
  alignItems: "center",
  width: "100%",
  marginTop: 15,
},
  cameraTabText: { color: "#777", fontSize: 15, fontWeight: "600" },
  cameraTabActive: { color: "#fff", fontWeight: "bold" },
  cameraTabDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#fff", alignSelf: "center", marginTop: 4 },

  bigHeartOverlay: { position: "absolute", top: "42%", left: "50%", marginLeft: -60, marginTop: -60, zIndex: 50 },
});

// ─── NEW: Styles for recording flow screens ──────────────────────────────────
const flowStyles = StyleSheet.create({
  // Cinematic bars (thin black, top and bottom)
  cinematicBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: '#000',
    zIndex: 50,
  },
  cinematicBarThin: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: '#000',
    zIndex: 50,
  },

  // Focus reticle
  focusReticle: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderWidth: 1.5,
    borderColor: '#FFD700',
    borderRadius: 4,
    zIndex: 200,
  },

  // ── Review Screen (rv*) ────────────────────────────────────────────────────
  rvTopBar: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  rvTopBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rvBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 110 : 96,
    paddingHorizontal: 16,
  },
  rvThumbBox: {
    width: 170,
    height: 220,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  rvSideOptions: {
    flex: 1,
    paddingLeft: 20,
    paddingTop: 10,
    gap: 26,
  },
  rvOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rvOptionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  rvBottomBar: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  rvDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  rvDeleteText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rvReRecordBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(60,60,60,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#555',
  },
  rvReRecordInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  rvNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
  },
  rvNextText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  rvGalleryThumb: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 86,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
    zIndex: 100,
  },
  rvFlipBtn: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 86,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },

  // ── Editor Screen (ed*) ────────────────────────────────────────────────────
  edTopBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 52,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    zIndex: 100,
  },
  edBackBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  edAudioBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flex: 1,
    marginHorizontal: 10,
  },
  edAudioBannerTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  edAudioBannerSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 1,
  },
  editorTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  edDotsBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  edBottomBar: {
    position: 'absolute',
    top: 62 + width * (16 / 9) - 50,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 6,
    paddingTop: 37,
    zIndex: 100,
  },
  edToolItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  edToolIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  edToolLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
  edNextCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#3897F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    marginRight: 2,
  },

  // ── Upload Screen ──────────────────────────────────────────────────────────
  uploadTopBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 32,
    left: 0,
    right: 0,
    height: 52,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 100,
  },
  // TikTok-style Post screen
  ttListCard: {
    marginHorizontal: 0,
    marginTop: 12,
    backgroundColor: '#0d0d0d',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#1f1f1f',
  },
  ttDescRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    alignItems: 'flex-start',
  },
  ttDescInput: {
    color: '#fff',
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  ttTabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 0,
  },
  ttTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 5,
    marginBottom: 5,
    backgroundColor: '#1c1c1e',
  },
  ttTabActive: {
    backgroundColor: '#FE2C55',
  },
  ttTabText: {
    color: '#ccc',
    fontSize: 11,
    fontWeight: '600',
  },
  ttTabTextActive: {
    color: '#fff',
  },
  ttThumb: {
    width: 80,
    height: 110,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  ttSelectCoverBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  ttSelectCoverText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  ttRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0d0d0d',
  },
  ttRowIcon: {
    marginRight: 14,
    color: '#fff',
  },
  ttRowLabel: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
  },
  ttRowSub: {
    color: '#999',
    fontSize: 13,
    marginRight: 4,
  },
  ttRowSubLine: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  ttDivider: {
    height: 0.5,
    backgroundColor: '#1f1f1f',
    marginLeft: 50,
  },
  ttShareIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  ttShareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ttDraftsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  ttDraftsBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  // More options sheet
  ttModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  ttMoreSheet: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 40,
  },
  ttSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#555',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  ttSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  ttSheetTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  ttSheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  ttSheetRowIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#2c2c2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ttSheetRowLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  ttSheetRowSub: {
    color: '#888',
    fontSize: 12,
    marginTop: 3,
  },
  // kept for cover modal
  uploadThumbContainer: { alignItems: 'center', marginTop: 20, marginBottom: 4 },
  uploadVideoThumb: { width: width * 0.42, height: width * 0.42 * (16/9), borderRadius: 10, overflow: 'hidden', backgroundColor: '#000' },
  uploadThumbEditLabel: { marginTop: 8, paddingHorizontal: 14, paddingVertical: 5, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20 },
  uploadThumbText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  uploadInputWrapper: { marginHorizontal: 16, marginTop: 16, backgroundColor: '#1A1A1A', borderRadius: 12, borderWidth: 1, borderColor: '#333', padding: 12 },
  uploadTextInput: { color: '#fff', fontSize: 15, minHeight: 70, textAlignVertical: 'top' },
  uploadCharCount: { color: '#555', fontSize: 11, textAlign: 'right', marginTop: 4 },
  uploadSection: { marginHorizontal: 16, marginTop: 20, backgroundColor: '#1A1A1A', borderRadius: 12, borderWidth: 0.5, borderColor: '#333', overflow: 'hidden' },
  uploadSectionTitle: { color: '#999', fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  uploadOptionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderTopWidth: 0.5, borderTopColor: '#2A2A2A' },
  uploadOptionLabel: { flex: 1, color: '#fff', fontSize: 15, marginLeft: 12 },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#555' },
  radioCircleActive: { borderColor: '#FE2C55', backgroundColor: '#FE2C55' },
  uploadToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 0.5, borderTopColor: '#2A2A2A' },
  uploadToggleLabel: { color: '#fff', fontSize: 15 },
  uploadBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: '#111',
    borderTopWidth: 0.5,
    borderTopColor: '#2a2a2a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 100,
  },
  uploadEditBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2A2A2A', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 30, gap: 8 },
  uploadEditText: { color: '#fff', fontSize: 15, fontWeight: '600', marginLeft: 6 },
  uploadPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FE2C55',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 6,
  },
  uploadPostText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Cover selection modal
  coverModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  coverModalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  coverModalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  coverSliderLabel: {
    color: '#aaa',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  coverSliderTrack: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    marginHorizontal: 16,
    position: 'relative',
  },
  coverSliderThumb: {
  position: 'absolute',
  top: -9,
  width: 24,
  height: 24,
  borderRadius: 12,
  backgroundColor: '#FE2C55',
  borderWidth: 3,
  borderColor: '#fff',
},

coverSaveBtn: {
  backgroundColor: '#FE2C55',
  marginTop: 24,
  paddingVertical: 14,
  borderRadius: 30,
  alignItems: 'center',
},

coverSaveBtnText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '700',
},

// ── Network Upload Indicator (top-left corner) ──
uploadProcessingWrap: {
  position: 'absolute',
  top: 56,
  left: 10,
  width: 100,
  zIndex: 9999,
  borderRadius: 20,
  shadowColor: '#20D5EC',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.8,
  shadowRadius: 16,
  elevation: 20,
  overflow: 'hidden',
},
uploadProcessing: {
  width: '100%',
  borderRadius: 20,
  borderWidth: 1,
  borderColor: 'rgba(32,213,236,0.5)',
  paddingVertical: 10,
  paddingHorizontal: 10,
  alignItems: 'center',
  overflow: 'hidden',
},
uploadNetBars: {
  flexDirection: 'row',
  alignItems: 'flex-end',
  gap: 3,
  marginBottom: 8,
  height: 14,
},
uploadNetBar: {
  width: 5,
  borderRadius: 2,
},
uploadRingWrap: {
  width: 54,
  height: 54,
  borderRadius: 27,
  borderWidth: 3,
  borderColor: '#20D5EC',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 7,
  overflow: 'hidden',
},
uploadRingGlow: {
  position: 'absolute',
  width: 54,
  height: 54,
  borderRadius: 27,
  backgroundColor: '#20D5EC',
},
uploadRingInner: {
  flexDirection: 'row',
  alignItems: 'flex-end',
},
uploadPercent: {
  color: '#fff',
  fontSize: 17,
  fontWeight: '800',
  letterSpacing: -0.5,
},
uploadPercentSign: {
  color: '#20D5EC',
  fontSize: 10,
  fontWeight: '700',
  marginBottom: 2,
  marginLeft: 1,
},
uploadText: {
  color: '#bbb',
  fontSize: 9,
  fontWeight: '700',
  letterSpacing: 0.3,
  marginBottom: 8,
  textAlign: 'center',
},
uploadBarTrack: {
  width: '100%',
  height: 3,
  backgroundColor: 'rgba(255,255,255,0.12)',
  borderRadius: 2,
  overflow: 'hidden',
},
uploadBarFill: {
  height: 3,
  borderRadius: 2,
  backgroundColor: '#20D5EC',
},

});