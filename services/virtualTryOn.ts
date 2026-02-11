import { supabase } from '@/lib/supabase';
import { ClothingItem } from './outfitAI';

export interface AvatarTemplate {
  id: string;
  name: string;
  gender: string;
  bodyType: string;
  mappingZones: MappingZones;
  defaultMeasurements: BodyMeasurements;
  base_image_url?: string;
}

export interface MappingZones {
  head: Zone;
  chest: Zone;
  waist: Zone;
  legs: Zone;
  feet: Zone;
  layering: {
    outer: number;
    top: number;
    bottom: number;
    shoes: number;
  };
}

export interface Zone {
  top: number;
  height: number;
  width?: number;
}

export interface BodyMeasurements {
  height: number;
  chest: number;
  waist: number;
  hips: number;
}

export interface ClothingMapping {
  item: ClothingItem;
  zone: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  transform: {
    scale: number;
    rotate: number;
    perspective: string;
  };
  layerIndex: number;
  effects: {
    shadow: string;
    brightness: number;
    contrast: number;
  };
}

export interface OutfitVisualization {
  id?: string;
  userId: string;
  itemIds: string[];
  genderModel: string;
  bodyType: string;
  viewAngle: string;
  mappings: ClothingMapping[];
  metadata: {
    generatedAt: Date;
    avatarTemplate: string;
    totalLayers: number;
  };
}

export class VirtualTryOnEngine {
  private categoryToZoneMap: { [key: string]: string } = {
    'shirt': 'chest',
    't-shirt': 'chest',
    'blouse': 'chest',
    'top': 'chest',
    'dress': 'chest',
    'sweater': 'chest',
    'hoodie': 'chest',
    'jacket': 'chest',
    'blazer': 'chest',
    'coat': 'chest',
    'cardigan': 'chest',
    'pants': 'legs',
    'jeans': 'legs',
    'trousers': 'legs',
    'shorts': 'legs',
    'skirt': 'legs',
    'leggings': 'legs',
    'shoes': 'feet',
    'sneakers': 'feet',
    'boots': 'feet',
    'heels': 'feet',
    'sandals': 'feet',
  };

  private layerPriority: { [key: string]: number } = {
    'shoes': 0,
    'sneakers': 0,
    'boots': 0,
    'pants': 1,
    'jeans': 1,
    'shorts': 1,
    'skirt': 1,
    'dress': 2,
    'shirt': 3,
    't-shirt': 3,
    'blouse': 3,
    'sweater': 4,
    'hoodie': 4,
    'jacket': 5,
    'blazer': 5,
    'coat': 6,
    'cardigan': 5,
  };

  async getAvatarTemplate(gender: string, bodyType: string = 'average'): Promise<AvatarTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('avatar_templates')
        .select('*')
        .eq('gender', gender)
        .eq('body_type', bodyType)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        const { data: neutralData } = await supabase
          .from('avatar_templates')
          .select('*')
          .eq('gender', 'unspecified')
          .eq('body_type', bodyType)
          .eq('is_active', true)
          .maybeSingle();

        if (!neutralData) return null;

        return {
          id: neutralData.id,
          name: neutralData.name,
          gender: neutralData.gender,
          bodyType: neutralData.body_type,
          mappingZones: neutralData.mapping_zones as MappingZones,
          defaultMeasurements: neutralData.default_measurements as BodyMeasurements,
          base_image_url: neutralData.base_image_url,
        };
      }

      return {
        id: data.id,
        name: data.name,
        gender: data.gender,
        bodyType: data.body_type,
        mappingZones: data.mapping_zones as MappingZones,
        defaultMeasurements: data.default_measurements as BodyMeasurements,
        base_image_url: data.base_image_url,
      };
    } catch (error) {
      console.error('Error fetching avatar template:', error);
      return null;
    }
  }

  getZoneForCategory(category: string): string {
    const normalizedCategory = category.toLowerCase().trim();
    return this.categoryToZoneMap[normalizedCategory] || 'chest';
  }

  getLayerIndex(category: string): number {
    const normalizedCategory = category.toLowerCase().trim();
    return this.layerPriority[normalizedCategory] ?? 3;
  }

  calculateItemPosition(
    item: ClothingItem,
    zone: Zone,
    template: AvatarTemplate
  ): ClothingMapping['position'] {
    const category = item.category.toLowerCase();
    const isFullLength = category === 'dress' || category === 'coat';

    let position = {
      x: 0,
      y: zone.top,
      width: zone.width || 100,
      height: zone.height,
    };

    if (isFullLength) {
      const chestZone = template.mappingZones.chest;
      const legsZone = template.mappingZones.legs;
      position.y = chestZone.top - 5;
      position.height = (legsZone.top + legsZone.height * 0.8) - chestZone.top;
      position.width = Math.max(chestZone.width || 100, legsZone.width || 90) * 1.2;
    }

    if (category.includes('jacket') || category.includes('blazer') || category.includes('cardigan')) {
      position.width = (zone.width || 100) * 1.4;
      position.height = zone.height * 1.2;
      position.x = -((position.width - (zone.width || 100)) / 2);
    }

    if (category === 'shorts') {
      position.height = zone.height * 0.4;
      position.width = (zone.width || 90) * 1.1;
    }

    if (category === 'skirt') {
      position.height = zone.height * 0.5;
      position.width = (zone.width || 90) * 1.15;
    }

    if (category.includes('shirt') || category.includes('top') || category.includes('blouse') || category.includes('t-shirt')) {
      position.width = (zone.width || 100) * 1.3;
      position.height = zone.height * 1.15;
      position.y = zone.top - 5;
    }

    if (category.includes('pants') || category.includes('jeans') || category.includes('trousers')) {
      position.width = (zone.width || 90) * 1.15;
      position.height = zone.height * 1.0;
      position.y = zone.top;
    }

    if (category.includes('shoes') || category.includes('sneakers') || category.includes('boots')) {
      position.width = (zone.width || 70) * 1.3;
      position.height = zone.height * 1.2;
    }

    return position;
  }

  calculateTransform(
    item: ClothingItem,
    layerIndex: number
  ): ClothingMapping['transform'] {
    const category = item.category.toLowerCase();

    let scale = 1.0;
    let rotate = 0;
    let perspective = 'none';

    if (category.includes('jacket') || category.includes('coat')) {
      scale = 1.05;
      perspective = '800px';
    }

    if (layerIndex > 4) {
      scale *= 1.02;
    }

    return { scale, rotate, perspective };
  }

  calculateEffects(
    item: ClothingItem,
    layerIndex: number,
    zone: string
  ): ClothingMapping['effects'] {
    const color = item.color?.toLowerCase() || 'gray';

    let brightness = 1.0;
    let contrast = 1.0;
    let shadowIntensity = 0.15;

    if (layerIndex > 3) {
      shadowIntensity = 0.25;
    }

    if (['black', 'navy', 'dark'].some(dark => color.includes(dark))) {
      brightness = 0.95;
      contrast = 1.1;
      shadowIntensity = 0.3;
    }

    if (['white', 'cream', 'light'].some(light => color.includes(light))) {
      brightness = 1.05;
      contrast = 0.95;
      shadowIntensity = 0.1;
    }

    const shadow = `0px ${4 + layerIndex * 2}px ${8 + layerIndex * 4}px rgba(0,0,0,${shadowIntensity})`;

    return { shadow, brightness, contrast };
  }

  async generateVisualization(
    userId: string,
    items: ClothingItem[],
    gender: string = 'unspecified',
    viewAngle: string = 'front'
  ): Promise<OutfitVisualization | null> {
    try {
      const template = await this.getAvatarTemplate(gender);
      if (!template) {
        throw new Error('Avatar template not found');
      }

      const sortedItems = [...items].sort((a, b) => {
        return this.getLayerIndex(a.category) - this.getLayerIndex(b.category);
      });

      const mappings: ClothingMapping[] = sortedItems.map((item, index) => {
        const zoneName = this.getZoneForCategory(item.category);
        const zone = template.mappingZones[zoneName as keyof typeof template.mappingZones] as Zone;
        const layerIndex = this.getLayerIndex(item.category);

        const position = this.calculateItemPosition(item, zone, template);
        const transform = this.calculateTransform(item, layerIndex);
        const effects = this.calculateEffects(item, layerIndex, zoneName);

        return {
          item,
          zone: zoneName,
          position,
          transform,
          layerIndex,
          effects,
        };
      });

      const visualization: OutfitVisualization = {
        userId,
        itemIds: items.map(item => item.id),
        genderModel: gender,
        bodyType: 'average',
        viewAngle,
        mappings,
        metadata: {
          generatedAt: new Date(),
          avatarTemplate: template.id,
          totalLayers: mappings.length,
        },
      };

      return visualization;
    } catch (error) {
      console.error('Error generating visualization:', error);
      return null;
    }
  }

  async saveVisualization(visualization: OutfitVisualization): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('outfit_visualizations')
        .insert({
          user_id: visualization.userId,
          item_ids: visualization.itemIds,
          gender_model: visualization.genderModel,
          body_type: visualization.bodyType,
          view_angle: visualization.viewAngle,
          visualization_data: {
            mappings: visualization.mappings,
            metadata: visualization.metadata,
          },
          is_cached: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error saving visualization:', error);
      return null;
    }
  }

  async getUserProfile(userId: string): Promise<{ gender: string; bodyType: string } | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('gender, body_type')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) {
        return { gender: 'unspecified', bodyType: 'average' };
      }

      return {
        gender: data.gender || 'unspecified',
        bodyType: data.body_type || 'average',
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return { gender: 'unspecified', bodyType: 'average' };
    }
  }
}

export const virtualTryOn = new VirtualTryOnEngine();
