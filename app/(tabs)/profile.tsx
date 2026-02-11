import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Mail, Palette, LogOut, Save, Users } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export default function Profile() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    full_name: '',
    gender: 'unspecified',
    style_preference: 'casual',
  });

  const stylePreferences = [
    'casual',
    'formal',
    'sporty',
    'elegant',
    'streetwear',
    'minimalist',
    'vintage',
    'bohemian',
  ];

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          gender: data.gender || 'unspecified',
          style_preference: 'casual',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to update your profile');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          full_name: formData.full_name,
          gender: formData.gender,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      await loadProfile();
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#43e97b', '#38f9d7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          {!isEditing && (
            <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.avatarSection}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarLarge}>
            <Text style={styles.avatarTextLarge}>
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </LinearGradient>
          {!isEditing && (
            <Text style={styles.userName}>{profile?.full_name || 'User'}</Text>
          )}
        </View>

        {isEditing ? (
          <View style={styles.editForm}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                value={formData.full_name}
                onChangeText={(text) => setFormData({ ...formData, full_name: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Avatar Gender (for Virtual Try-On)</Text>
              <View style={styles.genderOptions}>
                {['male', 'female', 'unspecified'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderChip,
                      formData.gender === g && styles.genderChipActive,
                    ]}
                    onPress={() => setFormData({ ...formData, gender: g })}>
                    <Text
                      style={[
                        styles.genderText,
                        formData.gender === g && styles.genderTextActive,
                      ]}>
                      {g === 'male' ? '👨 Male' : g === 'female' ? '👩 Female' : '👤 Neutral'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setIsEditing(false);
                  setFormData({
                    full_name: profile?.full_name || '',
                    gender: profile?.gender || 'unspecified',
                    style_preference: 'casual',
                  });
                }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                <Save size={20} color="#ffffff" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.infoSection}>
            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <User size={24} color="#3b82f6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{profile?.full_name || 'Not set'}</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <Mail size={24} color="#3b82f6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profile?.email || user?.email}</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <Users size={24} color="#3b82f6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Avatar Gender</Text>
                <Text style={styles.infoValue}>
                  {profile?.gender === 'male' ? '👨 Male' : profile?.gender === 'female' ? '👩 Female' : '👤 Neutral'}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About SmartFit</Text>
          <Text style={styles.sectionText}>
            SmartFit is your personal stylist, helping you manage your wardrobe and create
            stylish outfits for any occasion. Make the most of what you already own and
            discover new combinations with AI-powered recommendations.
          </Text>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>SmartFit v1.0.0</Text>
          <Text style={styles.footerText}>Made with care for your wardrobe</Text>
        </View>
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
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
  },
  editButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#ffffff',
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarTextLarge: {
    fontSize: 48,
    fontWeight: '700',
    color: '#ffffff',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  editForm: {
    padding: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  styleChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  styleChipActive: {
    backgroundColor: '#3b82f6',
  },
  styleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  styleTextActive: {
    color: '#ffffff',
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  genderChip: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  genderChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  genderTextActive: {
    color: '#3b82f6',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    padding: 24,
    gap: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 21,
  },
  signOutButton: {
    flexDirection: 'row',
    backgroundColor: '#fee2e2',
    marginHorizontal: 24,
    marginVertical: 16,
    borderRadius: 12,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  signOutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
});
