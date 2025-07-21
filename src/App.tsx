import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { Dashboard } from '@/pages/Dashboard'
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
        return <div className="p-6"><h1 className="text-2xl font-bold">Orders Management</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>
      case 'broker-portal':
        return <div className="p-6"><h1 className="text-2xl font-bold">Broker Portal</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>
      case 'customer-portal':
        return <div className="p-6"><h1 className="text-2xl font-bold">Customer Portal</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>
      case 'delivery':
        return <div className="p-6"><h1 className="text-2xl font-bold">Delivery Requests</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>
      case 'stock':
        return <div className="p-6"><h1 className="text-2xl font-bold">Stock Management</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>
      case 'analytics':
        return <div className="p-6"><h1 className="text-2xl font-bold">Analytics</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>
      case 'notifications':
        return <div className="p-6"><h1 className="text-2xl font-bold">Notifications</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>
      case 'settings':
        return <div className="p-6"><h1 className="text-2xl font-bold">Settings</h1><p className="text-gray-600 mt-2">Coming soon...</p></div>
      default:
        return <Dashboard user={user} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-sm">FM</span>
          </div>
          <div className="text-lg font-semibold text-gray-900 mb-2">FleetMD</div>
          <div className="text-sm text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">FM</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">FleetMD</h1>
          <p className="text-gray-600 mb-6">Order Management & CRM Platform</p>
          <button
            onClick={() => blink.auth.login()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
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