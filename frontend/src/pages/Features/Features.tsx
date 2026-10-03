import React from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, ArrowRight, BookOpen, Boxes, GraduationCap, KeyRound, LifeBuoy, MessageSquare, Receipt,
  Rocket, ShieldCheck, Terminal, Wrench, Zap,
} from 'lucide-react'
import Header from '../../components/Header/Header'

type Feature = { icon: React.ElementType; title: string; text: string; how: string; tag: 'Free' | 'Pro' | 'Free · 10/month' }

const GROUPS: { title: string; blurb: string; items: Feature[] }[] = [
  {
    title: 'Learn',
    blurb: 'For college students, freshers and career switchers who want to become DevOps engineers.',
    items: [
      { icon: GraduationCap, tag: 'Free', title: '12-stage roadmap', text: 'Linux, Git, scripting, servers, Docker, CI/CD, AWS, Terraform, Kubernetes, monitoring, security and the job hunt, in order.', how: 'Each stage has a goal, topics, checkpoints you tick off, a project and free resources. Progress is saved to your account.' },
      { icon: BookOpen, tag: 'Free', title: 'Step-by-step deployment guides', text: '9 guides: prepare your computer, launch an AWS server, deploy a static site, a Node.js app and a MERN app, add a domain and HTTPS, auto-deploy with GitHub Actions, and an error cheat sheet.', how: 'Every command is copy-ready. Risky steps show what you should see, and common errors expand to a cause and a fix.' },
      { icon: Boxes, tag: 'Free', title: 'Tested starter projects', text: 'Download a working static site, Node.js app or MERN app as a ZIP, so you practise deploying instead of debugging sample code.', how: 'Each starter has a Dockerfile, a Compose file where needed, and an auto-deploy workflow. No sign-up needed to download.' },
    ],
  },
  {
    title: 'Generate and check',
    blurb: 'Write less boilerplate, and catch mistakes before they reach a server.',
    items: [
      { icon: Terminal, tag: 'Free · 10/month', title: '8 config generators', text: 'Dockerfile, Kubernetes, Terraform, Jenkinsfile, GitHub Actions, Ansible, Bash and Python scripts, from a short form.', how: 'Fill in the form, read the generated file, download it. Free accounts get 10 generations a month; Pro is unlimited.' },
      { icon: ShieldCheck, tag: 'Free', title: 'Validator', text: 'Checks configuration files for mistakes and insecure defaults, with suggestions.', how: 'Paste a config, get a list of problems and fixes before you deploy.' },
      { icon: KeyRound, tag: 'Free', title: 'Secret scanner', text: 'Finds AWS keys, GitHub tokens, private keys and database passwords in text.', how: 'Findings show only a redacted preview, with rotation advice. Nothing you paste is stored or logged.' },
    ],
  },
  {
    title: 'Fix problems',
    blurb: 'Everyone gets errors. The skill is finding the cause quickly.',
    items: [
      { icon: LifeBuoy, tag: 'Free', title: 'Help desk', text: 'Pick the area (Kubernetes, Docker, Terraform, AWS, Nginx, SSH, TLS…), then what you are seeing, and get the fix.', how: 'Explanations adapt to your experience level. Areas matching what you work with come first.' },
      { icon: Wrench, tag: 'Free', title: 'Error troubleshooter', text: 'Paste a log or error and get the likely cause and the commands to try. 29 common production errors covered.', how: 'Works on text you paste. It never sends your logs anywhere.' },
    ],
  },
  {
    title: 'Ship and operate (Pro)',
    blurb: 'For people deploying real projects.',
    items: [
      { icon: Zap, tag: 'Pro', title: 'Full-stack bundle (ZIP)', text: 'Dockerfile, Compose, GitHub Actions, Kubernetes manifests and a README for your app in one download.', how: 'Choose a runtime (Node, Python, Go, static), port and replicas, then download.' },
      { icon: Rocket, tag: 'Pro', title: 'One-click deployment and management', text: 'Deploy a Docker stack to your own AWS server over SSH and manage the deployments afterwards.', how: 'Your SSH key is encrypted before it is stored and is never shown again.' },
      { icon: Activity, tag: 'Pro', title: 'AWS cost analysis', text: 'See where your AWS spend goes by service and over time, using your own read-only credentials.', how: 'Helps you notice a forgotten server before the bill does.' },
    ],
  },
  {
    title: 'Community and account',
    blurb: 'Learning is easier with other people, and your data should be safe.',
    items: [
      { icon: MessageSquare, tag: 'Free', title: 'Chat, blogs and docs', text: 'Talk with other learners, publish what you learn, and read the DevOps documentation library.', how: 'Writing about what you built is also the best portfolio you can make.' },
      { icon: Receipt, tag: 'Free', title: 'Secure account', text: 'Optional two-factor login, protected sessions, billing history and printable invoices.', how: 'Sessions use secure cookies that scripts cannot read. Payments run through Cashfree.' },
    ],
  },
]

const STEPS = [
  ['Learn', 'Follow the roadmap and a guide. Download a tested starter project.'],
  ['Generate', 'Create the Dockerfile, pipeline or Terraform your project needs.'],
  ['Check', 'Run the validator and the secret scanner before you deploy.'],
  ['Deploy', 'Put it on your own server with HTTPS and automatic deploys.'],
  ['Fix', 'When something breaks, use the Help desk and troubleshooter.'],
]

const Features: React.FC = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-ink-950 text-slate-900 dark:text-gray-100">
    <Header showAuthButtons />
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
      <header className="max-w-3xl">
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">What DeployDojo <span className="text-gradient">does</span></h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-gray-300">
          DeployDojo is a <strong>learning platform and toolbox for DevOps</strong>. Beginners learn by deploying real projects on a real server.
          Working engineers generate configs, check them, and fix production errors faster.
        </p>
      </header>

      <section className="mt-12" aria-labelledby="process">
        <h2 id="process" className="font-display text-2xl font-bold">How it works</h2>
        <ol className="mt-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="glass-panel p-4">
              <span className="font-mono text-xs text-cyan-700 dark:text-cyan-300">Step {i + 1}</span>
              <div className="font-display font-semibold">{t}</div>
              <p className="mt-1 text-sm text-slate-600 dark:text-gray-400">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {GROUPS.map((g) => (
        <section key={g.title} className="mt-14" aria-label={g.title}>
          <h2 className="font-display text-2xl font-bold">{g.title}</h2>
          <p className="mt-1 text-slate-600 dark:text-gray-400">{g.blurb}</p>
          <div className="mt-5 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {g.items.map((f) => (
              <article key={f.title} className="glass-panel p-5 flex flex-col">
                <div className="flex items-start justify-between">
                  <span className="w-10 h-10 rounded-xl hero-gradient flex items-center justify-center"><f.icon className="w-5 h-5 text-white" /></span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${f.tag === 'Pro' ? 'bg-amber-400/90 text-amber-950' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'}`}>{f.tag}</span>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-700 dark:text-gray-300">{f.text}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-gray-400"><strong className="text-slate-700 dark:text-gray-300">How:</strong> {f.how}</p>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="mt-14 glass-panel p-6 md:p-8 flex flex-col md:flex-row gap-5 md:items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Who is it for?</h2>
          <ul className="mt-2 text-slate-700 dark:text-gray-300 space-y-1 list-disc pl-5">
            <li><strong>College students and freshers</strong> who want a clear path to a DevOps job.</li>
            <li><strong>Developers</strong> who need to deploy their own apps without guessing.</li>
            <li><strong>Working engineers</strong> who want faster configs, safer pipelines and quicker debugging.</li>
          </ul>
        </div>
        <div className="flex gap-3 shrink-0">
          <Link to="/register" className="btn-primary inline-flex items-center">Start free <ArrowRight className="ml-2 w-5 h-5" /></Link>
          <Link to="/learn" className="px-5 py-3 rounded-xl border border-slate-300 dark:border-white/15 font-semibold">See the guides</Link>
        </div>
      </section>
    </main>
  </div>
)

export default Features
