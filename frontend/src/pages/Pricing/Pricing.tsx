import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Minus } from 'lucide-react'
import Header from '../../components/Header/Header'
import api from '../../services/api'

interface PricingData {
  pricing: { monthly: number; yearly: number }
  plans: { free: { generationsPerMonth: number }; pro: unknown }
}

// shown if the API is unreachable; the server remains the source of truth for what is actually charged
const FALLBACK: PricingData = { pricing: { monthly: 199, yearly: 1990 }, plans: { free: { generationsPerMonth: 10 }, pro: {} } }

const Pricing: React.FC = () => {
  const [data, setData] = useState<PricingData>(FALLBACK)

  useEffect(() => {
    api.get('/payment/pricing').then((r) => setData(r.data.data)).catch(() => { /* keep fallback */ })
  }, [])

  const { monthly, yearly } = data.pricing
  const save = Math.round((1 - yearly / (monthly * 12)) * 100)
  const freeLimit = data.plans.free.generationsPerMonth

  const rows: [string, string | boolean, string | boolean][] = [
    ['Config generators (Terraform, Kubernetes, Docker, CI/CD…)', `${freeLimit} / month`, 'Unlimited'],
    ['Validator', true, true],
    ['Error troubleshooter & Help desk', true, true],
    ['Secret scanner', true, true],
    ['Docs, roadmap, community chat & blogs', true, true],
    ['Full-stack bundle ZIP (Docker + CI/CD + Kubernetes)', false, true],
    ['One-click AWS deployment & management', false, true],
    ['AWS cloud cost analysis', false, true],
    ['Vision deploy', false, true],
  ]
  const cell = (v: string | boolean) =>
    v === true ? <Check className="w-5 h-5 text-emerald-500 mx-auto" aria-label="Included" /> :
    v === false ? <Minus className="w-5 h-5 text-slate-400 mx-auto" aria-label="Not included" /> : <span className="text-sm">{v}</span>

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-ink-950 text-slate-900 dark:text-gray-100">
      <Header showAuthButtons />
      <main className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="font-display text-5xl font-bold tracking-tight">Simple, honest pricing</h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-gray-300">Start free. Upgrade when you need unlimited generation and deployment tools.</p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <div className="glass-panel p-8">
            <h2 className="font-display text-2xl font-semibold">Free</h2>
            <div className="mt-3"><span className="font-display text-5xl font-bold">₹0</span></div>
            <p className="mt-2 text-slate-600 dark:text-gray-400">For learning and everyday troubleshooting.</p>
            <Link to="/register" className="mt-6 block text-center px-6 py-3 rounded-xl border border-slate-300 dark:border-white/15 font-semibold hover:bg-white dark:hover:bg-white/5 transition">Create free account</Link>
          </div>
          <div className="glass-panel p-8 border-cyan-500/40 relative">
            <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-cyan-500 to-violet-600 text-white">Pro</span>
            <h2 className="font-display text-2xl font-semibold">Pro</h2>
            <div className="mt-3"><span className="font-display text-5xl font-bold">₹{monthly}</span><span className="text-slate-500 dark:text-gray-400"> / month</span></div>
            <p className="mt-2 text-slate-600 dark:text-gray-400">or ₹{yearly.toLocaleString('en-IN')} / year{save > 0 ? ` — save ${save}%` : ''}.</p>
            <Link to="/register" className="mt-6 block text-center btn-primary">Get Pro</Link>
          </div>
        </div>

        <div className="mt-12 glass-panel overflow-hidden">
          <table className="w-full text-left">
            <caption className="sr-only">Plan comparison</caption>
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-sm">
                <th scope="col" className="p-4 font-semibold">Feature</th>
                <th scope="col" className="p-4 font-semibold text-center w-32">Free</th>
                <th scope="col" className="p-4 font-semibold text-center w-32">Pro</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([name, free, pro]) => (
                <tr key={name} className="border-b last:border-0 border-slate-200 dark:border-white/5">
                  <th scope="row" className="p-4 font-normal">{name}</th>
                  <td className="p-4 text-center">{cell(free)}</td>
                  <td className="p-4 text-center">{cell(pro)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-gray-400">
          Payments by UPI, card or net banking via Cashfree. Prices in INR. Renewing adds time on top of your current period.
        </p>
        <p className="mt-2 text-center text-sm text-slate-500 dark:text-gray-400">Teams of 3+? <Link to="/contact" className="underline text-cyan-700 dark:text-cyan-300">Talk to us</Link>.</p>
      </main>
    </div>
  )
}

export default Pricing
