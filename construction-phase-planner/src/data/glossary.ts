// Plain-English glossary of the abbreviations and terms the game uses.
// STUB: the glossary owner replaces the entries; the exported names are the contract.
export interface GlossaryEntry {
  /** The abbreviation or term exactly as it appears in game text, e.g. "TWC". */
  term: string
  /** Spelled out, e.g. "Temporary Works Co-ordinator". */
  expansion: string
  /** One or two plain sentences: what it is and why it matters on site. */
  meaning: string
}

export const GLOSSARY: GlossaryEntry[] = [
  { term: 'CPP', expansion: 'Construction Phase Plan', meaning: 'The plan that sets out how health and safety will be managed during the construction phase.' },
]

export function lookupTerm(term: string): GlossaryEntry | undefined {
  const t = term.trim().toLowerCase()
  return GLOSSARY.find((g) => g.term.toLowerCase() === t)
}
