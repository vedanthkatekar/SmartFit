import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  Upload,
  AlertCircle,
  Check,
  ImageIcon,
  RotateCcw,
  Shirt,
} from 'lucide-react-native';
import type { ClothingItem } from '@/services/outfitAI';

const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

interface PhotoData {
  uri: string;
  width: number;
  height: number;
  fileSize?: number;
  mimeType?: string;
}

interface TryOnPhotoUploadProps {
  items: ClothingItem[];
  onPhotoSelected: (photo: PhotoData, garment: ClothingItem) => void;
  onCancel: () => void;
}

export function TryOnPhotoUpload({ items, onPhotoSelected, onCancel }: TryOnPhotoUploadProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null);
  const [selectedGarment, setSelectedGarment] = useState<ClothingItem | null>(
    items.length > 0 ? items[0] : null
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const validatePhoto = (result: ImagePicker.ImagePickerAsset): string | null => {
    if (result.fileSize && result.fileSize > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `Photo must be under ${MAX_FILE_SIZE_MB}MB. Current: ${(result.fileSize / (1024 * 1024)).toFixed(1)}MB`;
    }
    if (result.mimeType && !ACCEPTED_TYPES.includes(result.mimeType)) {
      return 'Only JPG and PNG formats are supported';
    }
    if (result.width < 200 || result.height < 300) {
      return 'Photo resolution is too low. Minimum 200x300 pixels required.';
    }
    const aspectRatio = result.height / result.width;
    if (aspectRatio < 0.8) {
      return 'Please use a portrait-oriented photo (taller than wide) for best results.';
    }
    return null;
  };

  const pickFromGallery = async () => {
    setValidationError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setValidationError('Gallery access is needed to select a photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const error = validatePhoto(asset);
    if (error) {
      setValidationError(error);
      return;
    }

    setSelectedPhoto({
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileSize: asset.fileSize ?? undefined,
      mimeType: asset.mimeType ?? undefined,
    });
  };

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      setValidationError('Camera is not available on web. Please upload a photo instead.');
      return;
    }
    setValidationError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setValidationError('Camera access is needed to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const error = validatePhoto(asset);
    if (error) {
      setValidationError(error);
      return;
    }

    setSelectedPhoto({
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileSize: asset.fileSize ?? undefined,
      mimeType: asset.mimeType ?? undefined,
    });
  };

  const clearPhoto = () => {
    setSelectedPhoto(null);
    setValidationError(null);
  };

  const handleContinue = () => {
    if (!selectedPhoto || !selectedGarment) return;
    onPhotoSelected(selectedPhoto, selectedGarment);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Upload Your Photo</Text>
        <Text style={styles.subtitle}>
          Select a garment to try on and upload a full-body photo
        </Text>
      </View>

      {items.length > 1 && (
        <View style={styles.garmentSection}>
          <View style={styles.garmentSectionHeader}>
            <Shirt size={18} color="#1e3a5f" />
            <Text style={styles.garmentSectionTitle}>Select Garment to Apply</Text>
          </View>
          <Text style={styles.garmentSectionHint}>
            AI processes one garment at a time. Pick the piece to try on.
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.garmentList}>
            {items.map((item) => {
              const isSelected = selectedGarment?.id === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.garmentItem, isSelected && styles.garmentItemSelected]}
                  onPress={() => setSelectedGarment(item)}>
                  <Image source={{ uri: item.image_url }} style={styles.garmentImage} />
                  {isSelected && (
                    <View style={styles.garmentCheck}>
                      <Check size={14} color="#ffffff" />
                    </View>
                  )}
                  <Text style={styles.garmentItemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.garmentItemCategory}>{item.category}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {!selectedPhoto ? (
        <>
          <View style={styles.uploadArea}>
            <View style={styles.uploadIconContainer}>
              <ImageIcon size={48} color="#94a3b8" />
            </View>
            <Text style={styles.uploadTitle}>Select a Photo</Text>
            <Text style={styles.uploadHint}>JPG or PNG, up to 10MB</Text>

            <View style={styles.uploadButtons}>
              <TouchableOpacity style={styles.uploadButton} onPress={pickFromGallery}>
                <LinearGradient
                  colors={['#1e3a5f', '#2563eb']}
                  style={styles.uploadButtonGradient}>
                  <Upload size={20} color="#ffffff" />
                  <Text style={styles.uploadButtonText}>Choose from Gallery</Text>
                </LinearGradient>
              </TouchableOpacity>

              {Platform.OS !== 'web' && (
                <TouchableOpacity style={styles.uploadButtonSecondary} onPress={takePhoto}>
                  <Camera size={20} color="#1e3a5f" />
                  <Text style={styles.uploadButtonSecondaryText}>Take a Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.guidelines}>
            <Text style={styles.guidelinesTitle}>Photo Guidelines</Text>
            {[
              'Stand facing the camera with arms slightly away from body',
              'Use a plain, uncluttered background',
              'Ensure even lighting with no harsh shadows',
              'Wear fitted clothing so body shape is visible',
              'Include full body from head to at least knees',
            ].map((tip, index) => (
              <View key={index} style={styles.guidelineRow}>
                <View style={styles.guidelineDot}>
                  <Check size={12} color="#10b981" />
                </View>
                <Text style={styles.guidelineText}>{tip}</Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <View style={styles.previewSection}>
          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedPhoto.uri }} style={styles.previewImage} />
            <View style={styles.previewOverlay}>
              <View style={styles.previewBadge}>
                <Check size={16} color="#ffffff" />
                <Text style={styles.previewBadgeText}>Photo ready</Text>
              </View>
            </View>
          </View>

          <View style={styles.photoMeta}>
            <Text style={styles.photoMetaText}>
              {selectedPhoto.width} x {selectedPhoto.height}px
              {selectedPhoto.fileSize
                ? ` | ${(selectedPhoto.fileSize / (1024 * 1024)).toFixed(1)}MB`
                : ''}
            </Text>
          </View>

          {selectedGarment && (
            <View style={styles.selectedGarmentBanner}>
              <Image
                source={{ uri: selectedGarment.image_url }}
                style={styles.bannerGarmentImage}
              />
              <View style={styles.bannerGarmentInfo}>
                <Text style={styles.bannerGarmentLabel}>Will apply:</Text>
                <Text style={styles.bannerGarmentName}>{selectedGarment.name}</Text>
              </View>
            </View>
          )}

          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.retakeButton} onPress={clearPhoto}>
              <RotateCcw size={18} color="#6b7280" />
              <Text style={styles.retakeText}>Choose Different</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.continueButton, !selectedGarment && styles.continueDisabled]}
              onPress={handleContinue}
              disabled={!selectedGarment}>
              <LinearGradient
                colors={selectedGarment ? ['#1e3a5f', '#2563eb'] : ['#94a3b8', '#94a3b8']}
                style={styles.continueGradient}>
                <Text style={styles.continueText}>Start AI Try-On</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {validationError && (
        <View style={styles.errorBanner}>
          <AlertCircle size={18} color="#dc2626" />
          <Text style={styles.errorText}>{validationError}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
  },
  garmentSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  garmentSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  garmentSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  garmentSectionHint: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 14,
  },
  garmentList: {
    gap: 10,
  },
  garmentItem: {
    width: 96,
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  garmentItemSelected: {
    borderColor: '#1e3a5f',
    backgroundColor: '#eff6ff',
  },
  garmentImage: {
    width: 72,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginBottom: 6,
  },
  garmentCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1e3a5f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  garmentItemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  garmentItemCategory: {
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'capitalize',
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    marginBottom: 24,
  },
  uploadIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 24,
  },
  uploadButtons: {
    width: '100%',
    gap: 12,
  },
  uploadButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  uploadButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  uploadButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#1e3a5f',
    gap: 10,
  },
  uploadButtonSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e3a5f',
  },
  guidelines: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  guidelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  guidelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  guidelineText: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  previewSection: {
    alignItems: 'center',
    gap: 16,
  },
  previewContainer: {
    width: '100%',
    maxWidth: 320,
    aspectRatio: 3 / 4,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
  },
  previewBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  photoMeta: {
    paddingVertical: 4,
  },
  photoMetaText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  selectedGarmentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 10,
    gap: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  bannerGarmentImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  bannerGarmentInfo: {
    flex: 1,
  },
  bannerGarmentLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  bannerGarmentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a5f',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
  },
  retakeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  continueButton: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  continueDisabled: {
    opacity: 0.5,
  },
  continueGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    padding: 14,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626',
    lineHeight: 20,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 16,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9ca3af',
  },
});
