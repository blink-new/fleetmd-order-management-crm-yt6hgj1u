import React, { useState, useEffect, useCallback } from 'react'
import { blink } from '../blink/client'
import { Notification, Order } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Switch } from '../components/ui/switch'
import { Label } from '../components/ui/label'
import { Separator } from '../components/ui/separator'
import { Bell, BellOff, CheckCircle, AlertTriangle, Info, Truck, Calendar, Settings } from 'lucide-react'

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [notificationSettings, setNotificationSettings] = useState({
    orderUpdates: true,
    deliveryAlerts: true,
    buildDates: true,
    systemAlerts: true
  })
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  const loadNotifications = useCallback(async () => {
    if (!user) return
    try {
      const notificationsData = await blink.db.notifications.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setNotifications(notificationsData)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }, [user])

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
      loadNotifications()
      loadOrders()
    }
  }, [user, loadNotifications, loadOrders])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_update': return CheckCircle
      case 'delivery_alert': return Truck
      case 'build_date': return Calendar
      case 'system_alert': return AlertTriangle
      default: return Info
    }
  }

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') return 'bg-red-100 text-red-800 border-red-200'
    
    switch (type) {
      case 'order_update': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'delivery_alert': return 'bg-green-100 text-green-800 border-green-200'
      case 'build_date': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'system_alert': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await blink.db.notifications.update(notificationId, {
        isRead: true,
        updatedAt: new Date().toISOString()
      })
      await loadNotifications()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead)
      for (const notification of unreadNotifications) {
        await blink.db.notifications.update(notification.id, {
          isRead: true,
          updatedAt: new Date().toISOString()
        })
      }
      await loadNotifications()
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const createTestNotification = async (type: string) => {
    if (!user) return
    
    const testNotifications = {
      order_update: {
        title: 'Order Status Updated',
        message: 'Your order ORD-12345 has been moved to production',
        type: 'order_update',
        priority: 'medium'
      },
      delivery_alert: {
        title: 'Delivery Scheduled',
        message: 'Your vehicle is scheduled for delivery on March 15th',
        type: 'delivery_alert',
        priority: 'high'
      },
      build_date: {
        title: 'Build Date Confirmed',
        message: 'Your vehicle build date has been confirmed for March 1st',
        type: 'build_date',
        priority: 'medium'
      },
      system_alert: {
        title: 'System Maintenance',
        message: 'Scheduled maintenance will occur tonight from 2-4 AM',
        type: 'system_alert',
        priority: 'low'
      }
    }

    try {
      const notification = {
        ...testNotifications[type as keyof typeof testNotifications],
        userId: user.id,
        isRead: false,
        createdAt: new Date().toISOString()
      }

      await blink.db.notifications.create(notification)
      await loadNotifications()
    } catch (error) {
      console.error('Failed to create test notification:', error)
    }
  }

  const getOrderDetails = (orderId?: string) => {
    if (!orderId) return null
    return orders.find(order => order.id === orderId)
  }

  const filteredNotifications = notifications.filter(notification => {
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false
    if (statusFilter === 'unread' && notification.isRead) return false
    if (statusFilter === 'read' && !notification.isRead) return false
    return true
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (!user) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <Badge className="bg-red-100 text-red-800">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="orderUpdates" className="font-medium">Order Updates</Label>
                <p className="text-sm text-gray-500">Get notified when order status changes</p>
              </div>
              <Switch
                id="orderUpdates"
                checked={notificationSettings.orderUpdates}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, orderUpdates: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="deliveryAlerts" className="font-medium">Delivery Alerts</Label>
                <p className="text-sm text-gray-500">Get notified about delivery schedules</p>
              </div>
              <Switch
                id="deliveryAlerts"
                checked={notificationSettings.deliveryAlerts}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, deliveryAlerts: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="buildDates" className="font-medium">Build Date Updates</Label>
                <p className="text-sm text-gray-500">Get notified about build date changes</p>
              </div>
              <Switch
                id="buildDates"
                checked={notificationSettings.buildDates}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, buildDates: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="systemAlerts" className="font-medium">System Alerts</Label>
                <p className="text-sm text-gray-500">Get notified about system updates</p>
              </div>
              <Switch
                id="systemAlerts"
                checked={notificationSettings.systemAlerts}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, systemAlerts: checked }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="order_update">Order Updates</SelectItem>
                <SelectItem value="delivery_alert">Delivery Alerts</SelectItem>
                <SelectItem value="build_date">Build Dates</SelectItem>
                <SelectItem value="system_alert">System Alerts</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Notifications</SelectItem>
                <SelectItem value="unread">Unread Only</SelectItem>
                <SelectItem value="read">Read Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Test Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Test Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => createTestNotification('order_update')}
            >
              Order Update
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => createTestNotification('delivery_alert')}
            >
              Delivery Alert
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => createTestNotification('build_date')}
            >
              Build Date
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => createTestNotification('system_alert')}
            >
              System Alert
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.map((notification) => {
          const Icon = getNotificationIcon(notification.type)
          const order = getOrderDetails(notification.orderId)
          
          return (
            <Card 
              key={notification.id} 
              className={`transition-all hover:shadow-md ${
                !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getNotificationColor(notification.type, notification.priority)}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{notification.title}</h3>
                        <p className="text-gray-600 mt-1">{notification.message}</p>
                        
                        {order && (
                          <div className="mt-2 text-sm text-gray-500">
                            Related to order: <span className="font-medium">{order.orderNumber}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {notification.priority}
                        </Badge>
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                      <span>{new Date(notification.createdAt).toLocaleString()}</span>
                      <div className="flex items-center gap-2">
                        {notification.isRead ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Read
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Bell className="w-3 h-3" />
                            Unread
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredNotifications.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BellOff className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-500">
              {typeFilter !== 'all' || statusFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'You have no notifications yet'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}