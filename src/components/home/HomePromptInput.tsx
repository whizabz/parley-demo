import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { ArrowUp, Mic } from 'lucide-react'
import { useSpeechDictation } from '../../hooks/useSpeechDictation'
import { filterHomePrompts, homePlaceholderExamples } from '../../data/suggestedPrompts'
import { useAppStore } from '../../store/appStore'

interface HomePromptInputProps {
  onSubmit: (question: string) => void
}

const TYPE_MS = 38
const DELETE_MS = 22
const HOLD_MS = 1600
const GAP_MS = 400
const MAX_TEXTAREA_PX = 128
const MENU_GAP_PX = 8
const MENU_MAX_PX = 224
const MENU_FOOTER_PX = 40

type MenuBox = {
  top: number
  left: number
  width: number
  maxHeight: number
}

export function HomePromptInput({ onSubmit }: HomePromptInputProps) {
  const listId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)
  const [typedPlaceholder, setTypedPlaceholder] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(0)
  const [menuBox, setMenuBox] = useState<MenuBox | null>(null)
  const addToast = useAppStore((s) => s.addToast)
  const { listening, supported, toggleListening } = useSpeechDictation((text) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text))
  })

  const showSuggestions = focused
  const suggestions = filterHomePrompts(input)
  const isIdle = !focused && !input.trim()
  const placeholder = isIdle ? typedPlaceholder : ''

  const updateMenuBox = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP_PX - 12
    const spaceAbove = rect.top - MENU_GAP_PX - 12
    const preferBelow = spaceBelow >= Math.min(MENU_MAX_PX, 160) || spaceBelow >= spaceAbove
    const available = Math.max(120, preferBelow ? spaceBelow : spaceAbove)
    const maxHeight = Math.min(MENU_MAX_PX, available)
    const top = preferBelow
      ? rect.bottom + MENU_GAP_PX
      : Math.max(12, rect.top - MENU_GAP_PX - maxHeight)

    setMenuBox({
      top,
      left: rect.left,
      width: rect.width,
      maxHeight,
    })
  }, [])

  useLayoutEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_PX)}px`
  }, [input])

  useLayoutEffect(() => {
    if (!focused) {
      setMenuBox(null)
      return
    }

    updateMenuBox()
    window.addEventListener('resize', updateMenuBox)
    window.addEventListener('scroll', updateMenuBox, true)

    return () => {
      window.removeEventListener('resize', updateMenuBox)
      window.removeEventListener('scroll', updateMenuBox, true)
    }
  }, [focused, input, updateMenuBox])

  useEffect(() => {
    if (!isIdle) {
      setTypedPlaceholder('')
      return
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let phraseIndex = 0
    let charIndex = 0
    let deleting = false
    let timer: number | undefined
    let cancelled = false

    const schedule = (fn: () => void, ms: number) => {
      timer = window.setTimeout(() => {
        if (!cancelled) fn()
      }, ms)
    }

    const tick = () => {
      if (cancelled) return
      const phrase = homePlaceholderExamples[phraseIndex]

      if (reducedMotion) {
        setTypedPlaceholder(phrase)
        schedule(() => {
          phraseIndex = (phraseIndex + 1) % homePlaceholderExamples.length
          tick()
        }, HOLD_MS)
        return
      }

      if (!deleting) {
        charIndex += 1
        setTypedPlaceholder(phrase.slice(0, charIndex))
        if (charIndex >= phrase.length) {
          schedule(() => {
            deleting = true
            tick()
          }, HOLD_MS)
          return
        }
        schedule(tick, TYPE_MS)
        return
      }

      charIndex -= 1
      setTypedPlaceholder(phrase.slice(0, Math.max(charIndex, 0)))
      if (charIndex <= 0) {
        deleting = false
        phraseIndex = (phraseIndex + 1) % homePlaceholderExamples.length
        schedule(tick, GAP_MS)
        return
      }
      schedule(tick, DELETE_MS)
    }

    tick()
    return () => {
      cancelled = true
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [isIdle])

  useEffect(() => {
    setHighlightIndex(0)
  }, [input, focused])

  useEffect(() => {
    if (!showSuggestions) return
    const el = document.getElementById(`${listId}-option-${highlightIndex}`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlightIndex, listId, showSuggestions])

  useEffect(() => {
    if (!focused) return
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setFocused(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [focused])

  const handleSubmit = (question = input) => {
    const q = question.trim()
    if (!q) return
    onSubmit(q)
    setInput('')
    setFocused(false)
  }

  const selectSuggestion = (question: string) => {
    handleSubmit(question)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightIndex((i) => (i + 1) % suggestions.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightIndex((i) => (i - 1 + suggestions.length) % suggestions.length)
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setFocused(false)
        e.currentTarget.blur()
        return
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        selectSuggestion(suggestions[highlightIndex]?.question ?? input)
        return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const listMaxHeight = menuBox
    ? Math.max(80, menuBox.maxHeight - MENU_FOOTER_PX)
    : MENU_MAX_PX - MENU_FOOTER_PX

  const menu =
    showSuggestions && menuBox
      ? createPortal(
          <div
            ref={menuRef}
            style={{
              top: menuBox.top,
              left: menuBox.left,
              width: menuBox.width,
              maxHeight: menuBox.maxHeight,
            }}
            className="fixed z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-white text-left shadow-[0_8px_28px_rgba(0,0,0,0.12)]"
          >
            <ul
              id={listId}
              role="listbox"
              aria-label="Suggested questions"
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
              style={{ maxHeight: listMaxHeight }}
            >
              {suggestions.length === 0 ? (
                <li className="px-4 py-3 text-sm text-border-form">No matching suggestions</li>
              ) : (
                suggestions.map((prompt, i) => {
                  const active = i === highlightIndex
                  return (
                    <li
                      key={prompt.id}
                      role="option"
                      aria-selected={active}
                      id={`${listId}-option-${i}`}
                    >
                      <button
                        type="button"
                        onMouseEnter={() => setHighlightIndex(i)}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectSuggestion(prompt.question)}
                        className={`w-full px-4 py-2.5 text-left text-sm text-brand transition-colors ${
                          active ? 'bg-highlight/50' : 'hover:bg-surface/80'
                        }`}
                      >
                        {prompt.title}
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
            <p className="border-t border-border/40 px-4 py-2.5 text-xs text-border-form">
              {input.trim()
                ? 'Matching questions'
                : 'Based on your history and peers in your role'}
            </p>
          </div>,
          document.body,
        )
      : null

  return (
    <div ref={containerRef} className="relative z-10 mx-auto w-full max-w-2xl">
      <div className="flex items-end gap-2 rounded-2xl border border-border bg-white px-3 py-2 shadow-sm">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={showSuggestions}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            showSuggestions && suggestions[highlightIndex]
              ? `${listId}-option-${highlightIndex}`
              : undefined
          }
          className="max-h-32 min-h-[2.5rem] flex-1 resize-none bg-transparent py-2 text-base leading-snug text-body outline-none placeholder:text-border-form"
        />
        <div className="mb-0.5 flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (!supported) {
                addToast('Voice dictation is not supported in this browser.')
                return
              }
              toggleListening()
            }}
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
              listening
                ? 'border-accent bg-highlight text-accent'
                : 'border-border text-border-form hover:bg-surface hover:text-brand'
            }`}
            aria-label={listening ? 'Stop dictation' : 'Start dictation'}
          >
            <Mic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            aria-label="Submit question"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
      {menu}
    </div>
  )
}
