import { AiOrb } from '../shared/AiOrb'
import { HomePromptInput } from './HomePromptInput'
import { useAppStore } from '../../store/appStore'

export function HomePage() {
  const startNewQuestion = useAppStore((s) => s.startNewQuestion)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Extra bottom padding biases the centered block upward so the dropdown has room. */}
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 pb-44 pt-10 text-center md:pb-52 md:pt-12">
        <div className="w-full">
          <AiOrb />
          <h1 className="mb-3 font-serif text-4xl text-brand">Your data, in conversation.</h1>
          <p className="mb-8 text-body">
            Explore claims, premiums, loss ratios, and retention — just ask in plain language.
          </p>

          <HomePromptInput onSubmit={startNewQuestion} />
        </div>
      </section>
    </div>
  )
}
