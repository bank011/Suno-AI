
// This utility file centralizes shared logic to avoid duplication.

/**
 * Returns the user-provided song structure. Originally, this function would
 * process and re-number sections, but based on user feedback, it now
 * preserves the user's input exactly as provided to give them full control.
 * @param songStructure - An array of structure parts, e.g., ['[Verse]', '[Chorus]', '[Verse 2]'].
 * @returns The original, unmodified array of structure parts.
 */
export const getProcessedStructure = (songStructure: string[]): string[] => {
    if (!songStructure) return [];
    return songStructure;
};

/**
 * Calculates the estimated Weirdness and Style Influence metrics for Suno AI
 * based on selected genres, moods, and the generated lyrics/prompt.
 * Now covers comprehensive genre lists including Thai, Asian, and Niche styles.
 * @param genres List of selected genres
 * @param moods List of selected moods
 * @param lyrics The generated lyrics (optional)
 * @param prompt The user's prompt (optional)
 * @returns Object containing { weirdness, influence }
 */
export const calculateAutoMetrics = (genres: string[], moods: string[], lyrics: string = '', prompt: string = '') => {
    const allTags = [...genres, ...moods].map(t => t.toLowerCase());
    const tagString = allTags.join('') + lyrics + prompt;
    
    // Deterministic jitter based on the content of the tags and text
    // This ensures the same combination always gives the same result, but feels "organic"
    let hash = 0;
    for (let i = 0; i < tagString.length; i++) {
        hash = ((hash << 5) - hash) + tagString.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    const jitterW = (Math.abs(hash) % 11) - 5; // -5 to +5 variance
    const jitterI = (Math.abs(hash >> 1) % 11) - 5;

    let w = 50; // Base Weirdness
    let i = 50; // Base Influence

    // --- WEIRDNESS CALCULATIONS ---

    // Extreme Weirdness (+30 to +40)
    if (allTags.some(t => t.includes('glitch') || t.includes('breakcore') || t.includes('hyperpop') || t.includes('experimental') || t.includes('idm') || t.includes('avant-garde') || t.includes('psychedelic') || t.includes('weird') || t.includes('whimsical'))) {
        w += 35;
    }

    // High Weirdness (+20 to +25)
    else if (allTags.some(t => t.includes('metal') || t.includes('death') || t.includes('trap') || t.includes('drill') || t.includes('dubstep') || t.includes('industrial') || t.includes('techno') || t.includes('cyberpunk') || t.includes('sci-fi') || t.includes('vocaloid') || t.includes('opera'))) {
        w += 20;
    }

    // Moderate Weirdness (+10 to +15)
    else if (allTags.some(t => t.includes('jazz') || t.includes('fusion') || t.includes('rap') || t.includes('hip hop') || t.includes('funk') || t.includes('synthwave') || t.includes('electronic') || t.includes('reggae') || t.includes('ska') || t.includes('latin') || t.includes('bossa'))) {
        w += 10;
    }

    // Low Weirdness (Safe/Standard) (-10 to -20)
    else if (allTags.some(t => t.includes('pop') || t.includes('ballad') || t.includes('acoustic') || t.includes('folk') || t.includes('country') || t.includes('easy listening') || t.includes('lullaby') || t.includes('children') || t.includes('classical') || t.includes('relax') || t.includes('calm'))) {
        w -= 15;
    }

    // --- INFLUENCE CALCULATIONS ---

    // Extreme Influence (+30 to +40) - Strict genres that must sound "authentic"
    if (allTags.some(t => t.includes('classical') || t.includes('opera') || t.includes('orchestral') || t.includes('traditional') || t.includes('ancient') || t.includes('luk thung') || t.includes('ลูกทุ่ง') || t.includes('mor lam') || t.includes('หมอลำ') || t.includes('enka') || t.includes('trot') || t.includes('gospel') || t.includes('choral') || t.includes('march'))) {
        i += 35;
    }

    // High Influence (+15 to +25) - Distinct styles
    else if (allTags.some(t => t.includes('metal') || t.includes('blues') || t.includes('jazz') || t.includes('country') || t.includes('techno') || t.includes('trance') || t.includes('house') || t.includes('disco') || t.includes('synthwave') || t.includes('city pop') || t.includes('k-pop') || t.includes('j-pop'))) {
        i += 20;
    }

    // Moderate Influence (+5 to +10)
    else if (allTags.some(t => t.includes('rock') || t.includes('pop') || t.includes('r&b') || t.includes('soul') || t.includes('hip hop') || t.includes('rap'))) {
        i += 5;
    }

    // Low Influence / Loose Structure (-10 to -20)
    else if (allTags.some(t => t.includes('lo-fi') || t.includes('ambient') || t.includes('dream') || t.includes('shoegaze') || t.includes('indie') || t.includes('alternative') || t.includes('fusion') || t.includes('experimental') || t.includes('chill'))) {
        i -= 15;
    }

    // --- MOOD MODIFIERS ---
    if (allTags.some(t => t.includes('dark') || t.includes('scary') || t.includes('horror') || t.includes('anxious') || t.includes('tense'))) w += 10;
    if (allTags.some(t => t.includes('happy') || t.includes('joy') || t.includes('romantic') || t.includes('warm') || t.includes('upbeat'))) w -= 5;
    if (allTags.some(t => t.includes('focused') || t.includes('intense') || t.includes('epic') || t.includes('cinematic'))) i += 10;

    // --- TEXT CONTENT MODIFIERS (Lyrics/Prompt) ---
    const textContent = (lyrics + " " + prompt).toLowerCase();
    
    // Experimental/Weird
    if (textContent.includes('ทดลอง') || textContent.includes('แปลก') || textContent.includes('แหวกแนว') || textContent.includes('experimental') || textContent.includes('ล้ำ')) {
        w += 15;
    }
    
    // Traditional/Classic
    if (textContent.includes('ดั้งเดิม') || textContent.includes('คลาสสิก') || textContent.includes('classic') || textContent.includes('traditional') || textContent.includes('เก่า')) {
        i += 15;
    }

    // Thai Literature/Folklore (increases influence for authenticity, slightly increases weirdness for niche)
    if (textContent.includes('แม่รจนา') || textContent.includes('เจ้าเงาะ') || textContent.includes('เครื่องทรง') || textContent.includes('เสี่ยงมาลัย') || textContent.includes('เออเออเอิงเอย') || textContent.includes('ดงพงพี')) {
        i += 10;
        w += 5;
    }

    // Thai Dialects (Northern/Southern) (increases influence for authenticity)
    if (textContent.includes('แหลง') || textContent.includes('น้องเห้อ') || textContent.includes('ขี้จุ๊') || textContent.includes('บ่าได้ก๋า') || textContent.includes('อ้าย') || textContent.includes('หื้อ')) {
        i += 10;
        w += 5;
    }

    // Teen Pop / School Love (decreases weirdness, standardizes influence)
    if (textContent.includes('นักร้องโรงเรียน') || textContent.includes('เข้าเรียน') || textContent.includes('แอบชอบ') || textContent.includes('ตั้ลลัลลา') || textContent.includes('baby girl')) {
        w -= 10;
        i -= 5;
    }

    // Apply Jitter to make it feel organic
    w += jitterW;
    i += jitterI;

    return { 
        weirdness: Math.min(100, Math.max(0, w)), 
        influence: Math.min(100, Math.max(0, i)) 
    };
};
