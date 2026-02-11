import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, TrendingUp, Shirt, Sun, Cloud } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

interface ClothingItem {
  id: string;
  name: string;
  category: string;
  color: string;
  season: string;
  image_url: string;
  times_worn: number;
}

interface Outfit {
  id: string;
  name: string;
  image_url: string;
  times_worn: number;
}

export default function Home() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [todayOutfit, setTodayOutfit] = useState<ClothingItem[]>([]);
  const [recentItems, setRecentItems] = useState<ClothingItem[]>([]);
  const [favoriteOutfits, setFavoriteOutfits] = useState<Outfit[]>([]);
  const [stats, setStats] = useState({ totalItems: 0, totalOutfits: 0 });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      if (!user?.id) {
        return;
      }

      const [profileData, itemsData, outfitsData, favOutfitsData] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase
          .from('clothing_items')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('outfits')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('outfits')
          .select('*')
          .eq('user_id', user.id)
          .eq('favorite', true)
          .limit(3),
      ]);

      if (profileData.data) setProfile(profileData.data);
      if (itemsData.data) {
        setRecentItems(itemsData.data);
        setStats(prev => ({ ...prev, totalItems: itemsData.data.length }));
      }
      if (outfitsData.data) {
        setStats(prev => ({ ...prev, totalOutfits: outfitsData.data.length }));
      }
      if (favOutfitsData.data) setFavoriteOutfits(favOutfitsData.data);

      generateTodayOutfit(itemsData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const generateTodayOutfit = (items: ClothingItem[]) => {
    if (items.length === 0) return;

    const currentSeason = getCurrentSeason();
    const seasonalItems = items.filter(
      (item) => item.season === currentSeason || item.season === 'all-season'
    );

    const topItems = seasonalItems.filter((item) =>
      ['shirt', 'dress', 'jacket'].includes(item.category)
    );
    const bottomItems = seasonalItems.filter((item) => item.category === 'pants');
    const shoeItems = seasonalItems.filter((item) => item.category === 'shoes');

    const outfit: ClothingItem[] = [];
    if (topItems.length > 0) outfit.push(topItems[Math.floor(Math.random() * topItems.length)]);
    if (bottomItems.length > 0) outfit.push(bottomItems[Math.floor(Math.random() * bottomItems.length)]);
    if (shoeItems.length > 0) outfit.push(shoeItems[Math.floor(Math.random() * shoeItems.length)]);

    setTodayOutfit(outfit);
  };

  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
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
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{profile?.full_name || 'Welcome'}</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={() => router.push('/(tabs)/profile')}>
            <Text style={styles.avatarText}>
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

        <View style={styles.statsRow}>
          <LinearGradient
            colors={['#f093fb', '#f5576c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}>
            <Shirt size={28} color="#ffffff" />
            <Text style={styles.statValue}>{stats.totalItems}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#4facfe', '#00f2fe']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}>
            <Sparkles size={28} color="#ffffff" />
            <Text style={styles.statValue}>{stats.totalOutfits}</Text>
            <Text style={styles.statLabel}>Outfits</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#43e97b', '#38f9d7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}>
            <TrendingUp size={28} color="#ffffff" />
            <Text style={styles.statValue}>{favoriteOutfits.length}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </LinearGradient>
        </View>

        {todayOutfit.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['#fa709a', '#fee140']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircle}>
                <Sun size={20} color="#ffffff" />
              </LinearGradient>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Just Right for Today's Weather</Text>
                <Text style={styles.sectionSubtitle}>AI-curated outfit suggestion</Text>
              </View>
            </View>

            <View style={styles.todayOutfitCard}>
              <View style={styles.todayOutfitGrid}>
                {todayOutfit.map((item, index) => (
                  <View key={item.id} style={[styles.todayOutfitItem, index === 0 && styles.todayOutfitItemLarge]}>
                    <Image source={{ uri: item.image_url }} style={styles.todayOutfitImage} />
                    <View style={styles.todayOutfitOverlay}>
                      <Text style={styles.todayOutfitName} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.wearButton}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.wearButtonGradient}>
                  <Text style={styles.wearButtonText}>Wear This Outfit</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {recentItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['#a8edea', '#fed6e3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircle}>
                <Cloud size={20} color="#667eea" />
              </LinearGradient>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>My Closet</Text>
                <Text style={styles.sectionSubtitle}>Recently added items</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.itemsRow}>
                {recentItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.closetItem}
                    onPress={() => router.push('/(tabs)/wardrobe')}>
                    <Image source={{ uri: item.image_url }} style={styles.closetItemImage} />
                    <View style={styles.closetItemInfo}>
                      <Text style={styles.closetItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.closetItemBrand}>{item.category}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {recentItems.length === 0 && (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['#ffecd2', '#fcb69f']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyCircle}>
              <Sparkles size={48} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>Start Your Fashion Journey</Text>
            <Text style={styles.emptyText}>
              Add clothes to your wardrobe to get personalized outfit suggestions
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(tabs)/wardrobe')}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyButtonGradient}>
                <Text style={styles.emptyButtonText}>Add Your First Item</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 12,
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    fontWeight: '600',
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  todayOutfitCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  todayOutfitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  todayOutfitItem: {
    width: '31%',
    aspectRatio: 0.75,
    borderRadius: 16,
    overflow: 'hidden',
  },
  todayOutfitItemLarge: {
    width: '100%',
    aspectRatio: 1.5,
  },
  todayOutfitImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f5f9',
  },
  todayOutfitOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
  },
  todayOutfitName: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
  },
  wearButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  wearButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  wearButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  itemsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  closetItem: {
    width: 140,
  },
  closetItemImage: {
    width: 140,
    height: 180,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  closetItemInfo: {
    marginTop: 10,
  },
  closetItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closetItemBrand: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyButton: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
  emptyButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
