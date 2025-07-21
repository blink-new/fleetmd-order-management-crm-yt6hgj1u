export interface User {
  id: string
  email: string
  displayName?: string
  role: 'admin' | 'sales' | 'finance' | 'broker' | 'customer'
  dealershipId?: string
}

export interface Order {
  id: string
  orderNumber: string
  oemOrderNumber?: string
  customerId: string
  customerName: string
  customerEmail: string
  brokerId?: string
  brokerName?: string
  status: 'pending' | 'confirmed' | 'in_production' | 'built' | 'in_transit' | 'delivered' | 'cancelled'
  vehicle: {
    make: string
    model: string
    trim: string
    year: number
    color: string
    vin?: string
    reg?: string
    imageUrl?: string
    buildUrl?: string
  }
  pricing: {
    basePrice: number
    options: number
    total: number
    deposit?: number
  }
  dates: {
    orderDate: string
    buildDate?: string
    estimatedDelivery?: string
    actualDelivery?: string
    lastAmendment?: string
  }
  location: {
    current: 'manufacturer' | 'in_transit' | 'dealer' | 'delivered'
    dealershipId: string
  }
  delivery: {
    method: 'collection' | 'delivery'
    address?: string
    contactName?: string
    contactPhone?: string
    requestedDate?: string
    logisticsCompany?: string
    status: 'not_requested' | 'requested' | 'approved' | 'in_progress' | 'completed'
  }
  communications: Communication[]
  createdAt: string
  updatedAt: string
  userId: string
}

export interface Communication {
  id: string
  orderId: string
  userId: string
  userName: string
  userRole: string
  message: string
  timestamp: string
  type: 'note' | 'status_update' | 'delivery_request' | 'customer_inquiry'
}

export interface StockVehicle {
  id: string
  vin: string
  make: string
  model: string
  trim: string
  year: number
  color: string
  status: 'available' | 'reserved' | 'sold'
  location: string
  price: number
  imageUrl?: string
  createdAt: string
  userId: string
}

export interface DeliveryRequest {
  id: string
  orderId: string
  requestedBy: string
  requestedByRole: string
  deliveryAddress: string
  contactName: string
  contactPhone: string
  requestedDate: string
  specialInstructions?: string
  status: 'pending' | 'approved' | 'declined' | 'in_progress' | 'completed'
  logisticsCompany?: string
  estimatedCost?: number
  createdAt: string
  updatedAt: string
  userId: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'order_update' | 'delivery_request' | 'stock_match' | 'system' | 'communication'
  orderId?: string
  isRead: boolean
  createdAt: string
}

export interface DashboardMetrics {
  totalOrders: number
  pendingOrders: number
  inProductionOrders: number
  deliveredOrders: number
  totalRevenue: number
  monthlyRevenue: number
  averageOrderValue: number
  deliveryRequests: number
  stockMatches: number
  communicationsToday: number
}