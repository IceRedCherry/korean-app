import { ref, computed } from 'vue'
import type { SpeechSpeed } from '../types/korean'

const SPEED_STORAGE_KEY = 'korean-pwa-speech-speed'

const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window
const voicesLoaded = ref(false)
const koreanVoice = ref<SpeechSynthesisVoice | null>(null)
const isSpeaking = ref(false)
const activeSequenceId = ref<string | null>(null)

function loadSavedSpeed(): SpeechSpeed {
  try {
    const saved = localStorage.getItem(SPEED_STORAGE_KEY)
    if (saved === 'slow' || saved === 'normal') return saved
  } catch {
    // ignore storage errors
  }
  return 'normal'
}

const speed = ref<SpeechSpeed>(loadSavedSpeed())

function refreshVoices() {
  if (!isSupported) {
    voicesLoaded.value = true
    koreanVoice.value = null
    return
  }
  const voices = window.speechSynthesis.getVoices()
  if (voices.length > 0) {
    voicesLoaded.value = true
    const koVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('ko'))
    // Предпочитаем локальный или качественный голос ko-KR
    koreanVoice.value =
      koVoices.find((v) => v.lang.toLowerCase() === 'ko-kr' && v.localService) ??
      koVoices.find((v) => v.lang.toLowerCase() === 'ko-kr') ??
      koVoices[0] ??
      null
  }
}

if (isSupported) {
  refreshVoices()
  window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices)
  // Фолбэк, если браузер не присылает voiceschanged и список голосов пуст
  window.setTimeout(() => {
    if (!voicesLoaded.value) {
      refreshVoices()
      voicesLoaded.value = true
    }
  }, 700)
}

let sequenceToken = 0

export function useSpeech() {
  const hasKoreanVoice = computed(() => {
    if (!isSupported) return false
    if (!voicesLoaded.value) return true
    return koreanVoice.value !== null
  })

  const voiceUnavailableReason = computed(() => {
    if (!isSupported) {
      return 'Ваш браузер не поддерживает синтез речи (Web Speech API). Вы можете читать транскрипцию и правила на экране.'
    }
    if (voicesLoaded.value && !koreanVoice.value) {
      return 'В системе не найден корейский голос (ko-KR). Установите корейский языковой пакет в настройках устройства или откройте приложение в Chrome / Safari.'
    }
    return ''
  })

  const currentRate = computed(() => (speed.value === 'slow' ? 0.65 : 0.95))

  function setSpeed(next: SpeechSpeed) {
    speed.value = next
    try {
      localStorage.setItem(SPEED_STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }

  function stop() {
    sequenceToken++
    activeSequenceId.value = null
    isSpeaking.value = false
    if (isSupported) {
      window.speechSynthesis.cancel()
    }
  }

  /**
   * Вызывается строго внутри обработчика @click (для совместимости с iOS Safari).
   */
  function speak(text: string, overrideSpeed?: SpeechSpeed) {
    if (!isSupported || !hasKoreanVoice.value || !text.trim()) return

    sequenceToken++
    activeSequenceId.value = null
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ko-KR'
    if (koreanVoice.value) {
      utterance.voice = koreanVoice.value
    }
    utterance.rate =
      overrideSpeed === 'slow'
        ? 0.65
        : overrideSpeed === 'normal'
          ? 0.95
          : currentRate.value
    utterance.pitch = 1

    utterance.onstart = () => {
      isSpeaking.value = true
    }
    utterance.onend = () => {
      isSpeaking.value = false
    }
    utterance.onerror = () => {
      isSpeaking.value = false
    }

    window.speechSynthesis.speak(utterance)
  }

  /**
   * Последовательное воспроизведение диалога. Первый вызов speak() происходит синхронно в @click.
   */
  function speakSequence(
    items: Array<{ id: string; text: string }>,
    options?: {
      overrideSpeed?: SpeechSpeed
      onLineChange?: (id: string | null) => void
      onComplete?: () => void
    }
  ) {
    if (!isSupported || !hasKoreanVoice.value || items.length === 0) return

    const myToken = ++sequenceToken
    window.speechSynthesis.cancel()

    const rate =
      options?.overrideSpeed === 'slow'
        ? 0.65
        : options?.overrideSpeed === 'normal'
          ? 0.95
          : currentRate.value

    const playIndex = (index: number) => {
      if (myToken !== sequenceToken) return
      if (index >= items.length) {
        isSpeaking.value = false
        activeSequenceId.value = null
        options?.onLineChange?.(null)
        options?.onComplete?.()
        return
      }

      const item = items[index]
      activeSequenceId.value = item.id
      options?.onLineChange?.(item.id)

      const utterance = new SpeechSynthesisUtterance(item.text)
      utterance.lang = 'ko-KR'
      if (koreanVoice.value) {
        utterance.voice = koreanVoice.value
      }
      utterance.rate = rate
      utterance.pitch = 1

      utterance.onstart = () => {
        if (myToken !== sequenceToken) return
        isSpeaking.value = true
      }
      utterance.onend = () => {
        if (myToken !== sequenceToken) return
        window.setTimeout(() => {
          playIndex(index + 1)
        }, 350)
      }
      utterance.onerror = () => {
        if (myToken !== sequenceToken) return
        isSpeaking.value = false
        activeSequenceId.value = null
        options?.onLineChange?.(null)
      }

      window.speechSynthesis.speak(utterance)
    }

    playIndex(0)
  }

  return {
    speed,
    currentRate,
    hasKoreanVoice,
    voiceUnavailableReason,
    isSpeaking,
    activeSequenceId,
    setSpeed,
    speak,
    speakSequence,
    stop,
  }
}
