<script setup lang="ts">
import { ref, computed } from 'vue'
import { VOCAB_CATEGORIES, ALL_VOCAB_WORDS } from '../data/vocabulary'
import { SPELLING_TASKS, PHRASE_BUILD_TASKS, DRAMA_EAR_TASKS } from '../data/practice'
import type {
  PracticeMode,
  VocabWord,
  SpellingTask,
  PhraseBuildTask,
  DramaEarTask,
} from '../types/korean'
import { useSpeech } from '../composables/useSpeech'
import { useProgress } from '../composables/useProgress'
import SpeakButton from './SpeakButton.vue'

interface MeaningQuestion {
  word: VocabWord
  options: string[]
}

type PracticeDifficulty = 'all' | 'basic' | 'drama'

const SESSION_LENGTH = 8

const { hasKoreanVoice, speak } = useSpeech()
const { completePracticeSession, state: progressState } = useProgress()

const activeMode = ref<PracticeMode | null>(null)
const difficulty = ref<PracticeDifficulty>('all')
const currentIdx = ref(0)
const isFinished = ref(false)

// Session question pools
const meaningQuestions = ref<MeaningQuestion[]>([])
const spellingQuestions = ref<SpellingTask[]>([])
const phraseQuestions = ref<PhraseBuildTask[]>([])
const dramaEarQuestions = ref<DramaEarTask[]>([])

// Per-question state
const wrongOptions = ref<string[]>([])
const isSolved = ref(false)
const hadMistakeThisQuestion = ref(false)
const firstTryCorrectCount = ref(0)
const hintMessage = ref('')

// Phrase builder state
const availableTiles = ref<Array<{ id: number; text: string; used: boolean }>>([])
const assembledTileIds = ref<number[]>([])
const phraseSoftWarning = ref(false)

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = copy[i]
    copy[i] = copy[j]
    copy[j] = tmp
  }
  return copy
}

function resetQuestionState() {
  wrongOptions.value = []
  isSolved.value = false
  hadMistakeThisQuestion.value = false
  hintMessage.value = ''
  phraseSoftWarning.value = false

  if (activeMode.value === 'build-phrase') {
    const q = phraseQuestions.value[currentIdx.value]
    if (q) {
      availableTiles.value = shuffle(
        q.chunks.map((text, idx) => ({ id: idx, text, used: false }))
      )
      assembledTileIds.value = []
    }
  }
}

const currentAudioText = computed(() => {
  if (activeMode.value === 'listen-meaning') {
    return meaningQuestions.value[currentIdx.value]?.word.korean ?? ''
  }
  if (activeMode.value === 'listen-spelling') {
    return spellingQuestions.value[currentIdx.value]?.korean ?? ''
  }
  if (activeMode.value === 'build-phrase') {
    return phraseQuestions.value[currentIdx.value]?.korean ?? ''
  }
  if (activeMode.value === 'drama-ear') {
    return dramaEarQuestions.value[currentIdx.value]?.korean ?? ''
  }
  return ''
})

const currentFallbackTranscription = computed(() => {
  if (activeMode.value === 'listen-meaning') {
    return meaningQuestions.value[currentIdx.value]?.word.transcription ?? ''
  }
  if (activeMode.value === 'listen-spelling') {
    return spellingQuestions.value[currentIdx.value]?.transcription ?? ''
  }
  if (activeMode.value === 'build-phrase') {
    return phraseQuestions.value[currentIdx.value]?.transcription ?? ''
  }
  if (activeMode.value === 'drama-ear') {
    return dramaEarQuestions.value[currentIdx.value]?.transcription ?? ''
  }
  return ''
})

function startSession(mode: PracticeMode) {
  activeMode.value = mode
  currentIdx.value = 0
  isFinished.value = false
  firstTryCorrectCount.value = 0

  if (mode === 'listen-meaning') {
    const allowedCatIds = new Set(
      VOCAB_CATEGORIES.filter((c) => {
        if (difficulty.value === 'basic') return c.level === 1
        if (difficulty.value === 'drama') return c.level >= 2
        return true
      }).map((c) => c.id)
    )
    const pool = ALL_VOCAB_WORDS.filter((w) => allowedCatIds.has(w.categoryId))
    const picked = shuffle(pool).slice(0, SESSION_LENGTH)
    meaningQuestions.value = picked.map((word) => {
      const distractors = shuffle(
        ALL_VOCAB_WORDS.filter((w) => w.id !== word.id)
      )
        .slice(0, 3)
        .map((w) => w.translation)
      return {
        word,
        options: shuffle([word.translation, ...distractors]),
      }
    })
  } else if (mode === 'listen-spelling') {
    const pool = SPELLING_TASKS.filter((t) => {
      if (difficulty.value === 'basic') return t.level === 1
      if (difficulty.value === 'drama') return t.level >= 2
      return true
    })
    spellingQuestions.value = shuffle(pool)
      .slice(0, SESSION_LENGTH)
      .map((t) => ({
        ...t,
        options: shuffle(t.options),
      }))
  } else if (mode === 'build-phrase') {
    const pool = PHRASE_BUILD_TASKS.filter((t) => {
      if (difficulty.value === 'basic') return t.level === 1
      if (difficulty.value === 'drama') return t.level >= 2
      return true
    })
    phraseQuestions.value = shuffle(pool).slice(0, SESSION_LENGTH)
  } else {
    dramaEarQuestions.value = shuffle(DRAMA_EAR_TASKS)
      .slice(0, SESSION_LENGTH)
      .map((t) => ({
        ...t,
        options: shuffle(t.options),
      }))
  }

  resetQuestionState()

  // Озвучиваем первое задание прямо внутри события @click
  if (hasKoreanVoice.value && currentAudioText.value) {
    speak(currentAudioText.value, 'normal')
  }
}

function selectMeaningOption(opt: string) {
  if (isSolved.value) return
  const q = meaningQuestions.value[currentIdx.value]
  if (!q) return

  if (opt === q.word.translation) {
    isSolved.value = true
    if (!hadMistakeThisQuestion.value) {
      firstTryCorrectCount.value += 1
    }
    hintMessage.value = ''
  } else {
    if (!wrongOptions.value.includes(opt)) {
      wrongOptions.value.push(opt)
    }
    hadMistakeThisQuestion.value = true
    hintMessage.value = `Подсказка: звучит как [${q.word.transcription}] (${q.word.syllables}). Попробуйте послушать медленно и выбрать снова.`
  }
}

function selectSpellingOption(opt: string) {
  if (isSolved.value) return
  const q = spellingQuestions.value[currentIdx.value]
  if (!q) return

  if (opt === q.korean) {
    isSolved.value = true
    if (!hadMistakeThisQuestion.value) {
      firstTryCorrectCount.value += 1
    }
    hintMessage.value = ''
  } else {
    if (!wrongOptions.value.includes(opt)) {
      wrongOptions.value.push(opt)
    }
    hadMistakeThisQuestion.value = true
    hintMessage.value = `Разбор звучания: [${q.transcription}] (${q.meaning}). ${q.hint}`
  }
}

function tapAvailableTile(tileId: number) {
  if (isSolved.value) return
  const tile = availableTiles.value.find((t) => t.id === tileId)
  if (!tile || tile.used) return
  tile.used = true
  assembledTileIds.value.push(tileId)
  phraseSoftWarning.value = false
}

function removeAssembledTile(tileId: number) {
  if (isSolved.value) return
  assembledTileIds.value = assembledTileIds.value.filter((id) => id !== tileId)
  const tile = availableTiles.value.find((t) => t.id === tileId)
  if (tile) tile.used = false
  phraseSoftWarning.value = false
}

const assembledTiles = computed(() =>
  assembledTileIds.value
    .map((id) => availableTiles.value.find((t) => t.id === id))
    .filter((t): t is { id: number; text: string; used: boolean } => Boolean(t))
)

function checkPhrase() {
  const q = phraseQuestions.value[currentIdx.value]
  if (!q) return
  const attempt = assembledTiles.value.map((t) => t.text).join(' ')
  const target = q.chunks.join(' ')

  if (attempt === target) {
    isSolved.value = true
    phraseSoftWarning.value = false
    if (!hadMistakeThisQuestion.value) {
      firstTryCorrectCount.value += 1
    }
    hintMessage.value = ''
  } else {
    hadMistakeThisQuestion.value = true
    phraseSoftWarning.value = true
    hintMessage.value = `Почти! Звучит как [${q.transcription}] («${q.translation}»). ${q.hint}`
  }
}

function nextQuestion() {
  if (currentIdx.value + 1 >= SESSION_LENGTH) {
    isFinished.value = true
    completePracticeSession()
    return
  }
  currentIdx.value += 1
  resetQuestionState()
  if (hasKoreanVoice.value && currentAudioText.value) {
    speak(currentAudioText.value, 'normal')
  }
}

function exitToModes() {
  activeMode.value = null
  isFinished.value = false
}

function selectDramaEarOption(opt: string) {
  if (isSolved.value) return
  const q = dramaEarQuestions.value[currentIdx.value]
  if (!q) return

  if (opt === q.translation) {
    isSolved.value = true
    if (!hadMistakeThisQuestion.value) {
      firstTryCorrectCount.value += 1
    }
    hintMessage.value = ''
  } else {
    if (!wrongOptions.value.includes(opt)) {
      wrongOptions.value.push(opt)
    }
    hadMistakeThisQuestion.value = true
    hintMessage.value = `Подсказка (${q.context}): [${q.transcription}]. ${q.hint}`
  }
}

const currentMeaningQ = computed(() => meaningQuestions.value[currentIdx.value] ?? null)
const currentSpellingQ = computed(() => spellingQuestions.value[currentIdx.value] ?? null)
const currentPhraseQ = computed(() => phraseQuestions.value[currentIdx.value] ?? null)
const currentDramaEarQ = computed(() => dramaEarQuestions.value[currentIdx.value] ?? null)
</script>

<template>
  <section class="practice-tab">
    <!-- ВЫБОР РЕЖИМА ТРЕНАЖЁРА -->
    <template v-if="!activeMode">
      <h2 class="section-heading">Тренажёр (Практика на слух)</h2>
      <p class="section-desc">
        Спокойные сессии по {{ SESSION_LENGTH }} заданий без таймеров и стресса.
        Пройдено тренировок: <strong>{{ progressState.practiceSessionsCompleted }}</strong>.
      </p>

      <div class="pill-tabs diff-pills" role="tablist" aria-label="Уровень заданий">
        <button
          type="button"
          class="pill-tab"
          :class="{ active: difficulty === 'all' }"
          @click="difficulty = 'all'"
        >
          Все уровни
        </button>
        <button
          type="button"
          class="pill-tab"
          :class="{ active: difficulty === 'basic' }"
          @click="difficulty = 'basic'"
        >
          База (A0–A1)
        </button>
        <button
          type="button"
          class="pill-tab"
          :class="{ active: difficulty === 'drama' }"
          @click="difficulty = 'drama'"
        >
          Разговорный и дорамы (A2–B1)
        </button>
      </div>

      <div class="mode-grid">
        <article class="card mode-card">
          <div class="mode-icon">🎧</div>
          <h3 class="mode-title">1. Пойми на слух</h3>
          <p class="mode-desc">
            Приложение произносит слово или короткую фразу — выберите верный перевод из 4 вариантов.
            В любой момент можно повторить медленно.
          </p>
          <button
            type="button"
            class="btn btn-primary mode-start-btn"
            @click="startSession('listen-meaning')"
          >
            Начать тренировку
          </button>
        </article>

        <article class="card mode-card">
          <div class="mode-icon">✍️</div>
          <h3 class="mode-title">2. Угадай написание</h3>
          <p class="mode-desc">
            Тренировка различения схожих звуков (ㄱ/ㅋ/ㄲ, ㅅ/ㅆ, ㅓ/ㅗ): послушайте слово и найдите
            его правильное написание на хангыле.
          </p>
          <button
            type="button"
            class="btn btn-primary mode-start-btn"
            @click="startSession('listen-spelling')"
          >
            Начать тренировку
          </button>
        </article>

        <article class="card mode-card">
          <div class="mode-icon">🧩</div>
          <h3 class="mode-title">3. Собери фразу на слух</h3>
          <p class="mode-desc">
            Прослушайте короткое предложение из 2–3 слов и соберите его, нажимая на карточки-слова
            в правильном порядке.
          </p>
          <button
            type="button"
            class="btn btn-primary mode-start-btn"
            @click="startSession('build-phrase')"
          >
            Начать тренировку
          </button>
        </article>

        <article class="card mode-card drama-mode-card">
          <div class="mode-icon">🎬</div>
          <h3 class="mode-title">4. Дорамный слух</h3>
          <p class="mode-desc">
            Звучит живая реплика из дорамной сцены (под дождём, в офисе, на панмале) —
            уловите смысл целиком на слух и выберите точный перевод!
          </p>
          <button
            type="button"
            class="btn btn-primary mode-start-btn"
            @click="startSession('drama-ear')"
          >
            Начать тренировку
          </button>
        </article>
      </div>
    </template>

    <!-- ИТОГИ СЕССИИ -->
    <template v-else-if="isFinished">
      <div class="card summary-card">
        <div class="summary-emoji">🌿</div>
        <h2 class="summary-title">Отличная тренировка!</h2>
        <p class="summary-sub">
          Вы спокойно разобрали все <strong>{{ SESSION_LENGTH }}</strong> заданий.
          С первой попытки получилось <strong>{{ firstTryCorrectCount }} из {{ SESSION_LENGTH }}</strong>.
        </p>
        <p class="muted summary-note">
          Каждое прослушивание помогает мозгу привыкать к ритму и звукам корейской речи — даже если
          пришлось воспользоваться подсказкой.
        </p>

        <div class="summary-actions">
          <button
            type="button"
            class="btn btn-primary"
            @click="startSession(activeMode)"
          >
            Пройти ещё одну сессию
          </button>
          <button type="button" class="btn btn-outline" @click="exitToModes">
            Выбрать другой режим
          </button>
        </div>
      </div>
    </template>

    <!-- АКТИВНАЯ СЕССИЯ -->
    <template v-else>
      <div class="session-top">
        <button type="button" class="btn btn-outline" @click="exitToModes">
          ← К режимам
        </button>
        <div class="session-progress-wrap">
          <span class="session-step">Задание {{ currentIdx + 1 }} из {{ SESSION_LENGTH }}</span>
          <div class="session-bar">
            <div
              class="session-bar-fill"
              :style="{ width: `${((currentIdx + (isSolved ? 1 : 0)) / SESSION_LENGTH) * 100}%` }"
            />
          </div>
        </div>
      </div>

      <div class="card task-card">
        <!-- БЛОК ПРОСЛУШИВАНИЯ -->
        <div class="listen-box">
          <p class="task-prompt">
            <template v-if="activeMode === 'listen-meaning'">
              Послушайте и выберите верный перевод:
            </template>
            <template v-else-if="activeMode === 'listen-spelling'">
              Послушайте и выберите правильное написание на хангыле:
            </template>
            <template v-else-if="activeMode === 'build-phrase'">
              Послушайте фразу и соберите её из слов по порядку:
            </template>
            <template v-else>
              <span v-if="currentDramaEarQ" class="badge badge-amber ctx-badge">
                🎬 {{ currentDramaEarQ.context }}
              </span>
              <span class="block-prompt">Послушайте реплику героя и выберите её смысл:</span>
            </template>
          </p>

          <div class="listen-buttons">
            <SpeakButton
              :text="currentAudioText"
              label="Послушать (0.95x)"
              speed="normal"
              variant="primary"
            />
            <SpeakButton
              :text="currentAudioText"
              label="Повторить медленно (0.65x)"
              speed="slow"
              variant="soft"
            />
          </div>

          <div v-if="!hasKoreanVoice" class="fallback-cue">
            Озвучка недоступна в браузере — ориентируйтесь на звучание:
            <strong>[{{ currentFallbackTranscription }}]</strong>
          </div>
        </div>

        <!-- РЕЖИМ 1: ПОЙМИ НА СЛУХ -->
        <div v-if="activeMode === 'listen-meaning' && currentMeaningQ" class="options-grid">
          <button
            v-for="opt in currentMeaningQ.options"
            :key="opt"
            type="button"
            class="option-btn"
            :class="{
              correct: isSolved && opt === currentMeaningQ.word.translation,
              'soft-wrong': wrongOptions.includes(opt),
            }"
            @click="selectMeaningOption(opt)"
          >
            {{ opt }}
          </button>
        </div>

        <!-- РЕЖИМ 2: УГАДАЙ НАПИСАНИЕ -->
        <div v-else-if="activeMode === 'listen-spelling' && currentSpellingQ" class="options-grid">
          <button
            v-for="opt in currentSpellingQ.options"
            :key="opt"
            type="button"
            class="option-btn kr option-kr"
            :class="{
              correct: isSolved && opt === currentSpellingQ.korean,
              'soft-wrong': wrongOptions.includes(opt),
            }"
            @click="selectSpellingOption(opt)"
          >
            {{ opt }}
          </button>
        </div>

        <!-- РЕЖИМ 3: СОБЕРИ ФРАЗУ НА СЛУХ -->
        <div v-else-if="activeMode === 'build-phrase' && currentPhraseQ" class="phrase-builder">
          <div
            class="assembled-zone"
            :class="{ 'soft-warn': phraseSoftWarning, 'zone-solved': isSolved }"
          >
            <span v-if="assembledTiles.length === 0" class="muted">
              Нажимайте на слова ниже, чтобы собрать фразу...
            </span>
            <button
              v-for="tile in assembledTiles"
              :key="`asm-${tile.id}`"
              type="button"
              class="kr word-tile placed"
              @click="removeAssembledTile(tile.id)"
            >
              {{ tile.text }}
            </button>
          </div>

          <div class="tiles-bank">
            <button
              v-for="tile in availableTiles"
              :key="`bank-${tile.id}`"
              type="button"
              class="kr word-tile"
              :disabled="tile.used || isSolved"
              @click="tapAvailableTile(tile.id)"
            >
              {{ tile.text }}
            </button>
          </div>

          <div v-if="!isSolved" class="check-row">
            <button
              type="button"
              class="btn btn-primary"
              :disabled="assembledTiles.length !== currentPhraseQ.chunks.length"
              @click="checkPhrase"
            >
              Проверить фразу
            </button>
          </div>
        </div>

        <!-- РЕЖИМ 4: ДОРАМНЫЙ СЛУХ -->
        <div v-else-if="activeMode === 'drama-ear' && currentDramaEarQ" class="drama-options-list">
          <button
            v-for="opt in currentDramaEarQ.options"
            :key="opt"
            type="button"
            class="option-btn drama-opt-btn"
            :class="{
              correct: isSolved && opt === currentDramaEarQ.translation,
              'soft-wrong': wrongOptions.includes(opt),
            }"
            @click="selectDramaEarOption(opt)"
          >
            {{ opt }}
          </button>
        </div>

        <!-- МЯГКАЯ ПОДСКАЗКА ПРИ ОШИБКЕ -->
        <div v-if="hintMessage && !isSolved" class="hint-banner">
          {{ hintMessage }}
        </div>

        <!-- ПОХВАЛА И РАЗБОР ПОСЛЕ ВЕРНОГО ОТВЕТА -->
        <div v-if="isSolved" class="solved-banner">
          <div class="solved-main">
            <span class="badge badge-sage">✓ Верно!</span>
            <template v-if="activeMode === 'listen-meaning' && currentMeaningQ">
              <div class="kr solved-kr">{{ currentMeaningQ.word.korean }}</div>
              <div class="transcription">[{{ currentMeaningQ.word.transcription }}]</div>
              <div>{{ currentMeaningQ.word.translation }}</div>
            </template>
            <template v-else-if="activeMode === 'listen-spelling' && currentSpellingQ">
              <div class="kr solved-kr">{{ currentSpellingQ.korean }}</div>
              <div class="transcription">[{{ currentSpellingQ.transcription }}]</div>
              <div>{{ currentSpellingQ.meaning }}</div>
            </template>
            <template v-else-if="activeMode === 'build-phrase' && currentPhraseQ">
              <div class="kr solved-kr">{{ currentPhraseQ.korean }}</div>
              <div class="transcription">[{{ currentPhraseQ.transcription }}]</div>
              <div>{{ currentPhraseQ.translation }}</div>
            </template>
            <template v-else-if="activeMode === 'drama-ear' && currentDramaEarQ">
              <div class="kr solved-kr">{{ currentDramaEarQ.korean }}</div>
              <div class="transcription">[{{ currentDramaEarQ.transcription }}]</div>
              <div>{{ currentDramaEarQ.translation }}</div>
            </template>
          </div>

          <button type="button" class="btn btn-primary next-btn" @click="nextQuestion">
            {{ currentIdx + 1 >= SESSION_LENGTH ? 'Завершить тренировку' : 'Дальше →' }}
          </button>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.diff-pills {
  margin-bottom: 16px;
}

.drama-mode-card {
  border-color: var(--amber-border);
  background: linear-gradient(180deg, #ffffff 0%, #fffcf5 100%);
}

.ctx-badge {
  margin-bottom: 6px;
}

.block-prompt {
  display: block;
}

.drama-options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.drama-opt-btn {
  text-align: left;
  line-height: 1.4;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}

.mode-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mode-icon {
  font-size: 2rem;
}

.mode-title {
  margin: 0;
  font-size: 1.12rem;
}

.mode-desc {
  margin: 0;
  font-size: 0.94rem;
  color: var(--text-secondary);
  flex: 1;
}

.mode-start-btn {
  margin-top: 6px;
  width: 100%;
}

/* Session */
.session-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.session-progress-wrap {
  flex: 1;
  min-width: 180px;
  max-width: 340px;
}

.session-step {
  display: block;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.session-bar {
  height: 8px;
  border-radius: 999px;
  background: var(--surface-subtle);
  overflow: hidden;
}

.session-bar-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.25s ease;
}

.task-card {
  max-width: 640px;
  margin: 0 auto;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.listen-box {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.task-prompt {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text);
}

.listen-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.fallback-cue {
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  background: var(--amber-soft);
  border: 1px solid var(--amber-border);
  font-size: 0.94rem;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}

.option-btn {
  min-height: 58px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--border);
  background: var(--bg);
  font-size: 1.02rem;
  font-weight: 600;
  text-align: center;
  transition: all 0.15s ease;
}

.option-btn:hover {
  border-color: var(--accent-border);
  background: var(--surface);
}

.option-kr {
  font-size: 1.8rem;
  min-height: 68px;
}

.option-btn.correct {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent);
}

.option-btn.soft-wrong {
  background: var(--amber-soft);
  border-color: var(--amber-border);
  color: var(--amber);
}

/* Phrase builder */
.phrase-builder {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.assembled-zone {
  min-height: 76px;
  padding: 14px;
  border-radius: var(--radius-sm);
  border: 2px dashed var(--border);
  background: var(--bg);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.16s ease;
}

.assembled-zone.soft-warn {
  border-color: var(--amber-border);
  background: var(--amber-soft);
}

.assembled-zone.zone-solved {
  border-style: solid;
  border-color: var(--accent);
  background: var(--accent-soft);
}

.tiles-bank {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.word-tile {
  min-height: 52px;
  padding: 10px 18px;
  border-radius: 12px;
  border: 1.5px solid var(--border);
  background: var(--surface);
  font-size: 1.35rem;
  font-weight: 600;
  box-shadow: var(--shadow-sm);
  transition: all 0.14s ease;
}

.word-tile:hover:not(:disabled) {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.word-tile:disabled {
  opacity: 0.35;
  cursor: default;
}

.word-tile.placed {
  background: var(--accent);
  border-color: var(--accent);
  color: #ffffff;
}

.check-row {
  display: flex;
  justify-content: center;
}

.check-row .btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.hint-banner {
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  background: var(--amber-soft);
  border: 1px solid var(--amber-border);
  color: var(--amber);
  font-size: 0.94rem;
}

.solved-banner {
  padding: 16px;
  border-radius: var(--radius-sm);
  background: var(--accent-soft);
  border: 1px solid var(--accent-border);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.solved-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.solved-kr {
  font-size: 1.5rem;
  font-weight: 600;
}

.next-btn {
  min-width: 160px;
}

/* Summary */
.summary-card {
  max-width: 540px;
  margin: 16px auto;
  padding: 32px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.summary-emoji {
  font-size: 3rem;
}

.summary-title {
  margin: 0;
  font-size: 1.5rem;
}

.summary-sub {
  margin: 0;
  font-size: 1.05rem;
}

.summary-note {
  margin: 0;
  font-size: 0.94rem;
}

.summary-actions {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}
</style>

