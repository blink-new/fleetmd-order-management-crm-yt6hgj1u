import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface OrdersChartProps {
  data: Array<{
    date: string
    orders: number
    revenue: number
  }>
  type: 'orders' | 'revenue'
}

export function OrdersChart({ data, type }: OrdersChartProps) {
  const formatValue = (value: number) => {
    if (type === 'revenue') {
      return `£${value.toLocaleString()}`
    }
    return value.toString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {type === 'orders' ? 'Orders Trend' : 'Revenue Trend'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={formatValue}
              />
              <Tooltip 
                formatter={(value: number) => [formatValue(value), type === 'orders' ? 'Orders' : 'Revenue']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey={type} 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}