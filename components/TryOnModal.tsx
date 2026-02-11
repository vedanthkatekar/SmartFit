import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Toast } from '@/components/Toast';
import { TryOnPhotoUpload } from '@/components/TryOnPhotoUpload';
import { TryOnProcessing } from '@/components/TryOnProcessing';
import { TryOnResultView } from '@/components/TryOnResult';
import {
  runTryOnPipeline,
  saveTryOnAsFavorite,
  ProcessingProgress,
  TryOnResult,
} from '@/services/tryOnPipeline';
import type { ClothingItem } from '@/services/outfitAI';

type FlowStep = 'upload' | 'processing' | 'result' | 'error';

interface TryOnModalProps {
  visible: boolean;
  onClose: () => void;
  items: ClothingItem[];
  outfitName: string;
  occasion: string;
  onRegenerateOutfit: () => void;
}

export function TryOnModal({
  visible,
  onClose,
  items,
  outfitName,
  occasion,
  onRegenerateOutfit,
}: TryOnModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<FlowStep>('upload');
  const [progress, setProgress] = useState<ProcessingProgress>({
    stage: 'idle',
    percent: 0,
    message: '',
  });
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const notify = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
  }, []);

  const resetFlow = useCallback(() => {
    setStep('upload');
    setProgress({ stage: 'idle', percent: 0, message: '' });
    setResult(null);
    setSaved(false);
    setErrorMessage('');
  }, []);

  const handleClose = useCallback(() => {
    resetFlow();
    onClose();
  }, [onClose, resetFlow]);

  const handlePhotoSelected = useCallback(
    async (photo: { uri: string; width: number; height: number }, garment: ClothingItem) => {
      if (!user?.id) {
        notify('Please sign in to use virtual try-on');
        return;
      }

      setStep('processing');

      const pipelineResult = await runTryOnPipeline(
        user.id,
        photo.uri,
        garment,
        items,
        outfitName,
        occasion,
        (p) => setProgress(p)
      );

      if (pipelineResult) {
        setResult(pipelineResult);
        setStep('result');
      } else {
        setErrorMessage('Processing failed. Please try a different photo.');
        setStep('error');
      }
    },
    [user, items, outfitName, occasion, notify]
  );

  const handleSave = useCallback(async () => {
    if (!result) return;
    setSaving(true);
    const success = await saveTryOnAsFavorite(result.id);
    setSaving(false);
    if (success) {
      setSaved(true);
      notify('Look saved to your collection!');
    } else {
      notify('Could not save. Please try again.');
    }
  }, [result, notify]);

  const handleRetryUpload = useCallback(() => {
    setResult(null);
    setSaved(false);
    setStep('upload');
  }, []);

  const handleRegenerateOutfit = useCallback(() => {
    handleClose();
    onRegenerateOutfit();
  }, [handleClose, onRegenerateOutfit]);

  const renderStepTitle = () => {
    switch (step) {
      case 'upload':
        return 'Virtual Try-On';
      case 'processing':
        return 'AI Processing';
      case 'result':
        return 'Your Look';
      case 'error':
        return 'Try Again';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.container}>
        <LinearGradient
          colors={['#1e3a5f', '#0f2942']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>{renderStepTitle()}</Text>
              <Text style={styles.headerSubtitle}>{outfitName}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {step === 'upload' && (
            <TryOnPhotoUpload
              items={items}
              onPhotoSelected={handlePhotoSelected}
              onCancel={handleClose}
            />
          )}

          {step === 'processing' && <TryOnProcessing progress={progress} />}

          {step === 'result' && result && (
            <TryOnResultView
              result={result}
              onSave={handleSave}
              onRetryUpload={handleRetryUpload}
              onRegenerateOutfit={handleRegenerateOutfit}
              onClose={handleClose}
              saving={saving}
              saved={saved}
            />
          )}

          {step === 'error' && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>!</Text>
              <Text style={styles.errorTitle}>Processing Error</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <View style={styles.errorActions}>
                <TouchableOpacity style={styles.errorRetry} onPress={handleRetryUpload}>
                  <Text style={styles.errorRetryText}>Try Different Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.errorCancel} onPress={handleClose}>
                  <Text style={styles.errorCancelText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <Toast
          visible={showToast}
          message={toastMessage}
          onHide={() => setShowToast(false)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 52,
    paddingBottom: 18,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorIcon: {
    fontSize: 48,
    fontWeight: '800',
    color: '#ef4444',
    width: 80,
    height: 80,
    lineHeight: 80,
    textAlign: 'center',
    borderRadius: 40,
    backgroundColor: '#fef2f2',
    overflow: 'hidden',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  errorActions: {
    width: '100%',
    gap: 12,
  },
  errorRetry: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#1e3a5f',
    alignItems: 'center',
  },
  errorRetryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  errorCancel: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  errorCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
});
