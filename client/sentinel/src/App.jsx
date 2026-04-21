import React, { useState, useEffect, useRef } from 'react';

/**
 * Sentinel AI - Premium Cybersecurity Dashboard
 * A high-end React UI featuring glassmorphism, neon accents, and smooth transitions.
 */

const App = () => {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, scanning, completed, error
  const [currentStage, setCurrentStage] = useState('');
  const [logs, setLogs] = useState([]);
  const [results, setResults] = useState(null);
  const terminalEndRef = useRef(null);

  const pollingRef = useRef(null);
  const lastStageRef = useRef('');
  const [scanId, setScanId] = useState(null);

  const stages = [
    { name: 'Initializing Analysis', weight: 10 },
    { name: 'Loading Security Tools', weight: 20 },
    { name: 'Crawling Architecture', weight: 40 },
    { name: 'Neural Pattern Matching', weight: 60 },
    { name: 'Simulating Vector Attacks', weight: 80 },
    { name: 'Generating Final Report', weight: 95 },
    { name: 'Scan Completed', weight: 100 },
  ];

  const levelColor = {
    LOW: "bg-green-500/20 text-green-400",
    MEDIUM: "bg-yellow-500/20 text-yellow-400",
    HIGH: "bg-red-500/20 text-red-400"
  };

  const stageMap = {
  analysis: "Initializing Analysis",
  tools: "Loading Security Tools",
  crawling: "Crawling Architecture",
  brain: "Neural Pattern Matching",
  attacks: "Simulating Vector Attacks",
  report: "Generating Final Report",
  completed: "Scan Completed"
};


  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    if (scanId && isScanning) {
      pollingRef.current = setInterval(fetchStatus, 2000);
    }

    return () => clearInterval(pollingRef.current);
  }, [scanId, isScanning]);

  const addLog = (message) => {
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs((prev) => [...prev, `[${time}] ${message}`]);
  };

  const startScan = async (e) => {
    e.preventDefault();
    if (!url) return;

    setIsScanning(true);
    setStatus('scanning');
    setProgress(0);
    setLogs([]);
    setResults(null);
    lastStageRef.current = '';

    addLog(`Establishing secure connection to ${url}...`);

    try {
    const res = await fetch('http://localhost:5000/api/full-scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: url })
    });

    const data = await res.json();

    if (!data.scanId) throw new Error("No scanId");

    setScanId(data.scanId);
    addLog("[✓] Scan initialized");

  } catch (err) {
    console.error(err);
    addLog("[!] Failed to start scan");
    setIsScanning(false);
    setStatus("error");
  }
  };
  const fetchStatus = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/scan-status/${scanId}`);

      if (!res.ok) throw new Error("Bad response");

      const data = await res.json();

      if (!data.success || !data.scan) return;

      const scan = data.scan;

      // ✅ Progress
      setProgress(scan.progress || 0);

      // ✅ Stage → matches your Gemini UI text
      setCurrentStage(stageMap[scan.stage] || scan.stage);

      // ✅ Logs (avoid duplicates)
      if (lastStageRef.current !== scan.stage) {
        lastStageRef.current = scan.stage;
        addLog(`Task: ${stageMap[scan.stage] || scan.stage}...`);
      }

      // ✅ FINAL RESULT
      if (scan.stage === "completed" && scan.result) {
        console.log("✅ BACKEND RESULT:", scan.result);

        setResults({
          score: scan.result?.risk_score ?? 0,
          level: scan.result?.risk_level ?? "LOW",
          findings: scan.result?.findings ?? []
        });

        // addLog("Task: Scan Completed...");
        addLog("Scan report generated successfully.");

        setIsScanning(false);
        setStatus("completed");
        clearInterval(pollingRef.current);
      }

    } catch (err) {
      console.error("Polling error:", err);
      addLog("[!] Polling failed...");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200 selection:bg-cyan-500/30 font-sans p-4 md:p-8 relative overflow-x-hidden">
      
      {/* Background Glow Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto px-6 md:px-10 space-y-8 relative">
        
        {/* Header Section */}
        <header className="text-center space-y-2 py-6">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Sentinel AI
          </h1>
          <p className="text-slate-400 text-lg font-medium">Advanced Vulnerability Intelligence & Threat Detection</p>
        </header>

        {/* Input Section */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-1 rounded-2xl shadow-2xl transition-all hover:border-white/20">
          <form onSubmit={startScan} className="flex flex-col md:flex-row gap-2">
            <input 
              type="url"
              required
              placeholder="Enter target URL (e.g., https://example.com)"
              className="flex-1 bg-transparent px-6 py-4 outline-none text-white placeholder:text-slate-500 text-lg"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isScanning}
            />
            <button 
              type="submit"
              disabled={isScanning}
              className={`px-10 py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2
                ${isScanning 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] text-white active:scale-95'
                }`}
            >
              {isScanning ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Scanning...
                </>
              ) : 'Start Scan'}
            </button>
          </form>
        </div>

        {/* Progress Section */}
        {isScanning && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-cyan-400 font-mono text-sm uppercase tracking-widest mb-1">Current Task</p>
                <h3 className="text-xl font-semibold text-white">{currentStage}</h3>
              </div>
              <span className="text-3xl font-mono font-bold text-white">{progress}%</span>
            </div>
            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Main Grid: Terminal and Results */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-10">
          
          {/* Terminal Section */}
          <div className="lg:col-span-1 flex flex-col h-[500px] bg-black/80 rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative group">
            <div className="bg-white/5 px-4 py-2 flex items-center gap-2 border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
              <span className="text-xs font-mono text-slate-500 uppercase tracking-tighter ml-2">Secure Terminal Instance</span>
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-sm space-y-1 custom-scrollbar">
              {logs.length === 0 && <p className="text-slate-600 italic">Waiting for process initiation...</p>}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-cyan-500/50 shrink-0 select-none">{">"}</span>
                  <p className={`${log.includes('Critical') ? 'text-red-400' : log.includes('Warning') ? 'text-yellow-400' : 'text-cyan-400/90'}`}>
                    {log}
                  </p>
                </div>
              ))}
              {isScanning && <span className="inline-block w-2 h-4 bg-cyan-500 animate-pulse align-middle ml-1" />}
              <div ref={terminalEndRef} />
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 xl:col-span-2 space-y-6">
            {!results && !isScanning && (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/5 rounded-3xl">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04m12.892 1.157l1.414 1.414m-7.414 2.828L11 11m0 0l-2.828 2.828M11 11l2.828 2.828M11 11V3"></path></svg>
                </div>
                <h3 className="text-xl font-medium text-slate-300">No active scan results</h3>
                <p className="text-slate-500 max-w-xs mx-auto">Enter a URL above and trigger a scan to analyze potential security vectors.</p>
              </div>
            )}

            {results && (
              <div className="space-y-6 animate-in zoom-in-95 duration-500">
                {/* Score Card */}
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl flex items-center justify-between overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div>
                    <h4 className="text-slate-400 uppercase tracking-widest text-sm font-bold">Threat Index Score</h4>
                    <p className="text-5xl font-black mt-1 text-white">{results.score}<span className="text-xl text-slate-500 font-normal">/100</span></p>
                  </div>
                  <div className="text-right">
                    <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase border border-white/10 ${levelColor[results.level?.toUpperCase()] || "bg-gray-500/20 text-gray-400"}`}>
                      {results.level}
                    </span>
                    <p className="text-slate-400 text-sm mt-2">Critical vulnerabilities found</p>
                  </div>
                </div>

                {/* Findings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.findings.map((finding, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/[0.08] transition-all hover:-translate-y-1 hover:shadow-xl group">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          finding.severity === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20'
                        }`}>
                          {finding.severity}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Vector: {finding.parameter}</span>
                      </div>
                      <h5 className="text-lg font-bold text-white mb-2">{finding.type}</h5>
                      <div className="bg-black/40 p-3 rounded-lg border border-white/5 mb-4">
                        <code className="text-pink-400 text-xs break-all">{finding.payload}</code>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed mb-4">{finding.explanation}</p>
                      <div className="pt-4 border-t border-white/5">
                        <p className="text-xs font-bold text-cyan-400 uppercase mb-1">Recommended Fix</p>
                        <p className="text-xs text-slate-300 italic">{finding.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default App;