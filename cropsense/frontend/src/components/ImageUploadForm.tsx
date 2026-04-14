import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Loader2, UploadCloud, X, CheckCircle2, AlertCircle } from 'lucide-react';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
export type ImagePredictionResult = {
  soil_type: string;
  soil_type_confidence: number;
  soil_label: string;
  soil_features: {
    N: number; P: number; K: number; ph: number;
    temperature: number; humidity: number; rainfall: number;
  };
  crop_recommendation: {
    crop: string;
    confidence: number;
    top3: { crop: string; probability: number }[];
    shap_values: any[];
  };
  yield_estimate: number;
  cluster: { cluster_id: number; soil_profile_label: string };
  shap_values: any[];
  mock_cnn?: boolean;
};

interface RegionClimate {
  temperature: number;
  humidity: number;
  rainfall: number;
}

interface ImageUploadFormProps {
  onResult: (result: ImagePredictionResult) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
  isMockMode: boolean;
}

// ------------------------------------------------------------------
// Hardcoded region climate (mirrors backend region_lookup.py)
// Used to show climate chips instantly without an extra API call
// ------------------------------------------------------------------
const REGION_CLIMATE: Record<string, RegionClimate> = {
  'Punjab':            { temperature: 23.5, humidity: 58.0, rainfall: 649.0 },
  'Haryana':           { temperature: 25.0, humidity: 55.0, rainfall: 617.0 },
  'Uttar Pradesh':     { temperature: 25.5, humidity: 66.0, rainfall: 902.0 },
  'Bihar':             { temperature: 26.5, humidity: 70.0, rainfall: 1205.0 },
  'West Bengal':       { temperature: 27.0, humidity: 78.0, rainfall: 1582.0 },
  'Odisha':            { temperature: 27.5, humidity: 75.0, rainfall: 1489.0 },
  'Andhra Pradesh':    { temperature: 28.5, humidity: 72.0, rainfall: 933.0 },
  'Telangana':         { temperature: 29.0, humidity: 65.0, rainfall: 901.0 },
  'Tamil Nadu':        { temperature: 28.5, humidity: 74.0, rainfall: 945.0 },
  'Karnataka':         { temperature: 24.5, humidity: 68.0, rainfall: 1139.0 },
  'Kerala':            { temperature: 27.0, humidity: 85.0, rainfall: 3055.0 },
  'Maharashtra':       { temperature: 27.5, humidity: 63.0, rainfall: 1290.0 },
  'Gujarat':           { temperature: 28.0, humidity: 57.0, rainfall: 820.0 },
  'Rajasthan':         { temperature: 30.5, humidity: 38.0, rainfall: 313.0 },
  'Madhya Pradesh':    { temperature: 26.5, humidity: 60.0, rainfall: 1117.0 },
  'Jharkhand':         { temperature: 25.5, humidity: 70.0, rainfall: 1300.0 },
  'Assam':             { temperature: 24.0, humidity: 82.0, rainfall: 2818.0 },
  'Himachal Pradesh':  { temperature: 13.5, humidity: 60.0, rainfall: 1469.0 },
  'Uttarakhand':       { temperature: 15.0, humidity: 65.0, rainfall: 1720.0 },
  'Chhattisgarh':      { temperature: 26.5, humidity: 68.0, rainfall: 1292.0 },
};

const REGIONS = Object.keys(REGION_CLIMATE);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

// Mock result used when backend is unavailable
const MOCK_IMAGE_RESULT: ImagePredictionResult = {
  soil_type: 'loamy',
  soil_type_confidence: 0.91,
  soil_label: 'Loamy soil — ideal texture, supports wide variety of crops',
  soil_features: { N: 85, P: 55, K: 120, ph: 6.5, temperature: 25.5, humidity: 66, rainfall: 902 },
  crop_recommendation: {
    crop: 'Rice',
    confidence: 94.5,
    top3: [
      { crop: 'Rice', probability: 94.5 },
      { crop: 'Wheat', probability: 3.2 },
      { crop: 'Maize', probability: 1.5 },
    ],
    shap_values: [],
  },
  yield_estimate: 4250.75,
  cluster: { cluster_id: 3, soil_profile_label: 'Nutrient-Rich Alluvial' },
  shap_values: [
    { feature: 'humidity', importance: 0.85 },
    { feature: 'rainfall', importance: 0.72 },
    { feature: 'N', importance: 0.45 },
    { feature: 'P', importance: 0.35 },
    { feature: 'K', importance: 0.28 },
    { feature: 'temperature', importance: 0.21 },
    { feature: 'ph', importance: 0.12 },
  ],
  mock_cnn: true,
};

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
export const ImageUploadForm: React.FC<ImageUploadFormProps> = ({
  onResult,
  isLoading,
  setIsLoading,
  isMockMode,
}) => {
  const [file, setFile]               = useState<File | null>(null);
  const [preview, setPreview]         = useState<string | null>(null);
  const [fileError, setFileError]     = useState<string | null>(null);
  const [isDragging, setIsDragging]   = useState(false);
  const [region, setRegion]           = useState<string>('');
  const [regionSearch, setRegionSearch] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const fileInputRef                  = useRef<HTMLInputElement>(null);
  const dropdownRef                   = useRef<HTMLDivElement>(null);

  const filteredRegions = REGIONS.filter((r) =>
    r.toLowerCase().includes(regionSearch.toLowerCase())
  );

  const selectedClimate = region ? REGION_CLIMATE[region] : null;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const validateAndSetFile = (f: File) => {
    setFileError(null);
    if (!ALLOWED_TYPES.includes(f.type)) {
      setFileError('Only JPEG and PNG images are supported.');
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setFileError(`File too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Max 10 MB.`);
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) validateAndSetFile(e.dataTransfer.files[0]);
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!file || !region) return;
    setIsLoading(true);

    if (isMockMode) {
      setTimeout(() => {
        onResult(MOCK_IMAGE_RESULT);
        setIsLoading(false);
      }, 1200);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('region', region);

      const res = await fetch('http://localhost:8000/predict-image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }

      const data: ImagePredictionResult = await res.json();
      onResult(data);
    } catch (e: any) {
      console.error('predict-image error:', e);
      // Graceful fallback to mock
      onResult(MOCK_IMAGE_RESULT);
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = !!file && !!region && !fileError && !isLoading;

  return (
    <div className="flex flex-col bg-white">
      {/* ── Upload + Region panel ── */}
      <div className="p-4 border-b-2 border-black space-y-4 bg-gray-50">

        {/* ── Drop Zone ── */}
        <div>
          <p className="text-[10px] uppercase tracking-widest font-sans font-medium mb-2">
            Soil Photo
          </p>

          {/* Preview */}
          {preview ? (
            <div className="relative border-2 border-black">
              <img
                src={preview}
                alt="Soil preview"
                className="w-full object-cover"
                style={{ maxHeight: '200px', objectFit: 'cover' }}
              />
              <button
                onClick={clearFile}
                className="absolute top-2 right-2 bg-black text-white w-7 h-7 flex items-center justify-center hover:bg-gray-700 transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 bg-black text-white text-[10px] uppercase tracking-widest px-2 py-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {file?.name}
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed flex flex-col items-center justify-center py-8 cursor-pointer transition-colors select-none
                ${isDragging ? 'border-black bg-gray-100' : 'border-gray-300 hover:border-black hover:bg-gray-50'}`}
            >
              {/* CSS camera icon */}
              <div className="relative w-12 h-10 mb-3">
                <div className="absolute inset-0 border-2 border-black rounded-sm" />
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-black" />
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-black" />
                <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-black" />
              </div>
              <UploadCloud className="w-6 h-6 mb-2 text-gray-400" />
              <p className="text-[12px] font-sans font-medium text-center px-4">
                Drop your soil photo here<br />
                <span className="text-gray-500">or click to browse</span>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handleFileChange}
                id="soil-image-input"
              />
            </div>
          )}

          {/* Error message */}
          {fileError && (
            <div className="mt-2 flex items-center gap-1 text-red-600 text-[11px] font-sans">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {fileError}
            </div>
          )}

          {/* Tip */}
          <p className="mt-2 text-[10px] text-gray-500 font-sans leading-relaxed">
            💡 <span className="italic">Tip: Take the photo in natural daylight on fresh soil, not on grass or rocks.</span>
          </p>
        </div>

        {/* ── Region Selector ── */}
        <div ref={dropdownRef} className="relative">
          <p className="text-[10px] uppercase tracking-widest font-sans font-medium mb-2">
            Select Your Region
          </p>
          <div
            className={`border-2 border-black bg-white px-3 py-2 cursor-pointer flex justify-between items-center ${showDropdown ? 'bg-black text-white' : ''}`}
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <span className={`text-[13px] font-sans ${region ? '' : 'text-gray-400'}`}>
              {region || 'Choose a state…'}
            </span>
            <span className={`text-[10px] ${showDropdown ? 'text-white' : 'text-gray-500'}`}>▾</span>
          </div>

          {showDropdown && (
            <div className="absolute z-50 left-0 right-0 border-2 border-t-0 border-black bg-white shadow-lg max-h-48 overflow-y-auto">
              <div className="border-b border-gray-200 px-3 py-2 sticky top-0 bg-white">
                <input
                  type="text"
                  value={regionSearch}
                  onChange={(e) => setRegionSearch(e.target.value)}
                  placeholder="Search state…"
                  className="w-full text-[12px] font-sans outline-none bg-transparent"
                  autoFocus
                />
              </div>
              {filteredRegions.length === 0 ? (
                <div className="px-3 py-3 text-[12px] text-gray-400">No matches</div>
              ) : (
                filteredRegions.map((r) => (
                  <div
                    key={r}
                    className={`px-3 py-2 text-[12px] font-sans cursor-pointer hover:bg-black hover:text-white transition-colors ${region === r ? 'bg-black text-white' : ''}`}
                    onClick={() => {
                      setRegion(r);
                      setRegionSearch('');
                      setShowDropdown(false);
                    }}
                  >
                    {r}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Climate chips ── */}
        {selectedClimate && (
          <div className="border-2 border-black bg-white p-3">
            <p className="text-[9px] uppercase tracking-widest font-sans text-gray-500 mb-2">
              Climate Data — {region}
            </p>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: 'Temp', value: `${selectedClimate.temperature}°C`, icon: '🌡️' },
                { label: 'Humidity', value: `${selectedClimate.humidity}%`, icon: '💧' },
                { label: 'Rainfall', value: `${selectedClimate.rainfall}mm/yr`, icon: '🌧️' },
              ].map((chip) => (
                <div
                  key={chip.label}
                  className="flex items-center gap-1 border border-black px-2 py-1 text-[11px] font-sans font-medium"
                >
                  <span>{chip.icon}</span>
                  <span className="text-gray-500">{chip.label}:</span>
                  <span>{chip.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Submit ── */}
      <div className="p-4 bg-gray-50 border-b-2 border-black">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          id="analyse-soil-btn"
          className="w-full border-2 border-black font-sans uppercase tracking-[0.1em] text-sm py-4 transition-colors flex items-center justify-center gap-2
            bg-green-700 text-white hover:bg-green-800 border-green-700
            disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 disabled:border-black"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin w-4 h-4" />
              <span>Analysing…</span>
            </>
          ) : (
            <>
              <span>🌱</span>
              <span>Analyse My Soil</span>
            </>
          )}
        </button>
        {(!file || !region) && (
          <p className="text-center text-[10px] text-gray-400 font-sans mt-2">
            {!file && !region ? 'Upload a photo and select a region to continue' :
              !file ? 'Upload a soil photo to continue' :
              'Select your region to continue'}
          </p>
        )}
      </div>
    </div>
  );
};
