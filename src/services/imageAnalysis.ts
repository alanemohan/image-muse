import { supabase } from '@/integrations/supabase/client';
import { AIAnalysisResult } from '@/types/gallery';

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isRetryable?: boolean
  ) {
    super(message);
    this.name = 'APIError';
  }
}

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getRetryDelay = (attempt: number): number => {
  return INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
};

const isRetryableError = (statusCode?: number, message?: string): boolean => {
  if (!statusCode) return false;
  // Retry on 429 (rate limit), 503 (service unavailable), 502 (bad gateway), 504 (gateway timeout)
  if ([429, 502, 503, 504].includes(statusCode)) return true;
  // Retry on timeout-like errors
  if (message?.includes('timeout') || message?.includes('ETIMEDOUT')) return true;
  return false;
};

export const analyzeImage = async (imageBase64: string, attempt = 1): Promise<AIAnalysisResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-image', {
      body: { imageBase64, type: 'analyze' }
    });

    if (error) {
      console.error(`Attempt ${attempt}/${MAX_RETRIES} - Error analyzing image:`, error);
      
      const apiError = new APIError(
        error.message || 'Failed to analyze image',
        error.status,
        isRetryableError(error.status, error.message)
      );

      if (apiError.isRetryable && attempt < MAX_RETRIES) {
        const delay = getRetryDelay(attempt);
        console.log(`Retrying in ${delay}ms...`);
        await sleep(delay);
        return analyzeImage(imageBase64, attempt + 1);
      }

      throw apiError;
    }

    if (data.error) {
      const apiError = new APIError(
        data.error,
        undefined,
        isRetryableError(undefined, data.error)
      );

      if (apiError.isRetryable && attempt < MAX_RETRIES) {
        const delay = getRetryDelay(attempt);
        console.log(`Retrying in ${delay}ms...`);
        await sleep(delay);
        return analyzeImage(imageBase64, attempt + 1);
      }

      throw apiError;
    }

    return data as AIAnalysisResult;
  } catch (err) {
    if (err instanceof APIError) throw err;
    
    const message = err instanceof Error ? err.message : 'Unknown error';
    const apiError = new APIError(message, undefined, isRetryableError(undefined, message));

    if (apiError.isRetryable && attempt < MAX_RETRIES) {
      const delay = getRetryDelay(attempt);
      console.log(`Retrying in ${delay}ms...`);
      await sleep(delay);
      return analyzeImage(imageBase64, attempt + 1);
    }

    throw apiError;
  }
};

export const regenerateCaption = async (imageBase64: string, attempt = 1): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-image', {
      body: { imageBase64, type: 'regenerate_caption' }
    });

    if (error) {
      console.error(`Attempt ${attempt}/${MAX_RETRIES} - Error regenerating caption:`, error);
      
      const apiError = new APIError(
        error.message || 'Failed to regenerate caption',
        error.status,
        isRetryableError(error.status, error.message)
      );

      if (apiError.isRetryable && attempt < MAX_RETRIES) {
        const delay = getRetryDelay(attempt);
        console.log(`Retrying in ${delay}ms...`);
        await sleep(delay);
        return regenerateCaption(imageBase64, attempt + 1);
      }

      throw apiError;
    }

    if (data.error) {
      const apiError = new APIError(
        data.error,
        undefined,
        isRetryableError(undefined, data.error)
      );

      if (apiError.isRetryable && attempt < MAX_RETRIES) {
        const delay = getRetryDelay(attempt);
        console.log(`Retrying in ${delay}ms...`);
        await sleep(delay);
        return regenerateCaption(imageBase64, attempt + 1);
      }

      throw apiError;
    }

    return data.caption;
  } catch (err) {
    if (err instanceof APIError) throw err;
    
    const message = err instanceof Error ? err.message : 'Unknown error';
    const apiError = new APIError(message, undefined, isRetryableError(undefined, message));

    if (apiError.isRetryable && attempt < MAX_RETRIES) {
      const delay = getRetryDelay(attempt);
      console.log(`Retrying in ${delay}ms...`);
      await sleep(delay);
      return regenerateCaption(imageBase64, attempt + 1);
    }

    throw apiError;
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const urlToBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
