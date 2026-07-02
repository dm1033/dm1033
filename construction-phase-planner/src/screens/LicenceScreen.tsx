import { useState } from 'react'

// ============================================================
// Monetisation placeholders.
// Replace the STRIPE_PAYMENT_LINKS with real Stripe Payment Link
// URLs created in your Stripe dashboard. Do NOT put secret keys
// anywhere in this client-side application.
// ============================================================

const STRIPE_PAYMENT_LINKS = {
  singleUser: 'https://buy.stripe.com/REPLACE_single_user_licence',
  trainingProvider: 'https://buy.stripe.com/REPLACE_training_provider_licence',
  monthly: 'https://buy.stripe.com/REPLACE_monthly_subscription',
  organisation: 'https://buy.stripe.com/REPLACE_organisation_licence',
}

const LICENCE_KEY_STORAGE = 'cpp-smsts-licence-key'

const TIERS = [
  {
    id: 'singleUser',
    name: 'Single User',
    price: '£— one-off',
    features: ['All three scenarios', 'Score reports & certificates', 'Offline play', '1 named user'],
    link: STRIPE_PAYMENT_LINKS.singleUser,
  },
  {
    id: 'monthly',
    name: 'Monthly Subscription',
    price: '£—/month',
    features: ['Everything in Single User', 'New scenarios as released', 'Cancel any time'],
    link: STRIPE_PAYMENT_LINKS.monthly,
  },
  {
    id: 'trainingProvider',
    name: 'Training Provider',
    price: '£—/year',
    features: ['Tutor dashboard & console', 'Custom questions & hazards', 'Delegate report downloads', 'Up to 100 delegates/year', 'Provider branding on certificates'],
    link: STRIPE_PAYMENT_LINKS.trainingProvider,
    highlight: true,
  },
  {
    id: 'organisation',
    name: 'Organisation',
    price: 'POA',
    features: ['Unlimited delegates', 'Multi-site licences', 'Custom scenario development', 'LMS/SCORM integration (roadmap)'],
    link: STRIPE_PAYMENT_LINKS.organisation,
  },
]

export default function LicenceScreen() {
  const [key, setKey] = useState(() => localStorage.getItem(LICENCE_KEY_STORAGE) ?? '')
  const [saved, setSaved] = useState(false)

  const saveKey = () => {
    // Placeholder validation: format XXXX-XXXX-XXXX-XXXX.
    // Production: validate against your licensing server.
    const ok = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key.trim().toUpperCase())
    if (ok) {
      localStorage.setItem(LICENCE_KEY_STORAGE, key.trim().toUpperCase())
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } else {
      alert('Licence key format: XXXX-XXXX-XXXX-XXXX (placeholder validation only).')
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-1">Licensing</h2>
      <p className="text-sm text-slate-400 mb-6">
        Placeholder pricing page — connect real Stripe Payment Links before going live. No payment
        secrets are stored in this application.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {TIERS.map((t) => (
          <div
            key={t.id}
            className={`rounded-xl border p-4 flex flex-col ${t.highlight ? 'border-amber-500 bg-amber-500/5' : 'border-slate-800 bg-slate-900/50'}`}
          >
            {t.highlight && <div className="text-[10px] font-bold text-amber-400 mb-1">MOST POPULAR</div>}
            <div className="font-bold">{t.name}</div>
            <div className="text-xl font-extrabold my-2">{t.price}</div>
            <ul className="text-xs text-slate-400 space-y-1 mb-4 flex-1">
              {t.features.map((f) => <li key={f}>✓ {f}</li>)}
            </ul>
            <a
              href={t.link}
              target="_blank"
              rel="noreferrer"
              className={`text-center rounded-lg px-3 py-2 text-sm font-bold ${t.highlight ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 'bg-slate-800 hover:bg-slate-700'}`}
            >
              Buy (placeholder)
            </a>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 max-w-lg">
        <h3 className="font-bold mb-2">🔑 Activate a licence key</h3>
        <p className="text-xs text-slate-400 mb-3">
          Enter the licence key from your purchase confirmation email. (Placeholder — format validation only.)
        </p>
        <div className="flex gap-2">
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            className="flex-1 rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm font-mono uppercase"
          />
          <button onClick={saveKey} className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 text-sm">
            Activate
          </button>
        </div>
        {saved && <p className="text-emerald-400 text-xs mt-2">✓ Licence key saved on this device.</p>}
        {localStorage.getItem(LICENCE_KEY_STORAGE) && !saved && (
          <p className="text-xs text-slate-500 mt-2">A licence key is active on this device.</p>
        )}
      </div>
    </div>
  )
}
