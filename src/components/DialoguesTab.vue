<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { DIALOGUES } from '../data/dialogues'
import type { Dialogue, DialogueToken, CourseLevel } from '../types/korean'
import { useSpeech } from '../composables/useSpeech'
import { useProgress } from '../composables/useProgress'
import SpeakButton from './SpeakButton.vue'

type VisibilityMode = 'all' | 'no-translation' | 'audio-only'
type DialogueLevelFilter = 'all' | CourseLevel

const {
  hasKoreanVoice,
  activeSequenceId,
  speak,
  speakSequence,
  stop,
} = useSpeech()

const { isDialogueCompleted, toggleDialogueCompleted, completedDialoguesCount } = useProgress()

const selectedDialogueId = ref<string | null>(null)
const levelFilter = ref<DialogueLevelFilter>('all')
const visibilityMode = ref<VisibilityMode>('all')
const revealedLines = ref<Record<string, boolean>>({})
const selectedToken = ref<{ lineId: string; token: DialogueToken } | null>(null)
const isPlayingFull = ref(false)

const filteredDialogues = computed(() => {
  if (levelFilter.value === 'all') return DIALOGUES
  return DIALOGUES.filter((d) => d.level === levelFilter.value)
})

const selectedDialogue = computed<Dialogue | null>(
  () => DIALOGUES.find((d) => d.id === selectedDialogueId.value) ?? null
)

function openDialogue(id: string) {
  stop()
  isPlayingFull.value = false
  selectedDialogueId.value = id
  visibilityMode.value = 'all'
  revealedLines.value = {}
  selectedToken.value = null
}

function goBack() {
  stop()
  isPlayingFull.value = false
  selectedDialogueId.value = null
  selectedToken.value = null
}

function setVisibility(mode: VisibilityMode) {
  visibilityMode.value = mode
  revealedLines.value = {}
  if (mode === 'audio-only') {
    selectedToken.value = null
  }
}

function toggleRevealLine(lineId: string) {
  revealedLines.value[lineId] = !revealedLines.value[lineId]
}

function showKoreanForLine(lineId: string): boolean {
  if (visibilityMode.value !== 'audio-only') return true
  return Boolean(revealedLines.value[lineId])
}

function showTranslationForLine(lineId: string): boolean {
  if (visibilityMode.value === 'all') return true
  return Boolean(revealedLines.value[lineId])
}

function togglePlayAll() {
  if (!selectedDialogue.value) return
  if (isPlayingFull.value) {
    stop()
    isPlayingFull.value = false
    return
  }
  isPlayingFull.value = true
  speakSequence(
    selectedDialogue.value.lines.map((l) => ({ id: l.id, text: l.korean })),
    {
      onComplete: () => {
        isPlayingFull.value = false
      },
    }
  )
}

function onTokenClick(lineId: string, token: DialogueToken) {
  if (
    selectedToken.value &&
    selectedToken.value.lineId === lineId &&
    selectedToken.value.token.text === token.text
  ) {
    selectedToken.value = null
    return
  }
  selectedToken.value = { lineId, token }
}

function speakWord(text: string) {
  isPlayingFull.value = false
  speak(text)
}

onBeforeUnmount(() => {
  if (isPlayingFull.value) {
    stop()
  }
})
</script>

<template>
  <section class="dialogues-tab">
    <!-- СПИСОК ДИАЛОГОВ -->
    <template v-if="!selectedDialogue">
      <h2 class="section-heading">Аудирование и диалоги</h2>
      <p class="section-desc">
        Пройдено диалогов: <strong>{{ completedDialoguesCount }} из {{ DIALOGUES.length }}</strong>.
        Слушайте живую речь и постепенно скрывайте подсказки.
      </p>

      <div class="pill-tabs dlg-level-pills" role="tablist" aria-label="Уровень диалогов">
        <button
          type="button"
          class="pill-tab"
          :class="{ active: levelFilter === 'all' }"
          @click="levelFilter = 'all'"
        >
          Все диалоги ({{ DIALOGUES.length }})
        </button>
        <button
          type="button"
          class="pill-tab"
          :class="{ active: levelFilter === 1 }"
          @click="levelFilter = 1"
        >
          Ур. 1 · База (6)
        </button>
        <button
          type="button"
          class="pill-tab"
          :class="{ active: levelFilter === 2 }"
          @click="levelFilter = 2"
        >
          Ур. 2 · Жизнь и офис (3)
        </button>
        <button
          type="button"
          class="pill-tab"
          :class="{ active: levelFilter === 3 }"
          @click="levelFilter = 3"
        >
          Ур. 3 · Сцены дорам (3)
        </button>
      </div>

      <div class="dialogue-grid">
        <button
          v-for="dlg in filteredDialogues"
          :key="dlg.id"
          type="button"
          class="card dialogue-card"
          @click="openDialogue(dlg.id)"
        >
          <div class="dlg-card-top">
            <span class="dlg-icon" aria-hidden="true">{{ dlg.icon }}</span>
            <div class="dlg-badges">
              <span class="badge" :class="dlg.level === 3 ? 'badge-amber' : 'badge-muted'">
                {{ dlg.styleTag }}
              </span>
              <span
                class="badge"
                :class="isDialogueCompleted(dlg.id) ? 'badge-sage' : 'badge-muted'"
              >
                {{ isDialogueCompleted(dlg.id) ? '✓ Пройден' : `${dlg.lines.length} реплик` }}
              </span>
            </div>
          </div>
          <h3 class="dlg-title">{{ dlg.title }}</h3>
          <p class="dlg-sit">{{ dlg.situation }}</p>
        </button>
      </div>
    </template>

    <!-- ПЛЕЕР ДИАЛОГА -->
    <template v-else>
      <div class="player-header">
        <button type="button" class="btn btn-outline" @click="goBack">
          ← Все диалоги
        </button>
        <div>
          <h2 class="section-heading player-title">
            {{ selectedDialogue.icon }} {{ selectedDialogue.title }}
          </h2>
          <p class="muted player-sub">{{ selectedDialogue.situation }}</p>
        </div>
      </div>

      <!-- ПАНЕЛЬ УПРАВЛЕНИЯ И РЕЖИМ «ТРЕНИРОВКА СЛУХА» -->
      <div class="card control-panel">
        <div class="control-row">
          <button
            v-if="hasKoreanVoice"
            type="button"
            class="btn"
            :class="isPlayingFull ? 'btn-amber' : 'btn-primary'"
            @click="togglePlayAll"
          >
            {{ isPlayingFull ? '■ Остановить диалог' : '▶ Слушать диалог целиком' }}
          </button>

          <div class="ear-mode-wrap">
            <span class="ear-label">👁 Тренировка слуха:</span>
            <div class="segmented">
              <button
                type="button"
                class="seg-btn"
                :class="{ active: visibilityMode === 'all' }"
                @click="setVisibility('all')"
              >
                Всё видно
              </button>
              <button
                type="button"
                class="seg-btn"
                :class="{ active: visibilityMode === 'no-translation' }"
                @click="setVisibility('no-translation')"
              >
                Без перевода
              </button>
              <button
                type="button"
                class="seg-btn"
                :class="{ active: visibilityMode === 'audio-only' }"
                @click="setVisibility('audio-only')"
              >
                Только аудио
              </button>
            </div>
          </div>
        </div>
        <p class="tip-line">
          Подсказка: нажимайте на любое корейское слово в реплике, чтобы увидеть его перевод.
        </p>
      </div>

      <!-- РЕПЛИКИ -->
      <div class="lines-list">
        <article
          v-for="line in selectedDialogue.lines"
          :key="line.id"
          class="card line-card"
          :class="[
            `side-${line.side}`,
            { 'is-speaking': activeSequenceId === line.id },
          ]"
        >
          <div class="line-top">
            <span class="speaker-name">{{ line.speaker }}</span>
            <div class="line-controls">
              <SpeakButton
                :text="line.korean"
                label="Послушать"
                speed="normal"
                variant="soft"
              />
              <SpeakButton
                :text="line.korean"
                label="0.65x"
                speed="slow"
                variant="outline"
              />
            </div>
          </div>

          <!-- КОРЕЙСКИЙ ТЕКСТ (КЛИКАБЕЛЬНЫЕ СЛОВА) -->
          <div v-if="showKoreanForLine(line.id)" class="tokens-row">
            <button
              v-for="(tok, idx) in line.tokens"
              :key="`${line.id}-${idx}`"
              type="button"
              class="kr token-btn"
              :class="{
                active:
                  selectedToken?.lineId === line.id &&
                  selectedToken?.token.text === tok.text,
              }"
              @click="onTokenClick(line.id, tok)"
            >
              {{ tok.text }}
            </button>
          </div>
          <div v-else class="hidden-audio-box">
            <span class="muted">Текст скрыт — попробуйте понять реплику на слух</span>
          </div>

          <!-- КАРТОЧКА ВЫБРАННОГО СЛОВА -->
          <div
            v-if="selectedToken && selectedToken.lineId === line.id"
            class="word-popover"
          >
            <div class="word-popover-info">
              <span class="kr popover-kr">{{ selectedToken.token.text }}</span>
              <span v-if="selectedToken.token.transcription" class="transcription">
                [{{ selectedToken.token.transcription }}]
              </span>
              <span class="popover-meaning">— {{ selectedToken.token.meaning }}</span>
            </div>
            <button
              v-if="hasKoreanVoice"
              type="button"
              class="btn btn-soft popover-speak"
              @click="speakWord(selectedToken.token.text)"
            >
              🔊 Слово
            </button>
          </div>

          <!-- ТРАНСКРИПЦИЯ И ПЕРЕВОД -->
          <div v-if="showTranslationForLine(line.id)" class="line-translation">
            <div class="transcription small-tr">[{{ line.transcription }}]</div>
            <div class="ru-text">{{ line.translation }}</div>
          </div>

          <!-- КНОПКА САМОПРОВЕРКИ В РЕЖИМЕ ТРЕНИРОВКИ СЛУХА -->
          <div v-if="visibilityMode !== 'all'" class="peek-row">
            <button
              type="button"
              class="peek-btn"
              @click="toggleRevealLine(line.id)"
            >
              {{ revealedLines[line.id] ? 'Скрыть подсказку' : '👁 Открыть для самопроверки' }}
            </button>
          </div>
        </article>
      </div>

      <!-- ОТМЕТКА ПРОХОЖДЕНИЯ -->
      <div class="complete-bar">
        <button
          type="button"
          class="btn"
          :class="isDialogueCompleted(selectedDialogue.id) ? 'btn-soft' : 'btn-primary'"
          @click="toggleDialogueCompleted(selectedDialogue.id)"
        >
          {{
            isDialogueCompleted(selectedDialogue.id)
              ? '✓ Диалог пройден (убрать отметку)'
              : 'Отметить диалог пройденным'
          }}
        </button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.dlg-level-pills {
  margin-bottom: 16px;
}

.dlg-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.dialogue-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.dialogue-card {
  text-align: left;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: transform 0.14s ease, box-shadow 0.14s ease, border-color 0.14s ease;
}

.dialogue-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--accent-border);
}

.dlg-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dlg-icon {
  font-size: 1.7rem;
}

.dlg-title {
  margin: 0;
  font-size: 1.12rem;
}

.dlg-sit {
  margin: 0;
  font-size: 0.92rem;
  color: var(--text-secondary);
}

/* Player */
.player-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.player-title {
  margin: 0;
}

.player-sub {
  margin: 2px 0 0;
  font-size: 0.92rem;
}

.control-panel {
  padding: 16px 18px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ear-mode-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.ear-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.segmented {
  display: inline-flex;
  background: var(--surface-subtle);
  padding: 4px;
  border-radius: 12px;
  gap: 4px;
}

.seg-btn {
  min-height: 40px;
  padding: 6px 12px;
  border-radius: 9px;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all 0.15s ease;
}

.seg-btn.active {
  background: var(--surface);
  color: var(--accent);
  box-shadow: var(--shadow-sm);
}

.tip-line {
  margin: 0;
  font-size: 0.88rem;
  color: var(--text-muted);
}

.lines-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.line-card {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.line-card.side-right {
  border-left: 4px solid var(--accent-border);
}

.line-card.side-left {
  border-left: 4px solid var(--border);
}

.line-card.is-speaking {
  border-color: var(--accent);
  border-left-color: var(--accent);
  background: var(--accent-soft);
}

.line-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.speaker-name {
  font-weight: 700;
  font-size: 0.92rem;
  color: var(--text-secondary);
}

.line-controls {
  display: flex;
  gap: 6px;
}

.tokens-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.token-btn {
  font-size: clamp(1.3rem, 3.6vw, 1.6rem);
  padding: 6px 10px;
  min-height: 44px;
  border-radius: 10px;
  background: var(--bg);
  border: 1px solid transparent;
  transition: all 0.14s ease;
}

.token-btn:hover {
  border-color: var(--accent-border);
  background: var(--accent-soft);
}

.token-btn.active {
  background: var(--accent);
  color: #ffffff;
}

.hidden-audio-box {
  padding: 14px;
  border-radius: var(--radius-sm);
  background: var(--surface-subtle);
  text-align: center;
  font-size: 0.94rem;
}

.word-popover {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  background: var(--amber-soft);
  border: 1px solid var(--amber-border);
}

.word-popover-info {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
}

.popover-kr {
  font-size: 1.2rem;
  font-weight: 700;
}

.popover-meaning {
  font-weight: 600;
}

.popover-speak {
  min-height: 40px;
  padding: 6px 12px;
  font-size: 0.88rem;
}

.line-translation {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.small-tr {
  font-size: 0.94rem;
}

.ru-text {
  font-size: 1rem;
  color: var(--text);
}

.peek-row {
  display: flex;
}

.peek-btn {
  min-height: 40px;
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--surface-subtle);
  color: var(--text-secondary);
  font-size: 0.88rem;
  font-weight: 600;
}

.complete-bar {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>

