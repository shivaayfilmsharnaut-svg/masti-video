import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { RotateCw } from 'lucide-react-native';

export type PullPhase = 'idle' | 'pulling' | 'release' | 'refreshing';

interface PullToRefreshIndicatorProps {
  phase: PullPhase;
  /** 0 → 1 progress while pulling, used to pre-rotate the icon before release */
  progress?: number;
  top?: number;
}

const CIRCLE_SIZE = 42;
const REFRESHING_TOP_OFFSET = 18;
// useNativeDriver is only supported on native (iOS/Android), not web
const USE_NATIVE = Platform.OS !== 'web';

export default function PullToRefreshIndicator({
  phase,
  progress = 0,
  top = 8,
}: PullToRefreshIndicatorProps) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const scale      = useRef(new Animated.Value(0.6)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const spin       = useRef(new Animated.Value(0)).current;
  const spinLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const visible = phase !== 'idle';

  // ── Fade + scale in/out ─────────────────────────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: visible ? 180 : 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: USE_NATIVE,
      }),
      Animated.spring(scale, {
        toValue: visible ? 1 : 0.6,
        useNativeDriver: USE_NATIVE,
        tension: 160,
        friction: 9,
      }),
    ]).start();
  }, [visible, opacity, scale]);

  // ── Lift up when refreshing, drop back when done ────────────────────────
  useEffect(() => {
    Animated.spring(translateY, {
      toValue: phase === 'refreshing' ? -REFRESHING_TOP_OFFSET : 0,
      useNativeDriver: USE_NATIVE,
      tension: 180,
      friction: 10,
    }).start();
  }, [phase, translateY]);

  // ── Spin loop only while refreshing ────────────────────────────────────
  useEffect(() => {
    if (phase === 'refreshing') {
      spin.setValue(0);
      spinLoopRef.current = Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 750,
          easing: Easing.linear,
          useNativeDriver: USE_NATIVE,
        })
      );
      spinLoopRef.current.start();
    } else {
      spinLoopRef.current?.stop();
      spinLoopRef.current = null;
    }
    return () => { spinLoopRef.current?.stop(); };
  }, [phase, spin]);

  // Progressive rotation while pulling; full spin loop while refreshing
  const rotate =
    phase === 'refreshing'
      ? spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] })
      : `${Math.min(progress, 1) * 300}deg`;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        { top, opacity, transform: [{ scale }, { translateY }] },
      ]}
    >
      <View style={styles.circle}>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <RotateCw size={22} strokeWidth={2.2} color="#1C1C1E" />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    // Cross-platform shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
      },
      android: { elevation: 6 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.18)' } as any,
    }),
  },
});
