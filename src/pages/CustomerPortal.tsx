import React, { useState, useEffect, useCallback } from 'react'
import { blink } from '../blink/client'
import { Order } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Separator } from '../components/ui/separator'
import { Search, Calendar, MapPin, Truck, CheckCircle, Clock, ExternalLink } from 'lucide-react'

export default function CustomerPortal() {
  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  const loadCustomerOrders = useCallback(async () => {
    if (!user) return
    try {
      const ordersData = await blink.db.orders.list({
        where: { customerEmail: user.email },
        orderBy: { createdAt: 'desc' }
      })
      setOrders(ordersData)
    } catch (error) {
      console.error('Failed to load customer orders:', error)
    }
  }, [user])

  const filterOrders = useCallback(() => {
    let filtered = orders

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm])

  useEffect(() => {
    if (user) {
      loadCustomerOrders()
    }
  }, [user, loadCustomerOrders])

  useEffect(() => {
    filterOrders()
  }, [orders, searchTerm, filterOrders])

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'pending': return 10
      case 'confirmed': return 25
      case 'in_production': return 50
      case 'built': return 75
      case 'in_transit': return 90
      case 'delivered': return 100
      default: return 0
    }
  }

  const getStatusColor = (status: string) => {
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

  const getStatusSteps = (status: string) => {
    const steps = [
      { key: 'pending', label: 'Order Placed', icon: CheckCircle },
      { key: 'confirmed', label: 'Order Confirmed', icon: CheckCircle },
      { key: 'in_production', label: 'In Production', icon: Clock },
      { key: 'built', label: 'Vehicle Built', icon: CheckCircle },
      { key: 'in_transit', label: 'In Transit', icon: Truck },
      { key: 'delivered', label: 'Delivered', icon: CheckCircle }
    ]

    const currentIndex = steps.findIndex(step => step.key === status)
    
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex
    }))
  }

  if (!user) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <div className="text-sm text-gray-500">
          Welcome, {user.email}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by order number or vehicle model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {filteredOrders.map((order) => {
          const statusSteps = getStatusSteps(order.status)
          const progress = getStatusProgress(order.status)
          
          return (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{order.orderNumber}</CardTitle>
                    <p className="text-gray-600 mt-1">
                      {order.vehicleModel} • {order.vehicleTrim} • {order.vehicleColor}
                    </p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Order Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Status Timeline */}
                <div className="space-y-4">
                  <h4 className="font-medium">Order Timeline</h4>
                  <div className="space-y-3">
                    {statusSteps.map((step, index) => {
                      const Icon = step.icon
                      return (
                        <div key={step.key} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            step.completed 
                              ? 'bg-green-100 text-green-600' 
                              : step.current 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'bg-gray-100 text-gray-400'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`${
                            step.completed || step.current 
                              ? 'text-gray-900 font-medium' 
                              : 'text-gray-400'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <Separator />

                {/* Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-500 text-sm mb-1">Order Value</h5>
                    <p className="text-lg font-semibold">£{order.orderValue.toLocaleString()}</p>
                  </div>
                  
                  {order.buildDate && (
                    <div>
                      <h5 className="font-medium text-gray-500 text-sm mb-1">Build Date</h5>
                      <p className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(order.buildDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  
                  {order.deliveryDate && (
                    <div>
                      <h5 className="font-medium text-gray-500 text-sm mb-1">Expected Delivery</h5>
                      <p className="flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        {new Date(order.deliveryDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {order.currentLocation && (
                  <div>
                    <h5 className="font-medium text-gray-500 text-sm mb-1">Current Location</h5>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {order.currentLocation}
                    </p>
                  </div>
                )}

                {order.vin && (
                  <div>
                    <h5 className="font-medium text-gray-500 text-sm mb-1">VIN Number</h5>
                    <p className="font-mono text-sm bg-gray-50 p-2 rounded">{order.vin}</p>
                  </div>
                )}

                {/* Vehicle Image Placeholder */}
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <div className="w-16 h-16 mx-auto bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                    <Truck className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">Vehicle image will be available once production begins</p>
                </div>

                {/* Build Link */}
                {order.buildLink && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-medium mb-2">Vehicle Build Configuration</h5>
                    <Button variant="outline" className="w-full" asChild>
                      <a href={order.buildLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Build Details
                      </a>
                    </Button>
                  </div>
                )}

                {/* Last Update */}
                <div className="text-sm text-gray-500 text-center pt-4 border-t">
                  Last updated: {new Date(order.updatedAt).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Truck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'You have no orders yet'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}