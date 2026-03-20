import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all bills
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')

    const where: {
      status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
      customerId?: string
    } = {}

    if (status && ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'].includes(status)) {
      where.status = status as 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
    }
    if (customerId) {
      where.customerId = customerId
    }

    const bills = await db.bill.findMany({
      where,
      include: {
        customer: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(bills)
  } catch (error) {
    console.error('Error fetching bills:', error)
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 })
  }
}

// Generate invoice number
async function generateInvoiceNumber(): Promise<string> {
  const count = await db.bill.count()
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  return `INV-${year}${month}-${(count + 1).toString().padStart(4, '0')}`
}

// POST create new bill
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, items, taxRate, discount, dueDate, notes } = body

    if (!customerId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Customer and items are required' }, { status: 400 })
    }

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0
    )
    const tax = subtotal * (taxRate || 0) / 100
    const total = subtotal + tax - (discount || 0)

    const invoiceNumber = await generateInvoiceNumber()

    const bill = await db.bill.create({
      data: {
        invoiceNumber,
        customerId,
        subtotal,
        tax,
        taxRate: taxRate || 0,
        discount: discount || 0,
        total,
        dueDate: new Date(dueDate),
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

    return NextResponse.json(bill, { status: 201 })
  } catch (error) {
    console.error('Error creating bill:', error)
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 })
  }
}
