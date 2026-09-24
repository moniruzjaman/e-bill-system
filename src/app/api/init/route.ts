import { NextResponse } from 'next/server'
import db from '@/lib/db'

// This route checks database connection and tables
export async function GET() {
  try {
    // Try to connect
    await db.$connect()
    
    // Check if tables exist by trying to count
    const customerCount = await db.customer.count()
    const billCount = await db.bill.count()
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connected successfully',
      tables: {
        customers: customerCount,
        bills: billCount,
      },
    })
  } catch (error) {
    console.error('Database check error:', error)
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Database connection failed',
      hint: 'Make sure DATABASE_URL and DIRECT_URL are set in Vercel environment variables',
    }, { status: 500 })
  }
}
