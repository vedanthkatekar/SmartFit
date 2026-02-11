import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Plus, X, Save, Trash2, Heart, Wand2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Toast } from '@/components/Toast';

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  image_url: string;
}

interface Outfit {
  id: string;
  name: string;
  occasion: string;
  season: string;
  weather_type: string;
  ai_generated: boolean;
  favorite: boolean;
  times_worn: number;
  items?: ClothingItem[];
}

export default function Outfits() {
  const { user } = useAuth();
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    occasion: 'casual',
    season: 'all-season',
    weather_type: 'any',
  });
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showNotification = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
  }, []);

  const occasions = ['casual', 'work', 'formal', 'sports', 'date', 'party'];
  const seasons = ['all-season', 'spring', 'summer', 'fall', 'winter'];
  const weatherTypes = ['any', 'sunny', 'rainy', 'cold', 'hot'];
  const filters = ['all', 'favorite', 'casual', 'work', 'formal'];

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const [outfitsData, itemsData] = await Promise.all([
        supabase
          .from('outfits')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('clothing_items')
          .select('id, name, category, image_url')
          .eq('user_id', user.id),
      ]);

      if (outfitsData.error) throw outfitsData.error;
      if (itemsData.error) throw itemsData.error;

      const outfitsWithItems = await Promise.all(
        (outfitsData.data || []).map(async (outfit) => {
          const { data: outfitItems } = await supabase
            .from('outfit_items')
            .select('clothing_item_id')
            .eq('outfit_id', outfit.id);

          const items = (itemsData.data || []).filter((item) =>
            outfitItems?.some((oi) => oi.clothing_item_id === item.id)
          );

          return { ...outfit, items };
        })
      );

      setOutfits(outfitsWithItems);
      setClothingItems(itemsData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOutfit = async () => {
    if (!user?.id) {
      showNotification('Please log in to create outfits');
      return;
    }

    if (!formData.name.trim()) {
      showNotification('Please enter an outfit name');
      return;
    }

    if (selectedItems.length === 0) {
      showNotification('Please select at least one item');
      return;
    }

    setSaving(true);

    try {
      const { data: outfit, error: outfitError } = await supabase
        .from('outfits')
        .insert({
          user_id: user.id,
          name: formData.name.trim(),
          occasion: formData.occasion,
          season: formData.season,
          weather_type: formData.weather_type,
          ai_generated: false,
        })
        .select()
        .single();

      if (outfitError) throw outfitError;

      const outfitItems = selectedItems.map((itemId) => ({
        outfit_id: outfit.id,
        clothing_item_id: itemId,
      }));

      const { error: itemsError } = await supabase.from('outfit_items').insert(outfitItems);

      if (itemsError) throw itemsError;

      await loadData();
      setShowCreateModal(false);
      resetForm();
      showNotification('Outfit created successfully!');
    } catch (error) {
      console.error('Error creating outfit:', error);
      showNotification('Failed to create outfit. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAIOutfit = async () => {
    if (!user?.id) {
      showNotification('Please log in to generate outfits');
      return;
    }

    if (clothingItems.length < 2) {
      showNotification('Add more clothes to generate AI outfits');
      return;
    }

    setSaving(true);

    const currentSeason = getCurrentSeason();
    const seasonalItems = clothingItems.filter((item: any) =>
      ['all-season', currentSeason].includes(item.season)
    );

    const tops = seasonalItems.filter((item) =>
      ['shirt', 'dress', 'jacket'].includes(item.category)
    );
    const bottoms = seasonalItems.filter((item) => item.category === 'pants');
    const shoes = seasonalItems.filter((item) => item.category === 'shoes');

    const selectedOutfitItems: string[] = [];
    if (tops.length > 0) selectedOutfitItems.push(tops[Math.floor(Math.random() * tops.length)].id);
    if (bottoms.length > 0)
      selectedOutfitItems.push(bottoms[Math.floor(Math.random() * bottoms.length)].id);
    if (shoes.length > 0) selectedOutfitItems.push(shoes[Math.floor(Math.random() * shoes.length)].id);

    if (selectedOutfitItems.length === 0) {
      showNotification('Not enough suitable items for this season');
      setSaving(false);
      return;
    }

    try {
      const { data: outfit, error: outfitError } = await supabase
        .from('outfits')
        .insert({
          user_id: user.id,
          name: `AI Outfit ${new Date().toLocaleDateString()}`,
          occasion: 'casual',
          season: currentSeason,
          weather_type: 'any',
          ai_generated: true,
        })
        .select()
        .single();

      if (outfitError) throw outfitError;

      const outfitItems = selectedOutfitItems.map((itemId) => ({
        outfit_id: outfit.id,
        clothing_item_id: itemId,
      }));

      const { error: itemsError } = await supabase.from('outfit_items').insert(outfitItems);

      if (itemsError) throw itemsError;

      await loadData();
      showNotification('AI outfit generated successfully!');
    } catch (error) {
      console.error('Error generating AI outfit:', error);
      showNotification('Failed to generate AI outfit');
    } finally {
      setSaving(false);
    }
  };

  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  };

  const toggleFavorite = async (outfitId: string, currentFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('outfits')
        .update({ favorite: !currentFavorite })
        .eq('id', outfitId);

      if (error) throw error;

      setOutfits(
        outfits.map((outfit) =>
          outfit.id === outfitId ? { ...outfit, favorite: !currentFavorite } : outfit
        )
      );
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDeleteOutfit = async (id: string) => {
    try {
      const { error } = await supabase.from('outfits').delete().eq('id', id);

      if (error) throw error;
      setOutfits(outfits.filter((outfit) => outfit.id !== id));
    } catch (error) {
      console.error('Error deleting outfit:', error);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      occasion: 'casual',
      season: 'all-season',
      weather_type: 'any',
    });
    setSelectedItems([]);
  };

  const filteredOutfits =
    selectedFilter === 'all'
      ? outfits
      : selectedFilter === 'favorite'
      ? outfits.filter((o) => o.favorite)
      : outfits.filter((o) => o.occasion === selectedFilter);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4facfe', '#00f2fe']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}>
        <View style={styles.header}>
          <Text style={styles.title}>My Outfits</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.aiButton, saving && styles.buttonDisabled]}
              onPress={handleGenerateAIOutfit}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Wand2 size={20} color="#ffffff" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowCreateModal(true)}
              disabled={saving}>
              <Plus size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
            onPress={() => setSelectedFilter(filter)}>
            <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : filteredOutfits.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Sparkles size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Outfits Yet</Text>
          <Text style={styles.emptyText}>Create your first outfit combination</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOutfits}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.outfitCard}>
              <View style={styles.outfitHeader}>
                <View style={styles.outfitInfo}>
                  <Text style={styles.outfitName}>{item.name}</Text>
                  <Text style={styles.outfitDetails}>
                    {item.occasion} • {item.season}
                    {item.ai_generated && ' • AI'}
                  </Text>
                </View>
                <View style={styles.outfitActions}>
                  <TouchableOpacity onPress={() => toggleFavorite(item.id, item.favorite)}>
                    <Heart
                      size={20}
                      color={item.favorite ? '#ef4444' : '#9ca3af'}
                      fill={item.favorite ? '#ef4444' : 'transparent'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteOutfit(item.id)}>
                    <Trash2 size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.itemsScroll}>
                {item.items?.map((clothingItem) => (
                  <View key={clothingItem.id} style={styles.outfitItem}>
                    <Image source={{ uri: clothingItem.image_url }} style={styles.outfitItemImage} />
                    <Text style={styles.outfitItemName} numberOfLines={1}>
                      {clothingItem.name}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        />
      )}

      <Modal visible={showCreateModal} animationType="slide">
        <ScrollView style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Outfit</Text>
            <TouchableOpacity
              onPress={() => {
                setShowCreateModal(false);
                resetForm();
              }}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Outfit Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Summer Beach Look"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <Text style={styles.label}>Occasion</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {occasions.map((occ) => (
                <TouchableOpacity
                  key={occ}
                  style={[
                    styles.optionChip,
                    formData.occasion === occ && styles.optionChipActive,
                  ]}
                  onPress={() => setFormData({ ...formData, occasion: occ })}>
                  <Text
                    style={[
                      styles.optionText,
                      formData.occasion === occ && styles.optionTextActive,
                    ]}>
                    {occ.charAt(0).toUpperCase() + occ.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Season</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {seasons.map((season) => (
                <TouchableOpacity
                  key={season}
                  style={[styles.optionChip, formData.season === season && styles.optionChipActive]}
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

            <Text style={styles.label}>Select Items ({selectedItems.length})</Text>
            <FlatList
              data={clothingItems}
              numColumns={3}
              scrollEnabled={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.selectableItem,
                    selectedItems.includes(item.id) && styles.selectableItemActive,
                  ]}
                  onPress={() => toggleItemSelection(item.id)}>
                  <Image source={{ uri: item.image_url }} style={styles.selectableItemImage} />
                  {selectedItems.includes(item.id) && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleCreateOutfit}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Save size={20} color="#ffffff" />
              )}
              <Text style={styles.saveButtonText}>
                {saving ? 'Creating...' : 'Create Outfit'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>

      <Toast
        visible={showToast}
        message={toastMessage}
        onHide={() => setShowToast(false)}
      />
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
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  aiButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
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
  buttonDisabled: {
    opacity: 0.6,
  },
  filterScroll: {
    flexGrow: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 4,
  },
  filterChipActive: {
    backgroundColor: '#3b82f6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
  },
  outfitCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  outfitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  outfitInfo: {
    flex: 1,
  },
  outfitName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  outfitDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  outfitActions: {
    flexDirection: 'row',
    gap: 16,
  },
  itemsScroll: {
    flexGrow: 0,
  },
  outfitItem: {
    width: 100,
    marginRight: 12,
  },
  outfitItemImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  outfitItemName: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
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
  selectableItem: {
    flex: 1,
    margin: 4,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectableItemActive: {
    borderColor: '#3b82f6',
  },
  selectableItemImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
  },
  selectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#3b82f6',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
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
  saveButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
