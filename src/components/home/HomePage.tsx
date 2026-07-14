import { AiOrb } from '../shared/AiOrb'
import { PromptMarquee } from './PromptMarquee'
import { HomePromptInput } from './HomePromptInput'
import { useAppStore } from '../../store/appStore'

export function HomePage() {
  const startNewQuestion = useAppStore((s) => s.startNewQuestion)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-12 text-center md:py-16">
        <AiOrb />
        <h1 className="mb-3 font-serif text-4xl text-brand">Your data, in conversation.</h1>
        <p className="mb-8 text-body">
          Explore claims, premiums, loss ratios, and retention — just ask in plain language.
        </p>

        <HomePromptInput onSubmit={startNewQuestion} />

        <div className="relative z-0 mt-8 w-screen max-w-none overflow-hidden [margin-left:calc(50%-50vw)]">
          <PromptMarquee onSelect={startNewQuestion} />
        </div>
      </section>
    </div>
  )
}
