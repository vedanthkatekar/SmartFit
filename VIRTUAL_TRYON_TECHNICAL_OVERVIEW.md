# Virtual Try-On: Technical Implementation Overview

## System Architecture

The Virtual Try-On engine uses realistic 3D mannequin models as a base layer and intelligently overlays user's wardrobe items on top with realistic positioning, scaling, shadows, and depth effects.

## How Clothing is "Worn" on the Model

### 1. Base Model Rendering

**File**: `components/VirtualTryOnAvatar.tsx`

The 3D mannequin model is rendered as the foundation:

```typescript
<Image
  source={{ uri: modelUrl }}
  style={[styles.modelImage, { opacity }]}
  resizeMode="contain"
/>
```

- Model is displayed at full container size (300x600px default)
- Dark background (#1a1a1a) provides optimal contrast
- Opacity controlled by `showSkeleton` toggle (visible/faded)

### 2. Clothing Item Positioning

**File**: `services/virtualTryOn.ts`

Each clothing item is mapped to specific body zones:

```typescript
categoryToZoneMap = {
  'shirt': 'chest',
  'pants': 'legs',
  'shoes': 'feet',
  // ... etc
}
```

**Zone Coordinates** (stored in database `avatar_templates`):
```json
{
  "chest": {"top": 170, "height": 180, "width": 280},
  "legs": {"top": 470, "height": 350, "width": 240},
  "feet": {"top": 820, "height": 80, "width": 180}
}
```

### 3. Intelligent Scaling & Positioning

The `calculateItemPosition()` function adjusts each garment:

```typescript
// Jackets are wider and slightly larger
if (category.includes('jacket')) {
  position.width = (zone.width || 280) * 1.15;
  position.height = zone.height * 1.1;
  position.x = -((position.width - (zone.width || 280)) / 2);
}

// Pants are narrower, positioned slightly lower
if (category.includes('pants')) {
  position.width = (zone.width || 240) * 0.88;
  position.height = zone.height * 0.92;
  position.y = zone.top + 5;
}
```

### 4. Layering System

Clothing stacks in realistic order using z-index:

```typescript
layerPriority = {
  'shoes': 0,      // Bottom layer
  'pants': 1,
  'dress': 2,
  'shirt': 3,
  'sweater': 4,
  'jacket': 5,     // Top layer
  'coat': 6
}
```

### 5. Realistic Visual Effects

**Shadows** - Deeper for outer layers:
```typescript
shadowOpacity: 0.2 + layerIndex * 0.05,
shadowRadius: 6 + layerIndex * 3,
```

**Depth Gradients** - Add 3D appearance:
```typescript
<LinearGradient
  colors={['rgba(0,0,0,0.05)', 'transparent', 'rgba(0,0,0,0.08)']}
  style={styles.itemDepthGradient}
/>
```

**Opacity Blending** - Slight transparency for natural look:
```typescript
opacity: 0.92  // Allows base model to show through subtly
```

### 6. Rendering Pipeline

**Order of Operations**:

1. **Base Model Layer** (z-index: 0)
   - 3D mannequin image
   - Adjustable opacity

2. **Clothing Layers** (z-index: 10+)
   - Sorted by layer priority
   - Shoes → Pants → Top → Jacket
   - Each with position, scale, shadow

3. **Effect Overlays** (z-index: 1000+)
   - Depth gradients
   - Loading indicators

## Body Zone Mapping

### Chest Zone (Tops, Shirts, Jackets)
- **Top**: 170px from top
- **Height**: 180px
- **Width**: 280px
- **Items**: Shirts, blouses, t-shirts, sweaters, jackets

### Waist Zone (unused currently, for belts/accessories)
- **Top**: 350px from top
- **Height**: 120px
- **Width**: 260px

### Legs Zone (Bottoms)
- **Top**: 470px from top
- **Height**: 350px
- **Width**: 240px
- **Items**: Pants, jeans, shorts, skirts

### Feet Zone (Footwear)
- **Top**: 820px from top
- **Height**: 80px
- **Width**: 180px
- **Items**: Shoes, sneakers, boots

## Customization Points

### 1. Adjust Base Model

Change model images in `VirtualTryOnAvatar.tsx`:
```typescript
const MALE_MODEL_BASE = require('@/assets/avatar-models/male-front.png');
```

### 2. Fine-tune Positioning

Edit zone coordinates in Supabase `avatar_templates` table

### 3. Modify Scaling Logic

Update `calculateItemPosition()` in `virtualTryOn.ts`

### 4. Adjust Visual Effects

Edit shadow/opacity values in `renderClothingLayer()`

### 5. Add New Categories

Extend `categoryToZoneMap` and `layerPriority` dictionaries

## Data Flow

```
User Action: "Try On Virtually"
    ↓
VirtualTryOnModal opens
    ↓
virtualTryOn.generateVisualization()
    ↓
For each clothing item:
    - Determine body zone (chest/legs/feet)
    - Calculate position & scale
    - Determine layer order
    - Apply visual effects
    ↓
Create OutfitVisualization object
    ↓
VirtualTryOnAvatar renders:
    1. Base model image
    2. Sorted clothing items
    3. Effect layers
    ↓
User sees realistic outfit on 3D model
```

## Performance Optimizations

1. **Image Caching**: Clothing images preloaded, tracked via `loadedImages` state
2. **Database Caching**: Visualizations saved to `outfit_visualizations` table
3. **Lazy Loading**: Model only rendered when modal opens
4. **Optimized Shadows**: Platform-specific shadow implementations
5. **Efficient Re-renders**: Only affected layers update on changes

## Future Enhancements

- **Multi-angle support**: Side, back, 3/4 views
- **Background removal AI**: Remove clothing backgrounds automatically
- **Body type variants**: Slim, athletic, plus-size models
- **Animation**: Rotate model, zoom controls
- **AR Integration**: Try-on using device camera
- **Measurement mapping**: Use user measurements for better fit

## Key Files

- `components/VirtualTryOnAvatar.tsx` - Main rendering component
- `components/VirtualTryOnModal.tsx` - User interface wrapper
- `services/virtualTryOn.ts` - Core positioning/mapping engine
- `app/(tabs)/ai-stylist.tsx` - Integration point
- `app/(tabs)/profile.tsx` - Gender preference settings

## Database Tables

- `user_profiles` - Stores user gender preference
- `avatar_templates` - Zone mappings for each gender/body type
- `outfit_visualizations` - Cached visualization data

---

This system creates a highly realistic virtual try-on experience by intelligently compositing actual wardrobe photos onto professional 3D mannequin models with accurate proportions, layering, and visual effects.
