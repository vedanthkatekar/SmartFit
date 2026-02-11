import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ScanLine,
  Scissors,
  Move3d,
  Cpu,
  Upload,
} from 'lucide-react-native';
import type { ProcessingProgress, ProcessingStage } from '@/services/tryOnPipeline';

interface TryOnProcessingProps {
  progress: ProcessingProgress;
}

const STAGE_META: Record<string, { icon: typeof ScanLine; label: string; color: string }> = {
  submitting: { icon: Upload, label: 'Sending to AI Engine', color: '#6366f1' },
  pose_detection: { icon: ScanLine, label: 'Pose & Body Detection', color: '#3b82f6' },
  clothing_removal: { icon: Scissors, label: 'Clothing Removal', color: '#0891b2' },
  garment_warp: { icon: Move3d, label: 'Garment Warping (TPS)', color: '#059669' },
  diffusion_render: { icon: Cpu, label: 'Diffusion Rendering', color: '#d97706' },
};

const ORDERED_STAGES: ProcessingStage[] = [
  'submitting',
  'pose_detection',
  'clothing_removal',
  'garment_warp',
  'diffusion_render',
];

export function TryOnProcessing({ progress }: TryOnProcessingProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress.percent / 100,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progress.percent, progressAnim]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const currentStageIndex = ORDERED_STAGES.indexOf(progress.stage);

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconPulse, { transform: [{ scale: pulseAnim }] }]}>
        <LinearGradient colors={['#1e3a5f', '#0f2942']} style={styles.iconCircle}>
          {(() => {
            const meta = STAGE_META[progress.stage];
            if (!meta) return <Cpu size={32} color="#ffffff" />;
            const Icon = meta.icon;
            return <Icon size={32} color="#ffffff" />;
          })()}
        </LinearGradient>
      </Animated.View>

      <Text style={styles.message}>{progress.message}</Text>
      <Text style={styles.percent}>{progress.percent}%</Text>

      <View style={styles.progressBarOuter}>
        <Animated.View style={[styles.progressBarInner, { width: barWidth }]}>
          <LinearGradient
            colors={['#1e3a5f', '#3b82f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressGradient}
          />
        </Animated.View>
      </View>

      <View style={styles.stageList}>
        {ORDERED_STAGES.map((stage, index) => {
          const meta = STAGE_META[stage];
          if (!meta) return null;
          const isActive = index === currentStageIndex;
          const isDone = currentStageIndex > index;
          const Icon = meta.icon;
          return (
            <View
              key={stage}
              style={[
                styles.stageRow,
                isActive && styles.stageRowActive,
                isDone && styles.stageRowDone,
              ]}>
              <View
                style={[
                  styles.stageDot,
                  isActive && { backgroundColor: meta.color },
                  isDone && styles.stageDotDone,
                ]}>
                <Icon size={14} color={isActive || isDone ? '#ffffff' : '#94a3b8'} />
              </View>
              <Text
                style={[
                  styles.stageLabel,
                  isActive && styles.stageLabelActive,
                  isDone && styles.stageLabelDone,
                ]}>
                {meta.label}
              </Text>
              {isDone && (
                <View style={styles.checkMark}>
                  <Text style={styles.checkMarkText}>Done</Text>
                </View>
              )}
              {isActive && (
                <View style={styles.activeMark}>
                  <Text style={styles.activeMarkText}>Running</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>AI Garment Replacement</Text>
        <Text style={styles.infoText}>
          Your photo is being processed by a diffusion-based virtual try-on model
          that detects your body pose, removes existing clothing, and realistically
          warps the new garment to match your body shape, lighting, and proportions.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  iconPulse: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  percent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a5f',
    marginBottom: 20,
  },
  progressBarOuter: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
    marginBottom: 32,
  },
  progressBarInner: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
  },
  stageList: {
    width: '100%',
    gap: 8,
    marginBottom: 28,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    gap: 12,
  },
  stageRowActive: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  stageRowDone: {
    backgroundColor: '#f0fdf4',
  },
  stageDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageDotDone: {
    backgroundColor: '#10b981',
  },
  stageLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
  },
  stageLabelActive: {
    color: '#1e40af',
    fontWeight: '600',
  },
  stageLabelDone: {
    color: '#065f46',
    fontWeight: '500',
  },
  checkMark: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#d1fae5',
  },
  checkMarkText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  activeMark: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#dbeafe',
  },
  activeMarkText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563eb',
  },
  infoBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
});
