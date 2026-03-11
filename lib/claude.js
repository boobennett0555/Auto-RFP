export async function callClaude(messages, system) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, system }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.text
}

export const uid = () => Math.random().toString(36).slice(2, 9)

export const CATEGORIES = [
  'Company Overview', 'Experience & Portfolio', 'Team & Leadership',
  'Project Approach', 'Financial Capability', 'Timeline & Phasing',
  'References & Case Studies', 'Technical Specifications',
  'Community Impact', 'Legal & Compliance', 'Other',
]
