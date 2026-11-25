<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  BASIC_VOWELS,
  BASIC_CONSONANTS,
  COMPLEX_VOWELS,
  DOUBLE_CONSONANTS,
  ALL_HANGUL_CHARS,
  CONSONANT_COMPARISONS,
  BATCHIM_SOUND_GROUPS,
  LIAISON_RULES,
  BUILDER_INITIALS,
  BUILDER_MEDIALS,
  BUILDER_FINALS,
  composeHangulSyllable,
  transcribeComposedSyllable,
} from '../data/hangul'
import type { HangulChar } from '../types/korean'
import { useProgress } from '../composables/useProgress'
import { useSpeech } from '../composables/useSpeech'
import SpeakButton from './SpeakButton.vue'

type HangulStep = 'step1' | 'step2' | 'step3' | 'builder'

const activeStep = ref<HangulStep>('step1')
const selectedChar = ref<HangulChar | null>(null)

const { isLetterStudied, toggleLetterStudied, studiedLettersCount } = useProgress()
const { hasKoreanVoice, speak } = useSpeech()

// Syllable builder state (defaults to 한: ㅎ + ㅏ + ㄴ)
const initIdx = ref<number>(18)
const medIdx = ref<number>(0)
const finIdx = ref<number>(4)

const assembledSyllable = computed(() =>
  composeHangulSyllable(initIdx.value, medIdx.value, finIdx.value)
)

const assembledReading = computed(() =>
  transcribeComposedSyllable(initIdx.value, medIdx.value, finIdx.value)
)

const selectedInitialChar = computed(
  () => BUILDER_INITIALS.find((i) => i.index === initIdx.value)?.char ?? ''
)
const selectedMedialChar = computed(
  () => BUILDER_MEDIALS.find((m) => m.index === medIdx.value)?.char ?? ''
)
const selectedFinalChar = computed(
  () => BUILDER_FINALS.find((f) => f.index === finIdx.value)?.char ?? '—'
)

function openChar(item: HangulChar) {
  selectedChar.value = item
}

function closeModal() {
  selectedChar.value = null
}

function speakAndSelect(text: string) {
  if (hasKoreanVoice.value) {
    speak(text)
  }
}
</script>

<template>
  <section class="hangul-tab">
    <div class="hangul-top">
      <div>
        <h2 class="section-heading">Алфавит и чтение (Хангыль)</h2>
        <p class="section-desc">
          Изучено букв: <strong>{{ studiedLettersCount }} из {{ ALL_HANGUL_CHARS.length }}</strong>.
          Нажимайте на карточки, чтобы услышать звук и запомнить образ.
        </p>
      </div>
    </div>

    <div class="pill-tabs" role="tablist" aria-label="Разделы Хангыля">
      <button
        type="button"
        role="tab"
        class="pill-tab"
        :class="{ active: activeStep === 'step1' }"
        :aria-selected="activeStep === 'step1'"
        @click="activeStep = 'step1'"
      >
        Шаг 1 · Базовые (24)
      </button>
      <button
        type="button"
        role="tab"
        class="pill-tab"
        :class="{ active: activeStep === 'step2' }"
        :aria-selected="activeStep === 'step2'"
        @click="activeStep = 'step2'"
      >
        Шаг 2 · Сложные (16)
      </button>
      <button
        type="button"
        role="tab"
        class="pill-tab"
        :class="{ active: activeStep === 'step3' }"
        :aria-selected="activeStep === 'step3'"
        @click="activeStep = 'step3'"
      >
        Шаг 3 · Патчим и связывание
      </button>
      <button
        type="button"
        role="tab"
        class="pill-tab"
        :class="{ active: activeStep === 'builder' }"
        :aria-selected="activeStep === 'builder'"
        @click="activeStep = 'builder'"
      >
        Конструктор слогов
      </button>
    </div>

    <!-- ШАГ 1: Базовые гласные и согласные -->
    <div v-if="activeStep === 'step1'" class="step-content">
      <div class="group-block">
        <h3 class="group-title">Базовые гласные (10)</h3>
        <div class="char-grid">
          <button
            v-for="item in BASIC_VOWELS"
            :key="item.id"
            type="button"
            class="card char-card"
            :class="{ studied: isLetterStudied(item.id) }"
            @click="openChar(item)"
          >
            <span v-if="isLetterStudied(item.id)" class="studied-dot" title="Изучено">✓</span>
            <span class="kr char-symbol">{{ item.char }}</span>
            <span class="char-tr">{{ item.transcription }}</span>
          </button>
        </div>
      </div>

      <div class="group-block">
        <h3 class="group-title">Базовые согласные (14)</h3>
        <div class="char-grid">
          <button
            v-for="item in BASIC_CONSONANTS"
            :key="item.id"
            type="button"
            class="card char-card"
            :class="{ studied: isLetterStudied(item.id) }"
            @click="openChar(item)"
          >
            <span v-if="isLetterStudied(item.id)" class="studied-dot" title="Изучено">✓</span>
            <span class="kr char-symbol">{{ item.char }}</span>
            <span class="char-tr">{{ item.transcription }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ШАГ 2: Сложные гласные, удвоенные согласные и сравнение на слух -->
    <div v-else-if="activeStep === 'step2'" class="step-content">
      <div class="group-block">
        <h3 class="group-title">Сложные гласные — дифтонги (11)</h3>
        <div class="char-grid">
          <button
            v-for="item in COMPLEX_VOWELS"
            :key="item.id"
            type="button"
            class="card char-card"
            :class="{ studied: isLetterStudied(item.id) }"
            @click="openChar(item)"
          >
            <span v-if="isLetterStudied(item.id)" class="studied-dot" title="Изучено">✓</span>
            <span class="kr char-symbol">{{ item.char }}</span>
            <span class="char-tr">{{ item.transcription }}</span>
          </button>
        </div>
      </div>

      <div class="group-block">
        <h3 class="group-title">Удвоенные (напряжённые) согласные (5)</h3>
        <div class="char-grid">
          <button
            v-for="item in DOUBLE_CONSONANTS"
            :key="item.id"
            type="button"
            class="card char-card"
            :class="{ studied: isLetterStudied(item.id) }"
            @click="openChar(item)"
          >
            <span v-if="isLetterStudied(item.id)" class="studied-dot" title="Изучено">✓</span>
            <span class="kr char-symbol">{{ item.char }}</span>
            <span class="char-tr">{{ item.transcription }}</span>
          </button>
        </div>
      </div>

      <div class="group-block">
        <h3 class="group-title">Сравните на слух: простые, придыхательные и напряжённые</h3>
        <p class="section-desc">
          Нажимайте на карточки по очереди, чтобы уловить разницу в выдохе и напряжении.
        </p>

        <div class="comparison-list">
          <article
            v-for="group in CONSONANT_COMPARISONS"
            :key="group.id"
            class="card comparison-card"
          >
            <h4 class="comparison-title">{{ group.title }}</h4>
            <p class="comparison-desc">{{ group.description }}</p>

            <div class="comparison-grid">
              <div
                v-for="c in group.items"
                :key="c.char"
                class="comparison-item"
              >
                <span class="badge badge-muted">{{ c.kind }}</span>
                <button
                  type="button"
                  class="comparison-syllable-btn"
                  :disabled="!hasKoreanVoice"
                  @click="speakAndSelect(c.syllable)"
                >
                  <span class="kr comparison-syllable">{{ c.syllable }}</span>
                  <span class="transcription">[{{ c.transcription }}]</span>
                </button>
                <p class="comparison-tip">{{ c.tip }}</p>

                <div class="comparison-word-row">
                  <div>
                    <span class="kr comparison-word">{{ c.word }}</span>
                    <span class="muted"> — {{ c.wordMeaning }}</span>
                    <div class="muted small">[{{ c.wordTranscription }}]</div>
                  </div>
                  <SpeakButton :text="c.word" label="" compact variant="soft" />
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>

    <!-- ШАГ 3: Патчим и правила связывания -->
    <div v-else-if="activeStep === 'step3'" class="step-content">
      <div class="group-block">
        <h3 class="group-title">Что такое патчим (받침)?</h3>
        <div class="card info-card">
          <p>
            <strong>Патчим</strong> — это согласная буква, которая пишется в самом низу слога
            (например, <strong>ㄴ</strong> в слоге <span class="kr">한</span> или <strong>ㅁ</strong> в <span class="kr">김</span>).
            Хотя внизу может стоять почти любая согласная, перед паузой все они сводятся всего к
            <strong>7 финальным звукам</strong>: <strong>к, н, т, ль, м, п, нъ</strong>.
          </p>
        </div>

        <div class="batchim-grid">
          <article
            v-for="grp in BATCHIM_SOUND_GROUPS"
            :key="grp.id"
            class="card batchim-card"
          >
            <div class="batchim-header">
              <span class="batchim-sound">{{ grp.finalSound }}</span>
              <div class="batchim-letters">
                <span v-for="l in grp.letters" :key="l" class="kr letter-chip">{{ l }}</span>
              </div>
            </div>
            <p class="batchim-exp">{{ grp.explanation }}</p>
            <div class="batchim-examples">
              <div v-for="ex in grp.examples" :key="ex.korean" class="example-chip-row">
                <div>
                  <span class="kr example-kr">{{ ex.korean }}</span>
                  <span class="transcription"> [{{ ex.transcription }}]</span>
                  <span class="muted"> — {{ ex.meaning }}</span>
                </div>
                <SpeakButton :text="ex.korean" label="" compact variant="soft" />
              </div>
            </div>
          </article>
        </div>
      </div>

      <div class="group-block">
        <h3 class="group-title">Почему слова на слух звучат слитно?</h3>
        <div class="liaison-list">
          <article v-for="rule in LIAISON_RULES" :key="rule.id" class="card liaison-card">
            <h4 class="liaison-title">{{ rule.title }}</h4>
            <div class="rule-formula">{{ rule.formula }}</div>
            <p class="liaison-exp">{{ rule.explanation }}</p>

            <div class="liaison-examples">
              <div
                v-for="ex in rule.examples"
                :key="ex.written"
                class="liaison-example"
              >
                <div class="liaison-ex-main">
                  <div class="liaison-transform">
                    <span class="kr ex-written">{{ ex.written }}</span>
                    <span class="arrow">→</span>
                    <span class="kr ex-spoken">[{{ ex.pronounced }}]</span>
                  </div>
                  <div class="liaison-meta">
                    <span class="transcription">[{{ ex.transcription }}]</span>
                    <span> — {{ ex.meaning }}</span>
                  </div>
                  <p class="muted small">{{ ex.note }}</p>
                </div>
                <div class="liaison-btns">
                  <SpeakButton :text="ex.written" label="Обычно" speed="normal" variant="soft" />
                  <SpeakButton :text="ex.written" label="Медленно" speed="slow" variant="outline" />
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>

    <!-- КОНСТРУКТОР СЛОГОВ -->
    <div v-else class="step-content">
      <div class="card builder-preview">
        <div class="builder-formula">
          <span class="kr formula-part">{{ selectedInitialChar }}</span>
          <span class="plus">+</span>
          <span class="kr formula-part">{{ selectedMedialChar }}</span>
          <span class="plus">+</span>
          <span class="kr formula-part">{{ selectedFinalChar }}</span>
          <span class="plus">=</span>
        </div>

        <button
          type="button"
          class="builder-result-btn"
          :disabled="!hasKoreanVoice"
          @click="speakAndSelect(assembledSyllable)"
        >
          <span class="kr-xl builder-syllable">{{ assembledSyllable }}</span>
        </button>

        <div class="builder-reading">[{{ assembledReading }}]</div>

        <div class="builder-actions">
          <SpeakButton :text="assembledSyllable" label="Прослушать (0.95x)" speed="normal" variant="primary" />
          <SpeakButton :text="assembledSyllable" label="Медленно (0.65x)" speed="slow" variant="soft" />
        </div>
      </div>

      <div class="builder-controls">
        <div class="card picker-card">
          <h3 class="picker-title">1. Начальная согласная</h3>
          <div class="picker-grid">
            <button
              v-for="item in BUILDER_INITIALS"
              :key="item.index"
              type="button"
              class="picker-btn"
              :class="{ active: initIdx === item.index }"
              @click="initIdx = item.index"
            >
              <span class="kr picker-kr">{{ item.char }}</span>
              <span class="picker-ru">{{ item.ru || 'немая' }}</span>
            </button>
          </div>
        </div>

        <div class="card picker-card">
          <h3 class="picker-title">2. Гласная</h3>
          <div class="picker-grid">
            <button
              v-for="item in BUILDER_MEDIALS"
              :key="item.index"
              type="button"
              class="picker-btn"
              :class="{ active: medIdx === item.index }"
              @click="medIdx = item.index"
            >
              <span class="kr picker-kr">{{ item.char }}</span>
              <span class="picker-ru">{{ item.ru }}</span>
            </button>
          </div>
        </div>

        <div class="card picker-card">
          <h3 class="picker-title">3. Патчим (подслог, необязательно)</h3>
          <div class="picker-grid">
            <button
              v-for="item in BUILDER_FINALS"
              :key="item.index"
              type="button"
              class="picker-btn"
              :class="{ active: finIdx === item.index }"
              @click="finIdx = item.index"
            >
              <span class="kr picker-kr">{{ item.char }}</span>
              <span class="picker-ru">{{ item.ru || 'нет' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- МОДАЛЬНОЕ ОКНО ПОДРОБНОЙ КАРТОЧКИ БУКВЫ -->
    <div v-if="selectedChar" class="modal-backdrop" @click.self="closeModal">
      <div class="card modal-sheet" role="dialog" aria-modal="true">
        <div class="modal-header">
          <span class="badge badge-sage">{{ selectedChar.nameRu }} · {{ selectedChar.nameKo }}</span>
          <button type="button" class="close-btn" aria-label="Закрыть" @click="closeModal">✕</button>
        </div>

        <div class="modal-hero">
          <div class="kr-xl modal-char">{{ selectedChar.char }}</div>
          <div class="modal-tr">{{ selectedChar.transcription }}</div>
          <div class="modal-speak-row">
            <SpeakButton
              :text="selectedChar.speakText"
              label="Послушать звук"
              speed="normal"
              variant="primary"
            />
            <SpeakButton
              :text="selectedChar.speakText"
              label="Медленно"
              speed="slow"
              variant="soft"
            />
          </div>
        </div>

        <div class="modal-block">
          <div class="modal-label">Как произносить</div>
          <p class="modal-text">{{ selectedChar.soundHint }}</p>
        </div>

        <div class="modal-block mnemonic-box">
          <div class="modal-label">Ассоциация для запоминания</div>
          <p class="modal-text">{{ selectedChar.mnemonic }}</p>
        </div>

        <div class="modal-block example-box">
          <div>
            <div class="modal-label">Пример слова</div>
            <div class="example-line">
              <span class="kr example-word-kr">{{ selectedChar.exampleWord.korean }}</span>
              <span class="transcription">[{{ selectedChar.exampleWord.transcription }}]</span>
              <span>— {{ selectedChar.exampleWord.meaning }}</span>
            </div>
          </div>
          <SpeakButton :text="selectedChar.exampleWord.korean" label="" compact variant="soft" />
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn full-width"
            :class="isLetterStudied(selectedChar.id) ? 'btn-soft' : 'btn-primary'"
            @click="toggleLetterStudied(selectedChar.id)"
          >
            {{ isLetterStudied(selectedChar.id) ? '✓ Буква изучена (убрать отметку)' : 'Отметить букву изученной' }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.step-content {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.group-title {
  margin: 0 0 12px;
  font-size: 1.12rem;
  font-weight: 700;
  color: var(--text);
}

.char-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
  gap: 10px;
}

.char-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 92px;
  padding: 12px 8px;
  transition: transform 0.14s ease, border-color 0.14s ease, box-shadow 0.14s ease;
}

.char-card:hover {
  border-color: var(--accent-border);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.char-card.studied {
  background: var(--accent-soft);
  border-color: var(--accent-border);
}

.studied-dot {
  position: absolute;
  top: 6px;
  right: 8px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--accent);
}

.char-symbol {
  font-size: 2.3rem;
  line-height: 1.15;
  color: var(--text);
}

.char-tr {
  margin-top: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

/* Comparison cards */
.comparison-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comparison-card {
  padding: 18px;
}

.comparison-title {
  margin: 0 0 6px;
  font-size: 1.08rem;
}

.comparison-desc {
  margin: 0 0 14px;
  font-size: 0.94rem;
  color: var(--text-secondary);
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
}

.comparison-item {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comparison-syllable-btn {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 8px;
  background: var(--surface);
  border: 1px solid var(--border);
  min-height: 54px;
  justify-content: center;
}

.comparison-syllable-btn:hover:not(:disabled) {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.comparison-syllable {
  font-size: 2.2rem;
}

.comparison-tip {
  margin: 0;
  font-size: 0.88rem;
  color: var(--text-secondary);
}

.comparison-word-row {
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px dashed var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.comparison-word {
  font-size: 1.25rem;
  font-weight: 600;
}

/* Batchim & Liaison */
.info-card {
  padding: 16px 18px;
  margin-bottom: 14px;
  background: var(--accent-soft);
  border-color: var(--accent-border);
}

.info-card p {
  margin: 0;
}

.batchim-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}

.batchim-card {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.batchim-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.batchim-sound {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--accent);
}

.batchim-letters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.letter-chip {
  background: var(--surface-subtle);
  border-radius: 8px;
  padding: 3px 9px;
  font-size: 1.15rem;
  font-weight: 600;
}

.batchim-exp {
  margin: 0;
  font-size: 0.92rem;
  color: var(--text-secondary);
}

.batchim-examples {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.example-chip-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  background: var(--bg);
  border-radius: var(--radius-sm);
}

.example-kr {
  font-size: 1.3rem;
  font-weight: 600;
}

.liaison-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.liaison-card {
  padding: 18px;
}

.liaison-title {
  margin: 0 0 8px;
  font-size: 1.08rem;
}

.rule-formula {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
  font-size: 0.92rem;
  margin-bottom: 10px;
}

.liaison-exp {
  margin: 0 0 14px;
  color: var(--text-secondary);
  font-size: 0.95rem;
}

.liaison-examples {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.liaison-example {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  background: var(--bg);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.liaison-transform {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.ex-written {
  font-size: 1.45rem;
  font-weight: 600;
}

.arrow {
  color: var(--text-muted);
  font-weight: 700;
}

.ex-spoken {
  font-size: 1.35rem;
  color: var(--accent);
  font-weight: 600;
}

.liaison-meta {
  font-size: 0.95rem;
}

.liaison-btns {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.small {
  font-size: 0.86rem;
  margin: 4px 0 0;
}

/* Builder */
.builder-preview {
  padding: 24px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
}

.builder-formula {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 1.15rem;
}

.formula-part {
  padding: 4px 10px;
  background: var(--surface-subtle);
  border-radius: 8px;
  font-size: 1.25rem;
}

.plus {
  font-weight: 700;
  color: var(--text-muted);
}

.builder-result-btn {
  min-width: 120px;
  min-height: 110px;
  padding: 10px 24px;
  border-radius: var(--radius-md);
  background: var(--accent-soft);
  border: 2px solid var(--accent-border);
  transition: transform 0.12s ease;
}

.builder-result-btn:hover:not(:disabled) {
  transform: scale(1.03);
}

.builder-syllable {
  color: var(--accent);
}

.builder-reading {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text);
}

.builder-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 6px;
}

.builder-controls {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.picker-card {
  padding: 16px;
}

.picker-title {
  margin: 0 0 12px;
  font-size: 1rem;
  font-weight: 700;
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(62px, 1fr));
  gap: 8px;
}

.picker-btn {
  min-height: 56px;
  padding: 6px 4px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  transition: all 0.14s ease;
}

.picker-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #ffffff;
}

.picker-kr {
  font-size: 1.35rem;
  line-height: 1.1;
}

.picker-ru {
  font-size: 0.72rem;
  opacity: 0.85;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 100;
}

.modal-sheet {
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: var(--shadow-md);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.close-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--surface-subtle);
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-hero {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

.modal-char {
  color: var(--accent);
}

.modal-tr {
  font-size: 1.3rem;
  font-weight: 700;
}

.modal-speak-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
}

.modal-block {
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: var(--bg);
}

.mnemonic-box {
  background: var(--amber-soft);
  border: 1px solid var(--amber-border);
}

.example-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.modal-label {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.modal-text {
  margin: 0;
  font-size: 0.96rem;
}

.example-line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
}

.example-word-kr {
  font-size: 1.4rem;
  font-weight: 600;
}

.full-width {
  width: 100%;
}
</style>

