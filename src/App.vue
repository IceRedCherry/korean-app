<script setup lang="ts">
import { ref } from 'vue'
import type { AppTab } from './types/korean'
import { useSpeech } from './composables/useSpeech'
import { useProgress } from './composables/useProgress'
import HangulTab from './components/HangulTab.vue'
import GrammarTab from './components/GrammarTab.vue'
import VocabularyTab from './components/VocabularyTab.vue'
import DialoguesTab from './components/DialoguesTab.vue'
import PracticeTab from './components/PracticeTab.vue'

const activeTab = ref<AppTab>('hangul')

const {
  speed,
  setSpeed,
  hasKoreanVoice,
  voiceUnavailableReason,
  stop,
} = useSpeech()

const { todayActivityCount, activeDaysCount } = useProgress()

const TABS: Array<{ id: AppTab; label: string; shortLabel: string; icon: string }> = [
  { id: 'hangul', label: 'Алфавит', shortLabel: 'Хангыль', icon: '가' },
  { id: 'grammar', label: 'Грамматика', shortLabel: 'Грамм.', icon: '📖' },
  { id: 'vocabulary', label: 'Словарь', shortLabel: 'Словарь', icon: '🗂' },
  { id: 'dialogues', label: 'Диалоги', shortLabel: 'Диалоги', icon: '🎧' },
  { id: 'practice', label: 'Тренажёр', shortLabel: 'Практика', icon: '✦' },
]

function switchTab(tab: AppTab) {
  stop()
  activeTab.value = tab
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="header-inner">
        <div class="brand">
          <span class="kr brand-badge" aria-hidden="true">한</span>
          <div>
            <h1 class="brand-title">Корейский на слух</h1>
            <p class="brand-sub">
              Сегодня: {{ todayActivityCount }} · Дней практики: {{ activeDaysCount }}
            </p>
          </div>
        </div>

        <div v-if="hasKoreanVoice" class="speed-toggle" role="group" aria-label="Скорость озвучки">
          <button
            type="button"
            class="speed-btn"
            :class="{ active: speed === 'slow' }"
            @click="setSpeed('slow')"
          >
            Медленно (0.65x)
          </button>
          <button
            type="button"
            class="speed-btn"
            :class="{ active: speed === 'normal' }"
            @click="setSpeed('normal')"
          >
            Обычно (0.95x)
          </button>
        </div>
      </div>

      <!-- ДЕСКТОПНАЯ НАВИГАЦИЯ -->
      <nav class="desktop-nav" aria-label="Основные разделы">
        <button
          v-for="tab in TABS"
          :key="tab.id"
          type="button"
          class="desktop-nav-btn"
          :class="{ active: activeTab === tab.id }"
          @click="switchTab(tab.id)"
        >
          <span class="nav-icon" :class="{ kr: tab.id === 'hangul' }">{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
        </button>
      </nav>
    </header>

    <main class="app-main">
      <!-- ПОДСКАЗКА, ЕСЛИ ГОЛОС KO-KR НЕДОСТУПЕН -->
      <div v-if="!hasKoreanVoice && voiceUnavailableReason" class="card voice-notice" role="status">
        <strong>Озвучка временно скрыта:</strong> {{ voiceUnavailableReason }}
      </div>

      <HangulTab v-if="activeTab === 'hangul'" />
      <GrammarTab v-else-if="activeTab === 'grammar'" />
      <VocabularyTab v-else-if="activeTab === 'vocabulary'" />
      <DialoguesTab v-else-if="activeTab === 'dialogues'" />
      <PracticeTab v-else />
    </main>

    <!-- МОБИЛЬНАЯ НИЖНЯЯ НАВИГАЦИЯ -->
    <nav class="mobile-nav" aria-label="Основные разделы">
      <button
        v-for="tab in TABS"
        :key="tab.id"
        type="button"
        class="mobile-nav-btn"
        :class="{ active: activeTab === tab.id }"
        @click="switchTab(tab.id)"
      >
        <span class="mobile-nav-icon" :class="{ kr: tab.id === 'hangul' }">{{ tab.icon }}</span>
        <span class="mobile-nav-label">{{ tab.shortLabel }}</span>
      </button>
    </nav>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}

.header-inner {
  max-width: 980px;
  margin: 0 auto;
  padding: 12px 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-badge {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--accent);
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.2;
}

.brand-sub {
  margin: 2px 0 0;
  font-size: 0.82rem;
  color: var(--text-muted);
}

.speed-toggle {
  display: inline-flex;
  background: var(--surface-subtle);
  padding: 4px;
  border-radius: 12px;
  gap: 4px;
}

.speed-btn {
  min-height: 40px;
  padding: 6px 12px;
  border-radius: 9px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all 0.15s ease;
}

.speed-btn.active {
  background: var(--surface);
  color: var(--accent);
  box-shadow: var(--shadow-sm);
}

.desktop-nav {
  display: none;
  max-width: 980px;
  margin: 0 auto;
  padding: 0 16px 10px;
  gap: 8px;
}

.desktop-nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all 0.15s ease;
}

.desktop-nav-btn:hover {
  background: var(--surface-subtle);
}

.desktop-nav-btn.active {
  background: var(--accent-soft);
  color: var(--accent);
}

.nav-icon {
  font-size: 1.1rem;
}

.app-main {
  flex: 1;
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
  padding: 20px 16px 96px;
}

.voice-notice {
  padding: 14px 16px;
  margin-bottom: 18px;
  background: var(--amber-soft);
  border-color: var(--amber-border);
  color: var(--amber);
  font-size: 0.94rem;
}

.mobile-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--border);
  padding: 6px 4px calc(6px + env(safe-area-inset-bottom, 0px));
}

.mobile-nav-btn {
  min-height: 54px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--text-muted);
  transition: all 0.15s ease;
}

.mobile-nav-btn.active {
  color: var(--accent);
  background: var(--accent-soft);
}

.mobile-nav-icon {
  font-size: 1.25rem;
  line-height: 1.1;
}

.mobile-nav-label {
  font-size: 0.74rem;
  font-weight: 600;
}

@media (min-width: 768px) {
  .desktop-nav {
    display: flex;
  }

  .mobile-nav {
    display: none;
  }

  .app-main {
    padding: 24px 16px 48px;
  }
}
</style>
