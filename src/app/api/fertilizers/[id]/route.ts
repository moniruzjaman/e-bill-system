import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/fertilizers/[id] - Get single fertilizer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const fertilizer = await db.fertilizer.findUnique({
      where: { id },
      include: {
        inventory: {
          include: {
            dealer: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    if (!fertilizer) {
      return NextResponse.json(
        { error: 'Fertilizer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(fertilizer)
  } catch (error) {
    console.error('Error fetching fertilizer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fertilizer' },
      { status: 500 }
    )
  }
}

// PUT /api/fertilizers/[id] - Update fertilizer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    const fertilizer = await db.fertilizer.update({
      where: { id },
      data: {
        name: data.name,
        nameBn: data.nameBn,
        type: data.type,
        composition: data.composition,
        unit: data.unit,
        pricePerUnit: data.pricePerUnit !== undefined ? parseFloat(data.pricePerUnit) : undefined,
        subsidyRate: data.subsidyRate !== undefined ? parseFloat(data.subsidyRate) : undefined,
        maxPerFarmerPerSeason: data.maxPerFarmerPerSeason ? parseFloat(data.maxPerFarmerPerSeason) : null,
        isActive: data.isActive
      }
    })

    return NextResponse.json(fertilizer)
  } catch (error) {
    console.error('Error updating fertilizer:', error)
    return NextResponse.json(
      { error: 'Failed to update fertilizer' },
      { status: 500 }
    )
  }
}

// DELETE /api/fertilizers/[id] - Delete fertilizer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if fertilizer is used in transactions
    const usageCount = await db.transactionItem.count({
      where: { fertilizerId: id }
    })

    if (usageCount > 0) {
      // Soft delete by marking as inactive
      await db.fertilizer.update({
        where: { id },
        data: { isActive: false }
      })
      return NextResponse.json({ message: 'Fertilizer deactivated (used in transactions)' })
    }

    await db.fertilizer.delete({ where: { id } })
    return NextResponse.json({ message: 'Fertilizer deleted successfully' })
  } catch (error) {
    console.error('Error deleting fertilizer:', error)
    return NextResponse.json(
      { error: 'Failed to delete fertilizer' },
      { status: 500 }
    )
  }
}
