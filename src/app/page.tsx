'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  DollarSign,
  Users,
  FileText,
  Clock,
  AlertCircle,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  TrendingUp,
  Calendar,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Receipt,
  Building2,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react'

// Types
interface Customer {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  zipCode: string | null
  notes: string | null
  totalBills?: number
  totalAmount?: number
  paidBills?: number
  pendingBills?: number
  createdAt: string
}

interface BillItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface Bill {
  id: string
  invoiceNumber: string
  customerId: string
  customer: Customer
  items: BillItem[]
  subtotal: number
  tax: number
  taxRate: number
  discount: number
  total: number
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  dueDate: string
  issueDate: string
  notes: string | null
  paidAt: string | null
  createdAt: string
}

interface DashboardStats {
  totalRevenue: number
  pendingAmount: number
  overdueAmount: number
  totalBills: number
  paidBills: number
  pendingBills: number
  overdueBills: number
  totalCustomers: number
  recentBills: Bill[]
  topCustomers: { name: string; total: number }[]
  monthlyRevenue: { month: string; revenue: number }[]
}

export default function EBillSystem() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('dashboard')

  // Data states
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [bills, setBills] = useState<Bill[]>([])

  // Modal states
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [billModalOpen, setBillModalOpen] = useState(false)
  const [billDetailModalOpen, setBillDetailModalOpen] = useState(false)

  // Form states
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [editingBill, setEditingBill] = useState<Bill | null>(null)
  const [viewingBill, setViewingBill] = useState<Bill | null>(null)

  // Customer form
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    notes: '',
  })

  // Bill form
  const [billForm, setBillForm] = useState({
    customerId: '',
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
    taxRate: 0,
    discount: 0,
    dueDate: '',
    notes: '',
  })

  // Search and filter
  const [customerSearch, setCustomerSearch] = useState('')
  const [billSearch, setBillSearch] = useState('')
  const [billStatusFilter, setBillStatusFilter] = useState('all')

  // Fetch data functions
  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard')
      const data = await res.json()
      setDashboardStats(data)
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch dashboard data', variant: 'destructive' })
    }
  }

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers')
      const data = await res.json()
      setCustomers(data)
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch customers', variant: 'destructive' })
    }
  }

  const fetchBills = async () => {
    try {
      const res = await fetch('/api/bills')
      const data = await res.json()
      setBills(data)
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch bills', variant: 'destructive' })
    }
  }

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchDashboard(), fetchCustomers(), fetchBills()])
    }
    loadData()
  }, [])

  // Customer handlers
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCustomer) {
        const res = await fetch(`/api/customers/${editingCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customerForm),
        })
        if (res.ok) {
          toast({ title: 'Success', description: 'Customer updated successfully' })
        }
      } else {
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customerForm),
        })
        if (res.ok) {
          toast({ title: 'Success', description: 'Customer created successfully' })
        }
      }
      setCustomerModalOpen(false)
      resetCustomerForm()
      fetchCustomers()
      fetchDashboard()
    } catch {
      toast({ title: 'Error', description: 'Failed to save customer', variant: 'destructive' })
    }
  }

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Success', description: 'Customer deleted successfully' })
        fetchCustomers()
        fetchDashboard()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete customer', variant: 'destructive' })
    }
  }

  const resetCustomerForm = () => {
    setCustomerForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      zipCode: '',
      notes: '',
    })
    setEditingCustomer(null)
  }

  const openEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setCustomerForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      zipCode: customer.zipCode || '',
      notes: customer.notes || '',
    })
    setCustomerModalOpen(true)
  }

  // Bill handlers
  const handleBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const billData = {
        customerId: billForm.customerId,
        items: billForm.items.filter((item) => item.description && item.unitPrice > 0),
        taxRate: billForm.taxRate,
        discount: billForm.discount,
        dueDate: billForm.dueDate,
        notes: billForm.notes,
      }

      if (editingBill) {
        const res = await fetch(`/api/bills/${editingBill.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(billData),
        })
        if (res.ok) {
          toast({ title: 'Success', description: 'Bill updated successfully' })
        }
      } else {
        const res = await fetch('/api/bills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(billData),
        })
        if (res.ok) {
          toast({ title: 'Success', description: 'Bill created successfully' })
        }
      }
      setBillModalOpen(false)
      resetBillForm()
      fetchBills()
      fetchDashboard()
    } catch {
      toast({ title: 'Error', description: 'Failed to save bill', variant: 'destructive' })
    }
  }

  const handleDeleteBill = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) return
    try {
      const res = await fetch(`/api/bills/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Success', description: 'Bill deleted successfully' })
        fetchBills()
        fetchDashboard()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete bill', variant: 'destructive' })
    }
  }

  const handleUpdateBillStatus = async (id: string, status: Bill['status']) => {
    try {
      const res = await fetch(`/api/bills/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast({ title: 'Success', description: 'Bill status updated' })
        fetchBills()
        fetchDashboard()
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update bill status', variant: 'destructive' })
    }
  }

  const resetBillForm = () => {
    setBillForm({
      customerId: '',
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
      taxRate: 0,
      discount: 0,
      dueDate: '',
      notes: '',
    })
    setEditingBill(null)
  }

  const openEditBill = (bill: Bill) => {
    setEditingBill(bill)
    setBillForm({
      customerId: bill.customerId,
      items: bill.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      taxRate: bill.taxRate,
      discount: bill.discount,
      dueDate: new Date(bill.dueDate).toISOString().split('T')[0],
      notes: bill.notes || '',
    })
    setBillModalOpen(true)
  }

  const addBillItem = () => {
    setBillForm({
      ...billForm,
      items: [...billForm.items, { description: '', quantity: 1, unitPrice: 0 }],
    })
  }

  const removeBillItem = (index: number) => {
    setBillForm({
      ...billForm,
      items: billForm.items.filter((_, i) => i !== index),
    })
  }

  const updateBillItem = (index: number, field: string, value: string | number) => {
    const newItems = [...billForm.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setBillForm({ ...billForm, items: newItems })
  }

  const calculateBillTotal = () => {
    const subtotal = billForm.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )
    const tax = subtotal * (billForm.taxRate / 100)
    return subtotal + tax - billForm.discount
  }

  // Filter functions
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.email.toLowerCase().includes(customerSearch.toLowerCase())
  )

  const filteredBills = bills.filter((bill) => {
    const matchesSearch =
      bill.invoiceNumber.toLowerCase().includes(billSearch.toLowerCase()) ||
      bill.customer.name.toLowerCase().includes(billSearch.toLowerCase())
    const matchesStatus = billStatusFilter === 'all' || bill.status === billStatusFilter
    return matchesSearch && matchesStatus
  })

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Status badge color
  const getStatusBadge = (status: Bill['status']) => {
    const colors = {
      PENDING: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      PAID: 'bg-green-500/10 text-green-600 border-green-500/20',
      OVERDUE: 'bg-red-500/10 text-red-600 border-red-500/20',
      CANCELLED: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    }
    return <Badge className={colors[status]}>{status}</Badge>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md dark:bg-slate-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">E-Bill System</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Invoice & Billing Management
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  resetCustomerForm()
                  setCustomerModalOpen(true)
                }}
                variant="outline"
                size="sm"
                className="hidden sm:flex"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
              <Button
                onClick={() => {
                  resetBillForm()
                  setBillModalOpen(true)
                }}
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Bill
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-2">
              <Users className="h-4 w-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="bills" className="gap-2">
              <FileText className="h-4 w-4" />
              Bills
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            {dashboardStats ? (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-500">Total Revenue</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {formatCurrency(dashboardStats.totalRevenue)}
                          </p>
                          <p className="mt-1 flex items-center text-xs text-emerald-600">
                            <ArrowUpRight className="mr-1 h-3 w-3" />
                            From paid invoices
                          </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                          <DollarSign className="h-6 w-6 text-emerald-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-500">Pending Amount</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {formatCurrency(dashboardStats.pendingAmount)}
                          </p>
                          <p className="mt-1 flex items-center text-xs text-yellow-600">
                            <Clock className="mr-1 h-3 w-3" />
                            {dashboardStats.pendingBills} pending bills
                          </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                          <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-500">Overdue Amount</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {formatCurrency(dashboardStats.overdueAmount)}
                          </p>
                          <p className="mt-1 flex items-center text-xs text-red-600">
                            <ArrowDownRight className="mr-1 h-3 w-3" />
                            {dashboardStats.overdueBills} overdue bills
                          </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                          <AlertCircle className="h-6 w-6 text-red-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-500">Total Customers</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {dashboardStats.totalCustomers}
                          </p>
                          <p className="mt-1 flex items-center text-xs text-slate-600">
                            <Users className="mr-1 h-3 w-3" />
                            {dashboardStats.totalBills} total bills
                          </p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts and Lists */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Monthly Revenue Chart */}
                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg">Monthly Revenue</CardTitle>
                      <CardDescription>Revenue from paid invoices (last 6 months)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dashboardStats.monthlyRevenue.map((item, index) => (
                          <div key={index} className="flex items-center gap-4">
                            <span className="w-12 text-sm text-slate-500">{item.month}</span>
                            <div className="flex-1">
                              <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                  style={{
                                    width: `${Math.min(
                                      (item.revenue /
                                        Math.max(...dashboardStats.monthlyRevenue.map((r) => r.revenue), 1)) *
                                        100,
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <span className="w-24 text-right text-sm font-medium">
                              {formatCurrency(item.revenue)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Customers */}
                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg">Top Customers</CardTitle>
                      <CardDescription>Customers with highest total billing</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dashboardStats.topCustomers.length > 0 ? (
                          dashboardStats.topCustomers.map((customer, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                  <span className="text-sm font-medium">{index + 1}</span>
                                </div>
                                <span className="font-medium">{customer.name}</span>
                              </div>
                              <span className="font-semibold text-emerald-600">
                                {formatCurrency(customer.total)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-slate-500 py-4">No customer data yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Bills */}
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Bills</CardTitle>
                    <CardDescription>Latest invoices created</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Due Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dashboardStats.recentBills.length > 0 ? (
                          dashboardStats.recentBills.map((bill) => (
                            <TableRow key={bill.id}>
                              <TableCell className="font-medium">{bill.invoiceNumber}</TableCell>
                              <TableCell>{bill.customer.name}</TableCell>
                              <TableCell>{formatCurrency(bill.total)}</TableCell>
                              <TableCell>{getStatusBadge(bill.status)}</TableCell>
                              <TableCell>{formatDate(bill.dueDate)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                              No bills created yet
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
              </div>
            )}
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Customers</CardTitle>
                    <CardDescription>Manage your customer database</CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search customers..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="pl-9 w-full sm:w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Bills</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-medium text-white">
                                  {customer.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium">{customer.name}</p>
                                  <p className="text-xs text-slate-500">{customer.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {customer.phone && (
                                  <span className="flex items-center gap-1 text-xs">
                                    <Phone className="h-3 w-3" />
                                    {customer.phone}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {customer.city && (
                                <span className="flex items-center gap-1 text-sm">
                                  <MapPin className="h-3 w-3" />
                                  {customer.city}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {customer.totalBills || 0} total
                                </Badge>
                                <Badge variant="outline" className="text-xs text-emerald-600">
                                  {customer.paidBills || 0} paid
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(customer.totalAmount || 0)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditCustomer(customer)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteCustomer(customer.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                            No customers found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bills Tab */}
          <TabsContent value="bills">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Bills & Invoices</CardTitle>
                    <CardDescription>Manage all your invoices</CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder="Search bills..."
                        value={billSearch}
                        onChange={(e) => setBillSearch(e.target.value)}
                        className="pl-9 w-full sm:w-48"
                      />
                    </div>
                    <Select value={billStatusFilter} onValueChange={setBillStatusFilter}>
                      <SelectTrigger className="w-full sm:w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                        <SelectItem value="OVERDUE">Overdue</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBills.length > 0 ? (
                        filteredBills.map((bill) => (
                          <TableRow key={bill.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{bill.invoiceNumber}</p>
                                <p className="text-xs text-slate-500">
                                  {formatDate(bill.issueDate)}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                  <span className="text-xs font-medium">
                                    {bill.customer.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span>{bill.customer.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{bill.items.length} items</Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(bill.total)}
                            </TableCell>
                            <TableCell>{getStatusBadge(bill.status)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                {formatDate(bill.dueDate)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setViewingBill(bill)
                                      setBillDetailModalOpen(true)
                                    }}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEditBill(bill)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  {bill.status === 'PENDING' && (
                                    <DropdownMenuItem
                                      onClick={() => handleUpdateBillStatus(bill.id, 'PAID')}
                                    >
                                      <CreditCard className="mr-2 h-4 w-4" />
                                      Mark as Paid
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteBill(bill.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                            No bills found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Customer Modal */}
      <Dialog open={customerModalOpen} onOpenChange={setCustomerModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
            <DialogDescription>
              {editingCustomer ? 'Update customer information' : 'Enter customer details'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCustomerSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={customerForm.city}
                  onChange={(e) => setCustomerForm({ ...customerForm, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  value={customerForm.zipCode}
                  onChange={(e) => setCustomerForm({ ...customerForm, zipCode: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={customerForm.address}
                onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={customerForm.notes}
                onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCustomerModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-teal-600">
                {editingCustomer ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bill Modal */}
      <Dialog open={billModalOpen} onOpenChange={setBillModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBill ? 'Edit Bill' : 'Create New Bill'}</DialogTitle>
            <DialogDescription>
              {editingBill ? 'Update bill details' : 'Create a new invoice for your customer'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBillSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select
                value={billForm.customerId}
                onValueChange={(value) => setBillForm({ ...billForm, customerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Bill Items *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addBillItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>
              <div className="space-y-3">
                {billForm.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-5">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateBillItem(index, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Qty"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateBillItem(index, 'quantity', parseInt(e.target.value) || 1)
                        }
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Price"
                        min="0"
                        step="0.01"
                        value={item.unitPrice || ''}
                        onChange={(e) =>
                          updateBillItem(index, 'unitPrice', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBillItem(index)}
                        disabled={billForm.items.length === 1}
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={billForm.taxRate}
                  onChange={(e) =>
                    setBillForm({ ...billForm, taxRate: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Discount ($)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={billForm.discount}
                  onChange={(e) =>
                    setBillForm({ ...billForm, discount: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={billForm.dueDate}
                  onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billNotes">Notes</Label>
              <Textarea
                id="billNotes"
                value={billForm.notes}
                onChange={(e) => setBillForm({ ...billForm, notes: e.target.value })}
                rows={2}
              />
            </div>

            <Card className="bg-slate-50 dark:bg-slate-800/50">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>
                      {formatCurrency(
                        billForm.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax ({billForm.taxRate}%)</span>
                    <span>
                      {formatCurrency(
                        (billForm.items.reduce(
                          (sum, item) => sum + item.quantity * item.unitPrice,
                          0
                        ) *
                          billForm.taxRate) /
                          100
                      )}
                    </span>
                  </div>
                  {billForm.discount > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(billForm.discount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-emerald-600">{formatCurrency(calculateBillTotal())}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setBillModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-emerald-500 to-teal-600">
                {editingBill ? 'Update Bill' : 'Create Bill'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bill Detail Modal */}
      <Dialog open={billDetailModalOpen} onOpenChange={setBillDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bill Details</DialogTitle>
          </DialogHeader>
          {viewingBill && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold">{viewingBill.invoiceNumber}</h3>
                  <p className="text-sm text-slate-500">
                    Issued: {formatDate(viewingBill.issueDate)}
                  </p>
                </div>
                {getStatusBadge(viewingBill.status)}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="bg-slate-50 dark:bg-slate-800/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Bill From</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <span className="font-medium">E-Bill System</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-50 dark:bg-slate-800/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-500">Bill To</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{viewingBill.customer.name}</p>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Mail className="h-3 w-3" />
                      {viewingBill.customer.email}
                    </div>
                    {viewingBill.customer.phone && (
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Phone className="h-3 w-3" />
                        {viewingBill.customer.phone}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div>
                <h4 className="mb-3 font-medium">Items</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewingBill.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Card className="bg-slate-50 dark:bg-slate-800/50">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatCurrency(viewingBill.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax ({viewingBill.taxRate}%)</span>
                      <span>{formatCurrency(viewingBill.tax)}</span>
                    </div>
                    {viewingBill.discount > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Discount</span>
                        <span>-{formatCurrency(viewingBill.discount)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-emerald-600">{formatCurrency(viewingBill.total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Due Date: {formatDate(viewingBill.dueDate)}</span>
                {viewingBill.paidAt && (
                  <span className="text-emerald-600">
                    Paid on: {formatDate(viewingBill.paidAt)}
                  </span>
                )}
              </div>

              {viewingBill.notes && (
                <div className="text-sm text-slate-500">
                  <span className="font-medium">Notes: </span>
                  {viewingBill.notes}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBillDetailModalOpen(false)}>
              Close
            </Button>
            {viewingBill && viewingBill.status === 'PENDING' && (
              <Button
                className="bg-gradient-to-r from-emerald-500 to-teal-600"
                onClick={() => {
                  handleUpdateBillStatus(viewingBill.id, 'PAID')
                  setBillDetailModalOpen(false)
                }}
              >
                Mark as Paid
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
