import { Boxes, Container, GitBranch, Layers, Package, Server, Workflow } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface DeployStage {
  key: string
  tool: string
  note: string
  color: string
  icon: LucideIcon
  /** position in the 3D scene: top → bottom, zig-zag for depth */
  pos: [number, number, number]
}

/** The path an application takes from a git push to a live server. */
export const DEPLOY_STAGES: DeployStage[] = [
  { key: 'git', tool: 'GitHub', note: 'Push code', color: '#e2e8f0', icon: GitBranch, pos: [-1.5, 3.3, 0] },
  { key: 'ci', tool: 'GitHub Actions', note: 'Build & test', color: '#a78bfa', icon: Workflow, pos: [1.2, 2.2, 0.7] },
  { key: 'docker', tool: 'Docker', note: 'Package image', color: '#38bdf8', icon: Container, pos: [-1.3, 1.1, -0.4] },
  { key: 'registry', tool: 'Docker Hub', note: 'Store image', color: '#22d3ee', icon: Package, pos: [1.3, 0, 0.6] },
  { key: 'terraform', tool: 'Terraform', note: 'Provision cloud', color: '#8b5cf6', icon: Layers, pos: [-1.4, -1.1, -0.3] },
  { key: 'k8s', tool: 'Kubernetes', note: 'Run & scale pods', color: '#3b82f6', icon: Boxes, pos: [1.2, -2.2, 0.6] },
  { key: 'server', tool: 'AWS server + Nginx', note: 'Live in production', color: '#34d399', icon: Server, pos: [-0.3, -3.3, 0] },
]
