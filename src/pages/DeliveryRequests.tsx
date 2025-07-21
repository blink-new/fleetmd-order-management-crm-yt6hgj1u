import React, { useState, useEffect, useCallback } from 'react'
import { blink } from '../blink/client'
import { DeliveryRequest, Order } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Truck, Calendar, MapPin, Phone, User, CheckCircle, XCircle, Clock, Eye } from 'lucide-react'

export default function DeliveryRequests() {
  const [deliveryRequests, setDeliveryRequests] = useState<DeliveryRequest[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedRequest, setSelectedRequest] = useState<DeliveryRequest | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  const loadDeliveryRequests = useCallback(async () => {
    try {
      const requestsData = await blink.db.deliveryRequests.list({
        orderBy: { createdAt: 'desc' }
      })
      setDeliveryRequests(requestsData)
    } catch (error) {
      console.error('Failed to load delivery requests:', error)
    }
  }, [])

  const loadOrders = useCallback(async () => {
    try {
      const ordersData = await blink.db.orders.list()
      setOrders(ordersData)
    } catch (error) {
      console.error('Failed to load orders:', error)
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadDeliveryRequests()
      loadOrders()
    }
  }, [user, loadDeliveryRequests, loadOrders])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-emerald-100 text-emerald-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      await blink.db.deliveryRequests.update(requestId, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      })
      await loadDeliveryRequests()
    } catch (error) {
      console.error('Failed to update delivery request status:', error)
    }
  }

  const getOrderDetails = (orderId: string) => {
    return orders.find(order => order.id === orderId)
  }

  const filteredRequests = deliveryRequests.filter(request => 
    statusFilter === 'all' || request.status === statusFilter
  )

  if (!user) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Delivery Requests</h1>
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold">
                  {deliveryRequests.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold">
                  {deliveryRequests.filter(r => r.status === 'approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold">
                  {deliveryRequests.filter(r => r.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold">
                  {deliveryRequests.filter(r => r.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Requests ({filteredRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Preferred Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => {
                const order = getOrderDetails(request.orderId)
                return (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      {order?.orderNumber || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {order ? (
                        <div>
                          <div className="font-medium">{order.vehicleModel}</div>
                          <div className="text-sm text-gray-500">{order.vehicleTrim} • {order.vehicleColor}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span className="text-sm">{request.contactName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span className="text-sm text-gray-500">{request.contactPhone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-1 max-w-32">
                        <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm truncate">{request.pickupAddress}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-1 max-w-32">
                        <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm truncate">{request.deliveryAddress}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span className="text-sm">
                          {new Date(request.preferredDate).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request)
                            setIsViewDialogOpen(true)
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {request.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => updateRequestStatus(request.id, 'approved')}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateRequestStatus(request.id, 'rejected')}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        
                        {request.status === 'approved' && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => updateRequestStatus(request.id, 'in_progress')}
                          >
                            Start
                          </Button>
                        )}
                        
                        {request.status === 'in_progress' && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => updateRequestStatus(request.id, 'completed')}
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Request Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Delivery Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Order Number</Label>
                  <p className="text-lg font-semibold">
                    {getOrderDetails(selectedRequest.orderId)?.orderNumber || 'Unknown'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Contact Name</Label>
                  <p>{selectedRequest.contactName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Contact Phone</Label>
                  <p>{selectedRequest.contactPhone}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Pickup Address</Label>
                <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedRequest.pickupAddress}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Delivery Address</Label>
                <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedRequest.deliveryAddress}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Preferred Date</Label>
                <p className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(selectedRequest.preferredDate).toLocaleDateString()}
                </p>
              </div>

              {selectedRequest.specialInstructions && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Special Instructions</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedRequest.specialInstructions}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Created</Label>
                  <p>{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                  <p>{new Date(selectedRequest.updatedAt || selectedRequest.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}