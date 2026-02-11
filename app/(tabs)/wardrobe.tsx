import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Plus, X, Save, Trash2, Shirt, Upload, Download, ArrowLeftRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ScanningAnimation } from '@/components/ScanningAnimation';
import Constants from 'expo-constants';

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  color: string;
  season: string;
  image_url: string;
  favorite: boolean;
  times_worn: number;
}

export default function Wardrobe() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'shirt',
    color: '',
    season: 'all-season',
  });

  const categories = ['all', 'shirt', 'pants', 'dress', 'shoes', 'jacket', 'accessory'];
  const seasons = ['all-season', 'spring', 'summer', 'fall', 'winter'];
  const colors = ['black', 'white', 'gray', 'blue', 'red', 'green', 'yellow', 'brown', 'pink', 'purple'];

  useEffect(() => {
    loadItems();
  }, [user]);

  const loadItems = async () => {
    try {
      if (!user?.id) {
        setItems([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCameraCapture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      const imageData = `data:image/jpeg;base64,${photo.base64}`;
      setOriginalImage(imageData);
      setCapturedImage(imageData);
      setShowCamera(false);
      setShowProcessingModal(true);

      const processedImage = await processImageWithAI(imageData);
      setCapturedImage(processedImage);
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const processImageWithAI = async (imageData: string): Promise<string> => {
    try {
      setIsProcessing(true);
      setIsScanning(true);
      setProcessingError(null);

      const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('Sending image to Edge Function for processing...');
      const response = await fetch(
        `${supabaseUrl}/functions/v1/remove-background`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageData }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Edge Function error:', errorData);
        throw new Error(errorData.error || 'Failed to process image');
      }

      const result = await response.json();
      console.log('Background removal completed successfully');

      if (result.note) {
        setProcessingError(result.note);
      }

      setIsScanning(false);
      setIsProcessing(false);

      setShowProcessingModal(false);
      setShowAddModal(true);

      return result.processedImage;
    } catch (error) {
      console.error('Error processing image:', error);
      setIsScanning(false);
      setIsProcessing(false);
      setProcessingError(error instanceof Error ? error.message : 'Failed to process image');

      setShowProcessingModal(false);
      setShowAddModal(true);

      return imageData;
    }
  };

  const handleFileUpload = async () => {
    if (Platform.OS === 'web') {
      // Web implementation
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async (event: any) => {
            const original = event.target.result;
            setOriginalImage(original);
            setCapturedImage(original);
            setShowUploadOptions(false);
            setShowProcessingModal(true);

            const processedImage = await processImageWithAI(original);
            setCapturedImage(processedImage);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // Mobile implementation using ImagePicker
      try {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
          Alert.alert('Permission Required', 'Please allow access to your photo library to upload images.');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 1,
          base64: true,
        });

        if (!result.canceled && result.assets[0]) {
          const imageData = `data:image/jpeg;base64,${result.assets[0].base64}`;
          setOriginalImage(imageData);
          setCapturedImage(imageData);
          setShowUploadOptions(false);
          setShowProcessingModal(true);

          const processedImage = await processImageWithAI(imageData);
          setCapturedImage(processedImage);
        }
      } catch (error) {
        console.error('Error picking image:', error);
        Alert.alert('Error', 'Failed to pick image from gallery');
      }
    }
  };

  const handleOpenCamera = () => {
    setShowUploadOptions(false);
    setShowCamera(true);
  };

  const handleSaveItem = async () => {
    if (authLoading) {
      Alert.alert('Error', 'Please wait for authentication to load');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to save items');
      return;
    }

    if (!formData.name || !formData.color || !capturedImage) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clothing_items')
        .insert({
          user_id: user.id,
          name: formData.name,
          category: formData.category,
          color: formData.color,
          season: formData.season,
          image_url: capturedImage,
        })
        .select()
        .single();

      if (error) throw error;

      setItems([data, ...items]);
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('Error', 'Failed to save item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase.from('clothing_items').delete().eq('id', id);

      if (error) throw error;
      setItems(items.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'shirt',
      color: '',
      season: 'all-season',
    });
    setCapturedImage(null);
    setOriginalImage(null);
    setShowComparison(false);
    setProcessingError(null);
  };

  const handleDownloadImage = () => {
    if (Platform.OS === 'web' && capturedImage) {
      const link = document.createElement('a');
      link.href = capturedImage;
      link.download = `${formData.name || 'clothing-item'}.png`;
      link.click();
    }
  };

  const filteredItems = selectedCategory === 'all'
    ? items
    : items.filter((item) => item.category === selectedCategory);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Camera size={64} color="#3b82f6" />
          <Text style={styles.permissionTitle}>Camera Permission Needed</Text>
          <Text style={styles.permissionText}>
            We need camera access to let you add clothes to your wardrobe
          </Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f093fb', '#f5576c']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}>
        <View style={styles.header}>
          <Text style={styles.title}>My Wardrobe</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowUploadOptions(true)}>
            <Plus size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={styles.categoryChip}
              onPress={() => setSelectedCategory(cat)}>
              {selectedCategory === cat ? (
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.categoryChipGradient}>
                  <Text style={styles.categoryTextActive}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </LinearGradient>
              ) : (
                <Text style={styles.categoryText}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Shirt size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Clothes Yet</Text>
          <Text style={styles.emptyText}>Start adding items to your wardrobe</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <Image source={{ uri: item.image_url }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemDetails}>
                  {item.category} • {item.color}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteItem(item.id)}>
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={showUploadOptions} transparent animationType="fade">
        <View style={styles.uploadOptionsOverlay}>
          <View style={styles.uploadOptionsModal}>
            <View style={styles.uploadOptionsHeader}>
              <Text style={styles.uploadOptionsTitle}>Add Clothing Item</Text>
              <TouchableOpacity onPress={() => setShowUploadOptions(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.uploadOptionsSubtitle}>Choose how to add your item</Text>

            <View style={styles.uploadOptionsButtons}>
              {Platform.OS !== 'web' && (
                <TouchableOpacity style={styles.uploadOptionButton} onPress={handleOpenCamera}>
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.uploadOptionGradient}>
                    <Camera size={32} color="#ffffff" />
                    <Text style={styles.uploadOptionText}>Take Photo</Text>
                    <Text style={styles.uploadOptionSubtext}>Use camera to capture</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.uploadOptionButton} onPress={handleFileUpload}>
                <LinearGradient
                  colors={['#f093fb', '#f5576c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.uploadOptionGradient}>
                  <Upload size={32} color="#ffffff" />
                  <Text style={styles.uploadOptionText}>Upload Photo</Text>
                  <Text style={styles.uploadOptionSubtext}>Choose from gallery</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {Platform.OS !== 'web' && (
        <Modal visible={showCamera} animationType="slide">
          <CameraView ref={cameraRef} style={styles.camera} facing="back">
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCamera(false)}>
                <X size={32} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleCameraCapture}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </CameraView>
        </Modal>
      )}

      <Modal visible={showProcessingModal} animationType="slide">
        <View style={styles.processingModalContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.processingHeader}>
            <Text style={styles.processingHeaderTitle}>Processing Image</Text>
            <Text style={styles.processingHeaderSubtitle}>AI is analyzing your clothing item...</Text>
          </LinearGradient>

          <View style={styles.processingImageContainer}>
            {capturedImage && (
              <View style={styles.processingImageWrapper}>
                <Image source={{ uri: capturedImage }} style={styles.processingImage} />
                <ScanningAnimation isScanning={isScanning} />
                <View style={styles.processingStatusOverlay}>
                  <LinearGradient
                    colors={['rgba(102, 126, 234, 0.95)', 'rgba(118, 75, 162, 0.95)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.processingStatusBadge}>
                    <Text style={styles.processingStatusText}>
                      {isScanning ? 'Scanning...' : 'Removing Background...'}
                    </Text>
                  </LinearGradient>
                </View>
              </View>
            )}
          </View>

          <View style={styles.processingSteps}>
            <View style={styles.processingStep}>
              <View style={[styles.stepIndicator, isScanning && styles.stepIndicatorActive]}>
                {!isScanning && <Text style={styles.stepCheckmark}>✓</Text>}
              </View>
              <Text style={styles.stepText}>Analyzing Image</Text>
            </View>

            <View style={styles.processingStep}>
              <View style={[styles.stepIndicator, !isScanning && isProcessing && styles.stepIndicatorActive]}>
                {!isProcessing && !isScanning && <Text style={styles.stepCheckmark}>✓</Text>}
              </View>
              <Text style={styles.stepText}>Removing Background</Text>
            </View>

            <View style={styles.processingStep}>
              <View style={styles.stepIndicator} />
              <Text style={styles.stepText}>Ready to Add Details</Text>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddModal} animationType="slide">
        <ScrollView style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Name Your Item</Text>
              <Text style={styles.modalSubtitle}>Add details to complete your wardrobe item</Text>
            </View>
            <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {capturedImage && (
            <View>
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: showComparison && originalImage ? originalImage : capturedImage }}
                  style={styles.previewImage}
                />
                <ScanningAnimation isScanning={isScanning} />
                {isProcessing && (
                  <View style={styles.processingOverlay}>
                    <LinearGradient
                      colors={['rgba(102, 126, 234, 0.9)', 'rgba(118, 75, 162, 0.9)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.processingBadge}>
                      <Text style={styles.processingText}>AI Processing...</Text>
                    </LinearGradient>
                  </View>
                )}
              </View>

              {processingError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{processingError}</Text>
                </View>
              )}

              <View style={styles.imageActions}>
                {originalImage && capturedImage !== originalImage && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setShowComparison(!showComparison)}>
                    <ArrowLeftRight size={18} color="#667eea" />
                    <Text style={styles.actionButtonText}>
                      {showComparison ? 'Show Processed' : 'Show Original'}
                    </Text>
                  </TouchableOpacity>
                )}

                {Platform.OS === 'web' && !isProcessing && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleDownloadImage}>
                    <Download size={18} color="#667eea" />
                    <Text style={styles.actionButtonText}>Download PNG</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          <View style={styles.form}>
            <Text style={styles.label}>Item Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Blue Denim Jacket"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.slice(1).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.optionChip,
                    formData.category === cat && styles.optionChipActive,
                  ]}
                  onPress={() => setFormData({ ...formData, category: cat })}>
                  <Text
                    style={[
                      styles.optionText,
                      formData.category === cat && styles.optionTextActive,
                    ]}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {colors.map((col) => (
                <TouchableOpacity
                  key={col}
                  style={[
                    styles.optionChip,
                    formData.color === col && styles.optionChipActive,
                  ]}
                  onPress={() => setFormData({ ...formData, color: col })}>
                  <Text
                    style={[
                      styles.optionText,
                      formData.color === col && styles.optionTextActive,
                    ]}>
                    {col.charAt(0).toUpperCase() + col.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Season</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {seasons.map((season) => (
                <TouchableOpacity
                  key={season}
                  style={[
                    styles.optionChip,
                    formData.season === season && styles.optionChipActive,
                  ]}
                  onPress={() => setFormData({ ...formData, season })}>
                  <Text
                    style={[
                      styles.optionText,
                      formData.season === season && styles.optionTextActive,
                    ]}>
                    {season.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveItem}>
              <Save size={20} color="#ffffff" />
              <Text style={styles.saveButtonText}>Save Item</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  categoryContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
  },
  categoryScroll: {
    flexGrow: 0,
    paddingHorizontal: 16,
  },
  categoryChip: {
    marginHorizontal: 4,
    borderRadius: 24,
    overflow: 'hidden',
  },
  categoryChipGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  categoryChipActive: {},
  categoryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
  },
  categoryTextActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
  },
  itemCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    margin: 8,
    overflow: 'hidden',
    maxWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  itemImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#e5e7eb',
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 12,
    color: '#6b7280',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ffffff',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    padding: 24,
  },
  closeButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 24,
    alignSelf: 'flex-start',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#3b82f6',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  imagePreviewContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f1f5f9',
  },
  processingOverlay: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [{ translateX: -75 }],
  },
  processingBadge: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  processingText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  form: {
    padding: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    marginBottom: 8,
  },
  optionChipActive: {
    backgroundColor: '#3b82f6',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  optionTextActive: {
    color: '#ffffff',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    gap: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 24,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadOptionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  uploadOptionsModal: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  uploadOptionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadOptionsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  uploadOptionsSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  uploadOptionsButtons: {
    gap: 16,
  },
  uploadOptionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  uploadOptionGradient: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  uploadOptionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 8,
  },
  uploadOptionSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    textAlign: 'center',
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  processingModalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  processingHeader: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  processingHeaderTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  processingHeaderSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  processingImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  processingImageWrapper: {
    width: '100%',
    aspectRatio: 1,
    maxWidth: 400,
    position: 'relative',
  },
  processingImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
  },
  processingStatusOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  processingStatusBadge: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  processingStatusText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  processingSteps: {
    padding: 24,
    gap: 20,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  processingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicatorActive: {
    backgroundColor: '#667eea',
  },
  stepCheckmark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
});
