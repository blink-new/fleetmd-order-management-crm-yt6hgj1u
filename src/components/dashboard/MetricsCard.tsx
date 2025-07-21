import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface MetricsCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
    period: string
  }
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}

export function MetricsCard({ title, value, change, icon: Icon, className }: MetricsCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-gray-400" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {change && (
          <div className="flex items-center space-x-2 mt-2">
            <Badge 
              variant={change.type === 'increase' ? 'default' : 'secondary'}
              className={cn(
                "text-xs",
                change.type === 'increase' 
                  ? "bg-green-100 text-green-800 hover:bg-green-100" 
                  : "bg-red-100 text-red-800 hover:bg-red-100"
              )}
            >
              {change.type === 'increase' ? '+' : '-'}{Math.abs(change.value)}%
            </Badge>
            <span className="text-xs text-gray-500">vs {change.period}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}