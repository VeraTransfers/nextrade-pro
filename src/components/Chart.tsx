import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartDataPoint } from '../types';

interface ChartProps {
  data: ChartDataPoint[];
}

export const Chart: React.FC<ChartProps> = ({ data }) => {
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#00f2fe" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="day" stroke="#a0aec0" />
          <YAxis stroke="#a0aec0" />
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1a202c', borderColor: '#2d3748', color: '#fff' }}
            itemStyle={{ color: '#00f2fe' }}
          />
          <Area type="monotone" dataKey="value" stroke="#00f2fe" fillOpacity={1} fill="url(#colorValue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
