import { NextResponse } from 'next/server'
import db from '@/lib/db'

// This route creates tables by executing raw SQL
export async function GET() {
  try {
    // Create tables using raw SQL
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Customer" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT UNIQUE NOT NULL,
        "phone" TEXT,
        "address" TEXT,
        "city" TEXT,
        "zipCode" TEXT,
        "notes" TEXT,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Bill" (
        "id" TEXT PRIMARY KEY,
        "invoiceNumber" TEXT UNIQUE NOT NULL,
        "customerId" TEXT NOT NULL,
        "subtotal" REAL DEFAULT 0,
        "tax" REAL DEFAULT 0,
        "taxRate" REAL DEFAULT 0,
        "discount" REAL DEFAULT 0,
        "total" REAL DEFAULT 0,
        "status" TEXT DEFAULT 'PENDING',
        "dueDate" DATETIME NOT NULL,
        "issueDate" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "notes" TEXT,
        "paidAt" DATETIME,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "BillItem" (
        "id" TEXT PRIMARY KEY,
        "billId" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "quantity" INTEGER DEFAULT 1,
        "unitPrice" REAL NOT NULL,
        "total" REAL NOT NULL,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE
      );
    `)

    return NextResponse.json({
      status: 'success',
      message: 'Database tables created successfully',
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Migration failed',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  }
}
