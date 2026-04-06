import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface FeatureImportanceProps {
  data: Array<{ feature: string; importance: number }>;
}

export const FeatureImportance: React.FC<FeatureImportanceProps> = ({ data }) => {
  const maxVal = Math.max(...data.map(d => Math.abs(d.importance)), 0.001);
  const normalizedData = data.map(d => ({
    ...d,
    feature: d.feature.toUpperCase(),
    normalizedVal: (Math.abs(d.importance) / maxVal) * 100
  })).sort((a, b) => b.normalizedVal - a.normalizedVal);

  return (
    <div className="bg-white border-2 border-black p-8 h-full flex flex-col transition-all">
      <div className="border-b-2 border-black pb-4 mb-8 flex items-end justify-between">
        <div>
          <h3 className="font-serif text-3xl uppercase tracking-widest">Driver Analysis</h3>
          <p className="font-sans text-[10px] uppercase tracking-widest text-[#4B5563] mt-2">SHAP relative impact</p>
        </div>
      </div>
      
      <div className="h-48 w-full mt-auto">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={normalizedData} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis 
              dataKey="feature" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#000000', fontFamily: '"IBM Plex Sans", sans-serif', fontSize: 11, fontWeight: 500 }}
              width={100}
            />
            <Tooltip 
              cursor={{fill: '#F3F4F6'}} 
              contentStyle={{ borderRadius: '0', border: '2px solid black', fontFamily: '"IBM Plex Sans", sans-serif', textTransform: 'uppercase', fontSize: '10px' }}
              formatter={(value: any) => [`${value.toFixed(1)}%`, 'Impact']}
            />
            <Bar dataKey="normalizedVal" barSize={16}>
              {normalizedData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={'#000000'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
