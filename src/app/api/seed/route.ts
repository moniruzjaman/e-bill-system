import { NextResponse } from 'next/server'
import db from '@/lib/db'

// This route seeds the database with sample data
export async function GET() {
  try {
    // Check if data already exists
    const existingCustomers = await db.customer.count()
    if (existingCustomers > 0) {
      return NextResponse.json({
        status: 'info',
        message: 'Database already seeded',
        customerCount: existingCustomers,
      })
    }

    // Create sample customers
    const customers = await Promise.all([
      db.customer.create({
        data: {
          id: 'cust_001',
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1 (555) 123-4567',
          address: '123 Main Street',
          city: 'New York',
          zipCode: '10001',
          notes: 'VIP customer - priority support',
        },
      }),
      db.customer.create({
        data: {
          id: 'cust_002',
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '+1 (555) 234-5678',
          address: '456 Oak Avenue',
          city: 'Los Angeles',
          zipCode: '90001',
        },
      }),
      db.customer.create({
        data: {
          id: 'cust_003',
          name: 'Tech Solutions Inc.',
          email: 'tech.solutions@company.com',
          phone: '+1 (555) 345-6789',
          address: '789 Business Park',
          city: 'San Francisco',
          zipCode: '94102',
          notes: 'Enterprise client - monthly billing',
        },
      }),
      db.customer.create({
        data: {
          id: 'cust_004',
          name: 'Sarah Wilson',
          email: 'sarah.wilson@email.com',
          phone: '+1 (555) 456-7890',
          address: '321 Pine Road',
          city: 'Chicago',
          zipCode: '60601',
        },
      }),
      db.customer.create({
        data: {
          id: 'cust_005',
          name: 'Mike Brown',
          email: 'mike.brown@startup.io',
          phone: '+1 (555) 567-8901',
          address: '555 Startup Lane',
          city: 'Austin',
          zipCode: '78701',
        },
      }),
    ])

    const now = new Date()

    // Create sample bills
    const bills = await Promise.all([
      // Bill 1 - Paid
      db.bill.create({
        data: {
          id: 'bill_001',
          invoiceNumber: 'INV-2503-0001',
          customerId: 'cust_001',
          subtotal: 1500.00,
          taxRate: 8.5,
          tax: 127.50,
          discount: 0,
          total: 1627.50,
          status: 'PAID',
          dueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          paidAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
          items: {
            create: [
              { description: 'Website Development', quantity: 1, unitPrice: 1200.00, total: 1200.00 },
              { description: 'Domain Setup', quantity: 1, unitPrice: 150.00, total: 150.00 },
              { description: 'SSL Certificate', quantity: 1, unitPrice: 150.00, total: 150.00 },
            ],
          },
        },
      }),
      // Bill 2 - Paid
      db.bill.create({
        data: {
          id: 'bill_002',
          invoiceNumber: 'INV-2503-0002',
          customerId: 'cust_003',
          subtotal: 5000.00,
          taxRate: 10,
          tax: 500.00,
          discount: 200.00,
          total: 5300.00,
          status: 'PAID',
          dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          paidAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
          items: {
            create: [
              { description: 'Monthly Retainer - March', quantity: 1, unitPrice: 3500.00, total: 3500.00 },
              { description: 'Cloud Hosting Setup', quantity: 1, unitPrice: 1000.00, total: 1000.00 },
              { description: 'Security Audit', quantity: 1, unitPrice: 500.00, total: 500.00 },
            ],
          },
        },
      }),
      // Bill 3 - Pending
      db.bill.create({
        data: {
          id: 'bill_003',
          invoiceNumber: 'INV-2503-0003',
          customerId: 'cust_002',
          subtotal: 850.00,
          taxRate: 7.5,
          tax: 63.75,
          discount: 0,
          total: 913.75,
          status: 'PENDING',
          dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
          items: {
            create: [
              { description: 'Logo Design', quantity: 1, unitPrice: 500.00, total: 500.00 },
              { description: 'Business Cards Design', quantity: 1, unitPrice: 200.00, total: 200.00 },
              { description: 'Brand Guidelines Document', quantity: 1, unitPrice: 150.00, total: 150.00 },
            ],
          },
        },
      }),
      // Bill 4 - Pending
      db.bill.create({
        data: {
          id: 'bill_004',
          invoiceNumber: 'INV-2503-0004',
          customerId: 'cust_004',
          subtotal: 2200.00,
          taxRate: 9,
          tax: 198.00,
          discount: 100.00,
          total: 2298.00,
          status: 'PENDING',
          dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          items: {
            create: [
              { description: 'Mobile App Development - Phase 1', quantity: 1, unitPrice: 2000.00, total: 2000.00 },
              { description: 'App Store Setup Fee', quantity: 1, unitPrice: 200.00, total: 200.00 },
            ],
          },
        },
      }),
      // Bill 5 - Overdue
      db.bill.create({
        data: {
          id: 'bill_005',
          invoiceNumber: 'INV-2502-0005',
          customerId: 'cust_005',
          subtotal: 750.00,
          taxRate: 8,
          tax: 60.00,
          discount: 0,
          total: 810.00,
          status: 'OVERDUE',
          dueDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
          items: {
            create: [
              { description: 'SEO Optimization', quantity: 1, unitPrice: 500.00, total: 500.00 },
              { description: 'Content Writing (5 pages)', quantity: 5, unitPrice: 50.00, total: 250.00 },
            ],
          },
        },
      }),
      // Bill 6 - Paid
      db.bill.create({
        data: {
          id: 'bill_006',
          invoiceNumber: 'INV-2502-0006',
          customerId: 'cust_001',
          subtotal: 3000.00,
          taxRate: 8.5,
          tax: 255.00,
          discount: 150.00,
          total: 3105.00,
          status: 'PAID',
          dueDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          paidAt: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
          items: {
            create: [
              { description: 'E-commerce Integration', quantity: 1, unitPrice: 2000.00, total: 2000.00 },
              { description: 'Payment Gateway Setup', quantity: 1, unitPrice: 500.00, total: 500.00 },
              { description: 'Inventory Management Module', quantity: 1, unitPrice: 500.00, total: 500.00 },
            ],
          },
        },
      }),
    ])

    return NextResponse.json({
      status: 'success',
      message: 'Database seeded successfully!',
      customers: customers.length,
      bills: bills.length,
      totalRevenue: 10032.50,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Seed failed',
    }, { status: 500 })
  }
}
