import { useState, useEffect } from 'react';
import { SelectFiles, ConvertToMP4, OpenOutputFolder } from "../../wailsjs/go/main/App";
import { EventsOn } from "../../wailsjs/runtime/runtime";

// --- ICONS (Minimal & Sharp) ---
const TerminalIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>
);
const FileIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
);
const FolderIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
);
const TrashIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
);
const PlayIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="5 3 19 12 5 21 5 3"/></svg>
);
const PlusIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const SettingsIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
);

const PRESETS = [
    { label: "Default Profile", value: "default", category: "Standard" },
    { label: "Gaming 1080p 30fps", value: "gaming_1080p30", category: "Gaming" },
    { label: "Gaming 1080p 60fps", value: "gaming_1080p60", category: "Gaming" },
    { label: "Gaming 1440p (2K) 30fps", value: "gaming_2k30", category: "Gaming" },
    { label: "Gaming 1440p (2K) 60fps", value: "gaming_2k60", category: "Gaming" },
    { label: "Gaming 4K 30fps", value: "gaming_4k30", category: "Gaming" },
    { label: "Gaming 4K 60fps", value: "gaming_4k60", category: "Gaming" },
];

function Dashboard() {
    const [files, setFiles] = useState([]);
    const [isConverting, setIsConverting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [cpuUsage, setCpuUsage] = useState(0);
    const [ramUsage, setRamUsage] = useState(0);
    const [selectedPreset, setSelectedPreset] = useState("default");

    useEffect(() => {
        const cleanUpProgress = EventsOn("conversion:progress", (data) => {
            setFiles(currentFiles => 
                currentFiles.map(f => {
                    if (f.path === data.filename) {
                        if (f.status === 'done') return f;
                        return { ...f, progress: data.percent.toFixed(0) };
                    }
                    return f;
                })
            );
        });

        const cleanUpStats = EventsOn("system:stats", (data) => {
            setCpuUsage(data.cpu);
            setRamUsage(data.ram);
        });

        return () => {
            cleanUpProgress();
            cleanUpStats();
        };
    }, []);

    const handleBrowse = async () => {
        setErrorMessage("");
        try {
            const paths = await SelectFiles();
            if (paths && paths.length > 0) {
                const newFiles = paths.map(path => ({
                    path: path,
                    name: path.split(/[\\/]/).pop(),
                    status: 'pending',
                    progress: 0,
                    outputPath: '',
                    inputSize: '',  
                    outputSize: ''  
                }));
                
                setFiles(prev => {
                    const existingPaths = new Set(prev.map(p => p.path));
                    const filtered = newFiles.filter(f => !existingPaths.has(f.path));
                    return [...prev, ...filtered];
                });
            }
        } catch (err) {
            console.error(err);
            setErrorMessage("Selection Error: " + err);
        }
    };

    const convertAll = async () => {
        if (isConverting) return;
        setErrorMessage("");
        const pendingFiles = files.filter(f => f.status === 'pending');
        if (pendingFiles.length === 0) return;

        setIsConverting(true);

        for (const file of pendingFiles) {
            updateFileStatus(file.path, { status: 'converting' });
            try {
                // Passiamo il selectedPreset al backend
                const result = await ConvertToMP4(file.path, selectedPreset);
                updateFileStatus(file.path, { 
                    status: 'done', 
                    progress: 100, 
                    outputPath: result.outputPath,
                    inputSize: result.inputSize,
                    outputSize: result.outputSize
                });

            } catch (err) {
                console.error(err);
                updateFileStatus(file.path, { status: 'error' });
                setErrorMessage(`Process Failed: ${file.name} - ${err}`);
            }
        }
        setIsConverting(false);
    };

    const updateFileStatus = (path, updates) => {
        setFiles(prev => prev.map(f => {
            if (f.path === path) {
                return { ...f, ...updates };
            }
            return f;
        }));
    };

    const removeFile = (path) => {
        if(isConverting) return;
        setFiles(prev => prev.filter(f => f.path !== path));
    }

    const openFolder = (outputPath) => {
        if (outputPath) OpenOutputFolder(outputPath);
    }

    const pendingCount = files.filter(f => f.status === 'pending').length;

    // --- UTILS PER STILE ---
    const getStatusStyle = (status) => {
        switch(status) {
            case 'done': return 'text-emerald-400 bg-emerald-950/30 border-emerald-500/20';
            case 'converting': return 'text-cyan-400 bg-cyan-950/30 border-cyan-500/20 animate-pulse';
            case 'error': return 'text-red-400 bg-red-950/30 border-red-500/20';
            default: return 'text-zinc-500 bg-zinc-900 border-zinc-800';
        }
    };

    const getProgressBarStyle = (status) => {
        switch(status) {
            case 'done': return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
            case 'converting': return 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]';
            case 'error': return 'bg-red-600';
            default: return 'bg-zinc-700';
        }
    };

    return (
        <div className="h-screen overflow-hidden bg-[#09090b] text-gray-300 font-mono p-6 flex flex-col selection:bg-purple-500/30 select-none cursor-default">
            
            {/* --- TOP BAR (Fixed) --- */}
            <header className="flex-none flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-900 border border-zinc-700 rounded-md flex items-center justify-center">
                        <TerminalIcon className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">
                            <span className="text-purple-500 mr-1">./</span>DSN - Video compressor
                        </h1>
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">Video converter & compressor</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end text-[10px] text-zinc-500 mr-4">
                        <span>CPU_USAGE: {cpuUsage}%</span>
                        <span>RAM_USAGE: {ramUsage}%</span>
                        <span>STATUS: {isConverting ? <span className="text-cyan-400">RUNNING</span> : <span className="text-emerald-500">IDLE</span>}</span>
                    </div>

                    {/* --- PRESET SELECTOR --- */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                            <SettingsIcon className="w-3 h-3 text-zinc-500" />
                        </div>
                        <select 
                            disabled={isConverting}
                            value={selectedPreset}
                            onChange={(e) => setSelectedPreset(e.target.value)}
                            className="appearance-none bg-zinc-900 text-xs font-bold text-zinc-300 border border-zinc-700 rounded pl-8 pr-8 py-2 hover:border-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 disabled:opacity-50 cursor-pointer w-48"
                        >
                            <optgroup label="Standard">
                                <option value="default">Default Profile</option>
                            </optgroup>
                            <optgroup label="Gaming">
                                <option value="gaming_1080p30">1080p 30fps</option>
                                <option value="gaming_1080p60">1080p 60fps</option>
                                <option value="gaming_2k30">2K 30fps</option>
                                <option value="gaming_2k60">2K 60fps</option>
                                <option value="gaming_4k30">4K 30fps</option>
                                <option value="gaming_4k60">4K 60fps</option>
                            </optgroup>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                            <svg className="h-3 w-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    <button 
                        onClick={handleBrowse} 
                        disabled={isConverting}
                        className="cursor-pointer flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded transition-all active:scale-95 hover:border-zinc-500 disabled:opacity-50"
                    >
                        <PlusIcon className="w-4 h-4" /> Load Files
                    </button>
                    
                    {files.length > 0 && (
                        <button 
                            onClick={convertAll}
                            disabled={isConverting || pendingCount === 0}
                            className={`cursor-pointer flex items-center gap-2 px-6 py-2 text-xs font-bold uppercase rounded transition-all border disabled:opacity-50 disabled:cursor-not-allowed
                                ${isConverting 
                                    ? 'bg-zinc-900 border-zinc-700 text-zinc-500' 
                                    : 'bg-purple-900/20 hover:bg-purple-900/40 border-purple-500/50 text-purple-300 hover:text-white hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                                }`}
                        >
                            {isConverting ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"/> 
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <PlayIcon className="w-4 h-4" /> Execute Batch ({pendingCount})
                                </>
                            )}
                        </button>
                    )}
                </div>
            </header>

            {/* --- ERROR DISPLAY (Fixed if present) --- */}
            {errorMessage && (
                <div className="flex-none mb-4 bg-red-950/20 border-l-2 border-red-500 p-4 font-mono text-xs text-red-300 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                    <span><span className="font-bold text-red-500">[ERROR]</span> {errorMessage}</span>
                    <button onClick={() => setErrorMessage("")} className="hover:text-white">[x]</button>
                </div>
            )}

            {/* --- TABLE HEADER (Fixed) --- */}
            {files.length > 0 && (
                <div className="flex-none grid grid-cols-12 gap-4 px-4 py-2 text-[10px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800 bg-[#09090b] z-10">
                    <div className="col-span-5">File Name & Info</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-4">Progress</div>
                    <div className="col-span-1 text-right">Action</div>
                </div>
            )}

            {/* --- MAIN CONTENT (SCROLLABLE) --- */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0 relative">
                {files.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 border border-dashed border-zinc-800 rounded-lg bg-zinc-900/20">
                        <TerminalIcon className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-sm">No input files loaded.</p>
                        <p className="text-xs font-mono mt-2 opacity-50">Waiting for user command...</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 pt-2 pb-2">
                        {/* Rows */}
                        {files.map((file) => (
                            <div 
                                key={file.path} 
                                className="group grid grid-cols-12 gap-4 items-center px-4 py-3 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/50 hover:border-zinc-700 rounded transition-all text-xs"
                            >
                                {/* Name & Sizes */}
                                <div className="col-span-5 flex items-center gap-3 overflow-hidden">
                                    <FileIcon className="w-4 h-4 text-zinc-600 shrink-0" />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-zinc-300 truncate font-bold" title={file.name}>{file.name}</span>
                                        <div className="flex gap-2 text-[10px] text-zinc-500 font-mono">
                                            <span className="truncate" title={file.path}>{file.path}</span>
                                            
                                            {/* MOSTRO LE DIMENSIONI QUI */}
                                            {file.inputSize && (
                                                <span className="text-emerald-500/80 ml-2 border-l border-zinc-700 pl-2 whitespace-nowrap">
                                                    {file.inputSize} 
                                                    {file.outputSize && (
                                                        <> <span className="text-zinc-500">→</span> <span className="text-emerald-400 font-bold">{file.outputSize}</span></>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="col-span-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getStatusStyle(file.status)}`}>
                                        {file.status}
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="col-span-4 flex items-center gap-3">
                                    <div className="flex-1 h-1.5 bg-black rounded-full overflow-hidden border border-zinc-800">
                                        <div 
                                            className={`h-full transition-all duration-300 ${getProgressBarStyle(file.status)}`}
                                            style={{width: `${file.progress}%`}}
                                        />
                                    </div>
                                    <span className="w-8 text-right font-mono text-zinc-500">
                                        {file.status === 'done' ? '100%' : `${file.progress}%`}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="col-span-1 flex justify-end">
                                    {file.status === 'done' ? (
                                        <button 
                                            onClick={() => openFolder(file.outputPath)}
                                            className="cursor-pointer text-emerald-500 hover:text-emerald-400 transition-colors p-1"
                                            title="Open Output Directory"
                                        >
                                            <FolderIcon className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        !isConverting && (
                                            <button 
                                                onClick={() => removeFile(file.path)}
                                                className="cursor-pointer text-zinc-600 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                                                title="Remove from queue"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* --- FOOTER STATUS (Fixed) --- */}
            <div className="flex-none mt-2 pt-4 border-t border-zinc-900 text-[10px] text-zinc-600 flex justify-between font-mono bg-[#09090b]">
                <span>Creato con ❤️ da DS Network</span>
                <span>BUILD: REL_0.2.0 // CANDLE GROUP</span>
            </div>
        </div>
    );
}

export default Dashboard;