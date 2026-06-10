import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prompt, style } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI design generation is not configured. Please add your OpenAI API key.' },
        { status: 503 }
      )
    }

    const enhancedPrompt = `T-shirt design graphic, ${prompt}. Style: ${style || 'bold vector art'}.
      White background or transparent, suitable for screen printing, high contrast, no gradients,
      limited colors (2-4 colors max), clean edges, professional apparel design.`

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url',
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      return NextResponse.json({ error: err.error?.message || 'AI generation failed' }, { status: 500 })
    }

    const data = await response.json()
    const imageUrl = data.data[0]?.url

    return NextResponse.json({ imageUrl, revisedPrompt: data.data[0]?.revised_prompt })
  } catch (error) {
    console.error('AI design error:', error)
    return NextResponse.json({ error: 'Failed to generate design' }, { status: 500 })
  }
}
