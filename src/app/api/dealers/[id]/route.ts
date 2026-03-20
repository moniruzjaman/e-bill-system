import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/dealers/[id] - Get single dealer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const dealer = await db.dealer.findUnique({
      where: { id },
      include: {
        user: true,
        inventory: {
          include: {
            fertilizer: true
          }
        },
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            farmer: {
              select: { id: true, name: true, phone: true }
            }
          }
        }
      }
    })

    if (!dealer) {
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(dealer)
  } catch (error) {
    console.error('Error fetching dealer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dealer' },
      { status: 500 }
    )
  }
}

// PUT /api/dealers/[id] - Update dealer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    // Update dealer
    const dealer = await db.dealer.update({
      where: { id },
      data: {
        shopName: data.shopName,
        address: data.address,
        district: data.district,
        upazila: data.upazila,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        serviceRadius: data.serviceRadius ? parseFloat(data.serviceRadius) : null,
        isVerified: data.isVerified,
        approvedAt: data.isVerified ? new Date() : null
      }
    })

    // Update associated user if needed
    if (data.name || data.email || data.phone) {
      await db.user.update({
        where: { id: dealer.userId },
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone
        }
      })
    }

    return NextResponse.json(dealer)
  } catch (error) {
    console.error('Error updating dealer:', error)
    return NextResponse.json(
      { error: 'Failed to update dealer' },
      { status: 500 }
    )
  }
}

// DELETE /api/dealers/[id] - Delete dealer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const dealer = await db.dealer.findUnique({
      where: { id },
      include: { _count: { select: { transactions: true } } }
    })

    if (!dealer) {
      return NextResponse.json(
        { error: 'Dealer not found' },
        { status: 404 }
      )
    }

    if (dealer._count.transactions > 0) {
      // Cannot delete dealer with transactions
      return NextResponse.json(
        { error: 'Cannot delete dealer with existing transactions' },
        { status: 400 }
      )
    }

    // Delete dealer and associated user
    await db.dealer.delete({ where: { id } })
    await db.user.delete({ where: { id: dealer.userId } })

    return NextResponse.json({ message: 'Dealer deleted successfully' })
  } catch (error) {
    console.error('Error deleting dealer:', error)
    return NextResponse.json(
      { error: 'Failed to delete dealer' },
      { status: 500 }
    )
  }
}

// PATCH /api/dealers/[id] - Verify dealer
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    const dealer = await db.dealer.update({
      where: { id },
      data: {
        isVerified: data.isVerified ?? true,
        approvedAt: data.isVerified ? new Date() : null
      },
      include: { user: true }
    })

    // Also approve the user
    await db.user.update({
      where: { id: dealer.userId },
      data: {
        isApproved: data.isVerified ?? true,
        kycStatus: data.isVerified ? 'VERIFIED' : 'PENDING'
      }
    })

    return NextResponse.json(dealer)
  } catch (error) {
    console.error('Error verifying dealer:', error)
    return NextResponse.json(
      { error: 'Failed to verify dealer' },
      { status: 500 }
    )
  }
}
