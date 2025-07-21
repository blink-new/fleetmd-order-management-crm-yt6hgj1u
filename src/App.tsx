import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { Dashboard } from '@/pages/Dashboard'
import OrdersManagement from '@/pages/OrdersManagement'
import BrokerPortal from '@/pages/BrokerPortal'
import CustomerPortal from '@/pages/CustomerPortal'
import DeliveryRequests from '@/pages/DeliveryRequests'
import Notifications from '@/pages/Notifications'
import StockManagement from '@/pages/StockManagement'
import Settings from '@/pages/Settings'
import { blink } from '@/blink/client'
import type { User } from '@/types'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState('dashboard')

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      if (state.user) {
        // Map Blink user to our User type with role
        const mappedUser: User = {
          id: state.user.id,
          email: state.user.email,
          displayName: state.user.displayName,
          role: 'admin', // Default role - in real app this would come from user profile
          dealershipId: 'dealer-001'
        }
        setUser(mappedUser)
      } else {
        setUser(null)
      }
      setLoading(state.isLoading)
    })

    return unsubscribe
  }, [])

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={user} />
      case 'orders':
        return <div className="p-6"><OrdersManagement /></div>
      case 'broker-portal':
        return <div className="p-6"><BrokerPortal /></div>
      case 'customer-portal':
        return <div className="p-6"><CustomerPortal /></div>
      case 'delivery':
        return <div className="p-6"><DeliveryRequests /></div>
      case 'stock':
        return <div className="p-6"><StockManagement /></div>
      case 'analytics':
        return <div className="p-6"><h1 className="text-2xl font-bold">Analytics</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>
      case 'notifications':
        return <div className="p-6"><Notifications /></div>
      case 'settings':
        return <div className="p-6"><Settings /></div>
      default:
        return <Dashboard user={user} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center dark">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-sm">FM</span>
          </div>
          <div className="text-lg font-semibold mb-2">FleetMD</div>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center dark">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-lg">FM</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">FleetMD</h1>
          <p className="text-muted-foreground mb-6">Order Management & CRM Platform</p>
          <button
            onClick={() => blink.auth.login()}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex dark">
      <Sidebar 
        user={user} 
        currentPage={currentPage} 
        onPageChange={setCurrentPage} 
      />
      <div className="flex-1 flex flex-col">
        <Header user={user} />
        <main className="flex-1 overflow-auto">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  )
}

export default App