import { reactive, computed, watch } from 'vue'
import type { UserProgress, WordStatus } from '../types/korean'

const PROGRESS_STORAGE_KEY = 'korean-pwa-progress-v1'

function getTodayKey(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function loadInitialProgress(): UserProgress {
  const empty: UserProgress = {
    studiedLetters: [],
    studiedGrammar: [],
    wordStatuses: {},
    completedDialogues: [],
    practiceSessionsCompleted: 0,
    dailyActivity: {},
  }
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY)
    if (!raw) return empty
    const parsed = JSON.parse(raw) as Partial<UserProgress>
    return {
      studiedLetters: Array.isArray(parsed.studiedLetters) ? parsed.studiedLetters : [],
      studiedGrammar: Array.isArray(parsed.studiedGrammar) ? parsed.studiedGrammar : [],
      wordStatuses: parsed.wordStatuses && typeof parsed.wordStatuses === 'object' ? parsed.wordStatuses : {},
      completedDialogues: Array.isArray(parsed.completedDialogues) ? parsed.completedDialogues : [],
      practiceSessionsCompleted:
        typeof parsed.practiceSessionsCompleted === 'number' ? parsed.practiceSessionsCompleted : 0,
      dailyActivity:
        parsed.dailyActivity && typeof parsed.dailyActivity === 'object' ? parsed.dailyActivity : {},
    }
  } catch {
    return empty
  }
}

const state = reactive<UserProgress>(loadInitialProgress())

watch(
  state,
  (val) => {
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(val))
    } catch {
      // ignore quota errors
    }
  },
  { deep: true }
)

function recordActivity(points = 1) {
  const key = getTodayKey()
  state.dailyActivity[key] = (state.dailyActivity[key] ?? 0) + points
}

export function useProgress() {
  function isLetterStudied(id: string): boolean {
    return state.studiedLetters.includes(id)
  }

  function toggleLetterStudied(id: string) {
    const idx = state.studiedLetters.indexOf(id)
    if (idx >= 0) {
      state.studiedLetters.splice(idx, 1)
    } else {
      state.studiedLetters.push(id)
      recordActivity(1)
    }
  }

  function getWordStatus(wordId: string): WordStatus {
    return state.wordStatuses[wordId] ?? 'new'
  }

  function setWordStatus(wordId: string, status: WordStatus) {
    state.wordStatuses[wordId] = status
    recordActivity(1)
  }

  function isDialogueCompleted(dialogueId: string): boolean {
    return state.completedDialogues.includes(dialogueId)
  }

  function toggleDialogueCompleted(dialogueId: string) {
    const idx = state.completedDialogues.indexOf(dialogueId)
    if (idx >= 0) {
      state.completedDialogues.splice(idx, 1)
    } else {
      state.completedDialogues.push(dialogueId)
      recordActivity(3)
    }
  }

  function completePracticeSession() {
    state.practiceSessionsCompleted += 1
    recordActivity(5)
  }

  function isGrammarStudied(id: string): boolean {
    return state.studiedGrammar.includes(id)
  }

  function toggleGrammarStudied(id: string) {
    const idx = state.studiedGrammar.indexOf(id)
    if (idx >= 0) {
      state.studiedGrammar.splice(idx, 1)
    } else {
      state.studiedGrammar.push(id)
      recordActivity(2)
    }
  }

  const studiedLettersCount = computed(() => state.studiedLetters.length)
  const studiedGrammarCount = computed(() => state.studiedGrammar.length)

  const knownWordsCount = computed(
    () => Object.values(state.wordStatuses).filter((s) => s === 'known').length
  )

  const reviewWordsCount = computed(
    () => Object.values(state.wordStatuses).filter((s) => s === 'review').length
  )

  const completedDialoguesCount = computed(() => state.completedDialogues.length)

  const todayActivityCount = computed(() => state.dailyActivity[getTodayKey()] ?? 0)

  const activeDaysCount = computed(() => Object.keys(state.dailyActivity).length)

  return {
    state,
    isLetterStudied,
    toggleLetterStudied,
    isGrammarStudied,
    toggleGrammarStudied,
    getWordStatus,
    setWordStatus,
    isDialogueCompleted,
    toggleDialogueCompleted,
    completePracticeSession,
    studiedLettersCount,
    studiedGrammarCount,
    knownWordsCount,
    reviewWordsCount,
    completedDialoguesCount,
    todayActivityCount,
    activeDaysCount,
  }
}
