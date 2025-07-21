import React, { useState, useEffect, useCallback } from 'react'
import { blink } from '../blink/client'
import { StockVehicle, Order } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Label } from '../components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Search, Plus, Eye, Package, AlertTriangle, CheckCircle, Zap } from 'lucide-react'

export default function StockManagement() {
  const [stockVehicles, setStockVehicles] = useState<StockVehicle[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedVehicle, setSelectedVehicle] = useState<StockVehicle | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [matchedOrders, setMatchedOrders] = useState<Order[]>([])
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  const loadStockVehicles = useCallback(async () => {
    try {
      const stockData = await blink.db.stockVehicles.list({
        orderBy: { createdAt: 'desc' }
      })
      setStockVehicles(stockData)
    } catch (error) {
      console.error('Failed to load stock vehicles:', error)
    }
  }, [])

  const loadOrders = useCallback(async () => {
    try {
      const ordersData = await blink.db.orders.list({
        where: { status: 'pending' },
        orderBy: { createdAt: 'desc' }
      })
      setOrders(ordersData)
    } catch (error) {
      console.error('Failed to load orders:', error)
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadStockVehicles()
      loadOrders()
    }
  }, [user, loadStockVehicles, loadOrders])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'reserved': return 'bg-yellow-100 text-yellow-800'
      case 'sold': return 'bg-blue-100 text-blue-800'
      case 'damaged': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const findMatchingOrders = (vehicle: StockVehicle) => {
    return orders.filter(order => 
      order.vehicleModel.toLowerCase() === vehicle.model.toLowerCase() &&
      order.vehicleTrim.toLowerCase() === vehicle.trim.toLowerCase() &&
      order.vehicleColor.toLowerCase() === vehicle.color.toLowerCase()
    )
  }

  const handleCreateStock = async (formData: FormData) => {
    if (!user) return

    try {
      const newStock = {
        vin: formData.get('vin') as string,
        model: formData.get('model') as string,
        trim: formData.get('trim') as string,
        color: formData.get('color') as string,
        year: parseInt(formData.get('year') as string),
        price: parseFloat(formData.get('price') as string),
        location: formData.get('location') as string,
        status: 'available',
        userId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await blink.db.stockVehicles.create(newStock)
      await loadStockVehicles()
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('Failed to create stock vehicle:', error)
    }
  }

  const updateStockStatus = async (vehicleId: string, newStatus: string) => {
    try {
      await blink.db.stockVehicles.update(vehicleId, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      })
      await loadStockVehicles()
    } catch (error) {
      console.error('Failed to update stock status:', error)
    }
  }

  const matchOrderToStock = async (orderId: string, stockId: string) => {
    try {
      // Update order with stock vehicle details
      const stockVehicle = stockVehicles.find(v => v.id === stockId)
      if (!stockVehicle) return

      await blink.db.orders.update(orderId, {
        vin: stockVehicle.vin,
        status: 'confirmed',
        updatedAt: new Date().toISOString()
      })

      // Update stock status to reserved
      await updateStockStatus(stockId, 'reserved')
      
      await loadOrders()
      await loadStockVehicles()
    } catch (error) {
      console.error('Failed to match order to stock:', error)
    }
  }

  const filteredStock = stockVehicles.filter(vehicle => {
    if (statusFilter !== 'all' && vehicle.status !== statusFilter) return false
    if (searchTerm) {
      return (
        vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.trim.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.color.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    return true
  })

  const availableStock = stockVehicles.filter(v => v.status === 'available')
  const reservedStock = stockVehicles.filter(v => v.status === 'reserved')
  const soldStock = stockVehicles.filter(v => v.status === 'sold')

  if (!user) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Stock Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Stock Vehicle</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault()
              handleCreateStock(new FormData(e.currentTarget))
            }} className="space-y-4">
              <div>
                <Label htmlFor="vin">VIN Number</Label>
                <Input id="vin" name="vin" required />
              </div>
              <div>
                <Label htmlFor="model">Model</Label>
                <Input id="model" name="model" required />
              </div>
              <div>
                <Label htmlFor="trim">Trim</Label>
                <Input id="trim" name="trim" required />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <Input id="color" name="color" required />
              </div>
              <div>
                <Label htmlFor="year">Year</Label>
                <Input id="year" name="year" type="number" min="2020" max="2030" required />
              </div>
              <div>
                <Label htmlFor="price">Price (£)</Label>
                <Input id="price" name="price" type="number" step="0.01" required />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" required />
              </div>
              <Button type="submit" className="w-full">Add Vehicle</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Available</p>
                <p className="text-2xl font-bold">{availableStock.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Reserved</p>
                <p className="text-2xl font-bold">{reservedStock.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Sold</p>
                <p className="text-2xl font-bold">{soldStock.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-2xl font-bold">
                  £{availableStock.reduce((sum, v) => sum + v.price, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stock" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stock">Stock Vehicles</TabsTrigger>
          <TabsTrigger value="matching">Auto Matching</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stock Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search stock..."
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
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stock Vehicles ({filteredStock.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>VIN</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStock.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-mono text-sm">{vehicle.vin}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{vehicle.model}</div>
                          <div className="text-sm text-gray-500">{vehicle.trim} • {vehicle.color}</div>
                        </div>
                      </TableCell>
                      <TableCell>{vehicle.year}</TableCell>
                      <TableCell>£{vehicle.price.toLocaleString()}</TableCell>
                      <TableCell>{vehicle.location}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(vehicle.status)}>
                          {vehicle.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedVehicle(vehicle)
                              setMatchedOrders(findMatchingOrders(vehicle))
                              setIsViewDialogOpen(true)
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Select onValueChange={(value) => updateStockStatus(vehicle.id, value)}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Update" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">Available</SelectItem>
                              <SelectItem value="reserved">Reserved</SelectItem>
                              <SelectItem value="sold">Sold</SelectItem>
                              <SelectItem value="damaged">Damaged</SelectItem>
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
        </TabsContent>

        <TabsContent value="matching" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Auto Stock Matching</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availableStock.map((vehicle) => {
                  const matches = findMatchingOrders(vehicle)
                  if (matches.length === 0) return null

                  return (
                    <div key={vehicle.id} className="p-4 border rounded-lg bg-green-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{vehicle.model} {vehicle.trim}</h4>
                          <p className="text-sm text-gray-600">{vehicle.color} • {vehicle.year} • {vehicle.vin}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          {matches.length} match{matches.length !== 1 ? 'es' : ''}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700">Matching Orders:</h5>
                        {matches.map((order) => (
                          <div key={order.id} className="flex justify-between items-center p-2 bg-white rounded border">
                            <div>
                              <span className="font-medium">{order.orderNumber}</span>
                              <span className="ml-2 text-sm text-gray-500">{order.customerName}</span>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => matchOrderToStock(order.id, vehicle.id)}
                            >
                              Match Order
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
                
                {availableStock.filter(v => findMatchingOrders(v).length > 0).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No matching opportunities found</p>
                    <p className="text-sm">Available stock doesn't match any pending orders</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Vehicle Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Stock Vehicle Details</DialogTitle>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">VIN Number</Label>
                  <p className="font-mono">{selectedVehicle.vin}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge className={getStatusColor(selectedVehicle.status)}>
                    {selectedVehicle.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Model</Label>
                  <p>{selectedVehicle.model}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Trim</Label>
                  <p>{selectedVehicle.trim}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Color</Label>
                  <p>{selectedVehicle.color}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Year</Label>
                  <p>{selectedVehicle.year}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Price</Label>
                  <p className="text-lg font-semibold">£{selectedVehicle.price.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Location</Label>
                  <p>{selectedVehicle.location}</p>
                </div>
              </div>

              {matchedOrders.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Matching Orders</Label>
                  <div className="mt-2 space-y-2">
                    {matchedOrders.map((order) => (
                      <div key={order.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                        <div>
                          <span className="font-medium">{order.orderNumber}</span>
                          <span className="ml-2 text-sm text-gray-500">{order.customerName}</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => matchOrderToStock(order.id, selectedVehicle.id)}
                        >
                          Match
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-500">
                <p>Added: {new Date(selectedVehicle.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(selectedVehicle.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}