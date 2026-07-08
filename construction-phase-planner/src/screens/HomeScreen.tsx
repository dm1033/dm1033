import { DISCLAIMER } from '../types'

export default function HomeScreen({ onStart, onTutor }: { onStart: () => void; onTutor: () => void }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <div className="text-6xl mb-4">🚧</div>
        <h1 className="text-4xl font-extrabold tracking-tight">
          Construction Phase Planner
        </h1>
        <p className="text-xl text-amber-400 font-semibold mt-1">SMSTS Safety Challenge</p>
        <p className="text-slate-400 mt-4 max-w-2xl mx-auto">
          Plan, manage and safely deliver a construction project from site set-up to handover.
          Every decision moves your safety, legal, programme, cost, quality and environmental
          scores — and your client's confidence, your workforce's morale and your enforcement risk.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <button
          onClick={onStart}
          className="rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-lg px-6 py-5 transition-colors"
        >
          ▶ Start as Delegate
          <span className="block text-sm font-normal mt-1">Choose one of three project scenarios</span>
        </button>
        <button
          onClick={onTutor}
          className="rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-lg px-6 py-5 transition-colors"
        >
          🎓 Tutor / Admin Mode
          <span className="block text-sm font-normal text-slate-300 mt-1">
            Review delegate choices, reveal answers, add questions
          </span>
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4 text-sm mb-10">
        {[
          { icon: '🏗️', title: 'Plan the project', body: 'CDM duty holders, construction phase plan, welfare, RAMS, permits and temporary works — built as you play.' },
          { icon: '⚠️', title: 'Handle the unexpected', body: 'Service strikes, storms, HSE visits, PPE refusals and programme pressure test your judgement.' },
          { icon: '📊', title: 'Get graded like a manager', body: 'Seven scored disciplines, missed-item reports, downloadable CPP, registers, trackers and a tutor review sheet.' },
          { icon: '🎯', title: 'Every objective, evidenced', body: 'Each scenario walks you through all ten SMSTS-aligned learning outcomes, with a coverage report at the end.' },
          { icon: '🌱', title: 'Paperless and remote', body: 'No printing, no workbooks to post — play in a browser anywhere, download reports only when you need them.' },
          { icon: '🎮', title: 'Learning that sticks', body: 'Decisions with consequences beat slides: programme pressure, incidents and trade-offs make the principles memorable.' },
        ].map((c) => (
          <div key={c.title} className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <div className="text-2xl mb-2">{c.icon}</div>
            <div className="font-semibold mb-1">{c.title}</div>
            <div className="text-slate-400">{c.body}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400 leading-relaxed">
        <p className="font-semibold text-slate-300 mb-1">Disclaimer</p>
        <p>{DISCLAIMER}</p>
        <p className="mt-2">
          This is an SMSTS-aligned learning game based on construction site safety principles. It
          supports revision and practical understanding. It is not endorsed or approved by CITB and
          does not replace formal CITB training, assessment or certification.
        </p>
      </div>
    </div>
  )
}
