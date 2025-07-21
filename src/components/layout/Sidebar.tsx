import { useState } from 'react'
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Truck, 
  Bell, 
  Settings,
  BarChart3,
  MessageSquare,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { User } from '@/types'

interface SidebarProps {
  user: User | null
  currentPage: string
  onPageChange: (page: string) => void
}

interface NavItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'sales', 'finance', 'broker']
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: Package,
    roles: ['admin', 'sales', 'finance', 'broker']
  },
  {
    id: 'broker-portal',
    label: 'Broker Portal',
    icon: Users,
    roles: ['admin', 'broker']
  },
  {
    id: 'customer-portal',
    label: 'Customer Portal',
    icon: MessageSquare,
    roles: ['admin', 'sales', 'customer']
  },
  {
    id: 'delivery',
    label: 'Delivery Requests',
    icon: Truck,
    roles: ['admin', 'sales', 'broker']
  },
  {
    id: 'stock',
    label: 'Stock Management',
    icon: Search,
    roles: ['admin', 'sales']
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    roles: ['admin', 'finance']
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    roles: ['admin', 'sales', 'finance', 'broker']
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    roles: ['admin', 'sales', 'finance', 'broker']
  }
]

export function Sidebar({ user, currentPage, onPageChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const filteredNavItems = navItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  )

  return (
    <div className={cn(
      "bg-card border-r border-border flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Collapse Toggle */}
      <div className="p-4 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full justify-center"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredNavItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                isCollapsed && "justify-center px-2"
              )}
              onClick={() => onPageChange(item.id)}
            >
              <Icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
              {!isCollapsed && <span>{item.label}</span>}
            </Button>
          )
        })}
      </nav>

      {/* User Role Badge */}
      {!isCollapsed && user && (
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Current Role
          </div>
          <div className="text-sm font-medium text-foreground capitalize">
            {user.role}
          </div>
        </div>
      )}
    </div>
  )
}