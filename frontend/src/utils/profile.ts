/** Maps the "domains" chosen at signup to Help-desk areas and suggested next steps. */
export const AREA_FOR_DOMAIN: Record<string, string> = {
  Kubernetes: 'Kubernetes',
  Docker: 'Docker',
  Terraform: 'Terraform',
  'Cloud Computing (AWS/Azure/GCP)': 'AWS',
  'GitHub Actions': 'GitHub Actions',
  'CI/CD': 'GitHub Actions',
  'Linux/Unix': 'Linux',
  Networking: 'Nginx',
  Security: 'TLS',
}

export const isBeginner = (experience?: string) => !experience || ['Less than 1 year', '1-2 years'].includes(experience)
export const isSenior = (experience?: string) => ['5-10 years', '10+ years'].includes(experience || '')

export interface Recommendation { title: string; text: string; to: string; pro?: boolean }

/** Personalised next steps from experience level + chosen domains. */
export function recommendationsFor(experience: string | undefined, domains: string[] = []): Recommendation[] {
  const out: Recommendation[] = []
  if (isBeginner(experience)) {
    out.push({ title: 'Follow the DevOps roadmap', text: 'A step-by-step path from Linux basics to Kubernetes and CI/CD.', to: '/roadmap' })
    out.push({ title: 'Generate your first Dockerfile', text: 'See a production-grade example and read why each line is there.', to: '/generator/dockerfile' })
    out.push({ title: 'Stuck on an error?', text: 'Answer two questions and get a plain-language fix.', to: '/help' })
  } else if (isSenior(experience)) {
    out.push({ title: 'Ship a full-stack bundle', text: 'Dockerfile, compose, CI/CD and Kubernetes manifests in one ZIP.', to: '/bundle', pro: true })
    out.push({ title: 'Scan for leaked secrets', text: 'Paste configs or code; get redacted findings and rotation steps.', to: '/toolbox' })
    out.push({ title: 'Review cloud spend', text: 'See where AWS money goes, by service and over time.', to: '/cloud-cost-analysis', pro: true })
  } else {
    out.push({ title: 'Validate before you deploy', text: 'Catch insecure defaults and mistakes in your configs.', to: '/validator' })
    out.push({ title: 'Automate your pipeline', text: 'Generate GitHub Actions / Jenkins pipelines with tests and scans.', to: '/generator/github-actions' })
    out.push({ title: 'Debug faster', text: 'Guided troubleshooting for Kubernetes, Docker, Terraform and more.', to: '/help' })
  }
  if (domains.includes('Terraform')) out.push({ title: 'Terraform generator', text: 'Modular, state-managed configs for AWS, Azure and GCP.', to: '/generator/terraform' })
  if (domains.includes('Kubernetes')) out.push({ title: 'Kubernetes manifests', text: 'Deployments, services, ingress and HPA with sane defaults.', to: '/generator/kubernetes' })
  return out.slice(0, 5)
}
