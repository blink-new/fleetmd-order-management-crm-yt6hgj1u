import { useState, useEffect, useCallback } from 'react'
import { 
  Package, 
  Clock, 
  CheckCircle, 
  DollarSign, 
  TrendingUp, 
  Truck,
  Users,
  MessageSquare
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MetricsCard } from '@/components/dashboard/MetricsCard'
import { OrdersChart } from '@/components/dashboard/OrdersChart'
import { blink } from '@/blink/client'
import type { User, DashboardMetrics } from '@/types'

interface DashboardProps {
  user: User | null
}

export function Dashboard({ user }: DashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [chartData, setChartData] = useState<Array<{
    date: string
    orders: number
    revenue: number
  }>>([])
  const [loading, setLoading] = useState(true)

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load orders for metrics calculation
      const orders = await blink.db.orders.list({
        where: { userId: user?.id },
        orderBy: { createdAt: 'desc' }
      })

      // Calculate metrics
      const totalOrders = orders.length
      const pendingOrders = orders.filter(o => o.status === 'pending').length
      const inProductionOrders = orders.filter(o => o.status === 'in_production').length
      const deliveredOrders = orders.filter(o => o.status === 'delivered').length
      const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0)
      
      // Calculate monthly revenue (current month)
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthlyRevenue = orders
        .filter(o => {
          const orderDate = new Date(o.orderDate)
          return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
        })
        .reduce((sum, o) => sum + o.totalPrice, 0)

      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Load delivery requests
      const deliveryRequests = await blink.db.deliveryRequests.list({
        where: { userId: user?.id }
      })

      // Load communications
      const communications = await blink.db.communications.list({
        where: { userId: user?.id }
      })
      
      const today = new Date().toISOString().split('T')[0]
      const communicationsToday = communications.filter(c => 
        c.timestamp.startsWith(today)
      ).length

      setMetrics({
        totalOrders,
        pendingOrders,
        inProductionOrders,
        deliveredOrders,
        totalRevenue,
        monthlyRevenue,
        averageOrderValue,
        deliveryRequests: deliveryRequests.length,
        stockMatches: 0, // Will implement stock matching later
        communicationsToday
      })

      // Generate chart data (last 7 days)
      const chartData = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        const dayOrders = orders.filter(o => o.orderDate.startsWith(dateStr))
        const dayRevenue = dayOrders.reduce((sum, o) => sum + o.totalPrice, 0)
        
        chartData.push({
          date: date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
          orders: dayOrders.length,
          revenue: dayRevenue
        })
      }
      
      setChartData(chartData)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user, loadDashboardData])

  const getSalesMetrics = () => [
    {
      title: 'Total Orders',
      value: metrics?.totalOrders || 0,
      change: { value: 12, type: 'increase' as const, period: 'last month' },
      icon: Package
    },
    {
      title: 'Pending Orders',
      value: metrics?.pendingOrders || 0,
      icon: Clock
    },
    {
      title: 'In Production',
      value: metrics?.inProductionOrders || 0,
      icon: Package
    },
    {
      title: 'Delivered',
      value: metrics?.deliveredOrders || 0,
      change: { value: 8, type: 'increase' as const, period: 'last month' },
      icon: CheckCircle
    }
  ]

  const getFinanceMetrics = () => [
    {
      title: 'Total Revenue',
      value: `£${(metrics?.totalRevenue || 0).toLocaleString()}`,
      change: { value: 15, type: 'increase' as const, period: 'last month' },
      icon: DollarSign
    },
    {
      title: 'Monthly Revenue',
      value: `£${(metrics?.monthlyRevenue || 0).toLocaleString()}`,
      change: { value: 23, type: 'increase' as const, period: 'last month' },
      icon: TrendingUp
    },
    {
      title: 'Average Order Value',
      value: `£${(metrics?.averageOrderValue || 0).toLocaleString()}`,
      icon: DollarSign
    },
    {
      title: 'Delivery Requests',
      value: metrics?.deliveryRequests || 0,
      icon: Truck
    }
  ]

  const getBrokerMetrics = () => [
    {
      title: 'My Orders',
      value: metrics?.totalOrders || 0,
      icon: Package
    },
    {
      title: 'Pending Delivery',
      value: metrics?.deliveryRequests || 0,
      icon: Truck
    },
    {
      title: 'Communications',
      value: metrics?.communicationsToday || 0,
      icon: MessageSquare
    },
    {
      title: 'Active Customers',
      value: 12, // Mock data
      icon: Users
    }
  ]

  const getMetricsForRole = () => {
    switch (user?.role) {
      case 'finance':
        return getFinanceMetrics()
      case 'broker':
        return getBrokerMetrics()
      default:
        return getSalesMetrics()
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard - {user?.role === 'finance' ? 'Finance View' : user?.role === 'broker' ? 'Broker View' : 'Sales View'}
        </h1>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getMetricsForRole().map((metric, index) => (
          <MetricsCard
            key={index}
            title={metric.title}
            value={metric.value}
            change={metric.change}
            icon={metric.icon}
          />
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Orders Trend</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Trend</TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders">
          <OrdersChart data={chartData} type="orders" />
        </TabsContent>
        
        <TabsContent value="revenue">
          <OrdersChart data={chartData} type="revenue" />
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">New order #ORD-2024-001 created</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Delivery request approved</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Stock match found for BMW X5</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Pending Actions</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Orders awaiting approval</span>
              <span className="text-sm font-medium">{metrics?.pendingOrders || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Delivery requests</span>
              <span className="text-sm font-medium">{metrics?.deliveryRequests || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Communications today</span>
              <span className="text-sm font-medium">{metrics?.communicationsToday || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">OEM Integration: Online</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Logistics API: Connected</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Notifications: Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}