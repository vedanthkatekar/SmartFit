import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Save, Settings } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface StylePreferencesProps {
  visible: boolean;
  onClose: () => void;
}

export function StylePreferences({ visible, onClose }: StylePreferencesProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    styleTypes: ['casual'],
    favoriteColors: [],
    dislikedColors: [],
    comfortLevel: 'balanced',
    formalityPreference: 'casual',
    patternPreference: 'solids',
    fitPreference: 'regular',
  });

  const styleTypes = ['casual', 'formal', 'sporty', 'elegant', 'streetwear', 'minimalist', 'vintage', 'bohemian'];
  const colors = ['black', 'white', 'gray', 'blue', 'red', 'green', 'yellow', 'brown', 'pink', 'purple', 'beige', 'navy'];
  const comfortLevels = ['comfort-first', 'balanced', 'style-first'];
  const formalityLevels = ['casual', 'smart-casual', 'business', 'formal'];
  const patterns = ['solids', 'stripes', 'patterns', 'mixed'];
  const fits = ['loose', 'regular', 'fitted', 'mixed'];

  useEffect(() => {
    if (visible) {
      loadPreferences();
    }
  }, [visible]);

  const loadPreferences = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_style_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          styleTypes: data.style_types || ['casual'],
          favoriteColors: data.favorite_colors || [],
          dislikedColors: data.disliked_colors || [],
          comfortLevel: data.comfort_level || 'balanced',
          formalityPreference: data.formality_preference || 'casual',
          patternPreference: data.pattern_preference || 'solids',
          fitPreference: data.fit_preference || 'regular',
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_style_preferences')
        .upsert({
          user_id: user.id,
          style_types: preferences.styleTypes,
          favorite_colors: preferences.favoriteColors,
          disliked_colors: preferences.dislikedColors,
          comfort_level: preferences.comfortLevel,
          formality_preference: preferences.formalityPreference,
          pattern_preference: preferences.patternPreference,
          fit_preference: preferences.fitPreference,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      Alert.alert('Success', 'Your style preferences have been saved!');
      onClose();
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const toggleStyleType = (style: string) => {
    setPreferences(prev => ({
      ...prev,
      styleTypes: prev.styleTypes.includes(style)
        ? prev.styleTypes.filter(s => s !== style)
        : [...prev.styleTypes, style],
    }));
  };

  const toggleFavoriteColor = (color: string) => {
    setPreferences(prev => ({
      ...prev,
      favoriteColors: prev.favoriteColors.includes(color)
        ? prev.favoriteColors.filter(c => c !== color)
        : [...prev.favoriteColors, color],
      dislikedColors: prev.dislikedColors.filter(c => c !== color),
    }));
  };

  const toggleDislikedColor = (color: string) => {
    setPreferences(prev => ({
      ...prev,
      dislikedColors: prev.dislikedColors.includes(color)
        ? prev.dislikedColors.filter(c => c !== color)
        : [...prev.dislikedColors, color],
      favoriteColors: prev.favoriteColors.filter(c => c !== color),
    }));
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Settings size={28} color="#ffffff" />
              <View>
                <Text style={styles.headerTitle}>Style Preferences</Text>
                <Text style={styles.headerSubtitle}>Personalize your AI recommendations</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Style Types</Text>
            <Text style={styles.sectionDescription}>Select all that match your style</Text>
            <View style={styles.chipGrid}>
              {styleTypes.map(style => (
                <TouchableOpacity
                  key={style}
                  style={[styles.chip, preferences.styleTypes.includes(style) && styles.chipActive]}
                  onPress={() => toggleStyleType(style)}>
                  <Text style={[styles.chipText, preferences.styleTypes.includes(style) && styles.chipTextActive]}>
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Favorite Colors</Text>
            <Text style={styles.sectionDescription}>Colors you love to wear</Text>
            <View style={styles.colorGrid}>
              {colors.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorChip,
                    { backgroundColor: color === 'white' ? '#f3f4f6' : color },
                    preferences.favoriteColors.includes(color) && styles.colorChipSelected,
                  ]}
                  onPress={() => toggleFavoriteColor(color)}>
                  {preferences.favoriteColors.includes(color) && (
                    <Text style={styles.colorCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Avoid These Colors</Text>
            <Text style={styles.sectionDescription}>Colors you prefer not to wear</Text>
            <View style={styles.colorGrid}>
              {colors.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorChip,
                    { backgroundColor: color === 'white' ? '#f3f4f6' : color },
                    preferences.dislikedColors.includes(color) && styles.colorChipDisliked,
                  ]}
                  onPress={() => toggleDislikedColor(color)}>
                  {preferences.dislikedColors.includes(color) && (
                    <Text style={styles.colorCross}>×</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comfort vs Style</Text>
            <View style={styles.buttonRow}>
              {comfortLevels.map(level => (
                <TouchableOpacity
                  key={level}
                  style={[styles.optionButton, preferences.comfortLevel === level && styles.optionButtonActive]}
                  onPress={() => setPreferences(prev => ({ ...prev, comfortLevel: level }))}>
                  <Text style={[styles.optionButtonText, preferences.comfortLevel === level && styles.optionButtonTextActive]}>
                    {level.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Formality Level</Text>
            <View style={styles.buttonRow}>
              {formalityLevels.map(level => (
                <TouchableOpacity
                  key={level}
                  style={[styles.optionButton, preferences.formalityPreference === level && styles.optionButtonActive]}
                  onPress={() => setPreferences(prev => ({ ...prev, formalityPreference: level }))}>
                  <Text style={[styles.optionButtonText, preferences.formalityPreference === level && styles.optionButtonTextActive]}>
                    {level.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pattern Preference</Text>
            <View style={styles.buttonRow}>
              {patterns.map(pattern => (
                <TouchableOpacity
                  key={pattern}
                  style={[styles.optionButton, preferences.patternPreference === pattern && styles.optionButtonActive]}
                  onPress={() => setPreferences(prev => ({ ...prev, patternPreference: pattern }))}>
                  <Text style={[styles.optionButtonText, preferences.patternPreference === pattern && styles.optionButtonTextActive]}>
                    {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fit Preference</Text>
            <View style={styles.buttonRow}>
              {fits.map(fit => (
                <TouchableOpacity
                  key={fit}
                  style={[styles.optionButton, preferences.fitPreference === fit && styles.optionButtonActive]}
                  onPress={() => setPreferences(prev => ({ ...prev, fitPreference: fit }))}>
                  <Text style={[styles.optionButtonText, preferences.fitPreference === fit && styles.optionButtonTextActive]}>
                    {fit.charAt(0).toUpperCase() + fit.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={savePreferences}
            disabled={loading}>
            <LinearGradient
              colors={['#43e97b', '#38f9d7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveButtonGradient}>
              <Save size={20} color="#ffffff" />
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Preferences'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
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
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  chipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#667eea',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  chipTextActive: {
    color: '#667eea',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorChip: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorChipSelected: {
    borderColor: '#10b981',
  },
  colorChipDisliked: {
    borderColor: '#ef4444',
  },
  colorCheckmark: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  colorCross: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#667eea',
  },
  optionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  optionButtonTextActive: {
    color: '#667eea',
  },
  footer: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
