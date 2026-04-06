import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface TopCrop {
  crop: string;
  probability: number;
}

interface ResultCardProps {
  crop: string;
  confidence: number;
  top3: TopCrop[];
  clusterId: number;
  clusterLabel: string;
  yieldKg: number;
}

export const ResultCard: React.FC<ResultCardProps> = ({ 
  crop, confidence, top3, clusterId, clusterLabel, yieldKg 
}) => {
  return (
    <div className="bg-white border-2 border-black p-8 h-full flex flex-col transition-all">
      <div className="border-b-2 border-black pb-6 mb-8 flex justify-between items-end">
        <div>
          <h2 className="font-serif text-5xl uppercase tracking-tight">{crop}</h2>
          <p className="font-sans text-xs uppercase tracking-widest text-[#4B5563] mt-2">Optimal Cultivar Recommendation</p>
        </div>
        <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-serif text-2xl">
          01
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6 mb-8 border-b-2 border-black pb-8">
        <div className="border-2 border-black p-5 flex flex-col justify-between hover:bg-black hover:text-white transition-colors group">
          <span className="font-sans text-[10px] uppercase tracking-widest mb-4 text-[#4B5563] group-hover:text-[#CCCCCC]">Confidence Score</span>
          <span className="font-serif text-5xl">{confidence}%</span>
        </div>
        <div className="border-2 border-black p-5 flex flex-col justify-between hover:bg-black hover:text-white transition-colors group">
          <span className="font-sans text-[10px] uppercase tracking-widest mb-4 text-[#4B5563] group-hover:text-[#CCCCCC]">Est. Yield Potential</span>
          <div className="flex items-baseline space-x-2">
            <span className="font-serif text-4xl">{yieldKg.toLocaleString()}</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#4B5563] group-hover:text-[#CCCCCC]">KG/HA</span>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <span className="font-sans text-[10px] uppercase tracking-widest block mb-3 text-[#4B5563]">Soil Profile Mapping</span>
        <div className="border-2 border-black p-4 bg-gray-50 flex items-center justify-between hover:bg-black hover:text-white transition-colors group">
           <span className="font-mono text-sm uppercase font-medium">CLUSTER_{clusterId}</span>
           <span className="font-sans text-sm tracking-wide">{clusterLabel}</span>
        </div>
      </div>

      <div className="flex-grow flex flex-col mt-auto">
        <div className="flex items-center justify-between mb-6">
          <span className="font-sans text-[10px] uppercase tracking-widest text-[#4B5563]">Computed Alternatives</span>
          <div className="w-16 h-px bg-black"></div>
        </div>
        <div className="h-40 w-full mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={top3} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis type="number" hide domain={[0, 100]} />
              <YAxis dataKey="crop" type="category" axisLine={false} tickLine={false} width={80} className="font-serif text-xs uppercase" />
              <Tooltip 
                cursor={{fill: '#F3F4F6'}} 
                contentStyle={{ 
                  borderRadius: '0px', 
                  border: '2px solid black', 
                  fontFamily: '"IBM Plex Sans", sans-serif', 
                  textTransform: 'uppercase', 
                  fontSize: '10px',
                  backgroundColor: 'white',
                  color: 'black'
                }} 
              />
              <Bar dataKey="probability" barSize={28}>
                {top3.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#000000' : index === 1 ? '#4B5563' : '#9CA3AF'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
