import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface SoilFeatures {
  N: number;
  P: number;
  K: number;
  ph: number;
  temperature: number;
  humidity: number;
  rainfall: number;
}

interface SoilResultCardProps {
  soilType: string;
  confidence: number;       // 0–1 float
  soilLabel: string;
  soilFeatures: SoilFeatures;
  mockCnn?: boolean;
}

const ConfidencePill: React.FC<{ confidence: number }> = ({ confidence }) => {
  const pct = Math.round(confidence * 100);
  if (pct >= 80) {
    return (
      <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 border border-green-300 px-2 py-0.5 text-xs font-mono font-medium rounded-full">
        <CheckCircle2 className="w-3 h-3" />
        {pct}% confidence
      </span>
    );
  }
  if (pct >= 60) {
    return (
      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 text-xs font-mono font-medium rounded-full">
        <AlertTriangle className="w-3 h-3" />
        {pct}% confidence
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 border border-red-300 px-2 py-0.5 text-xs font-mono font-medium rounded-full">
      <XCircle className="w-3 h-3" />
      {pct}% confidence
    </span>
  );
};

const NpkChip: React.FC<{ label: string; value: number; unit?: string }> = ({ label, value, unit = 'mg/kg' }) => (
  <div className="flex flex-col items-center justify-center border border-amber-300 bg-amber-50 px-3 py-2 min-w-[60px]">
    <span className="text-[9px] uppercase tracking-widest text-amber-600 font-sans">{label}</span>
    <span className="text-lg font-serif font-semibold text-amber-900">{value.toFixed(0)}</span>
    <span className="text-[9px] text-amber-500 font-mono">{unit}</span>
  </div>
);

export const SoilResultCard: React.FC<SoilResultCardProps> = ({
  soilType,
  confidence,
  soilLabel,
  soilFeatures,
  mockCnn = false,
}) => {
  const displayName = soilType.charAt(0).toUpperCase() + soilType.slice(1);

  return (
    <div className="border-2 border-amber-800 bg-amber-50 p-6 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] uppercase tracking-widest text-amber-600 font-sans">
              CNN Soil Classification
            </span>
            {mockCnn && (
              <span className="text-[9px] uppercase tracking-widest bg-amber-200 text-amber-800 px-1.5 py-0.5 border border-amber-400 font-mono">
                MOCK
              </span>
            )}
          </div>
          <h2 className="font-serif text-2xl font-bold text-amber-900 mt-1">
            {displayName} Soil
          </h2>
          <div className="mt-1.5">
            <ConfidencePill confidence={confidence} />
          </div>
        </div>

        {/* Soil icon */}
        <div className="shrink-0 w-12 h-12 bg-amber-800 flex items-center justify-center text-amber-100 text-2xl select-none">
          🪨
        </div>
      </div>

      {/* Description */}
      <p className="text-sm font-sans text-amber-800 bg-white border border-amber-200 px-4 py-2 leading-relaxed">
        {soilLabel}
      </p>

      {/* NPK chips */}
      <div>
        <p className="text-[9px] uppercase tracking-widest text-amber-600 font-sans mb-2">
          Inferred Soil Nutrients
        </p>
        <div className="flex gap-2 flex-wrap">
          <NpkChip label="Nitrogen (N)" value={soilFeatures.N} />
          <NpkChip label="Phosphorus (P)" value={soilFeatures.P} />
          <NpkChip label="Potassium (K)" value={soilFeatures.K} />
          <NpkChip label="pH" value={soilFeatures.ph} unit="pH" />
        </div>
        <p className="text-[9px] text-amber-500 font-sans mt-1.5 italic">
          Values are midpoints of agronomic ranges for this soil type (deterministic lookup).
        </p>
      </div>

      {/* Divider hint */}
      <div className="border-t border-amber-300 pt-2">
        <p className="text-[9px] uppercase tracking-widest text-amber-600 font-sans">
          ↓ Crop recommendation from these values below
        </p>
      </div>
    </div>
  );
};
