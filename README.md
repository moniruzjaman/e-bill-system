# E-Bill System

A comprehensive **Invoice & Billing Management System** built with modern web technologies. Track customers, create professional invoices, manage payments, and analyze your business revenue with a beautiful, intuitive interface.

![E-Bill System](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue?style=flat-square&logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat-square&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## ✨ Features

### Dashboard
- 📊 **Revenue Analytics** - Track total revenue, pending amounts, and overdue payments
- 📈 **Monthly Revenue Chart** - Visualize revenue trends over the last 6 months
- 🏆 **Top Customers** - Identify your highest-value customers
- 📋 **Recent Bills** - Quick overview of latest invoices

### Customer Management
- ➕ Add, edit, and delete customers
- 🔍 Search customers by name or email
- 📞 Store contact information (phone, address, city, zip code)
- 📊 Track customer billing statistics

### Invoice Management
- 📄 Create professional invoices with multiple line items
- 💰 Automatic tax and discount calculations
- 📅 Due date tracking
- 🔄 Status management (Pending, Paid, Overdue, Cancelled)
- 👁️ Detailed bill view with all information

### Payment Tracking
- ✅ Mark invoices as paid with one click
- ⏰ Track pending and overdue payments
- 📱 Status badges for quick identification

## 🚀 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 |
| **UI Components** | shadcn/ui |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Icons** | Lucide React |
| **State** | React State + Zustand |

## 📦 Installation

### Prerequisites
- Node.js 18+ or Bun
- PostgreSQL database

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/moniruzjaman/e-bill-system.git
   cd e-bill-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your database credentials:
   ```env
   DATABASE_URL="postgresql://username:password@host:5432/e_bill_system?pgbouncer=true&connect_timeout=15"
   DIRECT_DATABASE_URL="postgresql://username:password@host:5432/e_bill_system"
   ```

4. **Initialize the database**
   ```bash
   npm run db:push
   ```

5. **(Optional) Seed sample data**
   ```bash
   npm run db:seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🚀 Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/moniruzjaman/e-bill-system)

### Step-by-Step Deployment

1. **Push to GitHub**
   - Fork or clone this repository to your GitHub account

2. **Create a Vercel Project**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your GitHub repository

3. **Set up PostgreSQL Database**

   **Option A: Vercel Postgres (Recommended)**
   - In your Vercel project, go to **Storage** tab
   - Click "Create Database"
   - Select "Postgres"
   - Follow the setup wizard
   - Vercel will automatically add environment variables

   **Option B: External Database Providers**
   - [Supabase](https://supabase.com) - Free tier available
   - [Neon](https://neon.tech) - Serverless PostgreSQL
   - [Railway](https://railway.app) - Simple deployment

4. **Configure Environment Variables**

   In Vercel dashboard, go to **Settings** → **Environment Variables** and add:

   ```
   DATABASE_URL=your_postgres_connection_string_with_pgbouncer
   DIRECT_DATABASE_URL=your_direct_postgres_connection_string
   ```

   **Important:** For Vercel Postgres, these are auto-populated. For external databases:
   - `DATABASE_URL` should include `?pgbouncer=true` for connection pooling
   - `DIRECT_DATABASE_URL` is the direct connection (without pgbouncer)

5. **Deploy**
   - Click "Deploy" and wait for the build to complete
   - Your app will be live at `your-project.vercel.app`

## 📁 Project Structure

```
e-bill-system/
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Sample data seed
├── public/
│   └── logo.svg             # App logo
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── bills/       # Bills API routes
│   │   │   ├── customers/   # Customers API routes
│   │   │   └── dashboard/   # Dashboard stats API
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Main application
│   ├── components/
│   │   └── ui/              # shadcn/ui components
│   ├── hooks/               # Custom React hooks
│   └── lib/
│       ├── db.ts            # Prisma client
│       └── utils.ts         # Utility functions
├── .env.example             # Environment template
├── next.config.ts           # Next.js configuration
├── package.json             # Dependencies
├── tailwind.config.ts       # Tailwind configuration
└── tsconfig.json            # TypeScript configuration
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema changes to database |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Create and apply migrations |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:seed` | Seed sample data |

## 🗄️ Database Schema

### Customer
- `id` - Unique identifier
- `name` - Customer name
- `email` - Email address (unique)
- `phone` - Phone number (optional)
- `address` - Street address (optional)
- `city` - City (optional)
- `zipCode` - Zip/Postal code (optional)
- `notes` - Additional notes (optional)

### Bill
- `id` - Unique identifier
- `invoiceNumber` - Auto-generated invoice number
- `customerId` - Reference to customer
- `subtotal` - Sum of all items
- `tax` - Tax amount
- `taxRate` - Tax percentage
- `discount` - Discount amount
- `total` - Final total
- `status` - PENDING | PAID | OVERDUE | CANCELLED
- `dueDate` - Payment due date
- `issueDate` - Invoice creation date
- `paidAt` - Date when paid (optional)

### BillItem
- `id` - Unique identifier
- `billId` - Reference to bill
- `description` - Item description
- `quantity` - Quantity
- `unitPrice` - Price per unit
- `total` - quantity × unitPrice

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - The React Framework
- [shadcn/ui](https://ui.shadcn.com) - Beautiful UI components
- [Prisma](https://prisma.io) - Next-generation ORM
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- [Vercel](https://vercel.com) - Deployment platform

---

Made with ❤️ by [Moniruz Jaman](https://github.com/moniruzjaman)
