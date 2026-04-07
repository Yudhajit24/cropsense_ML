import { useState, useEffect } from 'react';
import { Activity, MessageSquare, Sprout, Sparkles, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { InputForm, type SoilData } from './components/InputForm';
import { ResultCard } from './components/ResultCard';
import { FeatureImportance } from './components/FeatureImportance';
import { ClusterViz } from './components/ClusterViz';
import { StatsPanel, type ModelStat } from './components/StatsPanel';
import { Chatbot } from './components/Chatbot';

// --- MOCK DATA ---
const MOCK_PREDICTION = {
  crop_recommendation: {
    crop: "Rice",
    confidence: 94.5,
    top3: [
      { crop: "Rice", probability: 94.5 },
      { crop: "Jute", probability: 3.2 },
      { crop: "Papaya", probability: 1.5 }
    ]
  },
  estimated_yield_kg_ha: 4250.75,
  soil_cluster: {
    cluster_id: 1,
    soil_profile_label: "Tropical High-Humidity"
  }
};

const MOCK_SHAP = [
  { feature: "humidity", importance: 0.85 },
  { feature: "rainfall", importance: 0.72 },
  { feature: "N", importance: 0.45 },
  { feature: "P", importance: 0.35 },
  { feature: "K", importance: 0.28 },
  { feature: "temperature", importance: 0.21 },
  { feature: "ph", importance: 0.12 }
];

const MOCK_STATS = {
  dataset: { total_samples: 2200, num_features: 7, num_crops: 22 },
  models: [
    { Model: 'Voting Ensemble', Accuracy: 0.993, Precision: 0.993, Recall: 0.994, F1: 0.993 },
    { Model: 'Random Forest', Accuracy: 0.991, Precision: 0.992, Recall: 0.991, F1: 0.991 },
    { Model: 'XGBoost', Accuracy: 0.988, Precision: 0.988, Recall: 0.989, F1: 0.988 },
    { Model: 'Naive Bayes', Accuracy: 0.985, Precision: 0.987, Recall: 0.986, F1: 0.985 },
    { Model: 'SVM', Accuracy: 0.978, Precision: 0.980, Recall: 0.978, F1: 0.979 },
    { Model: 'Decision Tree', Accuracy: 0.954, Precision: 0.955, Recall: 0.954, F1: 0.954 },
    { Model: 'KNN', Accuracy: 0.941, Precision: 0.943, Recall: 0.941, F1: 0.942 }
  ]
};

// --- APP COMPONENT ---
function App() {
  const [activeTab, setActiveTab] = useState<'recommend' | 'analytics' | 'assistant'>('recommend');
  const [isLoading, setIsLoading] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);
  
  // State for recommend
  const [prediction, setPrediction] = useState<typeof MOCK_PREDICTION | null>(null);
  const [shapData, setShapData] = useState<any[]>([]);
  const [currentInput, setCurrentInput] = useState<SoilData | null>(null);
  
  // State for analytics
  const [stats, setStats] = useState<any>(null);
  const [modelCompare, setModelCompare] = useState<ModelStat[]>([]);

  // Initial data load for analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [statsRes, modelsRes] = await Promise.all([
          axios.get('http://localhost:8000/stats'),
          axios.get('http://localhost:8000/model-comparison')
        ]);
        if (statsRes.data.error || modelsRes.data.error) throw new Error("Models not loaded");
        setStats({
          total_samples: statsRes.data.total_samples,
          num_features: statsRes.data.num_features,
          num_crops: statsRes.data.num_crops,
        });
        setModelCompare(modelsRes.data);
        setIsMockMode(false);
      } catch (e) {
        setIsMockMode(true);
        setStats(MOCK_STATS.dataset);
        setModelCompare(MOCK_STATS.models);
      }
    };
    fetchAnalytics();
  }, []);

  const handlePredict = async (data: SoilData) => {
    setIsLoading(true);
    setCurrentInput(data);
    
    try {
      const predRes = await axios.post('http://localhost:8000/predict', data);
      const shapRes = await axios.get('http://localhost:8000/feature-importance');
      
      setPrediction(predRes.data);
      if (shapRes.data && !shapRes.data.error) {
        setShapData(shapRes.data);
      } else {
        setShapData(MOCK_SHAP);
      }
      setIsMockMode(false);
    } catch (e) {
      setIsMockMode(true);
      setTimeout(() => {
        setPrediction(MOCK_PREDICTION);
        setShapData(MOCK_SHAP);
        setIsLoading(false);
      }, 800);
      return;
    }
    
    setIsLoading(false);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-white overflow-hidden text-black antialiased font-sans">
      {/* TOP TOOLBAR */}
      <header className="h-[76px] bg-white border-b-2 border-black flex items-center justify-between px-6 shrink-0 z-10 box-border">
        {/* Left Section */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setActiveTab('recommend')}
            className={`w-[44px] h-[44px] border-2 border-black flex items-center justify-center transition-colors ${activeTab === 'recommend' ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}
          >
            <Sprout className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-[44px] h-[44px] border-2 border-black flex items-center justify-center transition-colors ${activeTab === 'analytics' ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}
          >
            <Activity className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveTab('assistant')}
            className={`w-[44px] h-[44px] border-2 border-black flex items-center justify-center transition-colors ${activeTab === 'assistant' ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <div className="h-[32px] w-px bg-black mx-4"></div>
          {isMockMode && (
            <span className="text-xs uppercase tracking-widest font-serif border-2 border-black px-2 py-1">Mode: MOCK</span>
          )}
        </div>

        {/* Middle Section */}
        <button className="h-[44px] bg-black text-white px-6 font-sans font-medium text-sm flex items-center space-x-2 hover:bg-white hover:text-black border-2 border-black transition-colors uppercase tracking-widest">
          <Sparkles className="w-4 h-4" />
          <span>AI Scan</span>
        </button>

        {/* Right Section */}
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

      {/* BODY WRAPPER */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* MAIN CANVAS */}
        <main className="flex-1 bg-gray-50 relative flex items-center justify-center p-8 overflow-y-auto">
          <div className="w-full max-w-5xl aspect-[16/10] bg-white border-2 border-black relative overflow-y-auto overflow-x-hidden flex flex-col shadow-none">
            {activeTab === 'recommend' && (
              <div className="p-8 h-full flex flex-col">
                <header className="border-b border-gray-200 pb-4 mb-8">
                  <h1 className="font-serif text-3xl font-semibold mb-1">Canvas View: Crop Prediction Map</h1>
                  <p className="font-sans text-gray-500 font-light">Analyzed using 7-dimensional agronomy vector data.</p>
                </header>

                {!prediction && !isLoading && (
                  <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                     <span className="font-serif text-gray-400 text-lg">Awaiting Input Parameters</span>
                  </div>
                )}
                
                {prediction && !isLoading && (
                   <div className="flex-1 overflow-y-auto">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <ResultCard 
                          crop={prediction.crop_recommendation.crop}
                          confidence={prediction.crop_recommendation.confidence}
                          top3={prediction.crop_recommendation.top3}
                          clusterId={prediction.soil_cluster.cluster_id}
                          clusterLabel={prediction.soil_cluster.soil_profile_label}
                          yieldKg={prediction.estimated_yield_kg_ha}
                        />
                        <FeatureImportance data={shapData} />
                      </div>
                      <div className="border-t-2 border-black pt-8">
                        <ClusterViz currentPoint={currentInput ? { n: currentInput.N, k: currentInput.K, clusterId: prediction.soil_cluster.cluster_id } : undefined} />
                      </div>
                   </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
               <div className="p-8 flex-1 flex flex-col">
                 <header className="border-b border-gray-200 pb-4 mb-8">
                  <h1 className="font-serif text-3xl font-semibold mb-1">Telemetry Dashboard</h1>
                  <p className="font-sans text-gray-500 font-light">Global model metrics and dataset distribution bounds.</p>
                </header>
                 <StatsPanel datasetStats={stats} modelStats={modelCompare} />
               </div>
            )}

             {activeTab === 'assistant' && (
               <div className="flex-1 flex flex-col">
                 <Chatbot />
               </div>
            )}
          </div>

          {/* Contextual Hint Bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white border-2 border-black px-6 py-3 flex items-center space-x-2 shadow-none pointer-events-none z-20">
            <span className="text-[12px] uppercase tracking-wider font-sans font-medium">Press</span>
            <kbd className="font-mono text-[12px] border border-black px-1">CMD</kbd>
            <span className="text-[12px] uppercase tracking-wider font-sans font-medium">+</span>
            <kbd className="font-mono text-[12px] border border-black px-1">K</kbd>
            <span className="text-[12px] uppercase tracking-wider font-sans font-medium text-gray-500">to search layers</span>
          </div>
        </main>

        {/* RIGHT SIDEBAR (Annotations / Inputs) */}
        {activeTab === 'recommend' && (
          <aside className="w-[384px] bg-white border-l-2 border-black flex flex-col shrink-0 h-full overflow-hidden">
            <header className="h-[76px] border-b-2 border-black px-6 flex items-center justify-between shrink-0 box-border">
              <h2 className="font-serif text-lg font-semibold flex items-center">
                Variables <span className="text-gray-400 ml-2 font-light script">(7)</span>
              </h2>
              <div className="flex space-x-1">
                <div className="w-3 h-3 border border-black"></div>
                <div className="w-3 h-3 bg-gray-300"></div>
                <div className="w-3 h-3 bg-black"></div>
              </div>
            </header>
            
            <div className="flex-1 overflow-y-auto bg-gray-50">
               <InputForm onSubmit={handlePredict} isLoading={isLoading} />
            </div>
          </aside>
        )}

      </div>
    </div>
  );
}

export default App;
