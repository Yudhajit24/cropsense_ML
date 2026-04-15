import { useState, useEffect } from 'react';
import { Activity, MessageSquare, Sprout, Sparkles, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { ImageUploadForm, type ImagePredictionResult } from './components/ImageUploadForm';
import { SoilResultCard } from './components/SoilResultCard';
import { ResultCard } from './components/ResultCard';
import { FeatureImportance } from './components/FeatureImportance';
import { ClusterViz } from './components/ClusterViz';
import { StatsPanel, type ModelStat } from './components/StatsPanel';
import { Chatbot } from './components/Chatbot';

// Mock stats for analytics (offline fallback)
// ------------------------------------------------------------------
const MOCK_STATS = {
  dataset: { total_samples: 2200, num_features: 7, num_crops: 22 },
  models: [
    { Model: 'Voting Ensemble', Accuracy: 0.993, Precision: 0.993, Recall: 0.994, F1: 0.993 },
    { Model: 'Random Forest',   Accuracy: 0.991, Precision: 0.992, Recall: 0.991, F1: 0.991 },
    { Model: 'XGBoost',         Accuracy: 0.988, Precision: 0.988, Recall: 0.989, F1: 0.988 },
    { Model: 'Naive Bayes',     Accuracy: 0.985, Precision: 0.987, Recall: 0.986, F1: 0.985 },
    { Model: 'SVM',             Accuracy: 0.978, Precision: 0.980, Recall: 0.978, F1: 0.979 },
    { Model: 'Decision Tree',   Accuracy: 0.954, Precision: 0.955, Recall: 0.954, F1: 0.954 },
    { Model: 'KNN',             Accuracy: 0.941, Precision: 0.943, Recall: 0.941, F1: 0.942 },
  ],
};

// Static plausible confusion matrix for CNN (8×8)
// Rows = true class, columns = predicted class
// Classes: alluvial, black, clay, red, sandy, loamy, laterite, chalky
const CNN_CLASSES = ['Alluvial', 'Black', 'Clay', 'Red', 'Sandy', 'Loamy', 'Laterite', 'Chalky'];
const CNN_CONFUSION_MATRIX = [
  [52, 1,  0,  0,  0,  2,  0,  0],
  [1,  49, 2,  0,  0,  1,  0,  1],
  [0,  1,  51, 1,  0,  1,  0,  0],
  [0,  0,  1,  48, 2,  0,  1,  0],
  [0,  0,  0,  2,  50, 0,  1,  0],
  [2,  0,  1,  0,  0,  53, 0,  0],
  [0,  0,  0,  1,  1,  0,  47, 1],
  [0,  1,  0,  0,  0,  0,  1,  49],
];

// Heat colour for confusion matrix cell (0–1 intensity)
function cmColor(value: number, rowMax: number): string {
  if (rowMax === 0) return 'bg-white';
  const ratio = value / rowMax;
  if (ratio > 0.8) return 'bg-green-700 text-white';
  if (ratio > 0.5) return 'bg-green-400 text-white';
  if (ratio > 0.2) return 'bg-green-200 text-green-900';
  if (ratio > 0)   return 'bg-green-50 text-green-800';
  return 'bg-white text-gray-300';
}

// ------------------------------------------------------------------
// APP
// ------------------------------------------------------------------
function App() {
  const [activeTab, setActiveTab] = useState<'recommend' | 'analytics' | 'assistant'>('recommend');
  const [isLoading, setIsLoading]     = useState(false);
  const [isMockMode, setIsMockMode]   = useState(false);

  // Prediction state
  const [prediction, setPrediction] = useState<ImagePredictionResult | null>(null);

  // Analytics state
  const [stats, setStats]             = useState<any>(null);
  const [modelCompare, setModelCompare] = useState<ModelStat[]>([]);

  // Initial analytics fetch
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [statsRes, modelsRes] = await Promise.all([
          axios.get('http://localhost:8000/stats'),
          axios.get('http://localhost:8000/model-comparison'),
        ]);
        if (statsRes.data.error || modelsRes.data.error) throw new Error('Models not loaded');
        setStats({
          total_samples: statsRes.data.total_samples,
          num_features:  statsRes.data.num_features,
          num_crops:     statsRes.data.num_crops,
        });
        setModelCompare(modelsRes.data);
        setIsMockMode(false);
      } catch {
        setIsMockMode(true);
        setStats(MOCK_STATS.dataset);
        setModelCompare(MOCK_STATS.models);
      }
    };
    fetchAnalytics();
  }, []);

  const handleResult = (result: ImagePredictionResult) => {
    setPrediction(result);
  };

  // Derive props for child components from prediction
  const soilFeatures = prediction?.soil_features;
  const shapData     = prediction?.shap_values ?? [];

  return (
    <div className="h-screen w-full flex flex-col bg-white overflow-hidden text-black antialiased font-sans">

      {/* ── TOP TOOLBAR ── */}
      <header className="h-[76px] bg-white border-b-2 border-black flex items-center justify-between px-6 shrink-0 z-10 box-border" role="banner">
        {/* Left */}
        <nav className="flex items-center space-x-2" role="tablist" aria-label="Main navigation">
          <button
            onClick={() => setActiveTab('recommend')}
            className={`w-[44px] h-[44px] border-2 border-black flex items-center justify-center transition-colors ${activeTab === 'recommend' ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}
            title="Crop Recommendation"
            role="tab"
            aria-selected={activeTab === 'recommend'}
            aria-controls="panel-recommend"
            id="tab-recommend"
            tabIndex={0}
          >
            <Sprout className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-[44px] h-[44px] border-2 border-black flex items-center justify-center transition-colors ${activeTab === 'analytics' ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}
            title="Analytics"
            role="tab"
            aria-selected={activeTab === 'analytics'}
            aria-controls="panel-analytics"
            id="tab-analytics"
            tabIndex={0}
          >
            <Activity className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab('assistant')}
            className={`w-[44px] h-[44px] border-2 border-black flex items-center justify-center transition-colors ${activeTab === 'assistant' ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}
            title="AI Assistant"
            role="tab"
            aria-selected={activeTab === 'assistant'}
            aria-controls="panel-assistant"
            id="tab-assistant"
            tabIndex={0}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <div className="h-[32px] w-px bg-black mx-4" aria-hidden="true" />
          {isMockMode && (
            <span className="text-xs uppercase tracking-widest font-serif border-2 border-black px-2 py-1" role="status">Mode: MOCK</span>
          )}
        </nav>

        {/* Middle */}
        <button className="h-[44px] bg-black text-white px-6 font-sans font-medium text-sm flex items-center space-x-2 hover:bg-white hover:text-black border-2 border-black transition-colors uppercase tracking-widest">
          <Sparkles className="w-4 h-4" />
          <span>CropSense v2</span>
        </button>

        {/* Right */}
        <div className="flex items-center space-x-2">
          <button className="h-[44px] px-5 bg-white border-2 border-black text-black font-sans text-sm font-medium hover:bg-black hover:text-white uppercase transition-colors">
            Share
          </button>
          <button className="h-[44px] px-4 bg-white border-2 border-black text-black font-sans text-sm font-medium hover:bg-black hover:text-white uppercase transition-colors flex items-center space-x-2">
            <span>Export</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 bg-white relative flex flex-col overflow-y-auto overflow-x-hidden" role="main" aria-label="Dashboard content">
          <div className="w-full h-full relative flex flex-col">

            {/* ── RECOMMEND TAB ── */}
            {activeTab === 'recommend' && (
              <div className="p-8 h-full flex flex-col">
                <header className="border-b border-gray-200 pb-4 mb-8">
                  <h1 className="font-serif text-3xl font-semibold mb-1">Canvas View: Soil-to-Crop Intelligence</h1>
                  <p className="font-sans text-gray-500 font-light">
                    CNN soil classification → agronomic lookup → ensemble crop recommendation
                  </p>
                </header>

                {/* Awaiting state */}
                {!prediction && !isLoading && (
                  <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 gap-4">
                    <div className="text-5xl select-none">🌱</div>
                    <div className="text-center">
                      <span className="font-serif text-gray-400 text-lg block">Awaiting Soil Photo</span>
                      <span className="font-sans text-gray-400 text-sm">Upload an image and select your region in the sidebar</span>
                    </div>
                  </div>
                )}

                {/* Loading state */}
                {isLoading && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span className="font-sans text-gray-500 text-sm uppercase tracking-widest">Analysing soil image…</span>
                  </div>
                )}

                {/* Results */}
                {prediction && !isLoading && (
                  <div className="flex-1 overflow-y-auto space-y-6">
                    {/* Soil result card — prominent at top */}
                    <SoilResultCard
                      soilType={prediction.soil_type}
                      confidence={prediction.soil_type_confidence}
                      soilLabel={prediction.soil_label}
                      soilFeatures={prediction.soil_features}
                      mockCnn={prediction.mock_cnn}
                    />

                    {/* Ensemble output */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <ResultCard
                        crop={prediction.crop_recommendation.crop}
                        confidence={prediction.crop_recommendation.confidence}
                        top3={prediction.crop_recommendation.top3}
                        clusterId={prediction.cluster.cluster_id}
                        clusterLabel={prediction.cluster.soil_profile_label}
                        yieldKg={prediction.yield_estimate}
                      />
                      <FeatureImportance data={shapData} />
                    </div>

                    <div className="border-t-2 border-black pt-8">
                      <ClusterViz
                        currentPoint={
                          soilFeatures
                            ? { n: soilFeatures.N, k: soilFeatures.K, clusterId: prediction.cluster.cluster_id }
                            : undefined
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ANALYTICS TAB ── */}
            {activeTab === 'analytics' && (
              <div className="p-8 flex-1 flex flex-col">
                <header className="border-b border-gray-200 pb-4 mb-8">
                  <h1 className="font-serif text-3xl font-semibold mb-1">Telemetry Dashboard</h1>
                  <p className="font-sans text-gray-500 font-light">
                    Global model metrics, CNN performance, and dataset distribution bounds.
                  </p>
                </header>

                <div className="space-y-10">
                  <StatsPanel datasetStats={stats} modelStats={modelCompare} />

                  {/* ── CNN Performance Card ── */}
                  <div className="border-2 border-black">
                    <div className="border-b-2 border-black p-6 bg-amber-50">
                      <h3 className="font-serif text-2xl uppercase tracking-widest text-amber-900">CNN Performance</h3>
                      <p className="font-sans text-[10px] uppercase tracking-widest text-amber-600 mt-1">
                        Custom 4-block CNN — trained from scratch (no pretrained weights) · CSE3231 Session 10
                      </p>
                    </div>

                    {/* CNN meta stats */}
                    <div className="grid grid-cols-3 border-b-2 border-black">
                      {[
                        { label: 'Test Accuracy',    value: '~87%',  sub: 'On held-out val set' },
                        { label: 'Training Images',  value: '4,600+', sub: 'Kaggle soil dataset' },
                        { label: 'Soil Classes',     value: '8',     sub: 'CNN output classes' },
                      ].map((item, i) => (
                        <div key={i} className={`p-6 flex flex-col gap-2 ${i < 2 ? 'border-r-2 border-black' : ''} hover:bg-black hover:text-white transition-colors group`}>
                          <span className="font-sans text-[10px] uppercase tracking-widest text-gray-500 group-hover:text-gray-400">{item.label}</span>
                          <span className="font-serif text-4xl">{item.value}</span>
                          <span className="font-sans text-[10px] text-gray-400 group-hover:text-gray-300">{item.sub}</span>
                        </div>
                      ))}
                    </div>

                    {/* CNN architecture summary */}
                    <div className="p-6 grid grid-cols-4 gap-3 border-b-2 border-black">
                      {[
                        { block: 'Block 1', desc: 'Conv2D(32) → BN → ReLU → MaxPool' },
                        { block: 'Block 2', desc: 'Conv2D(64) → BN → ReLU → MaxPool' },
                        { block: 'Block 3', desc: 'Conv2D(128) → BN → ReLU → MaxPool' },
                        { block: 'Block 4', desc: 'Conv2D(256) → BN → ReLU → GlobalAvgPool' },
                      ].map((b) => (
                        <div key={b.block} className="border border-black p-3 text-center hover:bg-black hover:text-white transition-colors group">
                          <p className="font-mono text-[10px] uppercase tracking-widest font-bold">{b.block}</p>
                          <p className="font-mono text-[9px] mt-1 text-gray-500 group-hover:text-gray-300 leading-relaxed">{b.desc}</p>
                        </div>
                      ))}
                    </div>

                    {/* ── Confusion Matrix ── */}
                    <div className="p-6">
                      <p className="font-sans text-[10px] uppercase tracking-widest text-gray-500 mb-4">
                        Confusion Matrix — 8 Soil Classes (static demo; run train_cnn.py for live results)
                      </p>
                      <div className="overflow-x-auto">
                        <table className="text-[10px] font-mono border-collapse">
                          <thead>
                            <tr>
                              <th className="w-20 text-right pr-2 text-gray-400 font-light">True ↓ / Pred →</th>
                              {CNN_CLASSES.map((c) => (
                                <th key={c} className="w-14 text-center pb-1 font-normal uppercase text-gray-500 border-b border-gray-300">{c}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {CNN_CONFUSION_MATRIX.map((row, ri) => {
                              const rowMax = Math.max(...row);
                              return (
                                <tr key={ri}>
                                  <td className="text-right pr-2 text-gray-500 uppercase py-0.5">{CNN_CLASSES[ri]}</td>
                                  {row.map((val, ci) => (
                                    <td key={ci} className={`w-14 h-8 text-center font-mono font-medium text-[11px] border border-gray-100 transition-colors ${cmColor(val, rowMax)}`}>
                                      {val > 0 ? val : ''}
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-[9px] text-gray-400 mt-2">Darker green = more predictions in that cell. Diagonal = correct classifications.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── ASSISTANT TAB ── */}
            {activeTab === 'assistant' && (
              <div className="flex-1 flex flex-col">
                <Chatbot />
              </div>
            )}
          </div>

          {/* Contextual hint bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white border-2 border-black px-6 py-3 flex items-center space-x-2 shadow-none pointer-events-none z-20">
            <span className="text-[12px] uppercase tracking-wider font-sans font-medium">Press</span>
            <kbd className="font-mono text-[12px] border border-black px-1">CMD</kbd>
            <span className="text-[12px] uppercase tracking-wider font-sans font-medium">+</span>
            <kbd className="font-mono text-[12px] border border-black px-1">K</kbd>
            <span className="text-[12px] uppercase tracking-wider font-sans font-medium text-gray-500">to search layers</span>
          </div>
        </main>

        {/* ── RIGHT SIDEBAR ── */}
        {activeTab === 'recommend' && (
          <aside className="w-[384px] bg-white border-l-2 border-black flex flex-col shrink-0 h-full overflow-hidden">
            <header className="h-[76px] border-b-2 border-black px-6 flex items-center justify-between shrink-0 box-border">
              <h2 className="font-serif text-lg font-semibold flex items-center gap-2">
                Soil Analysis
                <span className="text-gray-400 font-light text-sm font-sans">(CNN + lookup)</span>
              </h2>
              <div className="flex space-x-1">
                <div className="w-3 h-3 border border-black" />
                <div className="w-3 h-3 bg-gray-300" />
                <div className="w-3 h-3 bg-black" />
              </div>
            </header>

            <div className="flex-1 overflow-y-auto bg-gray-50">
              <ImageUploadForm
                onResult={handleResult}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                isMockMode={isMockMode}
              />
            </div>
          </aside>
        )}

      </div>
    </div>
  );
}

export default App;
