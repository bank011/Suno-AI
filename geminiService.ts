
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { type Language, translations } from "./translations";
import { selectSmartVocabulary, type SmartVocabularyResult, CATEGORIZED_VOCABULARY } from "./vocabularyEngine";
import { classifyGeminiError } from "./apiKeyVerifier";

export { selectSmartVocabulary, CATEGORIZED_VOCABULARY };
export type { SmartVocabularyResult };

export const BANNED_LYRIC_WORDS = [
    '"ตีสอง" (2 AM)',
    '"ห้องเดิม" (Same room)',
    '"หน้าจอมือถือ" (Mobile screen)',
    '"สตอรี่" (Story/IG Story)',
    '"มูฟออน" (Move on)',
    '"แชท" (Chat)',
    '"บล็อกเบอร์" (Block number)',
    '"เพลย์ลิสต์" (Playlist)',
    '"แก้วกาแฟ" (Coffee cup)',
    '"ร้าน" (Shop/Cafe - unless specific context)',
    '"รูปคู่" (Couple photo)',
    '"รูปถ่าย" (Photograph)',
    '"แจ้งเตือน" (Notification)',
    '"อันฟอล" (Unfollow)',
    '"หน้าจอ" (Screen)',
    '"ห้องนี้" (This room)'
];

export const RECOMMENDED_LYRIC_WORDS = [
    // User Preferred Vocabulary (Background Suggestions)
    'เชื่อ', 'ให้ใจ', 'ทุ่มเท', 'หัวใจ', 'สุดท้าย', 'เสียใจ', 'เสียน้ำตา', 'เหงา', 'ความรัก', 'ใจร้าย',
    'ครั้งสุดท้าย', 'แสนดี', 'รักแท้', 'เฝ้า', 'อธิษฐาน', 'เทวดา', 'สมดัง', 'ปรารถนา', 'จงเข้ามา', 'สาธุ',
    'จุดธูป', 'เก้าดอก', 'สักการะ', 'ย่อมือ', 'สุดศอก', 'พ้นศีรษะ', 'ดอกไม้', 'มาลัยมาลา', 'ตั้งจิต', 'ภาวนา',
    'เพิ่น', 'ซ่อยที', 'พ้อ', 'ความฮัก', 'อีกจักหน', 'บ่ขอหยังหลาย', 'ข่อย', 'ผู้เดียว', 'สาธุเด้อ',
    'ท้องฟ้า', 'แสงดาว', 'ว่างเปล่า', 'ฟ้า', 'แสงนวล', 'จันทร์เจ้าเอย', 'ตะวัน', 'ลาลับไกล', 'จันทร์ดวงน้อย',
    'ล่องลอย', 'นภา', 'ส่องแสงเต็มฟ้า', 'เศร้าใจ', 'หวั่นไหว', 'เงียบเหงา', 'เงียบงัน', 'ขาดใจ', 'ไม่ไหว',
    'สวยงาม', 'งดงามเหมือนเคย', 'มองดู', 'พรากเจ้าไกล', 'ช่วยบอกฉันที', 'ภาวนา', 'ล่องลอยคืนมา', 'ลา', 'ไม่มีเธอ',
    // Newly added suggestions
    'ดงพงพี', 'ทิวาราตรี', 'เครื่องทรง', 'รอนแรม', 'พารา', 'เสี่ยงคู่', 'เลื่องลือโฉม', 'ธิดา', 'ร้อยหัวเมือง', 'ฟ้าลิขิต',
    'เสี่ยงมาลัย', 'คู่ครอง', 'แม่รจนา', 'เจ้าเงาะ', 'ย่างย้ำ', 'ก้าวข้าม', 'ทัดหู', 'ผิวคล้ำ', 'ผมหยิก', 'ซาไก',
    'ปากแดง', 'สุกในดง', 'น่าขัน', 'งามดั่งนางฟ้า', 'ปั้นแต่ง', 'สมใจ', 'ฝากชีวิต', 'ข้างนอกไม่สวย', 'ข้างในเป็นทอง',
    'เออเออเอิงเอย', 'ชะเออเอิงเอย', 'เอย', 'หาญ', 'แหลง', 'แค่ๆ', 'แล', 'ตะ', 'น้องเห้อ', 'ความรู้สึก', 'ดั่งหวัง',
    'แอบชอบ', 'แอบมอง', 'ล้นปรี่', 'โลกทั้งใบ', 'รู้สึกเหมือนกัน', 'เดินเข้ามา', 'ได้ยิน', 'เสียงหัวใจ', 'แนบที่ใจ',
    'สบตากัน', 'ให้โอกาส', 'สัญญา', 'คุณค่าทางใจ', 'เฝ้ามอง', 'เก็บเอาเธอไปฝัน', 'กอดตอนนอน', 'เชื่อใจ', 'คบกับฉัน',
    'กำลังใจ', 'เหนื่อยล้า', 'ตามหา', 'เหี่ยวเฉา', 'เห็นใจ', 'นั่งเศร้า', 'ขึ้นหิ้ง', 'พบเธอ', 'โทรหา', 'เข้าเรียน',
    'เวลา', 'รอนาน', 'วิ่งตามใคร', 'นักร้องโรงเรียน', 'เจ้าชู้', 'ลองดู', 'ยิ้ม', 'พูดคุย', 'เหตุผล', 'อ้าย', 'ขี้จุ๊',
    'ตั้ลลัลลา', 'หื้อ', 'อู้', 'บ่าได้ก๋า', 'Baby girl', 'first time', 'my girl', 'Show', 'Too Slow', 'you know',
    'beautiful', 'so cute', 'fall in you'
];

export class RateLimitError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'RateLimitError';
    }
}

export class AuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthError';
    }
}

export class PermissionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PermissionError';
    }
}

export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}

function getSongwritingSystemInstruction(
    language: Language, 
    smartVocab?: SmartVocabularyResult, 
    customVocabulary?: string
): string {
    const customVocabSection = customVocabulary && customVocabulary.trim() !== '' 
        ? `
    # USER-DEFINED VOCABULARY (PRIORITY INCLUSION):
    - The user has explicitly requested to use these words/phrases. Try to weave them naturally into the lyrics:
      - ${customVocabulary.split(',').map(w => w.trim()).join('\n      - ')}
    - **Context Matters:** Don't just force them in. Adapt inflections or line placement to fit rhyme and rhythm.`
        : '';

    let vocabSection = '';
    if (smartVocab) {
        const hasCore = smartVocab.core && smartVocab.core.length > 0;
        const hasSupp = smartVocab.supporting && smartVocab.supporting.length > 0;
        const hasOpt = smartVocab.optional && smartVocab.optional.length > 0;
        const hasAvoid = smartVocab.avoid && smartVocab.avoid.length > 0;

        vocabSection = `
    # SMART VOCABULARY SELECTION (TAILORED FOR THIS SPECIFIC SONG):
    ${hasCore ? `- **CORE VOCABULARY (PRIMARY THEMATIC FOCUS - INTEGRATE NATURALLY):**
      - ${smartVocab.core.join('\n      - ')}
      * Rule: Integrate at least some of these core words naturally into the lyrics. Prefix/suffix inflections and phrase shifts (e.g., "เชื่อ" -> "ความเชื่อ", "อธิษฐาน" -> "คำอธิษฐาน") are supported and encouraged for natural flow. Do NOT force them if they disrupt rhythm.` : ''}

    ${hasSupp ? `- **SUPPORTING VOCABULARY (USE WHEN CONTEXT FITS):**
      - ${smartVocab.supporting.join('\n      - ')}` : ''}

    ${hasOpt ? `- **OPTIONAL VOCABULARY (SECONDARY OPTIONS):**
      - ${smartVocab.optional.join('\n      - ')}` : ''}

    ${hasAvoid ? `- **AVOID VOCABULARY (CLASHES WITH THIS SONG'S STYLE/GENRE - DO NOT USE):**
      - ${smartVocab.avoid.join('\n      - ')}` : ''}`;
    } else {
        vocabSection = `
    # SUGGESTED VOCABULARY:
    - Try to incorporate these evocative words naturally if they fit the context:
      - ${RECOMMENDED_LYRIC_WORDS.slice(0, 15).join('\n      - ')}
    `;
    }

    return `You are a professional Songwriter and Music Director for Suno AI.
    
    CORE OBJECTIVE:
    Write a song in ${translations[language].languageName} that feels like a modern hit. Use **ENGLISH** for all structural and musical directives.
    
    # 12 GOLDEN RULES OF COMPOSITION (MUST FOLLOW):
    1. **Rhyme & Assonance (CRITICAL):** Use strong end rhymes AND **internal rhymes** (สัมผัสใน) within lines. This is key for flow.
    2. **Seamless Flow:** Connect sentences naturally. Avoid abrupt stops. Each line should "hand off" the energy to the next.
    3. **Metaphorical Storytelling:** Don't just state facts. Use creative comparisons (e.g., "Silence loud as a siren" instead of "It was quiet").
    4. **Syllable Balance:** Match syllable counts between corresponding lines for perfect rhythm.
    5. **Singability:** Words must roll off the tongue cleanly. Avoid tongue-twisters or clunky consonant clusters.
    6. **Rhythm:** Lyrics must lock into the beat. Read them aloud to ensure they groove.
    7. **Hooks:** Use repetition strategically in the Chorus. Make it an earworm.
    8. **Emotion:** Show, don't just tell. Build emotional momentum through sensory details.
    9. **Phrasing:** Use short, punchy phrases for upbeat songs; longer, flowing lines for ballads.
    10. **Word Choice:** Avoid clichés. Use evocative, fresh language that paints a picture.
    11. **Imagery:** Connect visual metaphors to emotions.
    12. **Open Endings:** End lines with open sounds (vowels) for better transitions where appropriate.

    # CONTENT PHILOSOPHY (MODERN REALISM & POETIC DEPTH):
    - **THEME:** Focus on life in the 2020s, current social dynamics, technology influence, urban loneliness, or realistic modern relationships.
    - **STYLE:** Combine "Street Realism" with "Poetic Soul". It should sound like a conversation but feel like art.
    - **AVOID:** NO fairy tales, NO magic, NO archaic/ancient settings unless explicitly requested.
    - **LANGUAGE:** Use natural, contemporary language. Ground the lyrics in real-world situations but elevate them with clever wordplay.

    # BANNED / DISCOURAGED WORDS (DO NOT USE THESE CLICHÉS):
    - **Strictly avoid these specific words/phrases as they are overused and sound unnatural in songs:**
      - ${BANNED_LYRIC_WORDS.join('\n      - ')}
    - **Instead:** Describe the *feeling* or the *action* without naming the object directly. Show, don't tell.
    ${vocabSection}
    ${customVocabSection}

    STRICT OUTPUT FORMAT:
    Song Title: <Title in ${translations[language].languageName}>
    Style: <Genre, Mood, Instruments, Vocal Type - ALL IN ENGLISH>
    
    [Intro]
    (Instrumental cues)
    
    [Verse 1]
    [Vocal Style] <Lyrics in ${translations[language].languageName}>
    
    [Chorus]
    [Power/Emotion] <Lyrics in ${translations[language].languageName}>
    
    [Outro]
    [Fade Out] (Ending cue)
    `;
}

async function validateAndCorrectLyrics(
    lyrics: string,
    smartVocab: SmartVocabularyResult,
    language: Language,
    ai: GoogleGenAI,
    modelToUse: string
): Promise<string> {
    if (!lyrics || !smartVocab) return lyrics;

    // Check if any avoid words appear in lyrics
    const avoidWords = smartVocab.avoid || [];
    const foundAvoid = avoidWords.filter(w => w && w.length > 1 && lyrics.includes(w));

    // Check if core words (or basic roots) are used
    const coreWords = smartVocab.core || [];
    const usedCore = coreWords.filter(w => lyrics.includes(w));

    const needsAvoidFix = foundAvoid.length > 0;
    const needsCoreFix = coreWords.length > 0 && usedCore.length === 0;

    // If no fixes needed, return original lyrics directly
    if (!needsAvoidFix && !needsCoreFix) {
        return lyrics;
    }

    try {
        const correctionPrompt = `Refine these song lyrics for natural language flow and vocabulary compliance:

Current Lyrics:
${lyrics}

CORRECTION INSTRUCTIONS:
${needsAvoidFix ? `- Remove or replace these style-clashing words: ${foundAvoid.join(', ')}.` : ''}
${needsCoreFix ? `- Seamlessly integrate at least one of these core thematic words (or natural inflections/variations) into a suitable line: ${coreWords.join(', ')}.` : ''}
- Maintain exact song structure, section headers, rhymes, and rhythm.
- Return ONLY the revised complete song.`;

        const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
            model: modelToUse,
            contents: correctionPrompt,
            config: {
                systemInstruction: getSongwritingSystemInstruction(language, smartVocab)
            }
        }));

        return response.text?.trim() || lyrics;
    } catch (err) {
        console.warn("Vocabulary validation correction pass skipped on error:", err);
        return lyrics;
    }
}

export interface NarrativeConcept {
    coreTheme: string;
    story: string;
    keyEmotions: string;
    imagery: string;
}

export interface StyleSuggestion {
    genres: string[];
    moods: string[];
    tempos: string[];
    instruments: string[];
}

export interface GenerateAlbumArtParams {
    prompt: string;
    noText: boolean;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 2000): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        const errObj = error as any;
        const status = errObj?.status || errObj?.code || errObj?.error?.code || errObj?.error?.status;
        const message = (errObj?.message || errObj?.error?.message || String(error)).toLowerCase();

        // 401, 403, 404 should fail fast without retrying
        const isNonRetryable = 
            error instanceof AuthError ||
            error instanceof PermissionError ||
            error instanceof NotFoundError ||
            status === 401 || status === 403 || status === 404 ||
            status === 'UNAUTHENTICATED' || status === 'PERMISSION_DENIED' || status === 'NOT_FOUND' ||
            message.includes('401') || message.includes('403') || message.includes('404');

        if (isNonRetryable) {
            throw error;
        }

        const isRateLimit = 
            error instanceof RateLimitError || 
            status === 429 || status === 'RESOURCE_EXHAUSTED' ||
            message.includes('429') || message.includes('resource_exhausted') || message.includes('quota');

        if (isRateLimit && retries > 0) {
            await sleep(delayMs);
            return withRetry(fn, retries - 1, delayMs * 2);
        }
        throw error;
    }
}

const handleGeminiError = (error: unknown, language: Language): Error => {
    const t = translations[language].ui;

    if (error instanceof RateLimitError || error instanceof AuthError || error instanceof PermissionError || error instanceof NotFoundError) {
        return error;
    }

    const classified = classifyGeminiError(error);

    if (classified === "API Key ไม่ถูกต้อง") {
        return new AuthError(classified);
    }
    if (classified === "API Key ไม่มีสิทธิ์ / API ถูกจำกัด") {
        return new PermissionError(classified);
    }
    if (classified === "Model ไม่พบ") {
        return new NotFoundError(classified);
    }
    if (classified === "Quota/Credit หมด" || classified === "Quota หรือ Rate Limit") {
        return new RateLimitError(classified);
    }

    if (error instanceof Error) {
        return error;
    }
    return new Error(classified || t.errorUnknown || 'An unknown error occurred');
};

export async function generateSong(params: any, apiKey: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });
    const { 
        userPrompt = '', 
        genres = [], 
        moods = [], 
        tempos = [], 
        vocalGender = '', 
        instruments = [], 
        songStructure = [], 
        model, 
        language = 'th', 
        customVocabulary = '' 
    } = params;
    
    // Step 1: Intelligently select vocabulary beforehand
    const smartVocab = await selectSmartVocabulary(
        params,
        language,
        customVocabulary,
        apiKey
    );

    // Step 2: Build system instruction with smart vocabulary
    const systemInstruction = getSongwritingSystemInstruction(language, smartVocab, customVocabulary);

    const fullPrompt = `
    Create a song based on:
    - Concept: ${userPrompt}
    - Style: ${Array.isArray(genres) ? genres.join(', ') : genres} / ${Array.isArray(moods) ? moods.join(', ') : moods}
    - Tempo: ${Array.isArray(tempos) ? tempos.join(', ') : tempos}
    - Vocals: ${vocalGender}
    - Instruments: ${Array.isArray(instruments) ? instruments.join(', ') : instruments}
    - Structure: ${Array.isArray(songStructure) ? songStructure.join(', ') : songStructure}
    
    REMINDER: Keep it REALISTIC and MODERN. No fictional or novel-like vibes.
    `;

    const primaryModel = model || 'gemini-3.1-pro-preview';
    const bannedKeywords = BANNED_LYRIC_WORDS.map(w => {
        const match = w.match(/"([^"]+)"/);
        return match ? match[1] : '';
    }).filter(Boolean);

    let currentPrompt = fullPrompt;
    let attempts = 0;
    const maxAttempts = 2;

    try {
        let generatedText = '';
        while (attempts < maxAttempts) {
            const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                model: primaryModel,
                contents: currentPrompt,
                config: {
                    systemInstruction: systemInstruction,
                }
            }));
            
            const text = response.text || '';
            const foundBanned = bannedKeywords.filter(word => text.includes(word));

            if (foundBanned.length === 0) {
                generatedText = text;
                break;
            }

            console.warn(`Attempt ${attempts + 1} failed validation. Found banned words: ${foundBanned.join(', ')}`);
            
            if (attempts < maxAttempts - 1) {
                currentPrompt += `\n\nCRITICAL CORRECTION: The previous output contained banned words: ${foundBanned.join(', ')}. REGENERATE the song and STRICTLY REMOVE these words. Use creative alternatives.`;
            } else {
                generatedText = text;
            }
            attempts++;
        }

        // Step 3: Validate CORE and AVOID vocabulary in generated text
        if (generatedText) {
            generatedText = await validateAndCorrectLyrics(generatedText, smartVocab, language, ai, primaryModel);
        }

        return generatedText;
    } catch (error: any) {
        throw handleGeminiError(error, language);
    }
}

export async function generateRandomIdea(language: Language, apiKey: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a song idea in ${translations[language].languageName} about a realistic contemporary situation in today's world. No fantasy. No fairy tales. No novels. Just raw modern life. Max 2 sentences.`,
        }));
        return response.text?.trim() || '';
    } catch (error) {
        throw handleGeminiError(error, language);
    }
}

export async function generateRandomNarrative(language: Language, apiKey: string): Promise<NarrativeConcept> {
    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a random, deep song narrative concept. 
            Language: ${translations[language].languageName}.
            STRICT RULE: Focus on REALISM, MODERN LIFE, and CURRENT WORLD TRENDS. Avoid fantasy or novelistic tones. 
            Return JSON.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        coreTheme: { type: Type.STRING },
                        story: { type: Type.STRING },
                        keyEmotions: { type: Type.STRING },
                        imagery: { type: Type.STRING }
                    },
                    required: ['coreTheme', 'story', 'keyEmotions', 'imagery']
                }
            }
        }));
        return JSON.parse(response.text || '{}');
    } catch (error) {
        throw handleGeminiError(error, language);
    }
}

export async function generateNarrativeFromIdea(language: Language, idea: string, apiKey: string): Promise<NarrativeConcept> {
    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Expand this song idea into a modern and realistic narrative concept: "${idea}". 
            Language: ${translations[language].languageName}.
            IMPORTANT: Use contemporary settings and relatable real-world conflicts. Strictly avoid novel-style or fantasy storytelling.
            Return JSON.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        coreTheme: { type: Type.STRING },
                        story: { type: Type.STRING },
                        keyEmotions: { type: Type.STRING },
                        imagery: { type: Type.STRING }
                    },
                    required: ['coreTheme', 'story', 'keyEmotions', 'imagery']
                }
            }
        }));
        return JSON.parse(response.text || '{}');
    } catch (error) {
        throw handleGeminiError(error, language);
    }
}

export async function generateSongStructure(inputs: any, language: Language, apiKey: string): Promise<string[]> {
    const ai = new GoogleGenAI({ apiKey });
    try {
        const genres = inputs.selectedGenre?.join(', ') || '';
        const moods = inputs.selectedMood?.join(', ') || '';
        
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Act as a professional music producer. Create a detailed song structure for a song with the following style:
            
            Genre: ${genres}
            Mood: ${moods}
            Context/Theme: ${inputs.prompt || inputs.coreTheme || 'General'}
            
            CRITICAL RULES FOR STRUCTURE GENERATION:
            1. **Adapt to Genre:** The structure MUST reflect the specific conventions of the selected Genre.
            2. **Hip-Hop / Rap / Trap:** If the genre involves Rap, you MUST include sections specifically labeled "[Rap Verse]", "[Flow]", or "[Bars]". Do not just use "Verse".
            3. **EDM / Dance:** Include sections like "[Build-up]", "[Drop]", and "[Breakdown]".
            4. **Rock / Metal:** Include "[Guitar Solo]", "[Riff]", or "[Breakdown]".
            5. **Pop / Ballad:** Use standard "[Verse]", "[Pre-Chorus]", "[Chorus]", "[Bridge]".
            6. **Jazz / Blues:** Include "[Improvisation]" or "[Solo]".
            7. **Structure Format:** Use standard square bracket notation (e.g., "[Intro]", "[Verse 1]", "[Chorus]").
            
            Return ONLY a JSON array of strings representing the sequential parts of the song.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        }));
        return JSON.parse(response.text || '[]');
    } catch (error) {
        throw handleGeminiError(error, language);
    }
}

export async function generateStyleFromIdea(inputs: any, language: Language, apiKey: string): Promise<StyleSuggestion> {
    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze this song idea and suggest style parameters: "${inputs.prompt}".
            Language: ${translations[language].languageName}.
            Return JSON.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        genres: { type: Type.ARRAY, items: { type: Type.STRING } },
                        moods: { type: Type.ARRAY, items: { type: Type.STRING } },
                        tempos: { type: Type.ARRAY, items: { type: Type.STRING } },
                        instruments: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['genres', 'moods', 'tempos', 'instruments']
                }
            }
        }));
        return JSON.parse(response.text || '{}');
    } catch (error) {
        throw handleGeminiError(error, language);
    }
}

export async function generateStyleFromArtist(artist: string, language: Language, apiKey: string): Promise<StyleSuggestion> {
    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the musical style of "${artist}" and suggest parameters.
            Language: ${translations[language].languageName}.
            Return JSON.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        genres: { type: Type.ARRAY, items: { type: Type.STRING } },
                        moods: { type: Type.ARRAY, items: { type: Type.STRING } },
                        tempos: { type: Type.ARRAY, items: { type: Type.STRING } },
                        instruments: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['genres', 'moods', 'tempos', 'instruments']
                }
            }
        }));
        return JSON.parse(response.text || '{}');
    } catch (error) {
        throw handleGeminiError(error, language);
    }
}

export async function generateLyricsSRT(songData: string, inputs: any, language: Language, apiKey: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: `Convert to .SRT with timestamps: ${songData}`
        }));
        return response.text || '';
    } catch (error) {
        throw handleGeminiError(error, language);
    }
}

export async function generateYouTubeDescription(songData: string, inputs: any, language: Language, apiKey: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });
    try {
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: `Write a modern YouTube description in ${translations[language].languageName} for: ${songData}`
        }));
        return response.text || '';
    } catch (error) {
        throw handleGeminiError(error, language);
    }
}

export async function reviseSong(originalSong: string, request: string, model: string, language: Language, apiKey: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });
    const targetModel = model || 'gemini-3.1-pro-preview';
    try {
        const smartVocab = await selectSmartVocabulary(
            { userPrompt: request, story: originalSong },
            language,
            '',
            apiKey
        );
        const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: targetModel,
            contents: `Original Song:\n${originalSong}\n\nRevision Request:\n${request}`,
            config: {
                systemInstruction: getSongwritingSystemInstruction(language, smartVocab),
            }
        }));
        return response.text || '';
    } catch (error: any) {
        throw handleGeminiError(error, language);
    }
}
