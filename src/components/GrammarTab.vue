<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  GRAMMAR_LEVEL_LABELS,
  GRAMMAR_LESSONS,
  SPEECH_STYLES_TABLE,
  DRAMA_CONTRACTIONS,
} from '../data/grammar'
import { useProgress } from '../composables/useProgress'
import SpeakButton from './SpeakButton.vue'

type GrammarView = 1 | 2 | 3 | 4 | 'styles'

const activeView = ref<GrammarView>(1)
const { isGrammarStudied, toggleGrammarStudied, studiedGrammarCount } = useProgress()

const visibleLessons = computed(() => {
  if (activeView.value === 'styles') return []
  return GRAMMAR_LESSONS.filter((l) => l.level === activeView.value)
})

const currentLevelInfo = computed(() => {
  if (activeView.value === 'styles') return null
  return GRAMMAR_LEVEL_LABELS[activeView.value]
})
</script>

<template>
  <section class="grammar-tab">
    <h2 class="section-heading">Грамматика: от первых фраз к дорамам</h2>
    <p class="section-desc">
      Изучено тем: <strong>{{ studiedGrammarCount }} из {{ GRAMMAR_LESSONS.length }}</strong>.
      Проходите уровни по порядку — это вся живая грамматика, на которой строятся диалоги в сериалах.
    </p>

    <div class="pill-tabs" role="tablist" aria-label="Уровни грамматики">
      <button
        type="button"
        class="pill-tab"
        :class="{ active: activeView === 1 }"
        @click="activeView = 1"
      >
        Ур. 1 · База
      </button>
      <button
        type="button"
        class="pill-tab"
        :class="{ active: activeView === 2 }"
        @click="activeView = 2"
      >
        Ур. 2 · Времена
      </button>
      <button
        type="button"
        class="pill-tab"
        :class="{ active: activeView === 3 }"
        @click="activeView = 3"
      >
        Ур. 3 · Связки
      </button>
      <button
        type="button"
        class="pill-tab"
        :class="{ active: activeView === 4 }"
        @click="activeView = 4"
      >
        Ур. 4 · Дорамы
      </button>
      <button
        type="button"
        class="pill-tab"
        :class="{ active: activeView === 'styles' }"
        @click="activeView = 'styles'"
      >
        Панмаль и сокращения
      </button>
    </div>

    <!-- УРОКИ УРОВНЯ -->
    <div v-if="activeView !== 'styles'" class="grammar-content">
      <div v-if="currentLevelInfo" class="card level-banner">
        <h3 class="level-title">{{ currentLevelInfo.title }}</h3>
        <p class="level-sub">{{ currentLevelInfo.subtitle }}</p>
      </div>

      <div class="lessons-list">
        <article
          v-for="lesson in visibleLessons"
          :key="lesson.id"
          class="card lesson-card"
          :class="{ studied: isGrammarStudied(lesson.id) }"
        >
          <div class="lesson-top">
            <div>
              <h3 class="lesson-title">{{ lesson.title }}</h3>
              <p class="muted lesson-summary">{{ lesson.summary }}</p>
            </div>
            <button
              type="button"
              class="btn check-btn"
              :class="isGrammarStudied(lesson.id) ? 'btn-soft' : 'btn-outline'"
              @click="toggleGrammarStudied(lesson.id)"
            >
              {{ isGrammarStudied(lesson.id) ? '✓ Изучено' : 'Отметить' }}
            </button>
          </div>

          <div class="pattern-box">{{ lesson.pattern }}</div>
          <p class="lesson-exp">{{ lesson.explanation }}</p>

          <div v-if="lesson.dramaTip" class="drama-tip">
            <strong>🎬 Как звучит в дорамах:</strong> {{ lesson.dramaTip }}
          </div>

          <div class="examples-list">
            <div
              v-for="ex in lesson.examples"
              :key="ex.korean"
              class="example-row"
            >
              <div class="example-text">
                <div class="kr example-kr">{{ ex.korean }}</div>
                <div class="transcription small-tr">[{{ ex.transcription }}]</div>
                <div class="example-ru">{{ ex.translation }}</div>
              </div>
              <div class="example-btns">
                <SpeakButton :text="ex.korean" label="Обычно" speed="normal" variant="soft" />
                <SpeakButton :text="ex.korean" label="0.65x" speed="slow" variant="outline" />
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>

    <!-- ШПАРГАЛКА: УРОВНИ ВЕЖЛИВОСТИ, ПАНМАЛЬ И СОКРАЩЕНИЯ -->
    <div v-else class="grammar-content">
      <div class="card level-banner">
        <h3 class="level-title">Ключ к дорамам: 3 стиля речи и быстрые сокращения</h3>
        <p class="level-sub">
          В одном и том же сериале герои с начальником говорят официально, с коллегами — вежливо
          (-아요/어요), а с друзьями и любимыми — на панмале (просто отбросив «요»!).
        </p>
      </div>

      <div class="card table-card">
        <h3 class="block-heading">Сравнение стилей речи (нажмите на фразу, чтобы услышать)</h3>
        <div class="styles-list">
          <div
            v-for="row in SPEECH_STYLES_TABLE"
            :key="row.meaning"
            class="style-row"
          >
            <div class="style-meaning">{{ row.meaning }}</div>
            <div class="style-cells">
              <div class="style-cell">
                <span class="cell-label">Официальный</span>
                <div class="cell-main">
                  <span class="kr cell-kr">{{ row.formal }}</span>
                  <SpeakButton :text="row.formal" label="" compact variant="outline" />
                </div>
              </div>
              <div class="style-cell">
                <span class="cell-label">Вежливый</span>
                <div class="cell-main">
                  <span class="kr cell-kr">{{ row.polite }}</span>
                  <SpeakButton :text="row.polite" label="" compact variant="soft" />
                </div>
              </div>
              <div class="style-cell cell-banmal">
                <span class="cell-label">Панмаль (дорамы)</span>
                <div class="cell-main">
                  <div>
                    <span class="kr cell-kr">{{ row.banmal }}</span>
                    <div class="transcription tiny-tr">[{{ row.transcriptionBanmal }}]</div>
                  </div>
                  <SpeakButton :text="row.banmal" label="" compact variant="primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card table-card">
        <h3 class="block-heading">Частые сокращения в быстрой разговорной речи</h3>
        <div class="contractions-grid">
          <div
            v-for="item in DRAMA_CONTRACTIONS"
            :key="item.short"
            class="contraction-item"
          >
            <div class="contraction-top">
              <span class="kr c-full">{{ item.full }}</span>
              <span class="arrow">→</span>
              <span class="kr c-short">{{ item.short }}</span>
            </div>
            <div class="transcription small-tr">[{{ item.transcription }}]</div>
            <div class="muted small-ru">{{ item.meaning }}</div>
            <div class="c-btn">
              <SpeakButton :text="item.short" label="Послушать" speed="normal" variant="soft" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.grammar-content {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.level-banner {
  padding: 16px 18px;
  background: var(--accent-soft);
  border-color: var(--accent-border);
}

.level-title {
  margin: 0 0 4px;
  font-size: 1.08rem;
  color: var(--accent);
}

.level-sub {
  margin: 0;
  font-size: 0.94rem;
  color: var(--text-secondary);
}

.lessons-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lesson-card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lesson-card.studied {
  border-color: var(--accent-border);
}

.lesson-top {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.lesson-title {
  margin: 0 0 4px;
  font-size: 1.14rem;
}

.lesson-summary {
  margin: 0;
  font-size: 0.92rem;
}

.check-btn {
  min-width: 120px;
}

.pattern-box {
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 700;
  font-size: 0.96rem;
}

.lesson-exp {
  margin: 0;
  font-size: 0.96rem;
  color: var(--text);
}

.drama-tip {
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: var(--amber-soft);
  border: 1px solid var(--amber-border);
  color: var(--amber);
  font-size: 0.93rem;
}

.examples-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}

.example-row {
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: var(--bg);
  border: 1px solid var(--border);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.example-kr {
  font-size: 1.32rem;
  font-weight: 600;
}

.small-tr {
  font-size: 0.92rem;
}

.example-ru {
  font-size: 0.95rem;
  color: var(--text-secondary);
}

.example-btns {
  display: flex;
  gap: 6px;
}

/* Styles table */
.table-card {
  padding: 18px;
}

.block-heading {
  margin: 0 0 14px;
  font-size: 1.08rem;
}

.styles-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.style-row {
  padding: 14px;
  border-radius: var(--radius-sm);
  background: var(--bg);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.style-meaning {
  font-weight: 700;
  font-size: 1rem;
}

.style-cells {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 10px;
}

.style-cell {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cell-banmal {
  background: var(--accent-soft);
  border-color: var(--accent-border);
}

.cell-label {
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
}

.cell-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cell-kr {
  font-size: 1.25rem;
  font-weight: 600;
}

.tiny-tr {
  font-size: 0.84rem;
}

.contractions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 12px;
}

.contraction-item {
  padding: 14px;
  border-radius: var(--radius-sm);
  background: var(--bg);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.contraction-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.c-full {
  font-size: 1.15rem;
  color: var(--text-muted);
}

.arrow {
  color: var(--text-muted);
  font-weight: 700;
}

.c-short {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--accent);
}

.small-ru {
  font-size: 0.9rem;
}

.c-btn {
  margin-top: 6px;
}
</style>
