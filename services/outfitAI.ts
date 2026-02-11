import { supabase } from '@/lib/supabase';

export interface ClothingItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  color: string;
  season: string;
  image_url: string;
  fabric?: string;
  fit?: string;
  brand?: string;
  last_worn?: string;
  times_worn?: number;
  wear_frequency?: number;
  weather_suitability?: string[];
  tags?: string[];
}

export interface OutfitScore {
  colorHarmony: number;
  fitBalance: number;
  fabricCompatibility: number;
  styleCoherence: number;
  overall: number;
}

export interface OutfitRecommendation {
  items: ClothingItem[];
  score: OutfitScore;
  explanation: string;
  confidenceLevel: 'low' | 'medium' | 'high';
  occasion: string;
  weatherType: string;
  isBackup: boolean;
}

export interface UserPreferences {
  styleTypes?: string[];
  favoriteColors?: string[];
  dislikedColors?: string[];
  comfortLevel?: string;
  formalityPreference?: string;
  fitPreference?: string;
  moodSettings?: {
    adventurous: number;
    conservative: number;
    bold: number;
  };
}

export interface RecommendationContext {
  occasion: string;
  weather?: string;
  temperature?: number;
  season: string;
  mood?: string;
  isImportant?: boolean;
  dateFor?: Date;
}

export class OutfitAIEngine {
  private colorWheel: { [key: string]: string[] } = {
    red: ['orange', 'pink', 'purple'],
    orange: ['red', 'yellow', 'brown'],
    yellow: ['orange', 'green', 'gold'],
    green: ['yellow', 'blue', 'teal'],
    blue: ['green', 'purple', 'navy'],
    purple: ['blue', 'red', 'pink'],
    pink: ['red', 'purple', 'white'],
    brown: ['orange', 'beige', 'tan'],
    black: ['white', 'gray', 'red', 'blue', 'any'],
    white: ['black', 'gray', 'any'],
    gray: ['black', 'white', 'blue', 'any'],
    beige: ['brown', 'white', 'tan']
  };

  private complementaryColors: { [key: string]: string } = {
    red: 'green',
    green: 'red',
    blue: 'orange',
    orange: 'blue',
    yellow: 'purple',
    purple: 'yellow'
  };

  private formalityHierarchy = {
    formal: 5,
    business: 4,
    'smart-casual': 3,
    casual: 2,
    athletic: 1
  };

  calculateColorHarmony(colors: string[]): number {
    if (colors.length < 2) return 1.0;

    let harmonyScore = 0;
    let comparisons = 0;

    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        const color1 = colors[i].toLowerCase();
        const color2 = colors[j].toLowerCase();

        if (this.isNeutral(color1) || this.isNeutral(color2)) {
          harmonyScore += 1.0;
        } else if (this.areComplementary(color1, color2)) {
          harmonyScore += 0.9;
        } else if (this.areAnalogous(color1, color2)) {
          harmonyScore += 0.85;
        } else if (this.areTriadic(color1, color2, colors)) {
          harmonyScore += 0.8;
        } else {
          harmonyScore += 0.5;
        }
        comparisons++;
      }
    }

    return comparisons > 0 ? harmonyScore / comparisons : 1.0;
  }

  private isNeutral(color: string): boolean {
    const neutrals = ['black', 'white', 'gray', 'grey', 'beige', 'brown', 'tan', 'cream', 'ivory'];
    return neutrals.includes(color.toLowerCase());
  }

  private areComplementary(color1: string, color2: string): boolean {
    return this.complementaryColors[color1] === color2 || this.complementaryColors[color2] === color1;
  }

  private areAnalogous(color1: string, color2: string): boolean {
    const adjacents = this.colorWheel[color1] || [];
    return adjacents.includes(color2);
  }

  private areTriadic(color1: string, color2: string, allColors: string[]): boolean {
    return allColors.length >= 3;
  }

  calculateFitBalance(items: ClothingItem[]): number {
    const fits = items.map(item => item.fit || 'regular');
    const hasFitted = fits.includes('fitted') || fits.includes('slim');
    const hasLoose = fits.includes('loose') || fits.includes('relaxed') || fits.includes('oversized');

    if (hasFitted && hasLoose) return 1.0;
    if (fits.every(f => f === 'regular')) return 0.9;

    return 0.7;
  }

  calculateFabricCompatibility(items: ClothingItem[]): number {
    const fabrics = items.map(item => item.fabric || 'cotton').filter(Boolean);
    if (fabrics.length < 2) return 1.0;

    const formalFabrics = ['silk', 'wool', 'linen', 'cashmere'];
    const casualFabrics = ['denim', 'cotton', 'jersey', 'fleece', 'polyester'];

    const allFormal = fabrics.every(f => formalFabrics.includes(f.toLowerCase()));
    const allCasual = fabrics.every(f => casualFabrics.includes(f.toLowerCase()));
    const mixed = fabrics.some(f => formalFabrics.includes(f.toLowerCase())) &&
                  fabrics.some(f => casualFabrics.includes(f.toLowerCase()));

    if (allFormal || allCasual) return 1.0;
    if (mixed) return 0.7;

    return 0.85;
  }

  calculateStyleCoherence(items: ClothingItem[], occasion: string): number {
    const categories = items.map(item => item.category);

    const occasionMap: { [key: string]: string[] } = {
      formal: ['dress', 'suit', 'blazer', 'dress-pants', 'heels'],
      work: ['shirt', 'pants', 'blazer', 'dress', 'shoes'],
      casual: ['shirt', 'pants', 'dress', 'shoes', 'jacket'],
      sports: ['athletic-shirt', 'shorts', 'sneakers', 'athletic-pants'],
      date: ['dress', 'shirt', 'pants', 'jacket', 'shoes']
    };

    const expectedCategories = occasionMap[occasion.toLowerCase()] || occasionMap['casual'];
    const matches = categories.filter(cat =>
      expectedCategories.some(exp => cat.toLowerCase().includes(exp.toLowerCase()))
    );

    return Math.min(matches.length / Math.max(expectedCategories.length, categories.length), 1.0);
  }

  scoreOutfit(items: ClothingItem[], occasion: string): OutfitScore {
    const colors = items.map(item => item.color);

    const colorHarmony = this.calculateColorHarmony(colors);
    const fitBalance = this.calculateFitBalance(items);
    const fabricCompatibility = this.calculateFabricCompatibility(items);
    const styleCoherence = this.calculateStyleCoherence(items, occasion);

    const overall = (
      colorHarmony * 0.3 +
      fitBalance * 0.2 +
      fabricCompatibility * 0.2 +
      styleCoherence * 0.3
    );

    return {
      colorHarmony,
      fitBalance,
      fabricCompatibility,
      styleCoherence,
      overall
    };
  }

  generateExplanation(items: ClothingItem[], score: OutfitScore, occasion: string): string {
    const explanations: string[] = [];

    if (score.colorHarmony >= 0.85) {
      explanations.push('Perfect color harmony creates a cohesive look');
    } else if (score.colorHarmony >= 0.7) {
      explanations.push('Colors complement each other well');
    }

    if (score.fitBalance >= 0.9) {
      explanations.push('Balanced proportions with fitted and relaxed pieces');
    }

    if (score.styleCoherence >= 0.8) {
      explanations.push(`Ideal for ${occasion} occasions`);
    }

    const itemNames = items.map(item => item.name).join(', ');
    explanations.push(`Features: ${itemNames}`);

    return explanations.join('. ') + '.';
  }

  getConfidenceLevel(score: number): 'low' | 'medium' | 'high' {
    if (score >= 0.85) return 'high';
    if (score >= 0.7) return 'medium';
    return 'low';
  }

  async generateOutfitRecommendations(
    userId: string,
    context: RecommendationContext,
    preferences?: UserPreferences
  ): Promise<{ primary: OutfitRecommendation; backup: OutfitRecommendation } | null> {
    const { data: items, error } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('user_id', userId);

    if (error || !items || items.length < 2) {
      console.log('Not enough items:', items?.length);
      return null;
    }

    const recentHistory = await this.getRecentOutfitHistory(userId, 7);
    const recentlyWornIds = new Set(recentHistory.flatMap(h => h.item_ids));

    const availableItems = items.filter(item => {
      if (preferences?.dislikedColors?.includes(item.color)) return false;

      if (context.season && item.season !== 'all-season' && item.season !== context.season) {
        return false;
      }

      return true;
    });

    const underusedItems = availableItems
      .filter(item => !recentlyWornIds.has(item.id))
      .sort((a, b) => (a.wear_frequency || 0) - (b.wear_frequency || 0));

    const candidates = this.generateOutfitCombinations(
      underusedItems.length > 0 ? underusedItems : availableItems,
      context
    );

    const scoredOutfits = candidates.map(outfit => {
      const score = this.scoreOutfit(outfit, context.occasion);
      return {
        items: outfit,
        score,
        explanation: this.generateExplanation(outfit, score, context.occasion),
        confidenceLevel: this.getConfidenceLevel(score.overall),
        occasion: context.occasion,
        weatherType: context.weather || 'any',
        isBackup: false
      };
    });

    scoredOutfits.sort((a, b) => b.score.overall - a.score.overall);

    if (scoredOutfits.length === 0) {
      console.log('No valid outfits generated');
      return null;
    }

    const primary = scoredOutfits[0];
    const backup = scoredOutfits.length > 1
      ? { ...scoredOutfits[1], isBackup: true }
      : { ...scoredOutfits[0], isBackup: true };

    console.log(`Generated ${scoredOutfits.length} outfits. Primary score: ${primary.score.overall.toFixed(2)}`);
    return { primary, backup };
  }

  private generateOutfitCombinations(items: ClothingItem[], context: RecommendationContext): ClothingItem[][] {
    const tops = items.filter(item => ['shirt', 'dress', 'blouse', 't-shirt', 'sweater', 'hoodie'].includes(item.category));
    const bottoms = items.filter(item => ['pants', 'jeans', 'skirt', 'shorts', 'trousers'].includes(item.category));
    const layers = items.filter(item => ['jacket', 'blazer', 'cardigan', 'coat'].includes(item.category));
    const shoes = items.filter(item => ['shoes', 'sneakers', 'boots', 'heels', 'sandals'].includes(item.category));

    const combinations: ClothingItem[][] = [];

    if (tops.length === 0 && bottoms.length === 0) {
      return combinations;
    }

    if (tops.length > 0 && bottoms.length > 0) {
      for (const top of tops.slice(0, 15)) {
        for (const bottom of bottoms.slice(0, 8)) {
          const combo = [top, bottom];

          if (context.weather === 'cold' && layers.length > 0) {
            for (const layer of layers.slice(0, 2)) {
              const comboWithLayer = [...combo, layer];
              if (shoes.length > 0) {
                for (const shoe of shoes.slice(0, 2)) {
                  combinations.push([...comboWithLayer, shoe]);
                }
              } else {
                combinations.push(comboWithLayer);
              }
            }
          } else {
            if (shoes.length > 0) {
              for (const shoe of shoes.slice(0, 3)) {
                combinations.push([...combo, shoe]);
              }
            } else {
              combinations.push(combo);
            }
          }
        }
      }
    } else if (tops.length > 0) {
      for (const top of tops.slice(0, 10)) {
        const combo = [top];
        if (shoes.length > 0) {
          combo.push(shoes[0]);
        }
        combinations.push(combo);
      }
    } else if (bottoms.length > 0) {
      for (const bottom of bottoms.slice(0, 10)) {
        const combo = [bottom];
        if (shoes.length > 0) {
          combo.push(shoes[0]);
        }
        combinations.push(combo);
      }
    }

    console.log(`Generated ${combinations.length} outfit combinations`);
    return combinations.slice(0, 30);
  }

  private async getRecentOutfitHistory(userId: string, days: number): Promise<any[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    const { data, error } = await supabase
      .from('outfit_history')
      .select('*')
      .eq('user_id', userId)
      .gte('worn_date', date.toISOString().split('T')[0]);

    return data || [];
  }

  async saveRecommendation(userId: string, recommendation: OutfitRecommendation): Promise<string | null> {
    const { data, error } = await supabase
      .from('outfit_recommendations')
      .insert({
        user_id: userId,
        name: `${recommendation.occasion} Outfit`,
        item_ids: recommendation.items.map(item => item.id),
        occasion: recommendation.occasion,
        weather_type: recommendation.weatherType,
        season: recommendation.items[0]?.season || 'all-season',
        color_harmony_score: recommendation.score.colorHarmony,
        fit_balance_score: recommendation.score.fitBalance,
        fabric_compatibility_score: recommendation.score.fabricCompatibility,
        style_coherence_score: recommendation.score.styleCoherence,
        overall_score: recommendation.score.overall,
        confidence_level: recommendation.confidenceLevel,
        styling_explanation: recommendation.explanation,
        is_backup: recommendation.isBackup,
        date_for: new Date().toISOString().split('T')[0],
        status: 'suggested'
      })
      .select()
      .single();

    return data?.id || null;
  }
}

export const outfitAI = new OutfitAIEngine();
