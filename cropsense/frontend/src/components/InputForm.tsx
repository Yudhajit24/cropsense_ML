import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

export type SoilData = {
  N: number;
  P: number;
  K: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
};

interface InputFormProps {
  onSubmit: (data: SoilData) => void;
  isLoading: boolean;
}

const PRESETS = {
  Rice: { N: 80, P: 48, K: 40, temperature: 24, humidity: 82, ph: 6.5, rainfall: 230 },
  Maize: { N: 78, P: 48, K: 20, temperature: 22, humidity: 65, ph: 6.2, rainfall: 88 },
  Chickpea: { N: 40, P: 68, K: 80, temperature: 18, humidity: 17, ph: 7.0, rainfall: 80 },
  Cotton: { N: 118, P: 46, K: 20, temperature: 24, humidity: 80, ph: 7.0, rainfall: 85 },
  Coffee: { N: 101, P: 28, K: 30, temperature: 25, humidity: 58, ph: 6.8, rainfall: 160 },
  Mango: { N: 20, P: 18, K: 30, temperature: 32, humidity: 50, ph: 5.8, rainfall: 95 },
};

const RANGES = [
  { key: 'N', label: 'Nitrogen (N)', min: 0, max: 140, unit: 'mg/kg' },
  { key: 'P', label: 'Phosphorus (P)', min: 5, max: 145, unit: 'mg/kg' },
  { key: 'K', label: 'Potassium (K)', min: 5, max: 205, unit: 'mg/kg' },
  { key: 'temperature', label: 'Temperature', min: 8, max: 44, unit: '°C' },
  { key: 'humidity', label: 'Humidity', min: 14, max: 100, unit: '%' },
  { key: 'ph', label: 'pH Level', min: 3.5, max: 10, unit: 'pH' },
  { key: 'rainfall', label: 'Rainfall', min: 20, max: 300, unit: 'mm' },
];

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [data, setData] = useState<SoilData>({
    N: 50, P: 50, K: 50, temperature: 25, humidity: 60, ph: 6.5, rainfall: 100
  });

  const handleChange = (key: keyof SoilData, value: number) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const loadPreset = (preset: keyof typeof PRESETS) => {
    setData(PRESETS[preset]);
  };

  return (
    <div className="flex flex-col bg-white">
      {/* Presets Grid */}
      <div className="p-4 border-b-2 border-black bg-gray-50">
        <p className="text-[10px] uppercase tracking-widest font-sans font-medium mb-3">Load Configuration Profile</p>
        <div className="flex gap-2">
          {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((preset) => (
            <button
              key={preset}
              onClick={() => loadPreset(preset)}
              className="flex-1 border-2 border-black px-2 py-2 text-[11px] font-sans font-medium uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Input List */}
      <div className="flex flex-col">
        {RANGES.map((range, index) => (
          <div key={range.key} className="border-b-2 border-black p-4 transition-colors group hover:bg-black hover:text-white flex flex-col space-y-4">
            
            <div className="flex items-center space-x-4">
              <div className="w-[28px] h-[28px] bg-black text-white font-serif flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-black">
                {index + 1 < 10 ? `0${index + 1}` : index + 1}
              </div>
              <div className="flex-1 flex justify-between items-center">
                <div>
                  <h3 className="font-sans font-medium text-[14px]">{range.label}</h3>
                  <p className="font-sans font-light text-[12px] text-[#4B5563] group-hover:text-[#CCCCCC]">
                    Adjust telemetry value
                  </p>
                </div>
                <div className="font-sans font-medium text-lg">
                  {data[range.key as keyof SoilData].toFixed(range.key === 'ph' ? 1 : 0)}
                </div>
              </div>
            </div>
            
            <div className="relative pt-1">
              <input
                type="range"
                min={range.min}
                max={range.max}
                step={range.key === 'ph' ? 0.1 : 1}
                value={data[range.key as keyof SoilData]}
                onChange={(e) => handleChange(range.key as keyof SoilData, parseFloat(e.target.value))}
                className="w-full relative z-10 h-1.5 focus:outline-none"
              />
            </div>

            <div className="flex space-x-2">
              <span className="text-[10px] uppercase tracking-widest border border-black px-1.5 py-0.5 group-hover:border-white font-mono">
                UNIT: {range.unit}
              </span>
              <span className="text-[10px] uppercase tracking-widest border border-black px-1.5 py-0.5 group-hover:border-white font-mono">
                SYS_VAR: {range.key}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Action */}
      <div className="p-4 bg-gray-50 border-b-2 border-black">
        <button
          onClick={() => onSubmit(data)}
          disabled={isLoading}
          className="w-full border-2 border-black bg-white text-black font-sans uppercase tracking-[0.1em] text-sm py-4 hover:bg-black hover:text-white transition-colors flex items-center justify-center disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="animate-spin w-4 h-4" />
              <span>COMPUTING...</span>
            </div>
          ) : (
             "EXECUTE PREDICTION"
          )}
        </button>
      </div>

    </div>
  );
};
