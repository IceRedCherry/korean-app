export type AppTab = 'hangul' | 'grammar' | 'vocabulary' | 'dialogues' | 'practice'

export type SpeechSpeed = 'slow' | 'normal'

export type CourseLevel = 1 | 2 | 3

export type HangulCategory =
  | 'basic-vowel'
  | 'basic-consonant'
  | 'complex-vowel'
  | 'double-consonant'

export interface HangulChar {
  id: string
  char: string
  /** Слог для чёткого произношения через Web Speech API (ko-KR) */
  speakText: string
  category: HangulCategory
  nameKo: string
  nameRu: string
  /** Транскрипция по системе Концевича */
  transcription: string
  soundHint: string
  mnemonic: string
  exampleWord: {
    korean: string
    transcription: string
    meaning: string
  }
}

export interface ConsonantComparisonItem {
  char: string
  kind: 'Простая' | 'Придыхательная' | 'Напряжённая'
  syllable: string
  transcription: string
  tip: string
  word: string
  wordTranscription: string
  wordMeaning: string
}

export interface ConsonantComparisonGroup {
  id: string
  title: string
  description: string
  items: ConsonantComparisonItem[]
}

export interface BatchimSoundGroup {
  id: string
  finalSound: string
  letters: string[]
  explanation: string
  examples: Array<{
    korean: string
    transcription: string
    meaning: string
  }>
}

export interface LiaisonRule {
  id: string
  title: string
  formula: string
  explanation: string
  examples: Array<{
    written: string
    pronounced: string
    transcription: string
    meaning: string
    note: string
  }>
}

export interface GrammarExample {
  korean: string
  transcription: string
  translation: string
  note?: string
}

export interface GrammarLesson {
  id: string
  level: 1 | 2 | 3 | 4
  title: string
  pattern: string
  summary: string
  explanation: string
  dramaTip?: string
  examples: GrammarExample[]
}

export interface SpeechStyleRow {
  meaning: string
  formal: string
  polite: string
  banmal: string
  transcriptionBanmal: string
}

export interface ContractionRow {
  full: string
  short: string
  transcription: string
  meaning: string
}

export interface VocabExample {
  korean: string
  transcription: string
  translation: string
}

export interface VocabWord {
  id: string
  categoryId: string
  korean: string
  translation: string
  /** Как реально слышится в живой речи */
  transcription: string
  /** Разбор по слогам */
  syllables: string
  example: VocabExample
}

export interface VocabCategory {
  id: string
  level: CourseLevel
  title: string
  subtitle: string
  icon: string
  words: VocabWord[]
}

export type WordStatus = 'new' | 'review' | 'known'

export interface DialogueToken {
  text: string
  meaning?: string
  transcription?: string
  note?: string
}

export interface DialogueLine {
  id: string
  speaker: string
  side: 'left' | 'right'
  korean: string
  transcription: string
  translation: string
  tokens: DialogueToken[]
}

export interface Dialogue {
  id: string
  level: CourseLevel
  styleTag: string
  title: string
  situation: string
  icon: string
  lines: DialogueLine[]
}

export type PracticeMode =
  | 'listen-meaning'
  | 'listen-spelling'
  | 'build-phrase'
  | 'drama-ear'

export interface SpellingTask {
  id: string
  level: CourseLevel
  korean: string
  transcription: string
  meaning: string
  options: string[]
  hint: string
}

export interface PhraseBuildTask {
  id: string
  level: CourseLevel
  korean: string
  transcription: string
  translation: string
  /** Слова в правильном порядке */
  chunks: string[]
  hint: string
}

export interface DramaEarTask {
  id: string
  context: string
  korean: string
  transcription: string
  translation: string
  options: string[]
  hint: string
}

export interface UserProgress {
  studiedLetters: string[]
  studiedGrammar: string[]
  wordStatuses: Record<string, WordStatus>
  completedDialogues: string[]
  practiceSessionsCompleted: number
  dailyActivity: Record<string, number>
}
