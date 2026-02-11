import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  RotateCw,
  Save,
  Share2,
  Eye,
  Settings,
  User,
  Maximize2,
} from 'lucide-react-native';
import { VirtualTryOnAvatar } from './VirtualTryOnAvatar';
import { virtualTryOn, OutfitVisualization } from '@/services/virtualTryOn';
import { ClothingItem } from '@/services/outfitAI';
import { useAuth } from '@/contexts/AuthContext';

interface VirtualTryOnModalProps {
  visible: boolean;
  onClose: () => void;
  items: ClothingItem[];
  outfitName?: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function VirtualTryOnModal({
  visible,
  onClose,
  items,
  outfitName = 'My Outfit',
}: VirtualTryOnModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [visualization, setVisualization] = useState<OutfitVisualization | null>(null);
  const [viewAngle, setViewAngle] = useState<'front' | 'side' | 'back'>('front');
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [avatarSize, setAvatarSize] = useState<'normal' | 'large'>('normal');
  const [modelImageUrl, setModelImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (visible && items.length > 0) {
      generateVisualization();
    }
  }, [visible, items]);

  const generateVisualization = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const profile = await virtualTryOn.getUserProfile(user.id);
      const gender = profile?.gender || 'unspecified';

      const viz = await virtualTryOn.generateVisualization(
        user.id,
        items,
        gender,
        viewAngle
      );

      if (viz) {
        setVisualization(viz);
      } else {
        Alert.alert('Error', 'Failed to generate virtual try-on');
      }
    } catch (error) {
      console.error('Error generating visualization:', error);
      Alert.alert('Error', 'Failed to create visualization');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVisualization = async () => {
    if (!visualization) return;

    try {
      const vizId = await virtualTryOn.saveVisualization(visualization);
      if (vizId) {
        Alert.alert('Saved!', 'Your virtual try-on has been saved');
      }
    } catch (error) {
      console.error('Error saving visualization:', error);
      Alert.alert('Error', 'Failed to save visualization');
    }
  };

  const handleChangeAngle = async (angle: 'front' | 'side' | 'back') => {
    setViewAngle(angle);
    if (!user?.id) return;

    setLoading(true);
    try {
      const profile = await virtualTryOn.getUserProfile(user.id);
      const gender = profile?.gender || 'unspecified';

      const viz = await virtualTryOn.generateVisualization(
        user.id,
        items,
        gender,
        angle
      );

      if (viz) {
        setVisualization(viz);
      }
    } catch (error) {
      console.error('Error changing view angle:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarDimensions = () => {
    if (avatarSize === 'large') {
      return {
        width: Math.min(SCREEN_WIDTH * 0.9, 400),
        height: Math.min(SCREEN_HEIGHT * 0.7, 700),
      };
    }
    return {
      width: Math.min(SCREEN_WIDTH * 0.75, 320),
      height: Math.min(SCREEN_HEIGHT * 0.6, 600),
    };
  };

  const dimensions = getAvatarDimensions();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.title}>Virtual Try-On</Text>
              <Text style={styles.subtitle}>{outfitName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#667eea" />
              <Text style={styles.loadingText}>Creating your virtual model...</Text>
              <Text style={styles.loadingSubtext}>
                Applying clothing with realistic draping
              </Text>
            </View>
          ) : visualization ? (
            <>
              <View style={styles.avatarSection}>
                <View style={styles.avatarWrapper}>
                  <VirtualTryOnAvatar
                    visualization={visualization}
                    width={dimensions.width}
                    height={dimensions.height}
                    showSkeleton={showSkeleton}
                    modelImageUrl={modelImageUrl || undefined}
                  />
                  <TouchableOpacity
                    style={styles.fullscreenButton}
                    onPress={() =>
                      setAvatarSize(avatarSize === 'normal' ? 'large' : 'normal')
                    }>
                    <Maximize2 size={20} color="#667eea" />
                  </TouchableOpacity>
                </View>

                <View style={styles.angleControls}>
                  <Text style={styles.controlLabel}>View Angle</Text>
                  <View style={styles.angleButtons}>
                    <TouchableOpacity
                      style={[
                        styles.angleButton,
                        viewAngle === 'front' && styles.angleButtonActive,
                      ]}
                      onPress={() => handleChangeAngle('front')}>
                      <User size={20} color={viewAngle === 'front' ? '#ffffff' : '#667eea'} />
                      <Text
                        style={[
                          styles.angleButtonText,
                          viewAngle === 'front' && styles.angleButtonTextActive,
                        ]}>
                        Front
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.angleButton,
                        viewAngle === 'side' && styles.angleButtonActive,
                      ]}
                      onPress={() => handleChangeAngle('side')}>
                      <RotateCw size={20} color={viewAngle === 'side' ? '#ffffff' : '#667eea'} />
                      <Text
                        style={[
                          styles.angleButtonText,
                          viewAngle === 'side' && styles.angleButtonTextActive,
                        ]}>
                        Side
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.itemsList}>
                <Text style={styles.itemsTitle}>Outfit Details</Text>
                {items.map((item, index) => (
                  <View key={item.id} style={styles.itemCard}>
                    <View style={styles.itemNumber}>
                      <Text style={styles.itemNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemCategory}>{item.category}</Text>
                    </View>
                    <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                  </View>
                ))}
              </View>

              <View style={styles.features}>
                <Text style={styles.featuresTitle}>Outfit Visualization</Text>
                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      <Text style={styles.featureIconText}>✓</Text>
                    </View>
                    <Text style={styles.featureText}>Clean outfit display</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      <Text style={styles.featureIconText}>✓</Text>
                    </View>
                    <Text style={styles.featureText}>Intelligent body zone mapping</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      <Text style={styles.featureIconText}>✓</Text>
                    </View>
                    <Text style={styles.featureText}>Dynamic shadows & depth</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      <Text style={styles.featureIconText}>✓</Text>
                    </View>
                    <Text style={styles.featureText}>Accurate layering order</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <View style={styles.featureIcon}>
                      <Text style={styles.featureIconText}>✓</Text>
                    </View>
                    <Text style={styles.featureText}>Realistic proportions</Text>
                  </View>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Unable to generate visualization</Text>
            </View>
          )}
        </ScrollView>

        {!loading && visualization && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.footerButton} onPress={handleSaveVisualization}>
              <Save size={20} color="#667eea" />
              <Text style={styles.footerButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.footerButtonPrimary}
              onPress={() => {
                Alert.alert('Success', 'Ready to wear this amazing outfit!');
                onClose();
              }}>
              <LinearGradient
                colors={['#43e97b', '#38f9d7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.footerButtonPrimaryGradient}>
                <Text style={styles.footerButtonPrimaryText}>Looks Perfect!</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerButton}>
              <Share2 size={20} color="#667eea" />
              <Text style={styles.footerButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 20,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarWrapper: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  fullscreenButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  angleControls: {
    marginTop: 24,
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  angleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  angleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  angleButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  angleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  angleButtonTextActive: {
    color: '#ffffff',
  },
  itemsList: {
    marginHorizontal: 24,
    marginTop: 24,
  },
  itemsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  itemNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#667eea',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  itemCategory: {
    fontSize: 13,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  features: {
    marginHorizontal: 24,
    marginTop: 24,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
  },
  featureText: {
    fontSize: 14,
    color: '#6b7280',
  },
  toggles: {
    marginHorizontal: 24,
    marginTop: 16,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  footerButtonPrimary: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  footerButtonPrimaryGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
