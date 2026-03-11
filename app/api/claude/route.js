import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request) {
  try {
    const { messages, system } = await request.json()
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: system || 'You are an expert at helping real estate developers craft compelling RFP responses for hospital systems.',
      messages,
    })
    return Response.json({ text: response.content[0]?.text || '' })
  } catch (err) {
    console.error('Claude API error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
