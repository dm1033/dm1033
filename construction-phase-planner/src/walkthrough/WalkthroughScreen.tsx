// STUB: replaced by the walk-through lead. Props are the contract with App.tsx.
export interface WalkthroughScreenProps {
  /** Leave the walk for the report pack (after sign-off or skip). */
  onDone: () => void
  /** Leave the walk without closing it (it stays resumable). */
  onExit: () => void
}

export default function WalkthroughScreen({ onDone }: WalkthroughScreenProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">Site walk-through</h1>
      <p className="text-slate-300 mb-4">The walk-through is being built.</p>
      <button onClick={onDone} className="rounded-lg bg-amber-500 text-slate-950 font-bold px-6 py-3">Go to reports</button>
    </div>
  )
}
