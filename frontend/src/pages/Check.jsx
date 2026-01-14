"use client";
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IsFFmpegInstalled, InstallFFmpeg } from "../../wailsjs/go/main/App"; 
import { EventsOn, EventsOff } from "../../wailsjs/runtime/runtime"; 

// --- ICON COMPONENTS ---
const TerminalIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>
    </svg>
);

const DownloadIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
    </svg>
);

const AlertIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
);

const CheckIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 6 9 17 4 12"/>
    </svg>
);

function Check() {
    const [status, setStatus] = useState("checking"); // checking | missing | installing | success | error
    const [logs, setLogs] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();
    const logEndRef = useRef(null);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    useEffect(() => {
        checkFFmpeg();
        return () => EventsOff("install:log");
    }, []);

    const checkFFmpeg = async () => {
        // Simuliamo un minimo delay per estetica (per non flippare istantaneamente)
        await new Promise(r => setTimeout(r, 800)); 
        
        try {
            const installed = await IsFFmpegInstalled();
            if (installed) {
                navigate('/dashboard');
            } else {
                setStatus("missing");
            }
        } catch (err) {
            console.error("Errore check ffmpeg", err);
            setErrorMessage("System verification failed.");
            setStatus("error");
        }
    };

    const handleInstall = async () => {
        setStatus("installing");
        setLogs(["Initializing installer...", "Checking Homebrew environment..."]);

        EventsOn("install:log", (msg) => {
            setLogs((prevLogs) => [...prevLogs, msg]);
        });

        try {
            await InstallFFmpeg();
            setStatus("success");
            setLogs((prev) => [...prev, ">>> INSTALLATION SUCCESSFUL <<<"]);
            setTimeout(() => {
                navigate('/dashboard');
            }, 2500);
        } catch (err) {
            setStatus("error");
            setErrorMessage(err.toString());
        } finally {
            EventsOff("install:log");
        }
    };

    // --- HELPER PER STILI ---
    const getAccentColor = () => {
        switch(status) {
            case 'missing': return 'from-amber-500 to-orange-500';
            case 'installing': return 'from-blue-500 to-cyan-500';
            case 'success': return 'from-emerald-500 to-green-500';
            case 'error': return 'from-red-500 to-pink-600';
            default: return 'from-gray-500 to-gray-700';
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black text-white p-4 select-none cursor-default">
            
            {/* Main Card */}
            <div className="w-full max-w-[500px] bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-500">
                
                {/* Top Glowing Line */}
                <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${getAccentColor()} shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-1000`} />

                <div className="p-8 flex flex-col items-center text-center">
                    
                    {/* 1. CHECKING STATE */}
                    {status === 'checking' && (
                        <div className="py-12 flex flex-col items-center gap-6">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full border-4 border-white/5 border-t-blue-500 animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold tracking-widest uppercase">System Check</h2>
                                <p className="text-xs text-gray-500 font-mono mt-1">Controllo dipendenze..</p>
                            </div>
                        </div>
                    )}

                    {/* 2. MISSING STATE */}
                    {status === 'missing' && (
                        <div className="animate-in slide-in-from-bottom-4 duration-500 w-full">
                            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                                <AlertIcon className="w-10 h-10 text-amber-500" />
                            </div>
                            
                            <h2 className="text-2xl font-black mb-2 text-white">Dipendenza mancante</h2>
                            <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                                È richiesto <strong className="text-amber-400">FFmpeg</strong> per il funzionamento dell'applicazione.
                            </p>

                            <button 
                                onClick={handleInstall}
                                className="group relative w-full py-4 rounded-xl font-bold uppercase tracking-wider text-sm bg-gradient-to-r from-amber-600 to-orange-600 hover:brightness-110 transition-all shadow-lg shadow-orange-900/20 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                <span className="relative flex items-center justify-center gap-2 cursor-pointer">
                                    <DownloadIcon className="w-4 h-4" /> Installa
                                </span>
                            </button>
                            <p className="text-[10px] text-gray-600 mt-3 font-mono">Richiede una connessione internet.</p>
                        </div>
                    )}

                    {/* 3. INSTALLING & SUCCESS (TERMINAL VIEW) */}
                    {(status === 'installing' || status === 'success') && (
                        <div className="w-full animate-in fade-in duration-300">
                            
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {status === 'success' ? (
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                            <CheckIcon className="w-4 h-4 text-emerald-400" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                    <div className="text-left">
                                        <h3 className="font-bold text-sm text-white">
                                            {status === 'success' ? 'Ready to launch' : 'Installing FFmpeg'}
                                        </h3>
                                        <p className="text-[10px] text-gray-400 font-mono uppercase">
                                            {status === 'success' ? 'Setup Complete' : 'Executing Scripts...'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Fake Terminal Window */}
                            <div className="bg-[#0c0c0c] border border-white/10 rounded-lg overflow-hidden shadow-inner text-left font-mono text-[10px]">
                                {/* Window Bar */}
                                <div className="bg-white/5 px-3 py-2 flex gap-1.5 border-b border-white/5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                                </div>
                                
                                {/* Console Logs */}
                                <div className="h-48 overflow-y-auto p-3 space-y-1 scrollbar-hide">
                                    {logs.map((line, i) => (
                                        <div key={i} className="break-all flex gap-2">
                                            <span className="text-gray-600 select-none">›</span>
                                            <span className={`${status === 'success' && i === logs.length -1 ? 'text-emerald-400 font-bold' : 'text-gray-300'}`}>
                                                {line}
                                            </span>
                                        </div>
                                    ))}
                                    {status === 'installing' && (
                                        <div className="animate-pulse text-blue-400">_</div>
                                    )}
                                    <div ref={logEndRef} />
                                </div>
                            </div>

                            {status === 'success' && (
                                <p className="mt-4 text-emerald-400 text-xs font-bold uppercase tracking-widest animate-pulse">
                                    Redirecting to dashboard...
                                </p>
                            )}
                        </div>
                    )}

                    {/* 4. ERROR STATE */}
                    {status === 'error' && (
                        <div className="w-full animate-in shake duration-300">
                             <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                                <AlertIcon className="w-8 h-8 text-red-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Installation Failed</h2>
                            
                            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 mb-6 text-left">
                                <p className="font-mono text-[10px] text-red-300 break-words">
                                    {errorMessage || "Unknown error occurred during process."}
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => { setStatus('missing'); setLogs([]); }}
                                    className="flex-1 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase border border-white/10 transition-all"
                                >
                                    Try Again
                                </button>
                                <button 
                                    onClick={() => navigate('/dashboard')}
                                    className="flex-1 py-3 rounded-lg bg-transparent hover:bg-white/5 text-gray-400 hover:text-white text-xs font-bold uppercase transition-all"
                                >
                                    Skip Check
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Check;