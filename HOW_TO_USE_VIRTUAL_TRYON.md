# How to Use Virtual Try-On with Your 3D Models

This guide walks you through integrating your 3D mannequin models into SmartFit's Virtual Try-On system.

## Step 1: Add Your Model Images

You have two beautiful 3D mannequin models (grayscale human figures). To use them:

1. **Save both images** to your computer
2. **Name them appropriately**:
   - First image (slight angle): `male-front.png`
   - Second image (front view): `neutral-front.png`
   - For female model, use a similar model and name it: `female-front.png`

3. **Place them in the project**:
   ```
   /assets/avatar-models/male-front.png
   /assets/avatar-models/female-front.png
   /assets/avatar-models/neutral-front.png
   ```

## Step 2: Update the Code

Open `/components/VirtualTryOnAvatar.tsx` and update lines 14-16:

**From:**
```typescript
const MALE_MODEL_BASE = 'https://images.pexels.com/photos/14653174/pexels-photo-14653174.png';
const FEMALE_MODEL_BASE = 'https://images.pexels.com/photos/14653175/pexels-photo-14653175.png';
const NEUTRAL_MODEL_BASE = 'https://images.pexels.com/photos/14653174/pexels-photo-14653174.png';
```

**To:**
```typescript
const MALE_MODEL_BASE = require('@/assets/avatar-models/male-front.png');
const FEMALE_MODEL_BASE = require('@/assets/avatar-models/female-front.png');
const NEUTRAL_MODEL_BASE = require('@/assets/avatar-models/neutral-front.png');
```

## Step 3: Set User Preferences

1. Open the **Profile** tab in the app
2. Tap **Edit**
3. Select your **Avatar Gender** (Male, Female, or Neutral)
4. Tap **Save Changes**

## Step 4: Try It Out!

1. Go to **AI Stylist** tab
2. Generate an outfit recommendation
3. Tap the **"Try On Virtually"** button
4. Watch as your clothing items are realistically placed on the 3D model!

## How It Works

The Virtual Try-On system:

1. **Loads the base model** - Your 3D mannequin appears as the foundation
2. **Analyzes clothing items** - Each item in the outfit is categorized (shirt, pants, shoes, etc.)
3. **Maps to body zones** - Items are positioned on correct body parts (chest, legs, feet)
4. **Applies layering** - Clothing stacks realistically (shoes → pants → top → jacket)
5. **Adds realistic effects**:
   - Dynamic shadows based on layer depth
   - Depth gradients for 3D appearance
   - Proper scaling and proportions
   - Fabric-specific adjustments

## Customization Options

### Adjust Clothing Position

If clothing items don't align perfectly with your models, you can adjust the zone mappings:

1. Access your Supabase dashboard
2. Open the `avatar_templates` table
3. Edit the `mapping_zones` JSON column
4. Adjust the coordinates to match your model's proportions

### Change Background Color

In `/components/VirtualTryOnAvatar.tsx`, line 174:
```typescript
backgroundColor: '#1a1a1a',  // Change this to your preferred color
```

Dark backgrounds (#000000, #1a1a1a, #2a2a2a) work best for visibility.

### Add More Model Angles

To support side views or rotations:

1. Add more model images for each angle
2. Update the `viewAngle` switch statement in `getModelBaseUrl()`
3. Implement angle-specific clothing transformations

## Expected Results

With your 3D mannequin models integrated, users will see:

- **Realistic base model** - Your grayscale 3D human figure
- **Clothing overlay** - Their wardrobe items positioned naturally on the model
- **Proper proportions** - Items scaled to fit the body correctly
- **Layered appearance** - Multiple clothing items stacked in logical order
- **3D depth effects** - Shadows and gradients create realistic appearance
- **Faceless privacy** - The model's neutral face protects user privacy

## Tips for Best Results

1. **Use high-quality models** - Higher resolution = better detail
2. **Consistent pose** - All gender models should have similar standing poses
3. **Dark background** - Black or very dark gray provides best contrast
4. **Transparent PNG** - If possible, use transparent backgrounds
5. **Standard proportions** - Models should have realistic human proportions
6. **Front-facing view** - Models should face the camera directly

## Troubleshooting

**Model not showing:**
- Verify image files are in the correct folder
- Check file names match exactly (case-sensitive)
- Ensure images are PNG format
- Try rebuilding the app

**Clothing misaligned:**
- Adjust `mapping_zones` in database
- Check model aspect ratio (should be ~2:3 or similar)
- Verify model is standing straight, not angled

**Poor quality rendering:**
- Use higher resolution model images (900px height minimum)
- Ensure dark or transparent background
- Check image compression settings

---

Your 3D mannequin models are perfect for this system! They have realistic proportions, neutral poses, and professional quality that will make the Virtual Try-On experience impressive and engaging for users.
