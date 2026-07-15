import { useEffect, useId, useRef, useState } from 'react'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import type { Version } from '../../types'
import { useAppStore } from '../../store/appStore'

interface MessageFeedbackProps {
  version: Version
}

const CONFETTI = [
  { dx: '-14px', dy: '-18px', rot: '-40deg', color: '#196ecf', size: 4, delay: '0ms' },
  { dx: '12px', dy: '-16px', rot: '35deg', color: '#002677', size: 3, delay: '20ms' },
  { dx: '-18px', dy: '2px', rot: '-15deg', color: '#d14600', size: 3, delay: '40ms' },
  { dx: '16px', dy: '4px', rot: '50deg', color: '#196ecf', size: 4, delay: '10ms' },
  { dx: '2px', dy: '-22px', rot: '10deg', color: '#e5f8fb', size: 3, delay: '30ms' },
  { dx: '-8px', dy: '14px', rot: '-55deg', color: '#002677', size: 3, delay: '50ms' },
  { dx: '10px', dy: '12px', rot: '25deg', color: '#196ecf', size: 2, delay: '25ms' },
  { dx: '-4px', dy: '-10px', rot: '70deg', color: '#d14600', size: 2, delay: '15ms' },
] as const

export function MessageFeedback({ version }: MessageFeedbackProps) {
  const setVersionFeedback = useAppStore((s) => s.setVersionFeedback)
  const submitVersionFeedbackComment = useAppStore((s) => s.submitVersionFeedbackComment)
  const [commentOpen, setCommentOpen] = useState(false)
  const [comment, setComment] = useState(version.feedbackComment ?? '')
  const [burstKey, setBurstKey] = useState(0)
  const [popping, setPopping] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const burstId = useId()

  const feedback = version.feedback ?? null

  useEffect(() => {
    if (!commentOpen) return
    const timer = setTimeout(() => textareaRef.current?.focus(), 50)
    return () => clearTimeout(timer)
  }, [commentOpen])

  useEffect(() => {
    setComment(version.feedbackComment ?? '')
    if (version.feedback !== 'down') setCommentOpen(false)
  }, [version.id, version.feedback, version.feedbackComment])

  useEffect(() => {
    if (!popping) return
    const timer = setTimeout(() => setPopping(false), 400)
    return () => clearTimeout(timer)
  }, [popping])

  const onUp = () => {
    setCommentOpen(false)
    if (feedback !== 'up') {
      setBurstKey((key) => key + 1)
      setPopping(true)
      setVersionFeedback(version.id, 'up')
      return
    }
    setVersionFeedback(version.id, null)
  }

  const onDown = () => {
    if (feedback === 'down') {
      setCommentOpen(false)
      setVersionFeedback(version.id, null)
      return
    }
    setVersionFeedback(version.id, 'down')
    setCommentOpen(true)
  }

  const submitComment = () => {
    submitVersionFeedbackComment(version.id, comment)
    setCommentOpen(false)
  }

  const skipComment = () => {
    setCommentOpen(false)
  }

  return (
    <div className="pt-1">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onUp}
          className={`relative flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
            feedback === 'up'
              ? 'bg-highlight text-brand'
              : 'text-border-form hover:bg-surface hover:text-brand'
          }`}
          aria-label="Thumbs up"
          aria-pressed={feedback === 'up'}
        >
          {burstKey > 0 && (
            <span key={`${burstId}-${burstKey}`} className="pointer-events-none absolute inset-0">
              {CONFETTI.map((piece, index) => (
                <span
                  key={index}
                  className="thumb-confetti-piece"
                  style={{
                    ['--dx' as string]: piece.dx,
                    ['--dy' as string]: piece.dy,
                    ['--rot' as string]: piece.rot,
                    width: piece.size,
                    height: piece.size,
                    marginLeft: -piece.size / 2,
                    marginTop: -piece.size / 2,
                    backgroundColor: piece.color,
                    animationDelay: piece.delay,
                    borderRadius: index % 2 === 0 ? '9999px' : '1px',
                  }}
                />
              ))}
            </span>
          )}
          <ThumbsUp
            className={`h-3.5 w-3.5 ${feedback === 'up' ? 'fill-brand' : ''} ${
              popping ? 'animate-thumb-pop' : ''
            }`}
          />
        </button>
        <button
          type="button"
          onClick={onDown}
          className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
            feedback === 'down'
              ? 'bg-highlight text-brand'
              : 'text-border-form hover:bg-surface hover:text-brand'
          }`}
          aria-label="Thumbs down"
          aria-pressed={feedback === 'down'}
        >
          <ThumbsDown className={`h-3.5 w-3.5 ${feedback === 'down' ? 'fill-brand' : ''}`} />
        </button>
      </div>

      {commentOpen && (
        <div className="mt-2 max-w-sm rounded-xl border border-border bg-white p-3 shadow-sm">
          <p className="text-xs font-medium text-body">What didn&apos;t work? (optional)</p>
          <textarea
            ref={textareaRef}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Tell us what was wrong or missing…"
            className="mt-2 w-full resize-none rounded-lg border border-border-form/40 px-3 py-2 text-sm text-body outline-none placeholder:text-border-form focus:border-accent"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={skipComment}
              className="rounded-md px-3 py-1.5 text-xs text-border-form hover:bg-surface hover:text-body"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={submitComment}
              className="rounded-md bg-brand px-3 py-1.5 text-xs text-white hover:opacity-90"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
