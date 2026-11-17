// Inline glossary term. Usage: <Abbr term="TWC" /> or <Abbr term="TWC">the TWC</Abbr>.
// STUB: the glossary owner replaces the body with an accessible disclosure (works on touch and
// keyboard, not a hover-only tooltip). The props are the contract.
import type { ReactNode } from 'react'
import { lookupTerm } from '../data/glossary'

export function Abbr({ term, children }: { term: string; children?: ReactNode }) {
  const entry = lookupTerm(term)
  return <abbr title={entry ? `${entry.expansion}. ${entry.meaning}` : undefined}>{children ?? term}</abbr>
}

/** Opens the full glossary. Mounted in the app header and available to any screen. */
export function GlossaryButton({ className }: { className?: string }) {
  return <button type="button" className={className} disabled>Glossary</button>
}
