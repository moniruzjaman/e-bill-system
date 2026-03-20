import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

// GET single customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await db.$connect()
    
    const { id } = await params
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        bills: {
          include: {
            items: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 })
  }
}

// PUT update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await db.$connect()
    
    const { id } = await params
    const body = await request.json()
    const { name, email, phone, address, city, zipCode, notes } = body

    const customer = await db.customer.update({
      where: { id },
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

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

// DELETE customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await db.$connect()
    
    const { id } = await params
    
    // Delete customer's bills first (cascade)
    await db.billItem.deleteMany({
      where: {
        bill: { customerId: id },
      },
    })
    
    await db.bill.deleteMany({
      where: { customerId: id },
    })
    
    await db.customer.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Customer deleted successfully' })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}
