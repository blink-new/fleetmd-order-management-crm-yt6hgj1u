import React, { useState, useEffect, useCallback } from 'react'
import { blink } from '../blink/client'
import { Order, OrderStatus } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Search, Plus, Eye, Edit, Truck, Calendar, MapPin } from 'lucide-react'

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  const loadOrders = useCallback(async () => {
    try {
      const ordersData = await blink.db.orders.list({
        orderBy: { createdAt: 'desc' }
      })
      setOrders(ordersData)
    } catch (error) {
      console.error('Failed to load orders:', error)
    }
  }, [])

  const filterOrders = useCallback(() => {
    let filtered = orders

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm, statusFilter])

  useEffect(() => {
    if (user) {
      loadOrders()
    }
  }, [user, loadOrders])

  useEffect(() => {
    filterOrders()
  }, [orders, searchTerm, statusFilter, filterOrders])

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'in_production': return 'bg-purple-100 text-purple-800'
      case 'built': return 'bg-green-100 text-green-800'
      case 'in_transit': return 'bg-orange-100 text-orange-800'
      case 'delivered': return 'bg-emerald-100 text-emerald-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCreateOrder = async (formData: FormData) => {
    try {
      const newOrder = {
        orderNumber: `ORD-${Date.now()}`,
        customerName: formData.get('customerName') as string,
        customerEmail: formData.get('customerEmail') as string,
        vehicleModel: formData.get('vehicleModel') as string,
        vehicleTrim: formData.get('vehicleTrim') as string,
        vehicleColor: formData.get('vehicleColor') as string,
        orderValue: parseFloat(formData.get('orderValue') as string),
        status: 'pending' as OrderStatus,
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await blink.db.orders.create(newOrder)
      await loadOrders()
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('Failed to create order:', error)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await blink.db.orders.update(orderId, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      })
      await loadOrders()
    } catch (error) {
      console.error('Failed to update order status:', error)
    }
  }

  if (!user) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault()
              handleCreateOrder(new FormData(e.currentTarget))
            }} className="space-y-4">
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input id="customerName" name="customerName" required />
              </div>
              <div>
                <Label htmlFor="customerEmail">Customer Email</Label>
                <Input id="customerEmail" name="customerEmail" type="email" required />
              </div>
              <div>
                <Label htmlFor="vehicleModel">Vehicle Model</Label>
                <Input id="vehicleModel" name="vehicleModel" required />
              </div>
              <div>
                <Label htmlFor="vehicleTrim">Vehicle Trim</Label>
                <Input id="vehicleTrim" name="vehicleTrim" required />
              </div>
              <div>
                <Label htmlFor="vehicleColor">Vehicle Color</Label>
                <Input id="vehicleColor" name="vehicleColor" required />
              </div>
              <div>
                <Label htmlFor="orderValue">Order Value (£)</Label>
                <Input id="orderValue" name="orderValue" type="number" step="0.01" required />
              </div>
              <Button type="submit" className="w-full">Create Order</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_production">In Production</SelectItem>
                <SelectItem value="built">Built</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-sm text-gray-500">{order.customerEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.vehicleModel}</div>
                      <div className="text-sm text-gray-500">{order.vehicleTrim} • {order.vehicleColor}</div>
                    </div>
                  </TableCell>
                  <TableCell>£{order.orderValue.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order)
                          setIsViewDialogOpen(true)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Select onValueChange={(value) => updateOrderStatus(order.id, value as OrderStatus)}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Update" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="in_production">In Production</SelectItem>
                          <SelectItem value="built">Built</SelectItem>
                          <SelectItem value="in_transit">In Transit</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Order Number</Label>
                  <p className="text-lg font-semibold">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Customer Name</Label>
                  <p>{selectedOrder.customerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Customer Email</Label>
                  <p>{selectedOrder.customerEmail}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Vehicle Model</Label>
                  <p>{selectedOrder.vehicleModel}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Trim</Label>
                  <p>{selectedOrder.vehicleTrim}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Color</Label>
                  <p>{selectedOrder.vehicleColor}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Order Value</Label>
                  <p className="text-lg font-semibold">£{selectedOrder.orderValue.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Created</Label>
                  <p>{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedOrder.buildDate && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Build Date</Label>
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedOrder.buildDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {selectedOrder.deliveryDate && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Expected Delivery</Label>
                  <p className="flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    {new Date(selectedOrder.deliveryDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {selectedOrder.currentLocation && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Current Location</Label>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {selectedOrder.currentLocation}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}