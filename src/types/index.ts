export interface User {
  id: string
  email: string
  displayName?: string
  role: 'admin' | 'sales' | 'finance' | 'broker' | 'customer'
  dealershipId?: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'in_production' | 'built' | 'in_transit' | 'delivered' | 'cancelled'

export interface Order {
  id: string
  orderNumber: string
  oemOrderNumber?: string
  customerId?: string
  customerName: string
  customerEmail: string
  brokerId?: string
  brokerName?: string
  status: 'pending' | 'confirmed' | 'in_production' | 'built' | 'in_transit' | 'delivered' | 'cancelled'
  vehicleModel: string
  vehicleTrim: string
  vehicleColor: string
  orderValue: number
  buildDate?: string
  deliveryDate?: string
  currentLocation?: string
  vin?: string
  buildLink?: string
  createdAt: string
  updatedAt: string
  userId: string
}

export interface Communication {
  id: string
  orderId: string
  userId: string
  message: string
  sender: string
  type: 'message' | 'delivery_request' | 'status_update'
  createdAt: string
}

export interface StockVehicle {
  id: string
  vin: string
  model: string
  trim: string
  color: string
  year: number
  price: number
  location: string
  status: 'available' | 'reserved' | 'sold' | 'damaged'
  userId: string
  createdAt: string
  updatedAt: string
}

export interface DeliveryRequest {
  id: string
  orderId: string
  userId: string
  pickupAddress: string
  deliveryAddress: string
  contactName: string
  contactPhone: string
  preferredDate: string
  specialInstructions?: string
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed'
  createdAt: string
  updatedAt?: string
}

export interface Notification {
  id: string
  userId: string
  orderId?: string
  title: string
  message: string
  type: 'order_update' | 'delivery_alert' | 'build_date' | 'system_alert'
  priority: 'low' | 'medium' | 'high'
  isRead: boolean
  createdAt: string
  updatedAt?: string
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