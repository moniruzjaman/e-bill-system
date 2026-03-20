import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create sample customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { email: 'john.doe@example.com' },
      update: {},
      create: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        address: '123 Main Street',
        city: 'New York',
        zipCode: '10001',
        notes: 'VIP customer - priority support',
      },
    }),
    prisma.customer.upsert({
      where: { email: 'jane.smith@example.com' },
      update: {},
      create: {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1 (555) 234-5678',
        address: '456 Oak Avenue',
        city: 'Los Angeles',
        zipCode: '90001',
      },
    }),
    prisma.customer.upsert({
      where: { email: 'tech.solutions@company.com' },
      update: {},
      create: {
        name: 'Tech Solutions Inc.',
        email: 'tech.solutions@company.com',
        phone: '+1 (555) 345-6789',
        address: '789 Business Park',
        city: 'San Francisco',
        zipCode: '94102',
        notes: 'Enterprise client - monthly billing',
      },
    }),
    prisma.customer.upsert({
      where: { email: 'sarah.wilson@email.com' },
      update: {},
      create: {
        name: 'Sarah Wilson',
        email: 'sarah.wilson@email.com',
        phone: '+1 (555) 456-7890',
        address: '321 Pine Road',
        city: 'Chicago',
        zipCode: '60601',
      },
    }),
    prisma.customer.upsert({
      where: { email: 'mike.brown@startup.io' },
      update: {},
      create: {
        name: 'Mike Brown',
        email: 'mike.brown@startup.io',
        phone: '+1 (555) 567-8901',
        address: '555 Startup Lane',
        city: 'Austin',
        zipCode: '78701',
      },
    }),
  ])

  console.log(`Created ${customers.length} customers`)

  // Create sample bills
  const now = new Date()
  const bills = []

  // Bill 1 - Paid
  const bill1 = await prisma.bill.create({
    data: {
      invoiceNumber: 'INV-2503-0001',
      customerId: customers[0].id,
      subtotal: 1500.00,
      taxRate: 8.5,
      tax: 127.50,
      discount: 0,
      total: 1627.50,
      status: 'PAID',
      dueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      paidAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      items: {
        create: [
          { description: 'Website Development', quantity: 1, unitPrice: 1200.00, total: 1200.00 },
          { description: 'Domain Setup', quantity: 1, unitPrice: 150.00, total: 150.00 },
          { description: 'SSL Certificate', quantity: 1, unitPrice: 150.00, total: 150.00 },
        ],
      },
    },
  })
  bills.push(bill1)

  // Bill 2 - Paid
  const bill2 = await prisma.bill.create({
    data: {
      invoiceNumber: 'INV-2503-0002',
      customerId: customers[2].id,
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
  })
  bills.push(bill2)

  // Bill 3 - Pending
  const bill3 = await prisma.bill.create({
    data: {
      invoiceNumber: 'INV-2503-0003',
      customerId: customers[1].id,
      subtotal: 850.00,
      taxRate: 7.5,
      tax: 63.75,
      discount: 0,
      total: 913.75,
      status: 'PENDING',
      dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      items: {
        create: [
          { description: 'Logo Design', quantity: 1, unitPrice: 500.00, total: 500.00 },
          { description: 'Business Cards Design', quantity: 1, unitPrice: 200.00, total: 200.00 },
          { description: 'Brand Guidelines Document', quantity: 1, unitPrice: 150.00, total: 150.00 },
        ],
      },
    },
  })
  bills.push(bill3)

  // Bill 4 - Pending
  const bill4 = await prisma.bill.create({
    data: {
      invoiceNumber: 'INV-2503-0004',
      customerId: customers[3].id,
      subtotal: 2200.00,
      taxRate: 9,
      tax: 198.00,
      discount: 100.00,
      total: 2298.00,
      status: 'PENDING',
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      items: {
        create: [
          { description: 'Mobile App Development - Phase 1', quantity: 1, unitPrice: 2000.00, total: 2000.00 },
          { description: 'App Store Setup Fee', quantity: 1, unitPrice: 200.00, total: 200.00 },
        ],
      },
    },
  })
  bills.push(bill4)

  // Bill 5 - Overdue
  const bill5 = await prisma.bill.create({
    data: {
      invoiceNumber: 'INV-2502-0005',
      customerId: customers[4].id,
      subtotal: 750.00,
      taxRate: 8,
      tax: 60.00,
      discount: 0,
      total: 810.00,
      status: 'OVERDUE',
      dueDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      items: {
        create: [
          { description: 'SEO Optimization', quantity: 1, unitPrice: 500.00, total: 500.00 },
          { description: 'Content Writing (5 pages)', quantity: 5, unitPrice: 50.00, total: 250.00 },
        ],
      },
    },
  })
  bills.push(bill5)

  // Bill 6 - Paid
  const bill6 = await prisma.bill.create({
    data: {
      invoiceNumber: 'INV-2502-0006',
      customerId: customers[0].id,
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
  })
  bills.push(bill6)

  console.log(`Created ${bills.length} bills`)

  console.log('\n✅ Seed data created successfully!')
  console.log('\nSummary:')
  console.log('- 5 Customers')
  console.log('- 6 Bills (3 Paid, 2 Pending, 1 Overdue)')
  console.log('- Total Revenue: $10,032.50')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
