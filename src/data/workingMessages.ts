export const WORKING_MESSAGES = [
  'Connecting the dots across your sources…',
  'Reading between the rows…',
  'Asking the data nicely…',
  'Sifting through the fine print…',
  'Lining up the numbers…',
  'Checking semantics one more time…',
  'Teaching spreadsheets new tricks…',
  'Polishing the insights…',
  'Following the thread through your sources…',
  'Almost there — just a moment…',
  'Turning questions into tiles…',
  'Making sense of the joins…',
]

export function shuffleWorkingMessages(messages = WORKING_MESSAGES): string[] {
  const copy = [...messages]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}
