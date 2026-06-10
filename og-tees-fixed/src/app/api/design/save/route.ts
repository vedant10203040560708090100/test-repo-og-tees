import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { canvasJson, productId, productColor, printLocation, name, previewUrl } = body

    if (!canvasJson || !productId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const design = await prisma.design.create({
      data: {
        canvasJson,
        productId,
        productColor: productColor || 'White',
        printLocation: printLocation || 'front',
        name: name || null,
        previewUrl: previewUrl || null,
      },
    })

    return NextResponse.json({ design })
  } catch (error) {
    console.error('Error saving design:', error)
    return NextResponse.json({ error: 'Failed to save design' }, { status: 500 })
  }
}
