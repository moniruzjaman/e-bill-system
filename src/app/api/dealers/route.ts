import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateSHA256 } from '@/lib/crypto'

// GET /api/dealers - List all dealers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const district = searchParams.get('district')
    const verified = searchParams.get('verified')

    const where = {
      ...(district && { district }),
      ...(verified !== null && { isVerified: verified === 'true' })
    }

    const dealers = await db.dealer.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isApproved: true
          }
        },
        inventory: {
          include: {
            fertilizer: true
          }
        },
        _count: {
          select: { transactions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(dealers)
  } catch (error) {
    console.error('Error fetching dealers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dealers' },
      { status: 500 }
    )
  }
}

// POST /api/dealers - Create new dealer
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Create user first
    const user = await db.user.create({
      data: {
        nationalIdHash: generateSHA256(data.nationalId),
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: 'DEALER',
        kycStatus: 'PENDING',
        isApproved: false
      }
    })

    // Create dealer profile
    const dealer = await db.dealer.create({
      data: {
        userId: user.id,
        licenseNumber: data.licenseNumber,
        shopName: data.shopName,
        address: data.address,
        district: data.district,
        upazila: data.upazila,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        serviceRadius: data.serviceRadius ? parseFloat(data.serviceRadius) : null,
        isVerified: false
      },
      include: {
        user: true
      }
    })

    return NextResponse.json(dealer, { status: 201 })
  } catch (error: any) {
    console.error('Error creating dealer:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'License number or email already exists' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create dealer' },
      { status: 500 }
    )
  }
}
