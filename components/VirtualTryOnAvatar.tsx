import { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  Text,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { OutfitVisualization, ClothingMapping } from '@/services/virtualTryOn';
import Svg, { Path, Ellipse, Rect, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

interface VirtualTryOnAvatarProps {
  visualization: OutfitVisualization;
  width?: number;
  height?: number;
  showSkeleton?: boolean;
  modelImageUrl?: string;
}

export function VirtualTryOnAvatar({
  visualization,
  width = 300,
  height = 600,
  showSkeleton = true,
  modelImageUrl,
}: VirtualTryOnAvatarProps) {
  const [loading, setLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    setLoadedImages(new Set());
  }, [visualization]);

  const handleImageLoad = (itemId: string) => {
    setLoadedImages(prev => {
      const newSet = new Set(prev);
      newSet.add(itemId);
      if (newSet.size === visualization.mappings.length) {
        setLoading(false);
      }
      return newSet;
    });
  };

  const handleImageError = (itemId: string) => {
    console.warn(`Failed to load image for item ${itemId}`);
    handleImageLoad(itemId);
  };

  useEffect(() => {
    if (visualization.mappings.length === 0) {
      setLoading(false);
    }

    const timeout = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [visualization]);

  const renderAvatarBase = () => {
    const opacity = showSkeleton ? 0.85 : 0.15;
    const gender = visualization.genderModel || 'unspecified';

    const defaultModelImages = {
      male: 'https://i.postimg.cc/HxQdcZvH/3d-male-model-front.png',
      female: 'https://i.postimg.cc/HxQdcZvH/3d-male-model-front.png',
      unspecified: 'https://i.postimg.cc/HxQdcZvH/3d-male-model-front.png'
    };

    const imageUrl = modelImageUrl || defaultModelImages[gender as keyof typeof defaultModelImages] || defaultModelImages.unspecified;

    return (
      <View style={[styles.avatarBase, { width, height }]}>
        <Image
          source={{ uri: imageUrl }}
          style={[styles.modelImage, { opacity }]}
          resizeMode="contain"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.1)', 'transparent']}
          style={styles.modelGradient}
          pointerEvents="none"
        />
      </View>
    );
  };

  const renderClothingLayer = (mapping: ClothingMapping, index: number) => {
    const { item, position, transform, effects, layerIndex } = mapping;

    const adjustedX = (width / 2) - (position.width / 2) + position.x;

    const itemStyle = {
      position: 'absolute' as const,
      left: adjustedX,
      top: position.y,
      width: position.width,
      height: position.height,
      zIndex: 10 + layerIndex,
      transform: [
        { scale: transform.scale },
        { rotate: `${transform.rotate}deg` },
      ],
      opacity: loadedImages.has(item.id) ? 0.95 : 0,
    };

    const imageStyle = {
      width: '100%',
      height: '100%',
      resizeMode: 'contain' as const,
    };

    const shadowStyle = Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: layerIndex * 3 },
        shadowOpacity: 0.2 + layerIndex * 0.05,
        shadowRadius: 6 + layerIndex * 3,
      },
      android: {
        elevation: layerIndex * 3,
      },
      default: {},
    });

    return (
      <View key={item.id} style={[itemStyle, shadowStyle]}>
        <View style={styles.clothingWrapper}>
          <Image
            source={{ uri: item.image_url }}
            style={[
              imageStyle,
              {
                tintColor: undefined,
              },
            ]}
            onLoad={() => handleImageLoad(item.id)}
            onError={() => handleImageError(item.id)}
          />
          {mapping.zone === 'chest' && layerIndex > 2 && (
            <View style={styles.fabricFold} />
          )}
        </View>
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.05)',
            'transparent',
            'rgba(0,0,0,0.08)',
          ]}
          locations={[0, 0.5, 1]}
          style={styles.itemDepthGradient}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { width, height }]}>
      {renderAvatarBase()}

      <View style={styles.clothingContainer}>
        {visualization.mappings.map((mapping, index) =>
          renderClothingLayer(mapping, index)
        )}
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Rendering outfit...</Text>
        </View>
      )}

      <View style={styles.depthEffects}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.05)', 'transparent']}
          locations={[0, 0.5, 1]}
          style={styles.centerHighlight}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  avatarBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  modelImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  modelGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  clothingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  clothingWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  itemDepthGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  fabricFold: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    right: '20%',
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  depthEffects: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  centerHighlight: {
    width: '100%',
    height: '100%',
  },
});
