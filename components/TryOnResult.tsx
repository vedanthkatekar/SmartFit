import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  RotateCcw,
  RefreshCw,
  ArrowLeftRight,
  Check,
  Clock,
  Cpu,
  AlertTriangle,
} from 'lucide-react-native';
import type { TryOnResult as TryOnResultData } from '@/services/tryOnPipeline';

interface TryOnResultProps {
  result: TryOnResultData;
  onSave: () => void;
  onRetryUpload: () => void;
  onRegenerateOutfit: () => void;
  onClose: () => void;
  saving: boolean;
  saved: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function TryOnResultView({
  result,
  onSave,
  onRetryUpload,
  onRegenerateOutfit,
  onClose,
  saving,
  saved,
}: TryOnResultProps) {
  const [viewMode, setViewMode] = useState<'result' | 'before'>('result');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const imageWidth = Math.min(SCREEN_WIDTH - 48, 360);
  const imageHeight = (imageWidth * 3) / 2;

  const displayedImage =
    viewMode === 'result' ? result.resultImageUrl : result.originalPhotoUrl;

  const processingSeconds = (result.processingTimeMs / 1000).toFixed(1);

  return (
    <Animated.ScrollView
      style={[styles.container, { opacity: fadeAnim }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Your AI Try-On</Text>
        <Text style={styles.subtitle}>{result.outfitName}</Text>
      </View>

      {result.isDemo && (
        <View style={styles.demoBanner}>
          <AlertTriangle size={16} color="#92400e" />
          <Text style={styles.demoBannerText}>
            Demo mode -- connect a Fashn.ai API key for real garment replacement
          </Text>
        </View>
      )}

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'result' && styles.toggleActive]}
          onPress={() => setViewMode('result')}>
          <Text
            style={[styles.toggleText, viewMode === 'result' && styles.toggleTextActive]}>
            AI Result
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'before' && styles.toggleActive]}
          onPress={() => setViewMode('before')}>
          <ArrowLeftRight
            size={16}
            color={viewMode === 'before' ? '#ffffff' : '#6b7280'}
          />
          <Text
            style={[styles.toggleText, viewMode === 'before' && styles.toggleTextActive]}>
            Original
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imageSection}>
        <View style={[styles.imageFrame, { width: imageWidth, height: imageHeight }]}>
          <Image
            source={{ uri: displayedImage }}
            style={styles.mainImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.35)']}
            style={styles.imageGradient}
          />
          <View style={styles.modeBadge}>
            <Text style={styles.modeBadgeText}>
              {viewMode === 'result' ? 'AI Generated' : 'Original Photo'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.garmentCard}>
        <Image
          source={{ uri: result.garmentImageUrl }}
          style={styles.garmentThumb}
          resizeMode="cover"
        />
        <View style={styles.garmentInfo}>
          <Text style={styles.garmentLabel}>Applied Garment</Text>
          <Text style={styles.garmentName}>{result.garmentName}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Clock size={16} color="#3b82f6" />
          <Text style={styles.statValue}>{processingSeconds}s</Text>
          <Text style={styles.statLabel}>Processing</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Cpu size={16} color="#3b82f6" />
          <Text style={styles.statValue}>Fashn v1.6</Text>
          <Text style={styles.statLabel}>AI Model</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryAction, saved && styles.savedAction]}
          onPress={onSave}
          disabled={saving || saved}>
          <LinearGradient
            colors={saved ? ['#10b981', '#059669'] : ['#1e3a5f', '#2563eb']}
            style={styles.primaryActionGradient}>
            {saved ? (
              <>
                <Check size={20} color="#ffffff" />
                <Text style={styles.primaryActionText}>Saved</Text>
              </>
            ) : (
              <>
                <Heart size={20} color="#ffffff" />
                <Text style={styles.primaryActionText}>
                  {saving ? 'Saving...' : 'Save This Look'}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.secondaryActions}>
          <TouchableOpacity style={styles.secondaryAction} onPress={onRetryUpload}>
            <RotateCcw size={18} color="#6b7280" />
            <Text style={styles.secondaryActionText}>New Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryAction} onPress={onRegenerateOutfit}>
            <RefreshCw size={18} color="#6b7280" />
            <Text style={styles.secondaryActionText}>New Outfit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 16,
  },
  demoBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  toggleActive: {
    backgroundColor: '#1e3a5f',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageFrame: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  modeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  garmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
  },
  garmentThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  garmentInfo: {
    flex: 1,
  },
  garmentLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  garmentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  actions: {
    gap: 12,
  },
  primaryAction: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  savedAction: {
    opacity: 0.9,
  },
  primaryActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
});
