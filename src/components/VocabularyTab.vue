<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { VOCAB_CATEGORIES, ALL_VOCAB_WORDS } from '../data/vocabulary'
import type { VocabCategory, CourseLevel } from '../types/korean'
import { useProgress } from '../composables/useProgress'
import SpeakButton from './SpeakButton.vue'

type DeckFilter = 'active' | 'review' | 'all'
type LevelFilter = 'all' | CourseLevel

const { getWordStatus, setWordStatus, knownWordsCount, reviewWordsCount } = useProgress()

const selectedCategoryId = ref<string | null>(null)
const levelFilter = ref<LevelFilter>('all')
const deckFilter = ref<DeckFilter>('active')
const currentIndex = ref(0)
const isFlipped = ref(false)

const filteredCategories = computed(() => {
  if (levelFilter.value === 'all') return VOCAB_CATEGORIES
  return VOCAB_CATEGORIES.filter((c) => c.level === levelFilter.value)
})

const LEVEL_BADGE: Record<CourseLevel, string> = {
  1: 'Ур. 1 · База',
  2: 'Ур. 2 · Разговорный',
  3: 'Ур. 3 · Дорамы',
}

const selectedCategory = computed<VocabCategory | null>(
  () => VOCAB_CATEGORIES.find((c) => c.id === selectedCategoryId.value) ?? null
)

const deckWords = computed(() => {
  if (!selectedCategory.value) return []
  const words = selectedCategory.value.words
  if (deckFilter.value === 'active') {
    return words.filter((w) => getWordStatus(w.id) !== 'known')
  }
  if (deckFilter.value === 'review') {
    return words.filter((w) => getWordStatus(w.id) === 'review')
  }
  return words
})

const currentWord = computed(() => {
  if (deckWords.value.length === 0) return null
  const safeIdx = Math.min(currentIndex.value, deckWords.value.length - 1)
  return deckWords.value[safeIdx] ?? null
})

watch([selectedCategoryId, deckFilter], () => {
  currentIndex.value = 0
  isFlipped.value = false
})

function openCategory(id: string) {
  selectedCategoryId.value = id
  deckFilter.value = 'active'
  currentIndex.value = 0
  isFlipped.value = false
}

function getCategoryKnownCount(cat: VocabCategory): number {
  return cat.words.filter((w) => getWordStatus(w.id) === 'known').length
}

function prevCard() {
  if (deckWords.value.length === 0) return
  isFlipped.value = false
  currentIndex.value =
    (currentIndex.value - 1 + deckWords.value.length) % deckWords.value.length
}

function nextCard() {
  if (deckWords.value.length === 0) return
  isFlipped.value = false
  currentIndex.value = (currentIndex.value + 1) % deckWords.value.length
}

function markReview() {
  if (!currentWord.value) return
  setWordStatus(currentWord.value.id, 'review')
  isFlipped.value = false
  if (deckWords.value.length > 1) {
    currentIndex.value = (currentIndex.value + 1) % deckWords.value.length
  }
}

function markKnown() {
  if (!currentWord.value) return
  const wasActiveFilter = deckFilter.value === 'active'
  setWordStatus(currentWord.value.id, 'known')
  isFlipped.value = false
  if (wasActiveFilter) {
    // Текущее слово убралось из активной колоды, индекс остаётся валидным
    if (currentIndex.value >= deckWords.value.length) {
      currentIndex.value = Math.max(0, deckWords.value.length - 1)
    }
  } else if (deckWords.value.length > 1) {
    currentIndex.value = (currentIndex.value + 1) % deckWords.value.length
  }
}

function resetWordToActive() {
  if (!currentWord.value) return
  setWordStatus(currentWord.value.id, 'review')
}
</script>

<template>
  <section class="vocab-tab">
    <!-- СПИСОК КАТЕГОРИЙ -->
    <template v-if="!selectedCategory">
      <h2 class="section-heading">Словарь и фразы</h2>
      <p class="section-desc">
        Изучено слов: <strong>{{ knownWordsCount }} из {{ ALL_VOCAB_WORDS.length }}</strong>
        <span v-if="reviewWordsCount > 0"> · На повторении: <strong>{{ reviewWordsCount }}</strong></span>
      </p>

      <div class="pill-tabs level-pills" role="tablist" aria-label="Уровень словаря">
        <button
          type="button"
          class="pill-tab"
          :class="{ active: levelFilter === 'all' }"
          @click="levelFilter = 'all'"
        >
          Все темы ({{ VOCAB_CATEGORIES.length }})
        </button>
        <button
          type="button"
          class="pill-tab"
          :class="{ active: levelFilter === 1 }"
          @click="levelFilter = 1"
        >
          Ур. 1 · База
        </button>
        <button
          type="button"
          class="pill-tab"
          :class="{ active: levelFilter === 2 }"
          @click="levelFilter = 2"
        >
          Ур. 2 · Быт и офис
        </button>
        <button
          type="button"
          class="pill-tab"
          :class="{ active: levelFilter === 3 }"
          @click="levelFilter = 3"
        >
          Ур. 3 · Дорамы и панмаль
        </button>
      </div>

      <div class="category-grid">
        <button
          v-for="cat in filteredCategories"
          :key="cat.id"
          type="button"
          class="card category-card"
          @click="openCategory(cat.id)"
        >
          <div class="cat-top">
            <span class="cat-icon" aria-hidden="true">{{ cat.icon }}</span>
            <div class="cat-badges">
              <span class="badge" :class="cat.level === 3 ? 'badge-amber' : 'badge-muted'">
                {{ LEVEL_BADGE[cat.level] }}
              </span>
              <span class="badge" :class="getCategoryKnownCount(cat) === cat.words.length ? 'badge-sage' : 'badge-muted'">
                {{ getCategoryKnownCount(cat) }} / {{ cat.words.length }}
              </span>
            </div>
          </div>
          <h3 class="cat-title">{{ cat.title }}</h3>
          <p class="cat-sub">{{ cat.subtitle }}</p>
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{ width: `${(getCategoryKnownCount(cat) / cat.words.length) * 100}%` }"
            />
          </div>
        </button>
      </div>
    </template>

    <!-- КАРТОЧКИ ВНУТРИ КАТЕГОРИИ -->
    <template v-else>
      <div class="deck-header">
        <button type="button" class="btn btn-outline back-btn" @click="selectedCategoryId = null">
          ← Все темы
        </button>
        <div class="deck-title-wrap">
          <h2 class="section-heading">{{ selectedCategory.icon }} {{ selectedCategory.title }}</h2>
        </div>
      </div>

      <div class="pill-tabs" role="tablist">
        <button
          type="button"
          class="pill-tab"
          :class="{ active: deckFilter === 'active' }"
          @click="deckFilter = 'active'"
        >
          Активная колода ({{ selectedCategory.words.filter((w) => getWordStatus(w.id) !== 'known').length }})
        </button>
        <button
          type="button"
          class="pill-tab"
          :class="{ active: deckFilter === 'review' }"
          @click="deckFilter = 'review'"
        >
          Повторить ({{ selectedCategory.words.filter((w) => getWordStatus(w.id) === 'review').length }})
        </button>
        <button
          type="button"
          class="pill-tab"
          :class="{ active: deckFilter === 'all' }"
          @click="deckFilter = 'all'"
        >
          Все слова ({{ selectedCategory.words.length }})
        </button>
      </div>

      <!-- ПУСТАЯ КОЛОДА -->
      <div v-if="!currentWord" class="card empty-deck">
        <div class="empty-emoji">🌿</div>
        <h3 v-if="deckFilter === 'active'">Отличная работа! Все слова этой темы отмечены как изученные.</h3>
        <h3 v-else>В списке «Повторить» пока нет карточек.</h3>
        <p class="muted">
          Вы всегда можете переключиться на вкладку «Все слова», чтобы освежить их в памяти.
        </p>
        <button type="button" class="btn btn-primary" @click="deckFilter = 'all'">
          Показать все слова темы
        </button>
      </div>

      <!-- АКТИВНАЯ КАРТОЧКА -->
      <div v-else class="flashcard-stage">
        <div class="deck-counter">
          <span>Карточка {{ Math.min(currentIndex + 1, deckWords.length) }} из {{ deckWords.length }}</span>
          <span
            v-if="getWordStatus(currentWord.id) === 'known'"
            class="badge badge-sage"
          >
            ✓ Уже знаю
          </span>
          <span
            v-else-if="getWordStatus(currentWord.id) === 'review'"
            class="badge badge-amber"
          >
            На повторении
          </span>
        </div>

        <div
          class="card flashcard"
          :class="{ flipped: isFlipped }"
          role="button"
          tabindex="0"
          @click="isFlipped = !isFlipped"
          @keydown.enter.prevent="isFlipped = !isFlipped"
          @keydown.space.prevent="isFlipped = !isFlipped"
        >
          <!-- ЛИЦЕВАЯ СТОРОНА -->
          <div class="flashcard-front">
            <div class="kr-lg word-kr">{{ currentWord.korean }}</div>

            <div class="audio-row">
              <SpeakButton
                :text="currentWord.korean"
                label="Обычно (0.95x)"
                speed="normal"
                variant="primary"
              />
              <SpeakButton
                :text="currentWord.korean"
                label="Медленно (0.65x)"
                speed="slow"
                variant="soft"
              />
            </div>

            <p v-if="!isFlipped" class="flip-hint">
              Нажмите на карточку, чтобы открыть перевод, транскрипцию и пример
            </p>
          </div>

          <!-- ОБОРОТНАЯ СТОРОНА (ПО КЛИКУ) -->
          <div v-if="isFlipped" class="flashcard-back" @click.stop>
            <div class="back-translation">{{ currentWord.translation }}</div>
            <div class="back-transcription">[{{ currentWord.transcription }}]</div>
            <div class="syllables-box">
              <span class="syllables-label">По слогам:</span>
              <span class="kr syllables-text">{{ currentWord.syllables }}</span>
            </div>

            <div class="example-panel">
              <div class="example-panel-top">
                <span class="syllables-label">Живой пример</span>
                <div class="example-audio-btns">
                  <SpeakButton
                    :text="currentWord.example.korean"
                    label="Послушать"
                    speed="normal"
                    variant="soft"
                  />
                  <SpeakButton
                    :text="currentWord.example.korean"
                    label="0.65x"
                    speed="slow"
                    variant="outline"
                  />
                </div>
              </div>
              <div class="kr example-kr">{{ currentWord.example.korean }}</div>
              <div class="transcription small-tr">[{{ currentWord.example.transcription }}]</div>
              <div class="example-ru">{{ currentWord.example.translation }}</div>
            </div>

            <button
              type="button"
              class="hide-back-btn"
              @click="isFlipped = false"
            >
              Скрыть перевод
            </button>
          </div>
        </div>

        <!-- КНОПКИ СТАТУСА И НАВИГАЦИИ -->
        <div class="status-actions">
          <button type="button" class="btn btn-amber status-btn" @click="markReview">
            ↻ Повторить позже
          </button>
          <button
            v-if="getWordStatus(currentWord.id) !== 'known'"
            type="button"
            class="btn btn-primary status-btn"
            @click="markKnown"
          >
            ✓ Уже знаю
          </button>
          <button
            v-else
            type="button"
            class="btn btn-outline status-btn"
            @click="resetWordToActive"
          >
            Вернуть в колоду
          </button>
        </div>

        <div v-if="deckWords.length > 1" class="nav-actions">
          <button type="button" class="btn btn-outline" @click="prevCard">← Предыдущая</button>
          <button type="button" class="btn btn-outline" @click="nextCard">Следующая →</button>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.level-pills {
  margin-bottom: 16px;
}

.cat-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.category-card {
  text-align: left;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: transform 0.14s ease, box-shadow 0.14s ease, border-color 0.14s ease;
}

.category-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--accent-border);
}

.cat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cat-icon {
  font-size: 1.7rem;
}

.cat-title {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 700;
}

.cat-sub {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  flex: 1;
}

.progress-track {
  margin-top: 6px;
  height: 7px;
  border-radius: 999px;
  background: var(--surface-subtle);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.25s ease;
}

/* Deck */
.deck-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.deck-title-wrap .section-heading {
  margin: 0;
}

.flashcard-stage {
  margin-top: 18px;
  max-width: 620px;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.deck-counter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.92rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.flashcard {
  padding: 28px 22px;
  cursor: pointer;
  transition: box-shadow 0.18s ease, border-color 0.18s ease;
}

.flashcard:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--accent-border);
}

.flashcard-front {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 18px;
}

.word-kr {
  color: var(--text);
  word-break: keep-all;
}

.audio-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.flip-hint {
  margin: 4px 0 0;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.flashcard-back {
  margin-top: 22px;
  padding-top: 22px;
  border-top: 1px dashed var(--border);
  display: flex;
  flex-direction: column;
  gap: 12px;
  cursor: default;
}

.back-translation {
  font-size: 1.45rem;
  font-weight: 700;
  text-align: center;
  color: var(--text);
}

.back-transcription {
  font-size: 1.15rem;
  font-weight: 600;
  text-align: center;
  color: var(--accent);
}

.syllables-box {
  background: var(--bg);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  font-size: 0.95rem;
}

.syllables-label {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.syllables-text {
  font-size: 1.05rem;
}

.example-panel {
  background: var(--accent-soft);
  border: 1px solid var(--accent-border);
  border-radius: var(--radius-sm);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.example-panel-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.example-audio-btns {
  display: flex;
  gap: 6px;
}

.example-kr {
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--text);
}

.small-tr {
  font-size: 0.95rem;
}

.example-ru {
  font-size: 0.96rem;
  color: var(--text-secondary);
}

.hide-back-btn {
  align-self: center;
  padding: 8px 14px;
  font-size: 0.88rem;
  color: var(--text-muted);
  font-weight: 600;
}

.status-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.status-btn {
  width: 100%;
}

.nav-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.nav-actions .btn {
  flex: 1;
}

.empty-deck {
  margin-top: 20px;
  padding: 32px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.empty-emoji {
  font-size: 2.5rem;
}

.empty-deck h3 {
  margin: 0;
}
</style>

