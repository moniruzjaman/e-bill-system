import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get all bills with customer info
    const bills = await db.bill.findMany({
      include: {
        customer: true,
      },
    })

    // Get all customers
    const customers = await db.customer.findMany()

    // Calculate statistics
    const totalRevenue = bills
      .filter((b) => b.status === 'PAID')
      .reduce((sum, b) => sum + b.total, 0)

    const pendingAmount = bills
      .filter((b) => b.status === 'PENDING')
      .reduce((sum, b) => sum + b.total, 0)

    const overdueAmount = bills
      .filter((b) => b.status === 'OVERDUE')
      .reduce((sum, b) => sum + b.total, 0)

    const totalBills = bills.length
    const paidBills = bills.filter((b) => b.status === 'PAID').length
    const pendingBills = bills.filter((b) => b.status === 'PENDING').length
    const overdueBills = bills.filter((b) => b.status === 'OVERDUE').length

    // Recent bills (last 5)
    const recentBills = await db.bill.findMany({
      take: 5,
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Top customers by total spending
    const customerSpending: Record<string, { name: string; total: number }> = {}
    bills.forEach((bill) => {
      if (!customerSpending[bill.customerId]) {
        customerSpending[bill.customerId] = {
          name: bill.customer.name,
          total: 0,
        }
      }
      customerSpending[bill.customerId].total += bill.total
    })

    const topCustomers = Object.values(customerSpending)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    // Monthly revenue (last 6 months)
    const monthlyRevenue: { month: string; revenue: number }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

      const monthBills = bills.filter(
        (b) => b.status === 'PAID' && b.paidAt && b.paidAt >= monthStart && b.paidAt <= monthEnd
      )
      const revenue = monthBills.reduce((sum, b) => sum + b.total, 0)

      monthlyRevenue.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue,
      })
    }

    return NextResponse.json({
      totalRevenue,
      pendingAmount,
      overdueAmount,
      totalBills,
      paidBills,
      pendingBills,
      overdueBills,
      totalCustomers: customers.length,
      recentBills,
      topCustomers,
      monthlyRevenue,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
