import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

// GET single bill
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await db.$connect()
    
    const { id } = await params
    const bill = await db.bill.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    })

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    return NextResponse.json(bill)
  } catch (error) {
    console.error('Error fetching bill:', error)
    return NextResponse.json({ error: 'Failed to fetch bill' }, { status: 500 })
  }
}

// PUT update bill
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await db.$connect()
    
    const { id } = await params
    const body = await request.json()
    const { status, items, taxRate, discount, dueDate, notes } = body

    // If only updating status
    if (status && !items) {
      const updateData: {
        status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
        paidAt?: Date
      } = { status }

      if (status === 'PAID') {
        updateData.paidAt = new Date()
      }

      const bill = await db.bill.update({
        where: { id },
        data: updateData,
        include: {
          customer: true,
          items: true,
        },
      })

      return NextResponse.json(bill)
    }

    // Full update with items
    if (items && items.length > 0) {
      const subtotal = items.reduce(
        (sum: number, item: { quantity: number; unitPrice: number }) =>
          sum + item.quantity * item.unitPrice,
        0
      )
      const tax = subtotal * (taxRate || 0) / 100
      const total = subtotal + tax - (discount || 0)

      // Delete existing items and create new ones
      await db.billItem.deleteMany({
        where: { billId: id },
      })

      const bill = await db.bill.update({
        where: { id },
        data: {
          subtotal,
          tax,
          taxRate: taxRate || 0,
          discount: discount || 0,
          total,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          notes: notes || null,
          items: {
            create: items.map((item: { description: string; quantity: number; unitPrice: number }) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice,
            })),
          },
        },
        include: {
          customer: true,
          items: true,
        },
      })

      return NextResponse.json(bill)
    }

    return NextResponse.json({ error: 'Invalid update data' }, { status: 400 })
  } catch (error) {
    console.error('Error updating bill:', error)
    return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 })
  }
}

// DELETE bill
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await db.$connect()
    
    const { id } = await params

    // Delete items first
    await db.billItem.deleteMany({
      where: { billId: id },
    })

    // Delete bill
    await db.bill.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Bill deleted successfully' })
  } catch (error) {
    console.error('Error deleting bill:', error)
    return NextResponse.json({ error: 'Failed to delete bill' }, { status: 500 })
  }
}
