import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface ClusterVizProps {
  currentPoint?: { n: number; k: number; clusterId: number };
}

const generateClusterBackground = () => {
  const points: { x: number; y: number; cluster: number }[] = [];
  const centroids = [
    { n: 20, k: 30, c: 0 }, { n: 100, k: 50, c: 1 }, { n: 40, k: 120, c: 2 },
    { n: 120, k: 180, c: 3 }, { n: 10, k: 10, c: 4 },
  ];
  centroids.forEach(cent => {
    for(let i=0; i<30; i++) {
        points.push({
            x: Math.max(0, cent.n + (Math.random() - 0.5) * 40),
            y: Math.max(0, cent.k + (Math.random() - 0.5) * 60),
            cluster: cent.c
        });
    }
  });
  return points;
};

const CLUSTER_COLORS = ['#E5E7EB', '#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563'];

export const ClusterViz: React.FC<ClusterVizProps> = ({ currentPoint }) => {
  const bgData = useMemo(() => generateClusterBackground(), []);

  return (
    <div className="bg-white border-2 border-black p-8 transition-all">
      <div className="border-b-2 border-black pb-4 mb-8">
        <h3 className="font-serif text-3xl uppercase tracking-widest">Soil Profile Vector Map</h3>
        <p className="font-sans text-[10px] uppercase tracking-widest text-[#4B5563] mt-2">Nitrogen vs Potassium Distibution</p>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
            <XAxis type="number" dataKey="x" name="N" domain={[0, 150]} tick={{fontSize: 10, fontFamily: '"IBM Plex Sans", sans-serif'}} axisLine={{ stroke: '#000', strokeWidth: 2 }} tickLine={{ stroke: '#000', strokeWidth: 2 }} />
            <YAxis type="number" dataKey="y" name="K" domain={[0, 220]} tick={{fontSize: 10, fontFamily: '"IBM Plex Sans", sans-serif'}} axisLine={{ stroke: '#000', strokeWidth: 2 }} tickLine={{ stroke: '#000', strokeWidth: 2 }} />
            <ZAxis type="number" range={[20, 20]} />
            <Tooltip 
              cursor={{strokeDasharray: '3 3'}}
              contentStyle={{ borderRadius: '0', border: '2px solid black', fontFamily: '"IBM Plex Sans", sans-serif', textTransform: 'uppercase', fontSize: '10px' }}
            />
            
            {[0, 1, 2, 3, 4].map((cId) => (
              <Scatter key={`cluster-${cId}`} name={`C.${cId}`} data={bgData.filter(d => d.cluster === cId)} fill={CLUSTER_COLORS[cId]} opacity={1} />
            ))}

            {currentPoint && (
              <Scatter name="Analysis" data={[{ x: currentPoint.n, y: currentPoint.k }]} fill="#000000" shape="square">
                <Cell fill="#000000" />
              </Scatter>
            )}
            <Legend wrapperStyle={{ fontSize: '10px', fontFamily: '"IBM Plex Sans", sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '10px' }} iconType="square" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
