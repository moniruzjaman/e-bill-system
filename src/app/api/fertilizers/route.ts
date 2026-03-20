import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/fertilizers - List all fertilizers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const active = searchParams.get('active')

    const where = {
      ...(type && { type: type as any }),
      ...(active !== null && { isActive: active === 'true' })
    }

    const fertilizers = await db.fertilizer.findMany({
      where,
      include: {
        _count: {
          select: { inventory: true, transactionItems: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(fertilizers)
  } catch (error) {
    console.error('Error fetching fertilizers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fertilizers' },
      { status: 500 }
    )
  }
}

// POST /api/fertilizers - Create new fertilizer
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const fertilizer = await db.fertilizer.create({
      data: {
        name: data.name,
        nameBn: data.nameBn,
        type: data.type,
        composition: data.composition,
        unit: data.unit || 'kg',
        pricePerUnit: parseFloat(data.pricePerUnit),
        subsidyRate: parseFloat(data.subsidyRate) || 0,
        maxPerFarmerPerSeason: data.maxPerFarmerPerSeason ? parseFloat(data.maxPerFarmerPerSeason) : null,
        isActive: data.isActive ?? true
      }
    })

    return NextResponse.json(fertilizer, { status: 201 })
  } catch (error) {
    console.error('Error creating fertilizer:', error)
    return NextResponse.json(
      { error: 'Failed to create fertilizer' },
      { status: 500 }
    )
  }
}
