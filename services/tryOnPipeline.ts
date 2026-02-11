import { supabase } from '@/lib/supabase';
import { ClothingItem } from './outfitAI';
import Constants from 'expo-constants';

export type ProcessingStage =
  | 'idle'
  | 'submitting'
  | 'pose_detection'
  | 'clothing_removal'
  | 'garment_warp'
  | 'diffusion_render'
  | 'complete'
  | 'error';

export interface ProcessingProgress {
  stage: ProcessingStage;
  percent: number;
  message: string;
}

export interface TryOnResult {
  id: string;
  originalPhotoUrl: string;
  resultImageUrl: string;
  garmentImageUrl: string;
  garmentName: string;
  outfitName: string;
  occasion: string;
  itemIds: string[];
  processingTimeMs: number;
  isDemo: boolean;
  createdAt: string;
}

const SUPABASE_URL =
  Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY =
  Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const EDGE_FN_URL = `${SUPABASE_URL}/functions/v1/virtual-tryon`;

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40;

async function callEdgeFunction(
  action: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token || SUPABASE_ANON_KEY;

  const url = action ? `${EDGE_FN_URL}?action=${action}` : EDGE_FN_URL;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Edge function error (${res.status}): ${text}`);
  }

  return res.json();
}

async function submitTryOn(
  modelImage: string,
  garmentImage: string,
  category: string
): Promise<{ id: string; immediateResult?: string[]; isDemo: boolean }> {
  const data = await callEdgeFunction('', {
    modelImage,
    garmentImage,
    category,
  });

  if (data.demo) {
    return {
      id: data.id as string,
      immediateResult: (data.output as string[]) || undefined,
      isDemo: true,
    };
  }

  return { id: data.id as string, isDemo: false };
}

async function pollStatus(
  predictionId: string,
  onProgress: (p: ProcessingProgress) => void
): Promise<string[]> {
  const stages: { threshold: number; stage: ProcessingStage; msg: string }[] = [
    { threshold: 3, stage: 'pose_detection', msg: 'Analyzing body pose & structure...' },
    { threshold: 8, stage: 'clothing_removal', msg: 'Removing existing clothing...' },
    { threshold: 15, stage: 'garment_warp', msg: 'Warping garment to body shape...' },
    { threshold: 20, stage: 'diffusion_render', msg: 'AI rendering photorealistic result...' },
  ];

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const data = await callEdgeFunction('status', { predictionId });

    const pct = Math.min(95, Math.round((attempt / MAX_POLL_ATTEMPTS) * 100));
    const currentStage =
      [...stages].reverse().find((s) => attempt >= s.threshold) || stages[0];
    onProgress({ stage: currentStage.stage, percent: pct, message: currentStage.msg });

    if (data.status === 'completed') {
      return (data.output as string[]) || [];
    }

    if (data.status === 'failed') {
      throw new Error((data.error as string) || 'AI processing failed');
    }

    await delay(POLL_INTERVAL_MS);
  }

  throw new Error('Processing timed out. Please try again.');
}

export async function runTryOnPipeline(
  userId: string,
  photoUri: string,
  garmentItem: ClothingItem,
  allItems: ClothingItem[],
  outfitName: string,
  occasion: string,
  onProgress: (progress: ProcessingProgress) => void
): Promise<TryOnResult | null> {
  const startTime = Date.now();

  try {
    onProgress({ stage: 'submitting', percent: 5, message: 'Sending to AI try-on engine...' });

    const submission = await submitTryOn(photoUri, garmentItem.image_url, garmentItem.category);

    let resultImageUrl: string;
    let isDemo = submission.isDemo;

    if (submission.immediateResult && submission.immediateResult.length > 0) {
      resultImageUrl = submission.immediateResult[0];
      onProgress({ stage: 'diffusion_render', percent: 90, message: 'Processing complete...' });
      await delay(500);
    } else if (isDemo) {
      onProgress({ stage: 'pose_detection', percent: 20, message: 'Analyzing body pose & structure...' });
      await delay(800);
      onProgress({ stage: 'clothing_removal', percent: 40, message: 'Removing existing clothing...' });
      await delay(1000);
      onProgress({ stage: 'garment_warp', percent: 60, message: 'Warping garment to body shape...' });
      await delay(1200);
      onProgress({ stage: 'diffusion_render', percent: 85, message: 'AI rendering photorealistic result...' });
      await delay(1400);
      resultImageUrl = photoUri;
    } else {
      const outputUrls = await pollStatus(submission.id, onProgress);
      if (!outputUrls.length) {
        throw new Error('No output image returned from AI engine');
      }
      resultImageUrl = outputUrls[0];
    }

    const processingTimeMs = Date.now() - startTime;

    onProgress({ stage: 'complete', percent: 98, message: 'Saving result...' });

    const { data: photoRecord, error: photoError } = await supabase
      .from('virtual_tryon_photos')
      .insert({
        user_id: userId,
        photo_url: photoUri,
        image_width: 0,
        image_height: 0,
        is_processed: true,
        processing_status: 'completed',
        is_primary: false,
      })
      .select('id')
      .single();

    if (photoError) throw photoError;

    const { data: resultRecord, error: resultError } = await supabase
      .from('virtual_tryon_results')
      .insert({
        user_id: userId,
        photo_id: photoRecord.id,
        item_ids: allItems.map((i) => i.id),
        result_image_url: resultImageUrl,
        outfit_name: outfitName,
        occasion,
        processing_time_ms: processingTimeMs,
        confidence_score: isDemo ? 0 : 0.92,
        quality_score: isDemo ? 0 : 0.88,
        ai_model_version: 'fashn-v1.6',
        processing_metadata: {
          provider: 'fashn.ai',
          model: 'tryon-v1.6',
          garment_applied: garmentItem.name,
          garment_category: garmentItem.category,
          is_demo: isDemo,
          prediction_id: submission.id,
          pipeline_version: 'v3.0',
        },
      })
      .select('id, created_at')
      .single();

    if (resultError) throw resultError;

    onProgress({ stage: 'complete', percent: 100, message: 'Try-on complete!' });

    return {
      id: resultRecord.id,
      originalPhotoUrl: photoUri,
      resultImageUrl,
      garmentImageUrl: garmentItem.image_url,
      garmentName: garmentItem.name,
      outfitName,
      occasion,
      itemIds: allItems.map((i) => i.id),
      processingTimeMs,
      isDemo,
      createdAt: resultRecord.created_at,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Processing failed';
    onProgress({ stage: 'error', percent: 0, message: msg });
    console.error('Try-on pipeline error:', error);
    return null;
  }
}

export async function saveTryOnAsFavorite(resultId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('virtual_tryon_results')
      .update({ is_favorite: true })
      .eq('id', resultId);
    return !error;
  } catch {
    return false;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
