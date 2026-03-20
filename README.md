# E-Bill System

A comprehensive **Invoice & Billing Management System** built with modern web technologies. Track customers, create professional invoices, manage payments, and analyze your business revenue with a beautiful, intuitive interface.

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

## 📦 Installation

### Prerequisites
- Node.js 18+
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
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your database credentials:
   ```env
   DATABASE_URL="postgresql://username:password@host:5432/database?pgbouncer=true&connect_timeout=15"
   DIRECT_DATABASE_URL="postgresql://username:password@host:5432/database"
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

7. Open [http://localhost:3000](http://localhost:3000)

## 🚀 Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/moniruzjaman/e-bill-system)

### Step-by-Step

1. **Push to GitHub**

2. **Create Vercel Project**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your GitHub repository

3. **Add PostgreSQL Database**
   
   **Option A: Vercel Postgres (Recommended)**
   - In Vercel project, go to **Storage** tab
   - Click "Create Database" → "Postgres"
   - Environment variables are auto-added

   **Option B: External Database**
   - [Supabase](https://supabase.com) - Free tier
   - [Neon](https://neon.tech) - Serverless PostgreSQL
   - [Railway](https://railway.app)

4. **Set Environment Variables**

   Go to **Settings** → **Environment Variables**:
   ```
   DATABASE_URL=your_pooling_connection_string
   DIRECT_DATABASE_URL=your_direct_connection_string
   ```

5. **Deploy**
   - Click "Deploy"
   - App builds and runs `prisma db push` automatically
   - Tables are created automatically

6. **Seed Data (Optional)**

   After deployment, seed sample data:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add sample data via Prisma Studio or run seed locally with production DB

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed sample data |

## 🗄️ Database Schema

### Customer
- `id`, `name`, `email` (unique), `phone`, `address`, `city`, `zipCode`, `notes`

### Bill
- `id`, `invoiceNumber` (unique), `customerId`, `subtotal`, `tax`, `taxRate`, `discount`, `total`
- `status` (PENDING | PAID | OVERDUE | CANCELLED)
- `dueDate`, `issueDate`, `paidAt`

### BillItem
- `id`, `billId`, `description`, `quantity`, `unitPrice`, `total`

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

Made with ❤️ by [Moniruz Jaman](https://github.com/moniruzjaman)
