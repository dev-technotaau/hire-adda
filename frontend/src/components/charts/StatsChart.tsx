'use client';

import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';

interface StatsChartProps {
  data: Array<Record<string, unknown>>;
  dataKey: string;
  color?: string;
  height?: number;
}

export default function StatsChart({
  data,
  dataKey,
  color = '#1E5CAF',
  height = 60,
}: StatsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <Tooltip
          contentStyle={{
            borderRadius: '6px',
            border: '1px solid var(--border)',
            fontSize: '12px',
            padding: '4px 8px',
          }}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          fill={color}
          fillOpacity={0.1}
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
