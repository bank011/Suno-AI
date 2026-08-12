import { GoogleGenAI } from "@google/genai";

/**
 * Verifies a Gemini API key by making a lightweight, non-billed request.
 * @param apiKey The user-provided API key string.
 * @returns An object indicating if the key is valid, with an optional error message.
 */
export const verifyApiKey = async (apiKey: string): Promise<{ valid: boolean; error?: string }> => {
    if (!apiKey || !apiKey.trim()) {
        return { valid: false, error: "API Key cannot be empty." };
    }
    
    const sanitizedKey = apiKey.trim();

    // Basic validation: API keys must be ASCII characters only. 
    // If it contains non-ASCII (like Thai characters or invisible control chars), headers will fail.
    // eslint-disable-next-line no-control-regex
    if (/[^\x00-\x7F]/.test(sanitizedKey)) {
         return { valid: false, error: "API Key contains invalid characters (non-ASCII). Please check your input." };
    }

    try {
        const ai = new GoogleGenAI({ apiKey: sanitizedKey });
        // Use a lightweight generateContent call to a fast, active model for verification.
        await ai.models.generateContent({
            model: 'gemini-3.5-flash-lite',
            contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
        });
        return { valid: true };
    } catch (error) {
        console.error("API Key verification failed:", error);
        let errorMessage = "An unknown error occurred during verification.";
        
        const errObj = error as any;
        const status = errObj?.status || errObj?.code || errObj?.error?.code || errObj?.error?.status;
        const lowerMessage = (errObj?.message || errObj?.error?.message || String(error)).toLowerCase();

        if (status === 401 || status === 'UNAUTHENTICATED' || lowerMessage.includes('401') || lowerMessage.includes('api key not valid') || lowerMessage.includes('invalid api key') || lowerMessage.includes('unauthenticated')) {
            errorMessage = "The provided API Key is invalid or unauthorized (401). Please check your key.";
        } else if (status === 403 || status === 'PERMISSION_DENIED' || lowerMessage.includes('403') || lowerMessage.includes('permission') || lowerMessage.includes('project')) {
            errorMessage = "Access denied (403 Forbidden). Your API key or Google Cloud project lacks permissions or Gemini API access.";
        } else if (status === 404 || status === 'NOT_FOUND' || lowerMessage.includes('404') || lowerMessage.includes('not found')) {
            errorMessage = "Requested model or resource not found (404 Not Found).";
        } else if (status === 429 || status === 'RESOURCE_EXHAUSTED' || lowerMessage.includes('429') || lowerMessage.includes('quota') || lowerMessage.includes('resource_exhausted')) {
            errorMessage = "API Rate limit or quota exceeded (429 Too Many Requests). Please try again later.";
        } else if (lowerMessage.includes('iso-8859-1') || lowerMessage.includes('headers') || lowerMessage.includes('append')) {
            errorMessage = "API Key contains invalid characters. Please ensure you copied it correctly.";
        } else if (error instanceof TypeError || lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('type error')) {
            errorMessage = "Network error: Unable to connect to Gemini API. Please check your internet connection or firewall.";
        } else if (error instanceof Error) {
            errorMessage = `Verification failed: ${error.message}`;
        }
        return { valid: false, error: errorMessage };
    }
};