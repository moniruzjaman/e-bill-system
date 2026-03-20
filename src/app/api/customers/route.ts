import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all customers
export async function GET() {
  try {
    const customers = await db.customer.findMany({
      include: {
        bills: {
          select: {
            id: true,
            total: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const customersWithStats = customers.map((customer) => ({
      ...customer,
      totalBills: customer.bills.length,
      totalAmount: customer.bills.reduce((sum, bill) => sum + bill.total, 0),
      paidBills: customer.bills.filter((b) => b.status === 'PAID').length,
      pendingBills: customer.bills.filter((b) => b.status === 'PENDING').length,
    }))

    return NextResponse.json(customersWithStats)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

// POST create new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, address, city, zipCode, notes } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const customer = await db.customer.create({
      data: {
        name,
        email,
        phone: phone || null,
        address: address || null,
        city: city || null,
        zipCode: zipCode || null,
        notes: notes || null,
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating customer:', error)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}
