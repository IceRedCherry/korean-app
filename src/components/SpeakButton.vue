<script setup lang="ts">
import { useSpeech } from '../composables/useSpeech'
import type { SpeechSpeed } from '../types/korean'

const props = withDefaults(
  defineProps<{
    text: string
    label?: string
    speed?: SpeechSpeed
    variant?: 'primary' | 'soft' | 'outline'
    compact?: boolean
  }>(),
  {
    label: 'Озвучить',
    variant: 'soft',
    compact: false,
  }
)

const { hasKoreanVoice, speak } = useSpeech()

function onPlay() {
  speak(props.text, props.speed)
}
</script>

<template>
  <button
    v-if="hasKoreanVoice"
    type="button"
    class="btn speak-btn"
    :class="[`btn-${variant}`, { compact }]"
    :aria-label="label || 'Прослушать'"
    @click.stop="onPlay"
  >
    <svg
      class="speak-icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
    <span v-if="label">{{ label }}</span>
  </button>
</template>

<style scoped>
.speak-btn.compact {
  min-width: 48px;
  padding: 10px 12px;
}

.speak-icon {
  flex-shrink: 0;
}
</style>
