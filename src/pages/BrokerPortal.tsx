import React, { useState, useEffect, useCallback } from 'react'
import { blink } from '../blink/client'
import { Order, Communication } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Textarea } from '../components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Label } from '../components/ui/label'
import { MessageSquare, Truck, Calendar, MapPin, Clock, Send, Eye } from 'lucide-react'

export default function BrokerPortal() {
  const [orders, setOrders] = useState<Order[]>([])
  const [communications, setCommunications] = useState<Communication[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  const loadBrokerOrders = useCallback(async () => {
    if (!user) return
    try {
      const ordersData = await blink.db.orders.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setOrders(ordersData)
    } catch (error) {
      console.error('Failed to load broker orders:', error)
    }
  }, [user])

  const loadCommunications = useCallback(async () => {
    if (!user) return
    try {
      const commsData = await blink.db.communications.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setCommunications(commsData)
    } catch (error) {
      console.error('Failed to load communications:', error)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadBrokerOrders()
      loadCommunications()
    }
  }, [user, loadBrokerOrders, loadCommunications])

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

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedOrder || !user) return

    try {
      const communication = {
        orderId: selectedOrder.id,
        userId: user.id,
        message: newMessage,
        sender: user.email || 'Broker',
        type: 'message',
        createdAt: new Date().toISOString()
      }

      await blink.db.communications.create(communication)
      setNewMessage('')
      await loadCommunications()
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const requestDelivery = async (formData: FormData) => {
    if (!selectedOrder || !user) return

    try {
      const deliveryRequest = {
        orderId: selectedOrder.id,
        userId: user.id,
        pickupAddress: formData.get('pickupAddress') as string,
        deliveryAddress: formData.get('deliveryAddress') as string,
        contactName: formData.get('contactName') as string,
        contactPhone: formData.get('contactPhone') as string,
        preferredDate: formData.get('preferredDate') as string,
        specialInstructions: formData.get('specialInstructions') as string,
        status: 'pending',
        createdAt: new Date().toISOString()
      }

      await blink.db.deliveryRequests.create(deliveryRequest)
      
      // Also create a communication record
      const communication = {
        orderId: selectedOrder.id,
        userId: user.id,
        message: `Delivery requested for ${selectedOrder.orderNumber}`,
        sender: user.email || 'Broker',
        type: 'delivery_request',
        createdAt: new Date().toISOString()
      }

      await blink.db.communications.create(communication)
      
      setIsDeliveryDialogOpen(false)
      await loadCommunications()
    } catch (error) {
      console.error('Failed to request delivery:', error)
    }
  }

  if (!user) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Broker Portal</h1>
        <div className="text-sm text-gray-500">
          Welcome, {user.email}
        </div>
      </div>

      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders">My Orders</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Build Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>ETA</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.vehicleModel}</div>
                          <div className="text-sm text-gray-500">{order.vehicleTrim} • {order.vehicleColor}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.buildDate ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(order.buildDate).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-gray-400">TBD</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.currentLocation ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {order.currentLocation}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.deliveryDate ? (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {new Date(order.deliveryDate).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-gray-400">TBD</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {order.status === 'built' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order)
                                setIsDeliveryDialogOpen(true)
                              }}
                            >
                              <Truck className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {selectedOrder && (
            <Card>
              <CardHeader>
                <CardTitle>Order Communication - {selectedOrder.orderNumber}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-64 overflow-y-auto space-y-3">
                  {communications
                    .filter(comm => comm.orderId === selectedOrder.id)
                    .map((comm) => (
                      <div key={comm.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm">{comm.sender}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(comm.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{comm.message}</p>
                        {comm.type === 'delivery_request' && (
                          <Badge className="mt-2 bg-blue-100 text-blue-800">
                            Delivery Request
                          </Badge>
                        )}
                      </div>
                    ))}
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button onClick={sendMessage}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="communications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Communications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {communications.map((comm) => {
                  const order = orders.find(o => o.id === comm.orderId)
                  return (
                    <div key={comm.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium">{comm.sender}</span>
                          {order && (
                            <span className="ml-2 text-sm text-gray-500">
                              Order: {order.orderNumber}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(comm.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p>{comm.message}</p>
                      {comm.type === 'delivery_request' && (
                        <Badge className="mt-2 bg-blue-100 text-blue-800">
                          Delivery Request
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delivery Request Dialog */}
      <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Delivery</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            requestDelivery(new FormData(e.currentTarget))
          }} className="space-y-4">
            <div>
              <Label htmlFor="pickupAddress">Pickup Address</Label>
              <Textarea id="pickupAddress" name="pickupAddress" required />
            </div>
            <div>
              <Label htmlFor="deliveryAddress">Delivery Address</Label>
              <Textarea id="deliveryAddress" name="deliveryAddress" required />
            </div>
            <div>
              <Label htmlFor="contactName">Contact Name</Label>
              <Input id="contactName" name="contactName" required />
            </div>
            <div>
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input id="contactPhone" name="contactPhone" type="tel" required />
            </div>
            <div>
              <Label htmlFor="preferredDate">Preferred Date</Label>
              <Input id="preferredDate" name="preferredDate" type="date" required />
            </div>
            <div>
              <Label htmlFor="specialInstructions">Special Instructions</Label>
              <Textarea id="specialInstructions" name="specialInstructions" />
            </div>
            <Button type="submit" className="w-full">Submit Request</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}