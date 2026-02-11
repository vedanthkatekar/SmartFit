import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Wand2, ThumbsUp, ThumbsDown, TrendingUp, Sun, Cloud, Wind, Settings, Camera } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { outfitAI, OutfitRecommendation, RecommendationContext } from '@/services/outfitAI';
import { supabase } from '@/lib/supabase';
import { StylePreferences } from '@/components/StylePreferences';
import { TryOnModal } from '@/components/TryOnModal';
import { Toast } from '@/components/Toast';

export default function AIStylist() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [primaryOutfit, setPrimaryOutfit] = useState<OutfitRecommendation | null>(null);
  const [backupOutfit, setBackupOutfit] = useState<OutfitRecommendation | null>(null);
  const [showBackup, setShowBackup] = useState(false);
  const [occasion, setOccasion] = useState('casual');
  const [mood, setMood] = useState('balanced');
  const [weather, setWeather] = useState('mild');
  const [showPreferences, setShowPreferences] = useState(false);
  const [showVirtualTryOn, setShowVirtualTryOn] = useState(false);
  const [tryOnOutfit, setTryOnOutfit] = useState<OutfitRecommendation | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const occasions = [
    { id: 'casual', label: 'Casual', icon: '👕' },
    { id: 'work', label: 'Work', icon: '💼' },
    { id: 'formal', label: 'Formal', icon: '🎩' },
    { id: 'date', label: 'Date', icon: '💝' },
    { id: 'sports', label: 'Sports', icon: '⚽' },
    { id: 'party', label: 'Party', icon: '🎉' },
  ];

  const moods = [
    { id: 'bold', label: 'Bold', icon: '🔥' },
    { id: 'balanced', label: 'Balanced', icon: '⚖️' },
    { id: 'conservative', label: 'Conservative', icon: '🛡️' },
    { id: 'adventurous', label: 'Adventurous', icon: '🚀' },
  ];

  const weatherOptions = [
    { id: 'hot', label: 'Hot', icon: Sun, temp: '25°C+' },
    { id: 'mild', label: 'Mild', icon: Cloud, temp: '15-25°C' },
    { id: 'cold', label: 'Cold', icon: Wind, temp: '<15°C' },
  ];

  useEffect(() => {
    detectWeather();
  }, []);

  const detectWeather = () => {
    const month = new Date().getMonth();
    if (month >= 5 && month <= 7) {
      setWeather('hot');
    } else if (month >= 11 || month <= 1) {
      setWeather('cold');
    } else {
      setWeather('mild');
    }
  };

  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  };

  const generateOutfit = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please sign in to use AI Stylist');
      return;
    }

    setLoading(true);
    try {
      const context: RecommendationContext = {
        occasion,
        weather,
        season: getCurrentSeason(),
        mood,
        dateFor: new Date(),
      };

      const result = await outfitAI.generateOutfitRecommendations(user.id, context);

      if (!result) {
        Alert.alert(
          'Not Enough Items',
          'Add more clothing items to your wardrobe to get AI outfit recommendations. You need at least:\n\n• 2-3 tops (shirts, t-shirts)\n• 1-2 bottoms (pants, jeans)\n• Shoes are recommended but optional'
        );
        setLoading(false);
        return;
      }

      setPrimaryOutfit(result.primary);
      setBackupOutfit(result.backup);

      await outfitAI.saveRecommendation(user.id, result.primary);
      await outfitAI.saveRecommendation(user.id, result.backup);

    } catch (error) {
      console.error('Error generating outfit:', error);
      Alert.alert('Error', 'Failed to generate outfit recommendation');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (liked: boolean) => {
    if (!user?.id || !primaryOutfit) return;

    try {
      await supabase.from('outfit_feedback').insert({
        user_id: user.id,
        feedback_type: liked ? 'liked' : 'disliked',
        rating: liked ? 5 : 2,
        was_worn: false,
      });

      setToastMessage('Preference saved successfully');
      setShowToast(true);
    } catch (error) {
      console.error('Error saving feedback:', error);
      setToastMessage('Failed to save preference');
      setShowToast(true);
    }
  };

  const markAsWorn = async () => {
    if (!user?.id || !primaryOutfit) return;

    try {
      await supabase.from('outfit_history').insert({
        user_id: user.id,
        item_ids: primaryOutfit.items.map(item => item.id),
        worn_date: new Date().toISOString().split('T')[0],
        occasion,
      });

      for (const item of primaryOutfit.items) {
        await supabase
          .from('clothing_items')
          .update({
            last_worn: new Date().toISOString().split('T')[0],
            times_worn: (item.times_worn || 0) + 1,
            wear_frequency: (item.wear_frequency || 0) + 1,
          })
          .eq('id', item.id);
      }

      setToastMessage('Outfit marked as worn. Have a wonderful day!');
      setShowToast(true);
      setPrimaryOutfit(null);
      setBackupOutfit(null);
    } catch (error) {
      console.error('Error marking outfit as worn:', error);
      setToastMessage('Failed to mark outfit as worn');
      setShowToast(true);
    }
  };

  const openVirtualTryOn = (outfit: OutfitRecommendation) => {
    setTryOnOutfit(outfit);
    setShowVirtualTryOn(true);
  };

  const renderOutfit = (outfit: OutfitRecommendation | null, isBackup: boolean = false) => {
    if (!outfit) return null;

    return (
      <View style={styles.outfitContainer}>
        <View style={styles.outfitHeader}>
          <View style={styles.outfitTitleRow}>
            <Text style={styles.outfitTitle}>
              {isBackup ? 'Backup Option' : 'Recommended Outfit'}
            </Text>
            <View style={[
              styles.confidenceBadge,
              outfit.confidenceLevel === 'high' && styles.confidenceBadgeHigh,
              outfit.confidenceLevel === 'medium' && styles.confidenceBadgeMedium,
            ]}>
              <Text style={styles.confidenceText}>
                {outfit.confidenceLevel === 'high' ? '⭐ High' : outfit.confidenceLevel === 'medium' ? '✓ Medium' : '○ Low'} Confidence
              </Text>
            </View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsScroll}>
          {outfit.items.map((item, index) => (
            <View key={item.id} style={styles.outfitItem}>
              <View style={styles.itemImageContainer}>
                <Image source={{ uri: item.image_url }} style={styles.outfitItemImage} />
                <View style={styles.itemNumberBadge}>
                  <Text style={styles.itemNumberText}>{index + 1}</Text>
                </View>
              </View>
              <Text style={styles.outfitItemName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.outfitItemCategory}>{item.category}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.scoreSection}>
          <View style={styles.scoreRow}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Color</Text>
              <View style={styles.scoreBar}>
                <View style={[styles.scoreBarFill, { width: `${outfit.score.colorHarmony * 100}%` }]} />
              </View>
              <Text style={styles.scoreValue}>{Math.round(outfit.score.colorHarmony * 100)}%</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Style</Text>
              <View style={styles.scoreBar}>
                <View style={[styles.scoreBarFill, { width: `${outfit.score.styleCoherence * 100}%` }]} />
              </View>
              <Text style={styles.scoreValue}>{Math.round(outfit.score.styleCoherence * 100)}%</Text>
            </View>
          </View>
          <View style={styles.scoreRow}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Fit</Text>
              <View style={styles.scoreBar}>
                <View style={[styles.scoreBarFill, { width: `${outfit.score.fitBalance * 100}%` }]} />
              </View>
              <Text style={styles.scoreValue}>{Math.round(outfit.score.fitBalance * 100)}%</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Fabric</Text>
              <View style={styles.scoreBar}>
                <View style={[styles.scoreBarFill, { width: `${outfit.score.fabricCompatibility * 100}%` }]} />
              </View>
              <Text style={styles.scoreValue}>{Math.round(outfit.score.fabricCompatibility * 100)}%</Text>
            </View>
          </View>
        </View>

        <View style={styles.explanationContainer}>
          <Text style={styles.explanationLabel}>✨ Styling Notes</Text>
          <Text style={styles.explanationText}>{outfit.explanation}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>AI Stylist</Text>
            <Text style={styles.subtitle}>Your Personal Fashion Assistant</Text>
          </View>
          <TouchableOpacity style={styles.sparkleButton} onPress={() => setShowPreferences(true)}>
            <Settings size={28} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Occasion</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.optionsRow}>
              {occasions.map((occ) => (
                <TouchableOpacity
                  key={occ.id}
                  style={[styles.optionCard, occasion === occ.id && styles.optionCardActive]}
                  onPress={() => setOccasion(occ.id)}>
                  <Text style={styles.optionIcon}>{occ.icon}</Text>
                  <Text style={[styles.optionText, occasion === occ.id && styles.optionTextActive]}>
                    {occ.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weather Conditions</Text>
          <View style={styles.weatherRow}>
            {weatherOptions.map((w) => {
              const IconComponent = w.icon;
              return (
                <TouchableOpacity
                  key={w.id}
                  style={[styles.weatherCard, weather === w.id && styles.weatherCardActive]}
                  onPress={() => setWeather(w.id)}>
                  <IconComponent size={32} color={weather === w.id ? '#667eea' : '#9ca3af'} />
                  <Text style={[styles.weatherLabel, weather === w.id && styles.weatherLabelActive]}>
                    {w.label}
                  </Text>
                  <Text style={styles.weatherTemp}>{w.temp}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Style Mood</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.optionsRow}>
              {moods.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.moodChip, mood === m.id && styles.moodChipActive]}
                  onPress={() => setMood(m.id)}>
                  <Text style={styles.moodIcon}>{m.icon}</Text>
                  <Text style={[styles.moodText, mood === m.id && styles.moodTextActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <TouchableOpacity
          style={styles.generateButton}
          onPress={generateOutfit}
          disabled={loading}>
          <LinearGradient
            colors={['#f093fb', '#f5576c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.generateButtonGradient}>
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Wand2 size={24} color="#ffffff" />
                <Text style={styles.generateButtonText}>Generate Outfit</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {primaryOutfit && (
          <>
            {renderOutfit(primaryOutfit, false)}

            <TouchableOpacity
              style={styles.tryOnButton}
              onPress={() => openVirtualTryOn(primaryOutfit)}>
              <LinearGradient
                colors={['#1e3a5f', '#0f2942']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tryOnButtonGradient}>
                <Camera size={24} color="#ffffff" />
                <View>
                  <Text style={styles.tryOnButtonText}>Try On With Your Photo</Text>
                  <Text style={styles.tryOnButtonHint}>Upload a photo to see this outfit on you</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleFeedback(false)}>
                <ThumbsDown size={20} color="#ef4444" />
                <Text style={styles.actionButtonTextDislike}>Not for me</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButtonPrimary} onPress={markAsWorn}>
                <LinearGradient
                  colors={['#43e97b', '#38f9d7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButtonPrimaryGradient}>
                  <Text style={styles.actionButtonTextPrimary}>I'll Wear This!</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={() => handleFeedback(true)}>
                <ThumbsUp size={20} color="#10b981" />
                <Text style={styles.actionButtonTextLike}>Love it</Text>
              </TouchableOpacity>
            </View>

            {backupOutfit && (
              <TouchableOpacity
                style={styles.showBackupButton}
                onPress={() => setShowBackup(!showBackup)}>
                <TrendingUp size={20} color="#667eea" />
                <Text style={styles.showBackupText}>
                  {showBackup ? 'Hide' : 'Show'} Backup Option
                </Text>
              </TouchableOpacity>
            )}

            {showBackup && backupOutfit && renderOutfit(backupOutfit, true)}
          </>
        )}

        {!primaryOutfit && !loading && (
          <View style={styles.emptyState}>
            <Sparkles size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>Ready to Style You</Text>
            <Text style={styles.emptyText}>
              Select your preferences and tap "Generate Outfit" to get personalized recommendations
            </Text>
          </View>
        )}
      </ScrollView>

      <StylePreferences
        visible={showPreferences}
        onClose={() => setShowPreferences(false)}
      />

      {tryOnOutfit && (
        <TryOnModal
          visible={showVirtualTryOn}
          onClose={() => setShowVirtualTryOn(false)}
          items={tryOnOutfit.items}
          outfitName={`${occasion.charAt(0).toUpperCase() + occasion.slice(1)} Outfit`}
          occasion={occasion}
          onRegenerateOutfit={generateOutfit}
        />
      )}

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
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  sparkleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionCard: {
    width: 100,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardActive: {
    borderColor: '#667eea',
    backgroundColor: '#eff6ff',
  },
  optionIcon: {
    fontSize: 32,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  optionTextActive: {
    color: '#667eea',
  },
  weatherRow: {
    flexDirection: 'row',
    gap: 12,
  },
  weatherCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  weatherCardActive: {
    borderColor: '#667eea',
    backgroundColor: '#eff6ff',
  },
  weatherLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  weatherLabelActive: {
    color: '#667eea',
  },
  weatherTemp: {
    fontSize: 12,
    color: '#9ca3af',
  },
  moodChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodChipActive: {
    borderColor: '#667eea',
    backgroundColor: '#eff6ff',
  },
  moodIcon: {
    fontSize: 20,
  },
  moodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  moodTextActive: {
    color: '#667eea',
  },
  generateButton: {
    marginHorizontal: 24,
    marginVertical: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  outfitContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  outfitHeader: {
    marginBottom: 16,
  },
  outfitTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  outfitTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  confidenceBadgeHigh: {
    backgroundColor: '#d1fae5',
  },
  confidenceBadgeMedium: {
    backgroundColor: '#fef3c7',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  itemsScroll: {
    marginVertical: 16,
  },
  outfitItem: {
    width: 140,
    marginRight: 12,
  },
  itemImageContainer: {
    position: 'relative',
  },
  outfitItemImage: {
    width: 140,
    height: 180,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  itemNumberBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemNumberText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  outfitItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
  },
  outfitItemCategory: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  scoreSection: {
    marginTop: 16,
    gap: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 12,
  },
  scoreItem: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 6,
  },
  scoreBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 4,
  },
  scoreValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  explanationContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  explanationLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  tryOnButton: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0f2942',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  tryOnButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  tryOnButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  tryOnButtonHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  actionButtonPrimary: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonPrimaryGradient: {
    flexDirection: 'row',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonTextDislike: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  actionButtonTextLike: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  actionButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  showBackupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#667eea',
  },
  showBackupText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
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
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
