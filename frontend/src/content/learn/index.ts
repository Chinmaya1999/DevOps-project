import { parseGuide } from './parse'
import type { Guide } from './parse'

// every guides/*.md file, parsed at build time
const files = import.meta.glob('./guides/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

const ORDER = [
  'devops-big-picture', 'prepare-your-computer', 'launch-aws-server', 'deploy-static-website',
  'deploy-nodejs-app', 'deploy-mern-app', 'domain-and-https', 'auto-deploy-github-actions', 'deployment-error-cheatsheet',
]

export const GUIDES: Guide[] = Object.values(files)
  .map(parseGuide)
  .sort((a, b) => ORDER.indexOf(a.slug) - ORDER.indexOf(b.slug))

export const guideBySlug = (slug?: string) => GUIDES.find((g) => g.slug === slug)

/** id used to remember that a step is done */
export const lessonId = (guideSlug: string, stepId: string) => `${guideSlug}:${stepId}`
export const totalSteps = (g: Guide) => g.steps.length
export type { Guide } from './parse'
