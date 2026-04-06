import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export interface ModelStat {
  Model: string;
  Accuracy: number;
  Precision: number;
  Recall: number;
  F1: number;
}

interface StatsPanelProps {
  modelStats: ModelStat[];
  datasetStats: { total_samples: number; num_features: number; num_crops: number; };
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ modelStats, datasetStats }) => {
  const sortedStats = [...modelStats].sort((a, b) => b.Accuracy - a.Accuracy);
  return (
    <div className="space-y-8 flex-1 flex flex-col pb-12">
      {/* Top Meta Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        {[
          { label: 'Corpus Volume', val: datasetStats.total_samples, unit: 'SAMPLES' },
          { label: 'Taxonomy', val: datasetStats.num_crops, unit: 'CLASSES' },
          { label: 'Vectors', val: datasetStats.num_features, unit: 'DIMENSIONS' }
        ].map((item, idx) => (
          <div key={idx} className="border-2 border-black p-6 bg-white hover:bg-black hover:text-white transition-colors group flex flex-col justify-between">
            <span className="font-sans text-[10px] uppercase tracking-widest text-[#4B5563] group-hover:text-[#CCCCCC] mb-4">{item.label}</span>
            <div className="flex items-baseline space-x-2">
               <span className="font-serif text-5xl">{item.val}</span>
               <span className="font-mono text-[10px] uppercase tracking-widest">{item.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-[400px]">
        {/* Table */}
        <div className="border-2 border-black flex flex-col h-full bg-white transition-all overflow-hidden relative">
          <div className="border-b-2 border-black p-6 bg-white shrink-0">
             <h3 className="font-serif text-3xl uppercase tracking-widest">Model Index</h3>
             <p className="font-sans text-[10px] uppercase tracking-widest text-[#4B5563] mt-2">Classification Metrics</p>
          </div>
          <div className="overflow-x-auto overflow-y-auto flex-1 bg-white">
            <table className="w-full text-sm text-left font-sans">
              <thead className="text-[10px] uppercase tracking-widest border-b-2 border-black bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-4 border-r-2 border-black">Identifier</th>
                  <th className="px-6 py-4 text-right border-r-2 border-black">Accuracy</th>
                  <th className="px-6 py-4 text-right">F1 Score</th>
                </tr>
              </thead>
              <tbody>
                {sortedStats.map((stat, idx) => (
                  <tr key={stat.Model} className="border-b-2 border-black last:border-0 hover:bg-black hover:text-white transition-colors group cursor-default">
                    <td className="px-6 py-4 font-mono font-medium uppercase border-r-2 border-black group-hover:border-white whitespace-nowrap">
                      {idx === 0 ? `[★] ${stat.Model}` : stat.Model}
                    </td>
                    <td className="px-6 py-4 text-right border-r-2 border-black group-hover:border-white font-serif text-lg">{(stat.Accuracy * 100).toFixed(2)}%</td>
                    <td className="px-6 py-4 text-right font-serif text-lg text-gray-500 group-hover:text-gray-400">{(stat.F1 * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Line Chart */}
        <div className="border-2 border-black flex flex-col h-full bg-white transition-all">
          <div className="border-b-2 border-black p-6 shrink-0">
            <h3 className="font-serif text-3xl uppercase tracking-widest">Efficacy Plot</h3>
             <p className="font-sans text-[10px] uppercase tracking-widest text-[#4B5563] mt-2">Accuracy Progression</p>
          </div>
          <div className="flex-1 w-full bg-white p-6 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={modelStats} margin={{ top: 10, right: 10, left: -20, bottom: 35 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="Model" angle={-45} textAnchor="end" tick={{fontSize: 9, fontFamily: '"IBM Plex Sans", sans-serif'}} axisLine={{stroke: '#000', strokeWidth: 2}} tickLine={{stroke: '#000', strokeWidth: 2}} />
                <YAxis domain={[0.8, 1]} tick={{fontSize: 10, fontFamily: '"IBM Plex Sans", sans-serif'}} axisLine={{stroke: '#000', strokeWidth: 2}} tickLine={{stroke: '#000', strokeWidth: 2}} tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} />
                <Tooltip formatter={(value: any) => [`${(value * 100).toFixed(2)}%`, 'Accuracy']} contentStyle={{ borderRadius: '0', border: '2px solid black', fontFamily: '"IBM Plex Sans", sans-serif', textTransform: 'uppercase', fontSize: '10px' }} />
                <Line type="linear" dataKey="Accuracy" stroke="#000000" strokeWidth={2} dot={{ r: 4, fill: '#FFFFFF', strokeWidth: 2, stroke: '#000000' }} activeDot={{ r: 6, fill: '#000000', stroke: '#000000' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
