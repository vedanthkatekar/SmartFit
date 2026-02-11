# SmartFit - AI-Powered Digital Wardrobe & Outfit Planner

A modern React Native mobile application that revolutionizes how you manage your wardrobe and plan outfits using AI-powered recommendations and virtual try-on technology.

## Overview

SmartFit is an intelligent fashion companion that helps users organize their wardrobe, discover new outfit combinations, and make confident styling decisions. With advanced AI algorithms and virtual try-on capabilities, SmartFit takes the guesswork out of getting dressed.

## Key Features

### Digital Wardrobe Management
- Photograph and catalog your entire wardrobe
- Organize items by category, color, season, and brand
- Track wear frequency and last worn dates
- Tag items with custom labels for easy filtering
- Mark favorites for quick access

### AI-Powered Outfit Recommendations
- Receive personalized daily outfit suggestions
- Smart matching based on weather, occasion, and personal style
- Color harmony and fabric compatibility scoring
- Style coherence analysis with confidence ratings
- Avoid outfit repetition with intelligent rotation

### Virtual Try-On System
- Visualize complete outfits on customizable avatars
- Multiple body types and gender options
- See how clothes look together before wearing them
- Save and share outfit visualizations

### Smart Style Learning
- Personalized style preference profiles
- AI learns from your feedback and choices
- Mood-based outfit suggestions
- Budget and sustainability preferences
- Comfort and formality settings

### Weekly Outfit Planning
- Plan outfits for the entire week
- Ensure variety and rotation
- Adjust based on weather forecasts
- Confirm or swap planned outfits

### Outfit Analytics & History
- Track outfit performance and ratings
- View wear history and patterns
- Discover underutilized items
- Optimize wardrobe usage

## Technology Stack

- **Frontend**: React Native 0.81.4, React 19.1.0
- **Framework**: Expo SDK 54 with expo-router
- **Navigation**: Expo Router with tab-based layout
- **Backend**: Supabase (PostgreSQL database)
- **Authentication**: Supabase Auth (email/password)
- **Styling**: StyleSheet API with Linear Gradients
- **Icons**: Lucide React Native
- **Camera**: Expo Camera for wardrobe photography
- **Animations**: React Native Reanimated

## Database Architecture

The app uses a comprehensive Supabase PostgreSQL database with:
- Row Level Security (RLS) enabled on all tables
- Optimized indexes for performance
- Foreign key relationships for data integrity
- AI scoring tables for recommendation engine
- Secure user data isolation

### Core Tables
- `profiles` - User account information
- `clothing_items` - Individual wardrobe items
- `outfits` - Saved outfit combinations
- `outfit_recommendations` - AI-generated suggestions
- `user_style_preferences` - Personal style settings
- `weekly_outfit_plans` - Scheduled outfits
- `outfit_history` - Wear tracking
- `outfit_visualizations` - Virtual try-on data
- `avatar_templates` - 3D model configurations

## Security Features

- Row Level Security (RLS) policies on all tables
- Optimized auth queries for scalability
- Secure user data isolation
- Foreign key constraints
- Performance-optimized indexes

## Getting Started

### Prerequisites
- Node.js 16+ installed
- Expo CLI installed globally
- iOS Simulator or Android Emulator (or physical device)
- Supabase account with project configured

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Scan the QR code with Expo Go app (iOS/Android) or press `w` for web

## Project Structure

```
app/
├── (auth)/          # Authentication screens
│   ├── sign-in.tsx
│   └── sign-up.tsx
├── (tabs)/          # Main app tabs
│   ├── index.tsx         # Home/Dashboard
│   ├── wardrobe.tsx      # Wardrobe management
│   ├── outfits.tsx       # Outfit collections
│   ├── ai-stylist.tsx    # AI recommendations
│   └── profile.tsx       # User profile
├── _layout.tsx      # Root layout
└── +not-found.tsx   # 404 page

components/          # Reusable components
├── VirtualTryOnModal.tsx
├── VirtualTryOnAvatar.tsx
├── StylePreferences.tsx
└── ScanningAnimation.tsx

contexts/           # React contexts
└── AuthContext.tsx

services/           # Business logic
├── virtualTryOn.ts
└── outfitAI.ts

supabase/          # Database migrations
└── migrations/
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build:web` - Build for web deployment
- `npm run lint` - Run linter
- `npm run typecheck` - Run TypeScript type checking

## Platform Support

- iOS (iPhone & iPad)
- Android (Phone & Tablet)
- Web (Progressive Web App)

## License

Private - All rights reserved

## Public Demo

[View Live Demo](YOUR_PUBLIC_URL_HERE)

---

Built with Expo and Supabase
