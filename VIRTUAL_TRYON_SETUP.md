# Virtual Try-On Model Base Setup

This guide explains how to configure custom 3D mannequin/dummy model images for the Virtual Try-On feature.

## Quick Start

The Virtual Try-On system uses realistic 3D mannequin models as the base for clothing visualization. You have two options:

### Option 1: Use Local Images (Recommended)

1. **Save your model images** to the project:
   ```
   assets/avatar-models/male-front.png
   assets/avatar-models/female-front.png
   assets/avatar-models/neutral-front.png
   ```

2. **Update the image paths** in `components/VirtualTryOnAvatar.tsx`:
   ```typescript
   const MALE_MODEL_BASE = require('@/assets/avatar-models/male-front.png');
   const FEMALE_MODEL_BASE = require('@/assets/avatar-models/female-front.png');
   const NEUTRAL_MODEL_BASE = require('@/assets/avatar-models/neutral-front.png');
   ```

### Option 2: Use Hosted Images

If your model images are hosted online, simply update the URLs in `components/VirtualTryOnAvatar.tsx`:

```typescript
const MALE_MODEL_BASE = 'https://your-cdn.com/male-model.png';
const FEMALE_MODEL_BASE = 'https://your-cdn.com/female-model.png';
const NEUTRAL_MODEL_BASE = 'https://your-cdn.com/neutral-model.png';
```

## Model Image Requirements

For best results, your 3D mannequin images should:

- **Format**: PNG with transparent background preferred
- **Dimensions**: 600x900px or similar aspect ratio (2:3)
- **Pose**: Standing straight, arms slightly away from body
- **View**: Front-facing view
- **Background**: Dark (#1a1a1a) or transparent
- **Quality**: High resolution for crisp rendering

## How the System Works

1. **Base Model Display**: The mannequin image is rendered as the foundation
2. **Clothing Overlay**: User's wardrobe items are intelligently positioned and scaled over the model
3. **Zone Mapping**: Each clothing category (shirt, pants, shoes) maps to specific body zones
4. **Layering**: Items stack in realistic order (shoes → pants → top → jacket)
5. **Effects**: Dynamic shadows, depth, and blending create a realistic appearance

## Customizing Body Zones

The clothing mapping zones are defined in the database `avatar_templates` table. To adjust positioning:

1. Access your Supabase dashboard
2. Navigate to `avatar_templates` table
3. Edit the `mapping_zones` JSON for each gender
4. Adjust the coordinates to match your specific model dimensions

Example zone structure:
```json
{
  "head": {"top": 50, "height": 120},
  "chest": {"top": 170, "height": 180, "width": 280},
  "waist": {"top": 350, "height": 120, "width": 260},
  "legs": {"top": 470, "height": 350, "width": 240},
  "feet": {"top": 820, "height": 80, "width": 180}
}
```

## Testing Your Setup

1. **Set your avatar gender** in Profile settings
2. **Generate an outfit** in the AI Stylist tab
3. **Click "Try On Virtually"**
4. **Verify** that:
   - The base model displays correctly
   - Clothing items align with body zones
   - Layering order is realistic
   - Shadows and depth appear natural

## Troubleshooting

**Model not displaying:**
- Check image path/URL is correct
- Verify image format is supported (PNG, JPG)
- Ensure network access if using remote URLs

**Clothing misaligned:**
- Adjust `mapping_zones` coordinates in database
- Modify positioning logic in `services/virtualTryOn.ts`

**Poor rendering quality:**
- Use higher resolution model images
- Ensure transparent or dark backgrounds
- Check image compression settings

## Advanced Customization

For multi-angle support (side views, rotations), you can:

1. Add additional model images for each angle
2. Update the `viewAngle` handling in `VirtualTryOnAvatar.tsx`
3. Create corresponding zone mappings for each angle
4. Implement angle-specific clothing transformations

---

For questions or issues, refer to the main project documentation.
