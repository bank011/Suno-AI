import { GoogleGenAI } from "@google/genai";

/**
 * Classifies Gemini API errors into exact standardized messages according to HTTP status / response.
 * - 401 = API Key ไม่ถูกต้อง
 * - 403 = API Key ไม่มีสิทธิ์ / API ถูกจำกัด
 * - 404 = Model ไม่พบ
 * - 429 = Quota หรือ Rate Limit
 * - network error = Network/CORS
 */
export const classifyGeminiError = (error: unknown): string => {
    if (!error) return "เกิดข้อผิดพลาดไม่ทราบสาเหตุ";

    const errObj = error as any;
    const status = errObj?.status || errObj?.code || errObj?.error?.code || errObj?.error?.status;
    const rawMessage = errObj?.message || errObj?.error?.message || String(error);
    const lowerMessage = rawMessage.toLowerCase();

    // 429 = Quota หรือ Rate Limit / Quota/Credit หมด
    if (
        status === 429 ||
        status === 'RESOURCE_EXHAUSTED' ||
        lowerMessage.includes('429') ||
        lowerMessage.includes('resource_exhausted') ||
        lowerMessage.includes('quota') ||
        lowerMessage.includes('rate limit') ||
        lowerMessage.includes('too many requests') ||
        lowerMessage.includes('prepayment') ||
        lowerMessage.includes('credits are depleted') ||
        lowerMessage.includes('depleted')
    ) {
        return "Quota/Credit หมด";
    }

    // 401 = API Key ไม่ถูกต้อง
    if (
        status === 401 ||
        status === 'UNAUTHENTICATED' ||
        lowerMessage.includes('401') ||
        lowerMessage.includes('unauthenticated') ||
        lowerMessage.includes('api key not valid') ||
        lowerMessage.includes('invalid api key')
    ) {
        return "API Key ไม่ถูกต้อง";
    }

    // 403 = API Key ไม่มีสิทธิ์ / API ถูกจำกัด
    if (
        status === 403 ||
        status === 'PERMISSION_DENIED' ||
        lowerMessage.includes('403') ||
        lowerMessage.includes('permission_denied') ||
        lowerMessage.includes('permission denied') ||
        lowerMessage.includes('access denied') ||
        lowerMessage.includes('restricted')
    ) {
        return "API Key ไม่มีสิทธิ์ / API ถูกจำกัด";
    }

    // 404 = Model ไม่พบ
    if (
        status === 404 ||
        status === 'NOT_FOUND' ||
        lowerMessage.includes('404') ||
        lowerMessage.includes('not_found') ||
        lowerMessage.includes('model not found')
    ) {
        return "Model ไม่พบ";
    }

    // network error = Network/CORS
    if (
        error instanceof TypeError ||
        lowerMessage.includes('network') ||
        lowerMessage.includes('cors') ||
        lowerMessage.includes('failed to fetch') ||
        lowerMessage.includes('fetch failed') ||
        lowerMessage.includes('type error')
    ) {
        return "Network/CORS";
    }

    if (error instanceof Error && error.message) {
        return error.message;
    }

    return "เกิดข้อผิดพลาดไม่ทราบสาเหตุ";
};

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
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
        });
        return { valid: true };
    } catch (error) {
        console.error("API Key verification failed:", error);
        const errorMessage = classifyGeminiError(error);
        return { valid: false, error: errorMessage };
    }
};