import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ScanningAnimationProps {
  isScanning: boolean;
}

export function ScanningAnimation({ isScanning }: ScanningAnimationProps) {
  const scanLinePosition = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLinePosition, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scanLinePosition, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanLinePosition.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [isScanning]);

  if (!isScanning) return null;

  const scanLineTranslateY = scanLinePosition.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pulseContainer,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}>
        <View style={styles.cornerTopLeft} />
        <View style={styles.cornerTopRight} />
        <View style={styles.cornerBottomLeft} />
        <View style={styles.cornerBottomRight} />
      </Animated.View>

      <Animated.View
        style={[
          styles.scanLine,
          {
            transform: [{ translateY: scanLineTranslateY }],
          },
        ]}>
        <LinearGradient
          colors={['rgba(102, 126, 234, 0)', 'rgba(102, 126, 234, 0.8)', 'rgba(102, 126, 234, 0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.scanLineGradient}
        />
      </Animated.View>

      <View style={styles.gridOverlay}>
        {[...Array(8)].map((_, i) => (
          <View key={`h-${i}`} style={[styles.gridLine, { top: `${(i + 1) * 12.5}%` }]} />
        ))}
        {[...Array(8)].map((_, i) => (
          <View key={`v-${i}`} style={[styles.gridLine, { left: `${(i + 1) * 12.5}%`, width: 1, height: '100%' }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#667eea',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#667eea',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#667eea',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#667eea',
  },
  scanLine: {
    width: '90%',
    height: 4,
    position: 'absolute',
  },
  scanLineGradient: {
    width: '100%',
    height: '100%',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  gridLine: {
    position: 'absolute',
    height: 1,
    width: '100%',
    backgroundColor: '#667eea',
  },
});
