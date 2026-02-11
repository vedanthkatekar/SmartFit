# 3D Model Integration Guide - Virtual Try-On System

## What's New

The Virtual Try-On system now features an **actual visible 3D mannequin model** that displays as the base, with your clothing items realistically overlaid on top.

## How It Works Now

### 1. **Visible 3D Mannequin Base**
Instead of just showing clothing on a black background, you now see:
- A realistic gray/white 3D mannequin figure (similar to professional fashion models)
- Anatomically accurate proportions with head, shoulders, torso, arms, waist, hips, legs, and feet
- Gender-specific body shapes (male, female, neutral)
- Professional gradient shading for 3D depth effect

### 2. **Clothing Overlay System**
Your uploaded wardrobe items are intelligently placed:
- **Shirts/Tops** → Positioned on the chest/torso area
- **Pants/Jeans** → Positioned on the legs area
- **Shoes** → Positioned on the feet area
- **Jackets** → Layered over tops with wider sizing
- **Full-length items** (dresses, coats) → Span from chest to legs

### 3. **Realistic Visual Effects**
- **Layering**: Shoes → Pants → Shirt → Jacket (correct stacking order)
- **Shadows**: Deeper shadows for outer garments
- **Centering**: All items automatically centered on the model
- **Proportional sizing**: Items scale appropriately to body zones
- **Opacity blending**: Slight transparency allows the mannequin to show through naturally

## What You'll See

When you click "Try On Virtually":

1. **A 3D Mannequin appears** - Gray gradient figure with realistic proportions
2. **Loading animation** - Brief moment while clothing images load
3. **Clothing appears on the model** - Items position themselves on correct body parts
4. **Layered outfit display** - Multiple items stack in proper order
5. **Show/Hide Model toggle** - Can adjust mannequin visibility

## Technical Implementation

### 3D Mannequin (SVG-based)
- Built using React Native SVG for guaranteed display
- Gender-specific proportions:
  - **Male**: Broader shoulders (110px), narrower hips (90px)
  - **Female**: Narrower shoulders (90px), wider hips (95px)
  - **Neutral**: Balanced proportions (100px shoulders, 92px hips)
- Professional gradient fills simulate 3D lighting

### Body Zone Mapping
Clothing is mapped to these zones (based on 600px height):

```
Head:      48px from top
Chest:     102px - 210px (shirts, tops, jackets)
Waist:     210px - 288px (hip area)
Legs:      288px - 552px (pants, skirts, shorts)
Feet:      552px - 600px (shoes, boots)
```

### Intelligent Positioning Algorithm

**Shirts/Tops**: 1.3x zone width, centered on torso
**Pants**: 1.15x zone width, full leg length
**Jackets**: 1.4x zone width (wider to overlay tops), 1.2x height
**Shoes**: 1.3x zone width, positioned at feet
**Dresses**: Spans chest to 80% of legs

## Usage Instructions

### Step 1: Set Your Avatar Gender
1. Go to **Profile** tab
2. Tap **Edit**
3. Select **Avatar Gender** (Male, Female, or Neutral)
4. Save changes

### Step 2: Generate an Outfit
1. Go to **AI Stylist** tab
2. Select style preferences
3. Tap **Generate Outfit**

### Step 3: Virtual Try-On
1. Tap the **"Try On Virtually"** button
2. Wait for the 3D model to load
3. View your outfit on the mannequin
4. Use **"Show Base Model"** toggle to adjust mannequin visibility
5. Swipe through different view angles (if available)

## Customization Options

### Adjust Mannequin Proportions
Edit `/components/VirtualTryOnAvatar.tsx` lines 54-57:
```typescript
const shoulderWidth = isMale ? 110 : isFemale ? 90 : 100;
const torsoWidth = isMale ? 95 : isFemale ? 80 : 88;
const hipWidth = isMale ? 90 : isFemale ? 95 : 92;
const legWidth = isMale ? 45 : isFemale ? 42 : 44;
```

### Adjust Clothing Sizing
Edit `/services/virtualTryOn.ts` in the `calculateItemPosition()` function.

Example - make shirts wider:
```typescript
if (category.includes('shirt')) {
  position.width = (zone.width || 100) * 1.5; // Change from 1.3 to 1.5
}
```

### Change Mannequin Color
Edit the SVG gradients in `/components/VirtualTryOnAvatar.tsx`:
```typescript
<Stop offset="50%" stopColor="#d4d4d4" /> // Light gray
// Change to any hex color
```

### Adjust Background Color
Edit line 280 in `/components/VirtualTryOnAvatar.tsx`:
```typescript
backgroundColor: '#0f0f0f', // Very dark gray
```

## Troubleshooting

### "I only see clothes, no mannequin"
- Check that `showSkeleton` prop is `true` in VirtualTryOnModal
- Verify the mannequin opacity isn't set too low
- Ensure SVG is rendering (check for React Native SVG installation)

### "Clothes don't align with the body"
- Check zone mappings in Supabase `avatar_templates` table
- Adjust positioning multipliers in `calculateItemPosition()`
- Verify clothing category names match expected values

### "Clothes are too small/large"
- Adjust the width/height multipliers in `calculateItemPosition()`
- Update zone widths in database
- Check that images have transparent/removed backgrounds

### "Layering is wrong (jacket under shirt)"
- Verify category names in your wardrobe items
- Check `layerPriority` mapping in `virtualTryOn.ts`
- Ensure proper z-index assignment

## Advanced Features

### Adding Custom Body Types
1. Add new avatar template in database with body_type (e.g., 'athletic', 'plus-size')
2. Update zone mappings for the new body type
3. Add body type selection in Profile settings

### Multi-Angle Support
To add side/back views:
1. Create additional SVG mannequin views
2. Add angle selector in VirtualTryOnModal
3. Update clothing positioning for each angle
4. Implement angle-based transformations

### Upload Your Own 3D Model Image
If you have professional 3D model renders:
1. Save images to `/assets/avatar-models/`
2. Replace SVG mannequin with Image component
3. Load your custom model images:
```typescript
const MALE_MODEL = require('@/assets/avatar-models/male-front.png');
```

## Performance Notes

- SVG rendering is lightweight and fast
- Clothing images are cached after first load
- Visualizations are saved to database to avoid recalculation
- Complex outfits (5+ items) may take 1-2 seconds to fully render

## Next Steps

Now that you have a working 3D mannequin system:
1. Test with various clothing combinations
2. Adjust sizing/positioning as needed for your wardrobe photos
3. Consider implementing background removal AI for cleaner clothing images
4. Explore adding animation (rotation, zoom)
5. Add AR camera integration for real-world try-on

---

**The mannequin model is now fully functional and will display whenever you use the Virtual Try-On feature!**
