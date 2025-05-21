'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const data = [
  {
    name: 'Jan',
    utilization: 65,
    efficiency: 78,
  },
  {
    name: 'Feb',
    utilization: 70,
    efficiency: 82,
  },
  {
    name: 'Mar',
    utilization: 75,
    efficiency: 85,
  },
  {
    name: 'Apr',
    utilization: 80,
    efficiency: 88,
  },
  {
    name: 'May',
    utilization: 85,
    efficiency: 90,
  },
  {
    name: 'Jun',
    utilization: 82,
    efficiency: 87,
  },
];

export function ResourceMetricsChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="utilization" fill="#8884d8" name="Utilization %" />
          <Bar dataKey="efficiency" fill="#82ca9d" name="Efficiency %" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
