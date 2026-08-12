import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { type Language, translations } from "./translations";

export type SemanticCategory =
  | 'love'
  | 'heartbreak'
  | 'longing'
  | 'sadness'
  | 'hope'
  | 'faith'
  | 'nostalgia'
  | 'motivation'
  | 'isan'
  | 'northern'
  | 'southern'
  | 'modern'
  | 'traditional'
  | 'nature'
  | 'humor';

export interface VocabularyItem {
    word: string;
    categories: SemanticCategory[];
    emotions: string[];
    genres?: string[];
    regional?: 'isan' | 'northern' | 'southern' | 'central' | 'english' | null;
    priority?: number;
}

export interface SmartVocabularyResult {
    core: string[];
    supporting: string[];
    optional: string[];
    avoid: string[];
}

export interface SongGenerationInputs {
    userPrompt?: string;
    prompt?: string;
    story?: string;
    coreTheme?: string;
    genres?: string[];
    selectedGenre?: string[];
    moods?: string[];
    selectedMood?: string[];
    tempos?: string[];
    selectedTempo?: string[];
    vocalGender?: string;
    selectedVocal?: string;
    instruments?: string[];
    selectedInstruments?: string[];
    customVocabulary?: string;
    excludedWords?: string;
}

// Full database of categorized vocabulary items preserving ALL existing RECOMMENDED_LYRIC_WORDS
export const CATEGORIZED_VOCABULARY: VocabularyItem[] = [
    // Love / Romance
    { word: 'เชื่อ', categories: ['love', 'hope', 'motivation'], emotions: ['trust', 'hopeful'], genres: ['pop', 'rock', 'ballad', 'indie', 'lukthung'], priority: 1 },
    { word: 'ให้ใจ', categories: ['love'], emotions: ['devoted', 'romantic'], genres: ['pop', 'ballad', 'lukthung', 'rnb'], priority: 1 },
    { word: 'ทุ่มเท', categories: ['love', 'motivation'], emotions: ['earnest', 'devoted'], genres: ['pop', 'rock', 'ballad'], priority: 1 },
    { word: 'หัวใจ', categories: ['love', 'heartbreak', 'longing', 'sadness'], emotions: ['romantic', 'sad', 'passionate'], priority: 1 },
    { word: 'ความรัก', categories: ['love', 'hope'], emotions: ['romantic', 'loving'], priority: 1 },
    { word: 'รักแท้', categories: ['love', 'hope', 'faith'], emotions: ['devoted', 'hopeful'], genres: ['pop', 'ballad', 'lukthung'], priority: 1 },
    { word: 'แสนดี', categories: ['love', 'nostalgia'], emotions: ['warm', 'wistful'], genres: ['pop', 'ballad'], priority: 1 },
    { word: 'แอบชอบ', categories: ['love', 'modern'], emotions: ['shy', 'sweet'], genres: ['pop', 'indie', 'rnb', 'dance'], priority: 1 },
    { word: 'แอบมอง', categories: ['love', 'modern'], emotions: ['watchful', 'sweet'], genres: ['pop', 'indie', 'rnb'], priority: 1 },
    { word: 'ล้นปรี่', categories: ['love', 'sadness'], emotions: ['overflowing'], genres: ['pop', 'ballad', 'traditional'], priority: 1 },
    { word: 'โลกทั้งใบ', categories: ['love'], emotions: ['all-encompassing'], genres: ['pop', 'ballad', 'indie'], priority: 1 },
    { word: 'รู้สึกเหมือนกัน', categories: ['love', 'modern'], emotions: ['mutual affection'], genres: ['pop', 'indie', 'rnb'], priority: 1 },
    { word: 'เดินเข้ามา', categories: ['love', 'modern'], emotions: ['approaching'], genres: ['pop', 'rnb', 'indie'], priority: 1 },
    { word: 'เสียงหัวใจ', categories: ['love'], emotions: ['heartbeat'], genres: ['pop', 'ballad', 'rnb'], priority: 1 },
    { word: 'แนบที่ใจ', categories: ['love'], emotions: ['close to heart'], genres: ['pop', 'ballad'], priority: 1 },
    { word: 'สบตากัน', categories: ['love', 'modern'], emotions: ['eye contact'], genres: ['pop', 'indie', 'rnb'], priority: 1 },
    { word: 'สัญญา', categories: ['love', 'faith', 'nostalgia'], emotions: ['promise'], genres: ['pop', 'ballad', 'lukthung'], priority: 1 },
    { word: 'คุณค่าทางใจ', categories: ['love', 'nostalgia'], emotions: ['sentimental value'], genres: ['pop', 'ballad', 'indie'], priority: 1 },
    { word: 'เก็บเอาเธอไปฝัน', categories: ['love', 'modern'], emotions: ['dreaming of you'], genres: ['pop', 'indie', 'rnb'], priority: 1 },
    { word: 'กอดตอนนอน', categories: ['love', 'modern'], emotions: ['intimate', 'warm'], genres: ['pop', 'rnb', 'indie'], priority: 1 },
    { word: 'เชื่อใจ', categories: ['love', 'faith', 'hope'], emotions: ['trust'], genres: ['pop', 'ballad', 'rock'], priority: 1 },
    { word: 'คบกับฉัน', categories: ['love', 'modern'], emotions: ['asking to date'], genres: ['pop', 'rnb', 'indie'], priority: 1 },
    { word: 'พบเธอ', categories: ['love'], emotions: ['meeting you'], priority: 1 },
    { word: 'ยิ้ม', categories: ['love', 'hope'], emotions: ['smile'], priority: 1 },
    { word: 'พูดคุย', categories: ['love', 'modern'], emotions: ['talking'], genres: ['pop', 'indie', 'rnb'], priority: 1 },

    // Heartbreak / Sadness
    { word: 'สุดท้าย', categories: ['heartbreak', 'nostalgia', 'sadness'], emotions: ['sorrow', 'finality'], genres: ['pop', 'ballad', 'rock', 'lukthung'], priority: 1 },
    { word: 'เสียใจ', categories: ['heartbreak', 'sadness'], emotions: ['sad', 'regret'], genres: ['pop', 'ballad', 'rock', 'lukthung'], priority: 1 },
    { word: 'เสียน้ำตา', categories: ['heartbreak', 'sadness'], emotions: ['sad', 'crying'], genres: ['pop', 'ballad', 'lukthung'], priority: 1 },
    { word: 'เหงา', categories: ['sadness', 'longing'], emotions: ['lonely', 'pensive'], genres: ['pop', 'indie', 'ballad', 'rnb'], priority: 1 },
    { word: 'ใจร้าย', categories: ['heartbreak', 'sadness'], emotions: ['hurt', 'disappointed'], genres: ['pop', 'lukthung', 'rock'], priority: 1 },
    { word: 'ครั้งสุดท้าย', categories: ['heartbreak', 'nostalgia'], emotions: ['sad', 'wistful'], genres: ['pop', 'ballad', 'rock'], priority: 1 },
    { word: 'เศร้าใจ', categories: ['sadness', 'heartbreak'], emotions: ['sad', 'downhearted'], genres: ['pop', 'ballad', 'lukthung'], priority: 1 },
    { word: 'หวั่นไหว', categories: ['love', 'sadness'], emotions: ['anxious', 'fluttering'], genres: ['pop', 'ballad', 'rnb', 'indie'], priority: 1 },
    { word: 'เงียบเหงา', categories: ['sadness', 'longing'], emotions: ['lonely', 'quiet'], genres: ['pop', 'indie', 'ballad'], priority: 1 },
    { word: 'เงียบงัน', categories: ['sadness', 'heartbreak'], emotions: ['silent', 'desolate'], genres: ['pop', 'ballad', 'rock', 'indie'], priority: 1 },
    { word: 'ขาดใจ', categories: ['heartbreak', 'sadness'], emotions: ['intense sorrow', 'desperate'], genres: ['pop', 'ballad', 'rock', 'lukthung'], priority: 1 },
    { word: 'ไม่ไหว', categories: ['heartbreak', 'sadness'], emotions: ['overwhelmed', 'helpless'], genres: ['pop', 'rock', 'ballad', 'rnb'], priority: 1 },
    { word: 'พรากเจ้าไกล', categories: ['heartbreak', 'longing', 'traditional'], emotions: ['separated', 'tragic'], genres: ['traditional', 'lukthung', 'ballad'], priority: 1 },
    { word: 'ช่วยบอกฉันที', categories: ['heartbreak', 'longing'], emotions: ['confused', 'seeking'], genres: ['pop', 'ballad', 'rock', 'rnb'], priority: 1 },
    { word: 'ลา', categories: ['heartbreak', 'nostalgia'], emotions: ['farewell'], priority: 1 },
    { word: 'ไม่มีเธอ', categories: ['heartbreak', 'sadness', 'longing'], emotions: ['lonely', 'bereft'], genres: ['pop', 'ballad', 'rock', 'rnb'], priority: 1 },
    { word: 'ลาลับไกล', categories: ['heartbreak', 'sadness', 'nostalgia'], emotions: ['sorrowful', 'parting'], genres: ['ballad', 'pop', 'lukthung'], priority: 1 },
    { word: 'ปั้นแต่ง', categories: ['heartbreak', 'modern'], emotions: ['fabricated', 'fake'], genres: ['pop', 'rock', 'hiphop'], priority: 1 },
    { word: 'สมใจ', categories: ['heartbreak', 'love'], emotions: ['satisfied', 'bitter'], genres: ['pop', 'ballad', 'lukthung', 'rock'], priority: 1 },
    { word: 'เหี่ยวเฉา', categories: ['sadness', 'heartbreak'], emotions: ['withered'], genres: ['pop', 'ballad', 'indie'], priority: 1 },
    { word: 'เห็นใจ', categories: ['love', 'sadness'], emotions: ['sympathetic'], genres: ['pop', 'ballad', 'lukthung'], priority: 1 },
    { word: 'นั่งเศร้า', categories: ['sadness'], emotions: ['sitting sadly'], genres: ['pop', 'indie', 'lukthung'], priority: 1 },
    { word: 'วิ่งตามใคร', categories: ['heartbreak', 'sadness', 'modern'], emotions: ['chasing someone'], genres: ['pop', 'indie', 'rock'], priority: 1 },
    { word: 'เหตุผล', categories: ['heartbreak', 'sadness', 'modern'], emotions: ['reason'], genres: ['pop', 'ballad', 'rock'], priority: 1 },

    // Longing / Nostalgia
    { word: 'เฝ้า', categories: ['longing', 'love'], emotions: ['waiting', 'devoted'], genres: ['pop', 'ballad', 'lukthung'], priority: 1 },
    { word: 'เฝ้ามอง', categories: ['longing', 'love'], emotions: ['watching over'], genres: ['pop', 'ballad', 'indie'], priority: 1 },
    { word: 'จันทร์เจ้าเอย', categories: ['longing', 'nostalgia', 'nature'], emotions: ['poetic', 'wistful'], genres: ['pop', 'traditional', 'lukthung', 'indie'], priority: 1 },
    { word: 'ล่องลอย', categories: ['longing', 'nostalgia', 'nature'], emotions: ['dreamy', 'drifting'], genres: ['pop', 'indie', 'rnb', 'ballad'], priority: 1 },
    { word: 'ล่องลอยคืนมา', categories: ['longing', 'hope', 'nostalgia'], emotions: ['yearning'], genres: ['pop', 'ballad', 'indie'], priority: 1 },
    { word: 'งดงามเหมือนเคย', categories: ['nostalgia', 'love'], emotions: ['wistful', 'admiring'], genres: ['pop', 'ballad', 'indie'], priority: 1 },
    { word: 'มองดู', categories: ['longing', 'nostalgia'], emotions: ['observant', 'pensive'], priority: 1 },
    { word: 'ตามหา', categories: ['longing', 'hope', 'motivation'], emotions: ['searching'], genres: ['pop', 'rock', 'ballad', 'indie'], priority: 1 },
    { word: 'เวลา', categories: ['longing', 'nostalgia', 'sadness'], emotions: ['time'], priority: 1 },
    { word: 'รอนาน', categories: ['longing', 'sadness'], emotions: ['waiting long'], genres: ['pop', 'ballad', 'rnb'], priority: 1 },
    { word: 'ขึ้นหิ้ง', categories: ['nostalgia', 'modern'], emotions: ['classic', 'pedestal'], genres: ['pop', 'hiphop', 'indie'], priority: 1 },

    // Hope / Faith / Spiritual
    { word: 'อธิษฐาน', categories: ['hope', 'faith'], emotions: ['prayerful', 'hopeful'], genres: ['pop', 'ballad', 'lukthung', 'traditional'], priority: 1 },
    { word: 'เทวดา', categories: ['faith', 'hope', 'traditional'], emotions: ['reverent', 'spiritual'], genres: ['lukthung', 'morlam', 'traditional', 'pop'], priority: 1 },
    { word: 'สมดัง', categories: ['hope', 'faith'], emotions: ['fulfilled'], genres: ['lukthung', 'traditional', 'pop'], priority: 1 },
    { word: 'ปรารถนา', categories: ['hope', 'love', 'longing'], emotions: ['desiring', 'passionate'], genres: ['pop', 'ballad', 'traditional'], priority: 1 },
    { word: 'จงเข้ามา', categories: ['hope', 'motivation', 'love'], emotions: ['inviting', 'bold'], genres: ['pop', 'rock', 'dance'], priority: 1 },
    { word: 'สาธุ', categories: ['faith'], emotions: ['reverent', 'blessed'], genres: ['lukthung', 'morlam', 'traditional', 'folk'], priority: 1 },
    { word: 'จุดธูป', categories: ['faith'], emotions: ['spiritual', 'sacred'], genres: ['lukthung', 'morlam', 'traditional', 'folk'], priority: 1 },
    { word: 'เก้าดอก', categories: ['faith'], emotions: ['spiritual'], genres: ['lukthung', 'morlam', 'traditional'], priority: 1 },
    { word: 'สักการะ', categories: ['faith'], emotions: ['reverent'], genres: ['traditional', 'lukthung'], priority: 1 },
    { word: 'ย่อมือ', categories: ['faith', 'traditional'], emotions: ['reverent', 'respectful'], genres: ['lukthung', 'morlam', 'traditional'], priority: 1 },
    { word: 'สุดศอก', categories: ['faith', 'traditional'], emotions: ['reverent'], genres: ['lukthung', 'morlam', 'traditional'], priority: 1 },
    { word: 'พ้นศีรษะ', categories: ['faith', 'traditional'], emotions: ['reverent'], genres: ['lukthung', 'morlam', 'traditional'], priority: 1 },
    { word: 'มาลัยมาลา', categories: ['faith', 'traditional'], emotions: ['reverent', 'poetic'], genres: ['traditional', 'lukthung'], priority: 1 },
    { word: 'ตั้งจิต', categories: ['faith', 'hope'], emotions: ['focused', 'spiritual'], genres: ['lukthung', 'traditional', 'folk'], priority: 1 },
    { word: 'ภาวนา', categories: ['faith', 'hope', 'longing'], emotions: ['prayerful', 'desperate'], genres: ['pop', 'ballad', 'lukthung', 'rock'], priority: 1 },
    { word: 'ฟ้าลิขิต', categories: ['faith', 'love', 'traditional'], emotions: ['destined'], genres: ['pop', 'ballad', 'lukthung', 'traditional'], priority: 1 },
    { word: 'ฝากชีวิต', categories: ['faith', 'love'], emotions: ['devoted', 'serious'], genres: ['pop', 'ballad', 'lukthung'], priority: 1 },
    { word: 'ดั่งหวัง', categories: ['hope', 'motivation'], emotions: ['as wished'], genres: ['pop', 'ballad', 'lukthung'], priority: 1 },
    { word: 'ให้โอกาส', categories: ['hope', 'love', 'heartbreak'], emotions: ['seeking chance'], genres: ['pop', 'ballad', 'rnb'], priority: 1 },

    // Motivation / Life
    { word: 'ก้าวข้าม', categories: ['motivation', 'hope'], emotions: ['overcoming'], genres: ['pop', 'rock', 'hiphop', 'ballad'], priority: 1 },
    { word: 'ข้างนอกไม่สวย', categories: ['motivation', 'humor'], emotions: ['inner beauty'], genres: ['pop', 'indie', 'lukthung'], priority: 1 },
    { word: 'ข้างในเป็นทอง', categories: ['motivation'], emotions: ['valuable'], genres: ['pop', 'indie', 'lukthung'], priority: 1 },
    { word: 'กำลังใจ', categories: ['motivation', 'hope'], emotions: ['encouraging'], genres: ['pop', 'rock', 'lukthung', 'folk'], priority: 1 },
    { word: 'เหนื่อยล้า', categories: ['motivation', 'sadness'], emotions: ['exhausted'], genres: ['pop', 'rock', 'indie', 'ballad'], priority: 1 },

    // Isan Dialect
    { word: 'เพิ่น', categories: ['isan', 'love', 'heartbreak'], emotions: ['regional', 'respectful'], genres: ['morlam', 'lukthung', 'isan-pop', 'folk'], regional: 'isan', priority: 1 },
    { word: 'ซ่อยที', categories: ['isan', 'sadness', 'faith'], emotions: ['pleading'], genres: ['morlam', 'lukthung', 'isan-pop'], regional: 'isan', priority: 1 },
    { word: 'พ้อ', categories: ['isan', 'love', 'longing'], emotions: ['encounter'], genres: ['morlam', 'lukthung', 'isan-pop'], regional: 'isan', priority: 1 },
    { word: 'ความฮัก', categories: ['isan', 'love'], emotions: ['loving'], genres: ['morlam', 'lukthung', 'isan-pop'], regional: 'isan', priority: 1 },
    { word: 'อีกจักหน', categories: ['isan', 'hope', 'longing'], emotions: ['pleading'], genres: ['morlam', 'lukthung', 'isan-pop'], regional: 'isan', priority: 1 },
    { word: 'บ่ขอหยังหลาย', categories: ['isan', 'love', 'sadness'], emotions: ['humble'], genres: ['morlam', 'lukthung', 'isan-pop'], regional: 'isan', priority: 1 },
    { word: 'ข่อย', categories: ['isan'], emotions: ['self-referential'], genres: ['morlam', 'lukthung', 'isan-pop'], regional: 'isan', priority: 1 },
    { word: 'ผู้เดียว', categories: ['isan', 'sadness', 'longing'], emotions: ['lonely'], genres: ['morlam', 'lukthung', 'isan-pop'], regional: 'isan', priority: 1 },
    { word: 'สาธุเด้อ', categories: ['isan', 'faith'], emotions: ['blessed', 'prayerful'], genres: ['morlam', 'lukthung', 'isan-pop'], regional: 'isan', priority: 1 },
    { word: 'อ้าย', categories: ['isan', 'love', 'northern'], emotions: ['older brother / lover'], genres: ['morlam', 'lukthung', 'isan-pop', 'folk'], regional: 'isan', priority: 1 },

    // Northern Dialect
    { word: 'ขี้จุ๊', categories: ['northern', 'humor'], emotions: ['liar / teasing'], genres: ['northern-pop', 'lukthung', 'folk'], regional: 'northern', priority: 1 },
    { word: 'ตั้ลลัลลา', categories: ['northern', 'modern'], emotions: ['cute chant'], genres: ['pop', 'northern-pop'], regional: 'northern', priority: 1 },
    { word: 'หื้อ', categories: ['northern'], emotions: ['particle / give'], genres: ['northern-pop', 'lukthung', 'folk'], regional: 'northern', priority: 1 },
    { word: 'อู้', categories: ['northern'], emotions: ['speak'], genres: ['northern-pop', 'lukthung', 'folk'], regional: 'northern', priority: 1 },
    { word: 'บ่าได้ก๋า', categories: ['northern'], emotions: ['can\'t it be?'], genres: ['northern-pop', 'lukthung', 'folk'], regional: 'northern', priority: 1 },

    // Southern Dialect
    { word: 'หาญ', categories: ['southern', 'motivation'], emotions: ['brave', 'bold'], genres: ['southern-rock', 'lukthung', 'folk'], regional: 'southern', priority: 1 },
    { word: 'แหลง', categories: ['southern'], emotions: ['speak'], genres: ['southern-rock', 'lukthung', 'folk'], regional: 'southern', priority: 1 },
    { word: 'แค่ๆ', categories: ['southern', 'love'], emotions: ['close by'], genres: ['southern-rock', 'lukthung', 'folk'], regional: 'southern', priority: 1 },
    { word: 'แล', categories: ['southern', 'love'], emotions: ['look / see'], genres: ['southern-rock', 'lukthung', 'folk'], regional: 'southern', priority: 1 },
    { word: 'ตะ', categories: ['southern'], emotions: ['particle'], genres: ['southern-rock', 'lukthung', 'folk'], regional: 'southern', priority: 1 },
    { word: 'น้องเห้อ', categories: ['southern', 'love', 'longing'], emotions: ['affectionate call'], genres: ['southern-rock', 'lukthung', 'folk'], regional: 'southern', priority: 1 },

    // Traditional / Poetic / Literature
    { word: 'ดงพงพี', categories: ['traditional', 'nature'], emotions: ['wild', 'poetic'], genres: ['traditional', 'lukthung', 'folk'], priority: 1 },
    { word: 'ทิวาราตรี', categories: ['traditional'], emotions: ['timeless', 'poetic'], genres: ['traditional', 'lukthung', 'ballad'], priority: 1 },
    { word: 'เครื่องทรง', categories: ['traditional'], emotions: ['regal'], genres: ['traditional', 'lukthung'], priority: 1 },
    { word: 'รอนแรม', categories: ['traditional', 'longing'], emotions: ['wandering'], genres: ['traditional', 'lukthung', 'folk'], priority: 1 },
    { word: 'พารา', categories: ['traditional'], emotions: ['city / kingdom'], genres: ['traditional', 'lukthung'], priority: 1 },
    { word: 'เสี่ยงคู่', categories: ['traditional', 'love', 'faith'], emotions: ['fate', 'divination'], genres: ['traditional', 'lukthung'], priority: 1 },
    { word: 'เลื่องลือโฉม', categories: ['traditional', 'love'], emotions: ['admiring'], genres: ['traditional', 'lukthung'], priority: 1 },
    { word: 'ธิดา', categories: ['traditional'], emotions: ['daughter / maiden'], genres: ['traditional', 'lukthung'], priority: 1 },
    { word: 'ร้อยหัวเมือง', categories: ['traditional'], emotions: ['grand'], genres: ['traditional', 'lukthung'], priority: 1 },
    { word: 'เสี่ยงมาลัย', categories: ['traditional', 'love', 'faith'], emotions: ['fateful'], genres: ['traditional', 'lukthung'], priority: 1 },
    { word: 'คู่ครอง', categories: ['traditional', 'love', 'faith'], emotions: ['devoted'], genres: ['pop', 'ballad', 'lukthung', 'traditional'], priority: 1 },
    { word: 'แม่รจนา', categories: ['traditional'], emotions: ['folklore'], genres: ['traditional', 'lukthung'], priority: 1 },
    { word: 'เจ้าเงาะ', categories: ['traditional'], emotions: ['folklore', 'humorous'], genres: ['traditional', 'lukthung'], priority: 1 },
    { word: 'ย่างย้ำ', categories: ['traditional'], emotions: ['stepping'], genres: ['traditional', 'lukthung'], priority: 1 },
    { word: 'ทัดหู', categories: ['traditional', 'love'], emotions: ['tender', 'charming'], genres: ['pop', 'indie', 'lukthung', 'traditional'], priority: 1 },
    { word: 'ผิวคล้ำ', categories: ['traditional'], emotions: ['grounded', 'realistic'], genres: ['lukthung', 'traditional', 'folk'], priority: 1 },
    { word: 'ผมหยิก', categories: ['traditional'], emotions: ['descriptive'], genres: ['lukthung', 'traditional', 'folk'], priority: 1 },
    { word: 'ซาไก', categories: ['traditional'], emotions: ['folklore'], genres: ['traditional', 'lukthung'], priority: 1 },
    { word: 'ปากแดง', categories: ['traditional', 'modern'], emotions: ['vivid', 'alluring'], genres: ['pop', 'lukthung', 'hiphop', 'rnb'], priority: 1 },
    { word: 'สุกในดง', categories: ['traditional', 'nature'], emotions: ['rustic'], genres: ['traditional', 'lukthung'], priority: 1 },
    { word: 'งามดั่งนางฟ้า', categories: ['traditional', 'love'], emotions: ['enchanted', 'admiring'], genres: ['pop', 'ballad', 'lukthung'], priority: 1 },
    { word: 'เออเออเอิงเอย', categories: ['traditional'], emotions: ['traditional vocal'], genres: ['traditional', 'lukthung'], priority: 1 },
    { word: 'ชะเออเอิงเอย', categories: ['traditional'], emotions: ['traditional vocal'], genres: ['traditional', 'lukthung'], priority: 1 },
    { word: 'เอย', categories: ['traditional'], emotions: ['poetic ending'], genres: ['traditional', 'lukthung'], priority: 1 },

    // Nature / Sky
    { word: 'ท้องฟ้า', categories: ['nature', 'longing', 'sadness'], emotions: ['vast', 'pensive'], genres: ['pop', 'indie', 'ballad', 'rock'], priority: 1 },
    { word: 'แสงดาว', categories: ['nature', 'hope', 'longing'], emotions: ['dreamy', 'hopeful'], genres: ['pop', 'ballad', 'indie'], priority: 1 },
    { word: 'ว่างเปล่า', categories: ['sadness', 'heartbreak'], emotions: ['empty', 'numb'], genres: ['pop', 'ballad', 'indie', 'rock'], priority: 1 },
    { word: 'ฟ้า', categories: ['nature', 'longing', 'hope'], emotions: ['expansive'], priority: 1 },
    { word: 'แสงนวล', categories: ['nature', 'love', 'nostalgia'], emotions: ['soft', 'romantic'], genres: ['pop', 'traditional', 'ballad', 'jazz'], priority: 1 },
    { word: 'ตะวัน', categories: ['nature', 'nostalgia', 'motivation'], emotions: ['bright', 'warm'], genres: ['pop', 'rock', 'folk', 'lukthung'], priority: 1 },
    { word: 'จันทร์ดวงน้อย', categories: ['nature', 'love', 'longing'], emotions: ['tender'], genres: ['pop', 'ballad', 'indie', 'traditional'], priority: 1 },
    { word: 'นภา', categories: ['nature', 'traditional', 'hope'], emotions: ['grand', 'poetic'], genres: ['pop', 'traditional', 'ballad'], priority: 1 },
    { word: 'ส่องแสงเต็มฟ้า', categories: ['nature', 'hope', 'motivation'], emotions: ['radiant'], genres: ['pop', 'rock', 'ballad'], priority: 1 },
    { word: 'สวยงาม', categories: ['nature', 'love'], emotions: ['appreciative', 'beautiful'], priority: 1 },
    { word: 'ดอกไม้', categories: ['nature', 'love', 'faith'], emotions: ['gentle', 'loving'], genres: ['pop', 'lukthung', 'traditional', 'indie'], priority: 1 },

    // Modern / Youth / English
    { word: 'น่าขัน', categories: ['modern', 'humor'], emotions: ['playful', 'amused'], genres: ['pop', 'indie', 'hiphop'], priority: 1 },
    { word: 'โทรหา', categories: ['modern', 'love', 'longing'], emotions: ['calling phone'], genres: ['pop', 'rnb', 'hiphop', 'indie'], priority: 1 },
    { word: 'เข้าเรียน', categories: ['modern'], emotions: ['school life'], genres: ['pop', 'indie', 'rock'], priority: 1 },
    { word: 'นักร้องโรงเรียน', categories: ['modern', 'nostalgia'], emotions: ['school singer'], genres: ['pop', 'indie', 'rock'], priority: 1 },
    { word: 'เจ้าชู้', categories: ['modern', 'heartbreak', 'humor'], emotions: ['flirty / player'], genres: ['pop', 'lukthung', 'hiphop', 'rnb'], priority: 1 },
    { word: 'ลองดู', categories: ['modern', 'hope', 'love'], emotions: ['try it out'], genres: ['pop', 'rnb', 'hiphop'], priority: 1 },
    { word: 'ความรู้สึก', categories: ['modern', 'love', 'sadness'], emotions: ['emotions'], priority: 1 },
    { word: 'Baby girl', categories: ['modern', 'love'], emotions: ['flirty', 'affectionate'], genres: ['hiphop', 'rnb', 'pop'], regional: 'english', priority: 1 },
    { word: 'first time', categories: ['modern', 'nostalgia'], emotions: ['first experience'], genres: ['pop', 'rnb', 'indie'], regional: 'english', priority: 1 },
    { word: 'my girl', categories: ['modern', 'love'], emotions: ['affectionate'], genres: ['hiphop', 'rnb', 'pop'], regional: 'english', priority: 1 },
    { word: 'Show', categories: ['modern'], emotions: ['performance'], genres: ['hiphop', 'pop', 'rock'], regional: 'english', priority: 1 },
    { word: 'Too Slow', categories: ['modern'], emotions: ['impatient'], genres: ['hiphop', 'rnb', 'pop'], regional: 'english', priority: 1 },
    { word: 'you know', categories: ['modern'], emotions: ['casual'], genres: ['hiphop', 'rnb', 'pop'], regional: 'english', priority: 1 },
    { word: 'beautiful', categories: ['modern', 'love'], emotions: ['admiring'], genres: ['pop', 'rnb', 'indie'], regional: 'english', priority: 1 },
    { word: 'so cute', categories: ['modern', 'love'], emotions: ['cute'], genres: ['pop', 'indie'], regional: 'english', priority: 1 },
    { word: 'fall in you', categories: ['modern', 'love'], emotions: ['falling in love'], genres: ['pop', 'rnb', 'indie'], regional: 'english', priority: 1 }
];

/**
 * Perform intelligent rule-based candidate selection as a fast/reliable pre-filter or fallback.
 */
export function getRuleBasedCandidates(
    textContext: string,
    genres: string[],
    moods: string[]
): { candidateCore: string[]; candidateSupporting: string[]; candidateOptional: string[]; candidateAvoid: string[] } {
    const lowerContext = textContext.toLowerCase();
    const joinedGenres = genres.join(' ').toLowerCase();
    const joinedMoods = moods.join(' ').toLowerCase();

    const isIsan = joinedGenres.includes('อีสาน') || joinedGenres.includes('isan') || joinedGenres.includes('หมอลำ') || joinedGenres.includes('mor lam') || lowerContext.includes('อีสาน');
    const isNorthern = joinedGenres.includes('เหนือ') || joinedGenres.includes('lanna') || joinedGenres.includes('คำเมือง') || lowerContext.includes('เหนือ');
    const isSouthern = joinedGenres.includes('ใต้') || joinedGenres.includes('southern') || lowerContext.includes('ใต้');
    const isTraditional = joinedGenres.includes('traditional') || joinedGenres.includes('ไทยเดิม') || joinedGenres.includes('วรรณคดี');
    const isModern = joinedGenres.includes('hip hop') || joinedGenres.includes('r&b') || joinedGenres.includes('pop') || joinedGenres.includes('rock');

    const isSad = joinedMoods.includes('เศร้า') || joinedMoods.includes('sad') || joinedMoods.includes('อกหัก') || joinedMoods.includes('heartbreak');
    const isLove = joinedMoods.includes('รัก') || joinedMoods.includes('love') || joinedMoods.includes('romantic') || joinedMoods.includes('หวาน');
    const isFaith = joinedMoods.includes('มู') || joinedMoods.includes('ศรัทธา') || joinedMoods.includes('faith') || joinedMoods.includes('spiritual') || lowerContext.includes('สาธุ') || lowerContext.includes('วัด');

    const core: string[] = [];
    const supporting: string[] = [];
    const optional: string[] = [];
    const avoid: string[] = [];

    CATEGORIZED_VOCABULARY.forEach(item => {
        // Regional mis-matches should be avoided
        if (item.regional === 'isan' && !isIsan && (isSouthern || isNorthern || isTraditional)) {
            avoid.push(item.word);
            return;
        }
        if (item.regional === 'northern' && !isNorthern && (isIsan || isSouthern)) {
            avoid.push(item.word);
            return;
        }
        if (item.regional === 'southern' && !isSouthern && (isIsan || isNorthern)) {
            avoid.push(item.word);
            return;
        }
        if (item.regional === 'english' && isTraditional) {
            avoid.push(item.word);
            return;
        }
        if (item.categories.includes('traditional') && isModern && !isTraditional && item.word.length > 5) {
            avoid.push(item.word);
            return;
        }

        // Positive matching
        let score = 0;
        if (isIsan && item.regional === 'isan') score += 5;
        if (isNorthern && item.regional === 'northern') score += 5;
        if (isSouthern && item.regional === 'southern') score += 5;
        if (isFaith && item.categories.includes('faith')) score += 4;
        if (isSad && (item.categories.includes('sadness') || item.categories.includes('heartbreak'))) score += 3;
        if (isLove && (item.categories.includes('love') || item.categories.includes('longing'))) score += 3;
        if (isTraditional && item.categories.includes('traditional')) score += 4;

        if (lowerContext.includes(item.word.toLowerCase())) {
            score += 6;
        }

        if (score >= 5) {
            core.push(item.word);
        } else if (score >= 2) {
            supporting.push(item.word);
        } else {
            optional.push(item.word);
        }
    });

    return {
        candidateCore: core.slice(0, 8),
        candidateSupporting: supporting.slice(0, 10),
        candidateOptional: optional.slice(0, 10),
        candidateAvoid: Array.from(new Set(avoid)).slice(0, 10)
    };
}

/**
 * Main Smart Vocabulary Selection Engine
 * Analyzes inputs, context, genres, moods, and custom vocabulary using AI + heuristic fallback
 */
export async function selectSmartVocabulary(
    userPromptOrInputs: string | SongGenerationInputs,
    genresOrLanguage?: string[] | Language,
    moodsOrCustomVocab?: string[] | string,
    languageParam?: Language,
    customVocabParam?: string,
    apiKeyParam?: string
): Promise<SmartVocabularyResult> {
    // Standardize input arguments flexibly to support both positional and object signatures
    let userPrompt = '';
    let genres: string[] = [];
    let moods: string[] = [];
    let tempos: string[] = [];
    let vocalGender = '';
    let instruments: string[] = [];
    let language: Language = 'th';
    let customVocabulary = '';
    let apiKey = '';

    if (typeof userPromptOrInputs === 'object' && userPromptOrInputs !== null) {
        const inp = userPromptOrInputs;
        userPrompt = [inp.userPrompt, inp.prompt, inp.story, inp.coreTheme].filter(Boolean).join(' ');
        genres = inp.genres || inp.selectedGenre || [];
        moods = inp.moods || inp.selectedMood || [];
        tempos = inp.tempos || inp.selectedTempo || [];
        vocalGender = inp.vocalGender || inp.selectedVocal || '';
        instruments = inp.instruments || inp.selectedInstruments || [];
        customVocabulary = inp.customVocabulary || '';
        
        if (typeof genresOrLanguage === 'string') language = genresOrLanguage as Language;
        if (typeof moodsOrCustomVocab === 'string') customVocabulary = customVocabulary || moodsOrCustomVocab;
        if (typeof languageParam === 'string' && (languageParam === 'th' || languageParam === 'en' || languageParam === 'zh' || languageParam === 'jp')) language = languageParam;
        if (customVocabParam) customVocabulary = customVocabParam;
        if (apiKeyParam) apiKey = apiKeyParam;
    } else {
        userPrompt = String(userPromptOrInputs || '');
        if (Array.isArray(genresOrLanguage)) genres = genresOrLanguage;
        if (Array.isArray(moodsOrCustomVocab)) moods = moodsOrCustomVocab;
        if (languageParam) language = languageParam;
        if (customVocabParam) customVocabulary = customVocabParam;
        if (apiKeyParam) apiKey = apiKeyParam;
    }

    const customList = customVocabulary
        ? customVocabulary.split(',').map(s => s.trim()).filter(Boolean)
        : [];

    const ruleFallback = getRuleBasedCandidates(userPrompt, genres, moods);

    // If no API key provided or Gemini call fails, return structured rule-based selection
    if (!apiKey) {
        const finalCore = Array.from(new Set([...customList, ...ruleFallback.candidateCore])).slice(0, 10);
        return {
            core: finalCore,
            supporting: ruleFallback.candidateSupporting,
            optional: ruleFallback.candidateOptional,
            avoid: ruleFallback.candidateAvoid
        };
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        // Provide a curated sample of relevant database words to Gemini so it can pick core/supporting/optional/avoid
        const candidateWordsString = CATEGORIZED_VOCABULARY
            .map(item => item.word)
            .join(', ');

        const promptMessage = `Act as an expert Thai Music Producer and Lexicographer for Suno AI.
Analyze the following song concept and select the best vocabulary set:

Song Info:
- User Idea / Story: "${userPrompt}"
- Genres: ${genres.length ? genres.join(', ') : 'Not specified'}
- Moods: ${moods.length ? moods.join(', ') : 'Not specified'}
- Tempo: ${tempos.length ? tempos.join(', ') : 'Not specified'}
- Vocal Gender / Style: ${vocalGender || 'Not specified'}
- Instruments: ${instruments.length ? instruments.join(', ') : 'Not specified'}
- Custom User Requested Words: ${customList.length ? customList.join(', ') : 'None'}

Available Database Words Pool:
${candidateWordsString}

TASK:
Categorize vocabulary into 4 distinct lists for generating this specific song:
1. "core": 3 to 8 words from the Database Words Pool (plus custom user words if provided) that BEST anchor the emotional soul, theme, and dialect of this song.
2. "supporting": 4 to 10 words from the pool that fit the poetic/musical context well.
3. "optional": 3 to 8 words that can be used if rhyme or rhythm needs it.
4. "avoid": Words from the database pool that strictly CLASH with this song's style, regional dialect, or atmosphere (e.g. English hip-hop words in traditional Mor Lam, or ancient royal Thai words in modern urban pop).

STRICT RULES:
- User custom words MUST be prioritized into 'core' or 'supporting'.
- Do NOT invent words outside the provided database pool (except user custom words).
- If no database words are appropriate, return empty lists rather than forcing unnatural words.
- Return valid JSON matching schema.`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-3.5-flash-lite',
            contents: promptMessage,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        core: { type: Type.ARRAY, items: { type: Type.STRING } },
                        supporting: { type: Type.ARRAY, items: { type: Type.STRING } },
                        optional: { type: Type.ARRAY, items: { type: Type.STRING } },
                        avoid: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['core', 'supporting', 'optional', 'avoid']
                }
            }
        });

        const parsed = JSON.parse(response.text || '{}');
        
        const coreWords = Array.from(new Set([...customList, ...(parsed.core || [])])).slice(0, 12);
        const supportingWords = (parsed.supporting || []).filter((w: string) => !coreWords.includes(w)).slice(0, 12);
        const optionalWords = (parsed.optional || []).filter((w: string) => !coreWords.includes(w) && !supportingWords.includes(w)).slice(0, 10);
        const avoidWords = (parsed.avoid || []).filter((w: string) => !coreWords.includes(w)).slice(0, 12);

        return {
            core: coreWords,
            supporting: supportingWords,
            optional: optionalWords,
            avoid: avoidWords
        };
    } catch (err) {
        console.warn("Smart Vocabulary Gemini selection fallback triggered:", err);
        const finalCore = Array.from(new Set([...customList, ...ruleFallback.candidateCore])).slice(0, 10);
        return {
            core: finalCore,
            supporting: ruleFallback.candidateSupporting,
            optional: ruleFallback.candidateOptional,
            avoid: ruleFallback.candidateAvoid
        };
    }
}
