const PRODUCTION_API_URL = 'https://aura-studio-backend.onrender.com';

export type StylePreset = "corporate" | "editorial" | "dating";

export interface GenerationResult {
  success: boolean;
  resultUrl?: string;
  error?: string;
}

export const generateHeadshot = async (
  imageUri: string,
  stylePreset: StylePreset
): Promise<GenerationResult> => {
  try {
    console.log('Sending generation request to backend...');

    const response = await fetch(`${PRODUCTION_API_URL}/api/generate-headshot-v2`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ imageUri, stylePreset }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Server error response:', data);
      throw new Error(data.error || `Server responded with status ${response.status}`);
    }

    return { success: true, resultUrl: data.resultUrl };
  } catch (error: any) {
    console.error('Fetch error:', error);
    return { 
      success: false, 
      error: error.message || 'Unable to connect to backend server. Please check connection.' 
    };
  }
};