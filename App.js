// Complete App.js - matching test.html functionality
const { useState, useEffect, useRef } = React;
const { presets, builtInGenerators, modes } = PRNGConstants;

function App() {
    // State management
    const [equation, setEquation] = useState("x ^ (x << 13)");
    const [seed, setSeed] = useState(12345);
    const [resolution, setResolution] = useState(256);
    const [mode, setMode] = useState("raw");
    const [bitIndex, setBitIndex] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(0);
    const [contrastStretch, setContrastStretch] = useState({ enabled: false, auto: true, min: 0, max: 255 });
    const [minMaxValues, setMinMaxValues] = useState({ min: 0, max: 255 });
    const [builtInGenerator, setBuiltInGenerator] = useState('');
    const [bitStats, setBitStats] = useState(null);
    const [showBitStats, setShowBitStats] = useState(false);
    const [showModeDescription, setShowModeDescription] = useState(false);
    const [sideBySideMode, setSideBySideMode] = useState(false);
    
    const [showMenu, setShowMenu] = useState(false);
    const [showModeDropdown, setShowModeDropdown] = useState(false);
    const [showBuiltInDropdown, setShowBuiltInDropdown] = useState(false);
    const [showPresetsDropdown, setShowPresetsDropdown] = useState(false);
    const [showContrastDropdown, setShowContrastDropdown] = useState(false);
    const [showSyntaxHelper, setShowSyntaxHelper] = useState(false);
    
    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    
    const [leftPanel, setLeftPanel] = useState({
        equation: "x ^ (x << 13)",
        seed: 12345,
        resolution: 256,
        mode: "raw",
        bitIndex: 0,
        builtInGenerator: '',
        contrastStretch: { enabled: false, auto: true, min: 0, max: 255 },
        scale: 1,
        pan: { x: 0, y: 0 },
        showMenu: false,
        showModeMenu: false,
        showBuiltInMenu: false,
        showPresetsMenu: false,
        showContrastMenu: false,
        showModeDescription: false,
        isGenerating: false
    });
    
    const [rightPanel, setRightPanel] = useState({
        equation: "x ^ (x << 13)",
        seed: 12346,
        resolution: 256,
        mode: "raw",
        bitIndex: 0,
        builtInGenerator: '',
        contrastStretch: { enabled: false, auto: true, min: 0, max: 255 },
        scale: 1,
        pan: { x: 0, y: 0 },
        showMenu: false,
        showModeMenu: false,
        showBuiltInMenu: false,
        showPresetsMenu: false,
        showContrastMenu: false,
        showModeDescription: false,
        isGenerating: false
    });
    
    const [activePanel, setActivePanel] = useState('left');
    
    const canvasRef = useRef(null);
    const canvasLeftRef = useRef(null);
    const canvasRightRef = useRef(null);
    const workerRef = useRef(null);
    const workerLeftRef = useRef(null);
    const workerRightRef = useRef(null);
    const viewportRef = useRef(null);
    const textareaRef = useRef(null);

    // Initialize Workers
    useEffect(() => {
        workerRef.current = new Worker('worker.js');
        workerLeftRef.current = new Worker('worker.js');
        workerRightRef.current = new Worker('worker.js');

        const handleMessage = (e, isLeft = null) => {
            const { type, success, buffer, error, resolution: workerResolution, stats } = e.data;
            
            if (type === 'progress') {
                setProgress(e.data.progress);
                return;
            }
            
            if (success) {
                if (sideBySideMode) {
                    if (isLeft) {
                        drawBufferToCanvas(buffer, workerResolution, canvasLeftRef.current, leftPanel.scale, leftPanel.pan);
                        setLeftPanel(prev => ({ ...prev, isGenerating: false }));
                    } else {
                        drawBufferToCanvas(buffer, workerResolution, canvasRightRef.current, rightPanel.scale, rightPanel.pan);
                        setRightPanel(prev => ({ ...prev, isGenerating: false }));
                    }
                } else {
                    drawBufferToCanvas(buffer, workerResolution);
                    setIsGenerating(false);
                }
                
                if (stats && stats.bitStats) {
                    setBitStats(stats.bitStats);
                }
                if (stats && stats.minVal !== undefined) {
                    setMinMaxValues({ min: stats.minVal, max: stats.maxVal });
                }
                setError(null);
            } else {
                setError(error);
                if (sideBySideMode) {
                    if (isLeft) setLeftPanel(prev => ({ ...prev, isGenerating: false }));
                    else setRightPanel(prev => ({ ...prev, isGenerating: false }));
                } else {
                    setIsGenerating(false);
                }
            }
            setProgress(0);
        };
        
        workerRef.current.onmessage = (e) => handleMessage(e);
        workerLeftRef.current.onmessage = (e) => handleMessage(e, true);
        workerRightRef.current.onmessage = (e) => handleMessage(e, false);

        return () => {
            workerRef.current.terminate();
            workerLeftRef.current.terminate();
            workerRightRef.current.terminate();
        };
    }, [sideBySideMode]);
    
    useEffect(() => {
        if (sideBySideMode && canvasLeftRef.current && canvasLeftRef.current.width > 0) {
            const canvas = canvasLeftRef.current;
            const container = canvas.parentElement;
            if (container) {
                const scaledWidth = canvas.width * leftPanel.scale;
                const scaledHeight = canvas.height * leftPanel.scale;
                canvas.style.position = 'absolute';
                canvas.style.margin = '0';
                canvas.style.left = `${(container.clientWidth - scaledWidth) / 2 + leftPanel.pan.x}px`;
                canvas.style.top = `${(container.clientHeight - scaledHeight) / 2 + leftPanel.pan.y}px`;
                canvas.style.width = `${scaledWidth}px`;
                canvas.style.height = `${scaledHeight}px`;
            }
        }
    }, [leftPanel.scale, leftPanel.pan, sideBySideMode]);
    
    useEffect(() => {
        if (sideBySideMode && canvasRightRef.current && canvasRightRef.current.width > 0) {
            const canvas = canvasRightRef.current;
            const container = canvas.parentElement;
            if (container) {
                const scaledWidth = canvas.width * rightPanel.scale;
                const scaledHeight = canvas.height * rightPanel.scale;
                canvas.style.position = 'absolute';
                canvas.style.margin = '0';
                canvas.style.left = `${(container.clientWidth - scaledWidth) / 2 + rightPanel.pan.x}px`;
                canvas.style.top = `${(container.clientHeight - scaledHeight) / 2 + rightPanel.pan.y}px`;
                canvas.style.width = `${scaledWidth}px`;
                canvas.style.height = `${scaledHeight}px`;
            }
        }
    }, [rightPanel.scale, rightPanel.pan, sideBySideMode]);

    const drawBufferToCanvas = (buffer, res, targetCanvas = null, panelScale = 1, panelPan = { x: 0, y: 0 }) => {
        const canvas = targetCanvas || canvasRef.current;
        if (!canvas) {
            console.error('Canvas not found!');
            return;
        }
        
        if (canvas.width !== res) canvas.width = res;
        if (canvas.height !== res) canvas.height = res;

        const ctx = canvas.getContext("2d");
        const uint8Array = new Uint8ClampedArray(buffer);
        
        const imgData = new ImageData(uint8Array, res, res);
        ctx.putImageData(imgData, 0, 0);
        
        if (targetCanvas && canvas.parentElement) {
            const container = canvas.parentElement;
            const scaledWidth = res * panelScale;
            const scaledHeight = res * panelScale;
            canvas.style.position = 'absolute';
            canvas.style.left = `${(container.clientWidth - scaledWidth) / 2 + panelPan.x}px`;
            canvas.style.top = `${(container.clientHeight - scaledHeight) / 2 + panelPan.y}px`;
            canvas.style.width = `${scaledWidth}px`;
            canvas.style.height = `${scaledHeight}px`;
        }
    };

    const handleRun = () => {
        setIsGenerating(true);
        setError(null);
        setProgress(0);
        
        const message = {
            equation,
            seed: parseInt(seed),
            resolution: parseInt(resolution),
            mode,
            bitPlaneIndex: parseInt(bitIndex),
            contrastStretch,
            useBuiltIn: !!builtInGenerator,
            builtInType: builtInGenerator
        };
        
        workerRef.current.postMessage(message);
    };

    const handleRandomSeed = () => {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        setSeed(array[0]);
    };

    const insertSymbol = (symbol) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = equation;
        const before = text.substring(0, start);
        const after = text.substring(end);
        
        const newText = before + symbol + after;
        setEquation(newText);
        
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + symbol.length, start + symbol.length);
        }, 0);
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.1, Math.min(scale * delta, 10));
        setScale(newScale);
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setPan({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const resetView = () => {
        setScale(1);
        setPan({ x: 0, y: 0 });
    };

    const handleExportConfig = () => {
        const config = {
            equation,
            seed: parseInt(seed),
            resolution: parseInt(resolution),
            mode,
            bitIndex: parseInt(bitIndex),
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.download = `prng_config_${Date.now()}.json`;
        link.href = URL.createObjectURL(blob);
        link.click();
    };

    const handleExportSplitView = async () => {
        const config = {
            leftPanel: {
                equation: leftPanel.equation,
                seed: leftPanel.seed,
                resolution: leftPanel.resolution,
                mode: leftPanel.mode,
                bitIndex: leftPanel.bitIndex,
                builtInGenerator: leftPanel.builtInGenerator,
                contrastStretch: leftPanel.contrastStretch
            },
            rightPanel: {
                equation: rightPanel.equation,
                seed: rightPanel.seed,
                resolution: rightPanel.resolution,
                mode: rightPanel.mode,
                bitIndex: rightPanel.bitIndex,
                builtInGenerator: rightPanel.builtInGenerator,
                contrastStretch: rightPanel.contrastStretch
            },
            timestamp: new Date().toISOString()
        };

        // Export canvas images
        const leftCanvas = canvasLeftRef.current;
        const rightCanvas = canvasRightRef.current;
        
        if (leftCanvas && leftCanvas.width > 0) {
            config.leftPanel.imageData = leftCanvas.toDataURL('image/png');
        }
        if (rightCanvas && rightCanvas.width > 0) {
            config.rightPanel.imageData = rightCanvas.toDataURL('image/png');
        }
        
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.download = `prng_split_${Date.now()}.json`;
        link.href = URL.createObjectURL(blob);
        link.click();
    };

    const handleImportConfig = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const config = JSON.parse(event.target.result);
                    
                    if (config.equation !== undefined) setEquation(config.equation);
                    if (config.seed !== undefined) setSeed(config.seed);
                    if (config.resolution !== undefined) setResolution(config.resolution);
                    if (config.mode !== undefined) setMode(config.mode);
                    if (config.bitIndex !== undefined) setBitIndex(config.bitIndex);
                    
                    setError(null);
                    alert('Configuration loaded successfully!');
                } catch (err) {
                    setError('Failed to load configuration: ' + err.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const handleImportSplitView = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const config = JSON.parse(event.target.result);
                    
                    // Load left panel
                    if (config.leftPanel) {
                        setLeftPanel(prev => ({
                            ...prev,
                            equation: config.leftPanel.equation || prev.equation,
                            seed: config.leftPanel.seed || prev.seed,
                            resolution: config.leftPanel.resolution || prev.resolution,
                            mode: config.leftPanel.mode || prev.mode,
                            bitIndex: config.leftPanel.bitIndex || prev.bitIndex,
                            builtInGenerator: config.leftPanel.builtInGenerator || '',
                            contrastStretch: config.leftPanel.contrastStretch || prev.contrastStretch
                        }));

                        // Load left image if exists
                        if (config.leftPanel.imageData && canvasLeftRef.current) {
                            const img = new Image();
                            img.onload = () => {
                                const canvas = canvasLeftRef.current;
                                const ctx = canvas.getContext('2d');
                                canvas.width = img.width;
                                canvas.height = img.height;
                                ctx.drawImage(img, 0, 0);
                            };
                            img.src = config.leftPanel.imageData;
                        }
                    }
                    
                    // Load right panel
                    if (config.rightPanel) {
                        setRightPanel(prev => ({
                            ...prev,
                            equation: config.rightPanel.equation || prev.equation,
                            seed: config.rightPanel.seed || prev.seed,
                            resolution: config.rightPanel.resolution || prev.resolution,
                            mode: config.rightPanel.mode || prev.mode,
                            bitIndex: config.rightPanel.bitIndex || prev.bitIndex,
                            builtInGenerator: config.rightPanel.builtInGenerator || '',
                            contrastStretch: config.rightPanel.contrastStretch || prev.contrastStretch
                        }));

                        // Load right image if exists
                        if (config.rightPanel.imageData && canvasRightRef.current) {
                            const img = new Image();
                            img.onload = () => {
                                const canvas = canvasRightRef.current;
                                const ctx = canvas.getContext('2d');
                                canvas.width = img.width;
                                canvas.height = img.height;
                                ctx.drawImage(img, 0, 0);
                            };
                            img.src = config.rightPanel.imageData;
                        }
                    }
                    
                    alert('Split view configuration loaded successfully!');
                } catch (err) {
                    alert('Failed to load configuration: ' + err.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const updatePanelState = (panelSide, updates) => {
        if (panelSide === 'left') {
            setLeftPanel(prev => ({ ...prev, ...updates }));
        } else {
            setRightPanel(prev => ({ ...prev, ...updates }));
        }
    };
    
    const handlePanelGenerate = (panelSide) => {
        const panel = panelSide === 'left' ? leftPanel : rightPanel;
        const worker = panelSide === 'left' ? workerLeftRef.current : workerRightRef.current;
        
        updatePanelState(panelSide, { isGenerating: true });
        
        const message = {
            equation: panel.equation,
            seed: parseInt(panel.seed),
            resolution: parseInt(panel.resolution),
            mode: panel.mode,
            bitPlaneIndex: parseInt(panel.bitIndex),
            contrastStretch: panel.contrastStretch,
            useBuiltIn: !!panel.builtInGenerator,
            builtInType: panel.builtInGenerator
        };
        
        worker.postMessage(message);
    };
    
    const handlePanelWheel = (e, panelSide) => {
        e.preventDefault();
        const panel = panelSide === 'left' ? leftPanel : rightPanel;
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.1, Math.min(panel.scale * delta, 10));
        updatePanelState(panelSide, { scale: newScale });
    };

    return (
        <div className="flex flex-col h-screen">
            {sideBySideMode ? (
                <div className="flex flex-col h-screen">
                    <div className="bg-lab-800 border-b border-lab-700 px-4 py-2 flex items-center justify-center gap-3">
                        <button
                            onClick={handleExportSplitView}
                            className="px-4 py-1.5 bg-lab-700 hover:bg-lab-600 rounded text-sm font-medium flex items-center gap-2 transition-colors"
                            title="Export both panels with images"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export
                        </button>
                        <button
                            onClick={handleImportSplitView}
                            className="px-4 py-1.5 bg-lab-700 hover:bg-lab-600 rounded text-sm font-medium flex items-center gap-2 transition-colors"
                            title="Import both panels with images"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Import
                        </button>
                        <button
                            onClick={() => setSideBySideMode(false)}
                            className="px-4 py-1.5 bg-lab-700 hover:bg-lab-600 rounded text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Exit Split View
                        </button>
                    </div>
                    <div className="flex flex-1">
                        <Panel
                            panelSide="left"
                            panel={leftPanel}
                            canvasRef={canvasLeftRef}
                            modes={modes}
                            builtInGenerators={builtInGenerators}
                            presets={presets}
                            onUpdatePanel={(updates) => updatePanelState('left', updates)}
                            onGenerate={() => handlePanelGenerate('left')}
                            onWheel={(e) => handlePanelWheel(e, 'left')}
                            onSetActive={() => setActivePanel('left')}
                        />
                        <div className="w-0.5 bg-lab-accent"></div>
                        <Panel
                            panelSide="right"
                            panel={rightPanel}
                            canvasRef={canvasRightRef}
                            modes={modes}
                            builtInGenerators={builtInGenerators}
                            presets={presets}
                            onUpdatePanel={(updates) => updatePanelState('right', updates)}
                            onGenerate={() => handlePanelGenerate('right')}
                            onWheel={(e) => handlePanelWheel(e, 'right')}
                            onSetActive={() => setActivePanel('right')}
                        />
                    </div>
                </div>
            ) : (
                <>
                {/* Single View Mode - TOP BAR */}
                <header className="bg-lab-800 border-b border-lab-700 px-6 py-3 pb-10 flex items-center gap-4 shadow-lg">
                    {/* Menu Button */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 bg-lab-700 hover:bg-lab-600 rounded transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        
                        {showMenu && (
                            <div className="absolute top-full left-0 mt-2 w-80 bg-lab-900 border border-lab-700 rounded shadow-2xl z-50 p-4 space-y-4">
                                <button 
                                    onClick={() => setShowMenu(false)}
                                    className="absolute top-2 right-2 px-2 py-1 hover:bg-lab-700 rounded text-xs"
                                >
                                    ✕
                                </button>
                                
                                <div className="text-sm font-bold text-lab-accent mb-3 pt-4">PRNG Visual Lab Menu</div>
                                
                                {/* Visualization Mode */}
                                <div>
                                    <button
                                        onClick={() => setShowModeDropdown(!showModeDropdown)}
                                        className="w-full px-3 py-2 bg-lab-800 hover:bg-lab-700 rounded text-sm flex items-center justify-between transition-colors"
                                    >
                                        <span>Mode: {modes.find(m => m.id === mode)?.label}</span>
                                        <span>{showModeDropdown ? '▲' : '▼'}</span>
                                    </button>
                                    {showModeDropdown && (
                                        <div className="mt-2 space-y-1 pl-2">
                                            {modes.map((m) => (
                                                <button 
                                                    key={m.id}
                                                    onClick={() => {
                                                        setMode(m.id);
                                                        setShowModeDropdown(false);
                                                    }}
                                                    className={`w-full px-3 py-2 text-left text-sm rounded transition-colors ${
                                                        mode === m.id ? 'bg-lab-accent text-lab-900' : 'bg-lab-800 hover:bg-lab-700'
                                                    }`}
                                                >
                                                    {m.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Built-in Generators */}
                                <div>
                                    <button
                                        onClick={() => setShowBuiltInDropdown(!showBuiltInDropdown)}
                                        className="w-full px-3 py-2 bg-lab-800 hover:bg-lab-700 rounded text-sm flex items-center justify-between transition-colors"
                                    >
                                        <span>
                                            {builtInGenerator 
                                                ? `Built-In: ${builtInGenerators.find(g => g.type === builtInGenerator)?.name}` 
                                                : 'Built-In: Custom'}
                                        </span>
                                        <span>{showBuiltInDropdown ? '▲' : '▼'}</span>
                                    </button>
                                    {showBuiltInDropdown && (
                                        <div className="mt-2 space-y-1 pl-2">
                                            <button 
                                                onClick={() => {
                                                    setBuiltInGenerator('');
                                                    setShowBuiltInDropdown(false);
                                                }}
                                                className={`w-full px-3 py-2 text-left text-sm rounded transition-colors ${
                                                    !builtInGenerator ? 'bg-lab-accent text-lab-900' : 'bg-lab-800 hover:bg-lab-700'
                                                }`}
                                            >
                                                Use Custom Equation
                                            </button>
                                            {builtInGenerators.map((g) => (
                                                <button 
                                                    key={g.type}
                                                    onClick={() => {
                                                        setBuiltInGenerator(g.type);
                                                        setShowBuiltInDropdown(false);
                                                    }}
                                                    className={`w-full px-3 py-2 text-left text-sm rounded transition-colors ${
                                                        builtInGenerator === g.type ? 'bg-lab-accent text-lab-900' : 'bg-lab-800 hover:bg-lab-700'
                                                    }`}
                                                >
                                                    <div className="font-semibold">{g.name}</div>
                                                    <div className="text-xs text-gray-500">{g.description}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Contrast Stretch */}
                                <div>
                                    <button
                                        onClick={() => setShowContrastDropdown(!showContrastDropdown)}
                                        className="w-full px-3 py-2 bg-lab-800 hover:bg-lab-700 rounded text-sm flex items-center justify-between transition-colors"
                                    >
                                        <span>Contrast Stretch {contrastStretch.enabled ? '✓' : ''}</span>
                                        <span>{showContrastDropdown ? '▲' : '▼'}</span>
                                    </button>
                                    {showContrastDropdown && (
                                        <div className="mt-2 bg-lab-800 rounded p-3">
                                            <div className="text-xs text-yellow-400 mb-3 font-bold">⚠️ VISUAL AID ONLY</div>
                                            <label className="flex items-center gap-2 mb-3">
                                                <input 
                                                    type="checkbox" 
                                                    checked={contrastStretch.enabled}
                                                    onChange={(e) => setContrastStretch({...contrastStretch, enabled: e.target.checked})}
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-sm">Enable</span>
                                            </label>
                                            {contrastStretch.enabled && (
                                                <>
                                                    <label className="flex items-center gap-2 mb-3">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={contrastStretch.auto}
                                                            onChange={(e) => setContrastStretch({...contrastStretch, auto: e.target.checked})}
                                                            className="w-4 h-4"
                                                        />
                                                        <span className="text-sm">Auto (Min: {minMaxValues.min}, Max: {minMaxValues.max})</span>
                                                    </label>
                                                    {!contrastStretch.auto && (
                                                        <div className="space-y-2">
                                                            <div>
                                                                <label className="text-xs text-gray-400">Min: {contrastStretch.min}</label>
                                                                <input 
                                                                    type="range" 
                                                                    min="0" 
                                                                    max="255" 
                                                                    value={contrastStretch.min}
                                                                    onChange={(e) => setContrastStretch({...contrastStretch, min: parseInt(e.target.value)})}
                                                                    className="w-full"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs text-gray-400">Max: {contrastStretch.max}</label>
                                                                <input 
                                                                    type="range" 
                                                                    min="0" 
                                                                    max="255" 
                                                                    value={contrastStretch.max}
                                                                    onChange={(e) => setContrastStretch({...contrastStretch, max: parseInt(e.target.value)})}
                                                                    className="w-full"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Side-by-Side View */}
                                <div>
                                    <button 
                                        onClick={() => {
                                            setSideBySideMode(true);
                                            setShowMenu(false);
                                        }}
                                        className="w-full px-4 py-2 bg-lab-800 hover:bg-lab-700 rounded text-sm transition-colors"
                                    >
                                        👥 Split View
                                    </button>
                                </div>
                                
                                {/* Presets */}
                                <div>
                                    <button
                                        onClick={() => setShowPresetsDropdown(!showPresetsDropdown)}
                                        className="w-full px-3 py-2 bg-lab-800 hover:bg-lab-700 rounded text-sm flex items-center justify-between transition-colors"
                                    >
                                        <span>Equation Presets</span>
                                        <span>{showPresetsDropdown ? '▲' : '▼'}</span>
                                    </button>
                                    {showPresetsDropdown && (
                                        <div className="mt-2 space-y-1 pl-2">
                                            {presets.map((p) => (
                                                <button 
                                                    key={p.name}
                                                    onClick={() => {
                                                        setEquation(p.code);
                                                        setShowPresetsDropdown(false);
                                                    }}
                                                    className="w-full px-3 py-2 text-left text-sm bg-lab-800 hover:bg-lab-700 rounded transition-colors"
                                                >
                                                    {p.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Export/Import */}
                                <div className="flex gap-2 pt-3 border-t border-lab-700">
                                    <button 
                                        onClick={() => {
                                            handleExportConfig();
                                            setShowMenu(false);
                                        }}
                                        className="flex-1 px-4 py-2 bg-lab-700 hover:bg-lab-600 rounded text-sm transition-colors"
                                    >
                                        ⬇ Export
                                    </button>
                                    <button 
                                        onClick={() => {
                                            handleImportConfig();
                                            setShowMenu(false);
                                        }}
                                        className="flex-1 px-4 py-2 bg-lab-700 hover:bg-lab-600 rounded text-sm transition-colors"
                                    >
                                        ⬆ Import
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Equation Input */}
                    <div className="flex-1 max-w-2xl relative">
                        <textarea
                            ref={textareaRef}
                            value={equation}
                            onChange={(e) => setEquation(e.target.value)}
                            className="w-full h-12 bg-lab-900 border border-lab-700 rounded px-3 py-2 font-mono text-sm text-green-400 focus:outline-none focus:border-lab-accent resize-none"
                            placeholder="e.g. (x ^ (x << 13)) + (x >> 7)"
                        />
                        {/* Symbol Buttons */}
                        <div className="absolute -bottom-7 left-0 flex gap-1">
                            {['+', '-', '*', '^', '&', '|', '~', '<<', '>>', 'ROL', 'ROR', '(', ')', 'x'].map((sym) => (
                                <button
                                    key={sym}
                                    onClick={() => insertSymbol(sym)}
                                    className="px-2 py-0.5 bg-lab-700 hover:bg-lab-600 rounded text-xs font-mono transition-colors"
                                >
                                    {sym}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => setShowSyntaxHelper(!showSyntaxHelper)}
                        className="px-3 py-2 bg-lab-700 hover:bg-lab-600 rounded text-xs transition-colors"
                    >
                        ?
                    </button>

                    {/* Seed */}
                    <div className="flex items-center gap-2">
                        <div>
                            <label className="text-[10px] text-gray-500 block">Seed</label>
                            <input 
                                type="number" 
                                value={seed}
                                onChange={(e) => setSeed(e.target.value)}
                                className="w-32 bg-lab-900 border border-lab-700 rounded px-2 py-1 font-mono text-sm"
                            />
                        </div>
                        <button 
                            onClick={handleRandomSeed}
                            className="mt-4 px-3 py-1 bg-lab-700 hover:bg-lab-600 rounded text-xs transition-colors"
                        >
                            Random
                        </button>
                    </div>

                    {/* Resolution */}
                    <div>
                        <label className="text-[10px] text-gray-500 block">Resolution</label>
                        <select 
                            value={resolution}
                            onChange={(e) => setResolution(parseInt(e.target.value))}
                            className="bg-lab-900 border border-lab-700 rounded px-2 py-1 font-mono text-sm"
                        >
                            <option value="256">256</option>
                            <option value="512">512</option>
                            <option value="1024">1024</option>
                        </select>
                    </div>

                    {/* Generate Button */}
                    <button 
                        onClick={handleRun}
                        disabled={isGenerating}
                        className={`px-6 py-2 rounded font-bold uppercase text-sm transition-all ${
                            isGenerating 
                            ? 'bg-lab-700 text-gray-500 cursor-not-allowed' 
                            : 'bg-lab-accent text-lab-900 hover:bg-white'
                        }`}
                    >
                        {isGenerating ? 'Generating...' : 'Generate'}
                    </button>

                    {/* Stats Button */}
                    {bitStats && (
                        <button 
                            onClick={() => setShowBitStats(!showBitStats)}
                            className="px-3 py-2 bg-lab-700 hover:bg-lab-600 rounded text-xs transition-colors"
                        >
                            📊 Stats
                        </button>
                    )}

                    {/* Description Button */}
                    <button 
                        onClick={() => setShowModeDescription(!showModeDescription)}
                        className="px-3 py-2 bg-lab-700 hover:bg-lab-600 rounded text-xs transition-colors"
                    >
                        📖 Info
                    </button>
                </header>

                {/* Syntax Helper */}
                {showSyntaxHelper && (
                    <div className="bg-lab-800 border-b border-lab-700 px-6 py-3 text-xs">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <div className="font-bold text-lab-accent mb-1">Operators:</div>
                                <div className="space-y-0.5 text-gray-400 font-mono">
                                    <div>+ - * / % (arithmetic)</div>
                                    <div>& | ^ ~ (bitwise)</div>
                                    <div>&lt;&lt; &gt;&gt; (shift)</div>
                                </div>
                            </div>
                            <div>
                                <div className="font-bold text-lab-accent mb-1">Variable:</div>
                                <div className="text-gray-400 font-mono">x (previous output)</div>
                            </div>
                            <div>
                                <div className="font-bold text-lab-accent mb-1">Functions:</div>
                                <div className="space-y-0.5 text-gray-400 font-mono">
                                    <div>ROL(x, n) - Rotate left</div>
                                    <div>ROR(x, n) - Rotate right</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bit Index Slider (conditional) */}
                {mode === 'bit' && (
                    <div className="bg-lab-800 border-b border-lab-700 px-6 py-2 flex items-center gap-4">
                        <label className="text-sm text-gray-400">Bit Index: {bitIndex}</label>
                        <input 
                            type="range" 
                            min="0" max="31" 
                            value={bitIndex}
                            onChange={(e) => setBitIndex(parseInt(e.target.value))}
                            className="flex-1 max-w-md"
                        />
                        <span className="text-xs text-gray-500">0 (LSB) → 31 (MSB)</span>
                    </div>
                )}

                {/* Progress Bar */}
                {isGenerating && progress > 0 && (
                    <div className="bg-lab-800 border-b border-lab-700 px-6 py-2">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 bg-lab-900 rounded-full h-4 overflow-hidden">
                                <div 
                                    className="h-full bg-lab-accent transition-all duration-200"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="text-sm text-gray-400 font-mono w-16">{Math.round(progress)}%</span>
                        </div>
                    </div>
                )}

                {/* MAIN CANVAS AREA */}
                <main 
                    ref={viewportRef}
                    className="flex-1 bg-gray-900 overflow-hidden canvas-viewport relative"
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <div 
                        className="canvas-wrapper"
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`
                        }}
                    >
                        <canvas 
                            ref={canvasRef}
                            style={{ imageRendering: 'pixelated', display: 'block' }}
                        />
                    </div>

                    {/* Zoom Controls */}
                    <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-lab-800/80 backdrop-blur border border-lab-700 rounded p-2">
                        <button 
                            onClick={() => setScale(s => Math.min(s * 1.2, 10))}
                            className="px-3 py-1 bg-lab-700 hover:bg-lab-600 rounded text-sm"
                        >
                            +
                        </button>
                        <div className="text-xs text-center text-gray-400">{Math.round(scale * 100)}%</div>
                        <button 
                            onClick={() => setScale(s => Math.max(s / 1.2, 0.1))}
                            className="px-3 py-1 bg-lab-700 hover:bg-lab-600 rounded text-sm"
                        >
                            −
                        </button>
                        <button 
                            onClick={resetView}
                            className="px-3 py-1 bg-lab-700 hover:bg-lab-600 rounded text-xs mt-2"
                        >
                            Reset
                        </button>
                    </div>

                    {/* Info Badge */}
                    <div className="absolute top-4 left-4 bg-lab-800/80 backdrop-blur border border-lab-700 px-3 py-1 rounded text-xs text-gray-400 font-mono">
                        {resolution}×{resolution} | Zoom: {Math.round(scale * 100)}%
                    </div>

                    {/* Mode Description Panel */}
                    {showModeDescription && (
                        <div className="absolute top-4 left-4 bg-lab-800/95 backdrop-blur border border-lab-700 rounded shadow-2xl p-4 max-h-[80vh] overflow-y-auto" style={{ width: '380px' }}>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-lab-accent">
                                    {modes.find(m => m.id === mode)?.label || mode} Mode
                                </h3>
                                <button 
                                    onClick={() => setShowModeDescription(false)}
                                    className="px-2 py-1 hover:bg-lab-700 rounded text-xs transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="space-y-3 text-xs text-gray-300">
                                {mode === 'raw' && (
                                    <>
                                        <p className="font-bold text-lab-accent">Raw Output Visualization</p>
                                        <p>Displays the raw 32-bit PRNG output converted to grayscale (0-255).</p>
                                        <p className="text-gray-400">• Each pixel = value / 2³² × 255</p>
                                        <p className="text-gray-400">• Shows distribution of generated values</p>
                                        <p className="mt-2"><strong>Good PRNG:</strong> Random gray noise</p>
                                        <p><strong>Bad PRNG:</strong> Visible patterns, stripes, or repetition</p>
                                    </>
                                )}
                                {mode === 'bit' && (
                                    <>
                                        <p className="font-bold text-lab-accent">Bit Plane Extraction</p>
                                        <p>Isolates a single bit position (0-31) from each 32-bit output.</p>
                                        <p className="text-gray-400">• Bit 0 = LSB (least significant)</p>
                                        <p className="text-gray-400">• Bit 31 = MSB (most significant)</p>
                                        <p className="text-gray-400">• White = 1, Black = 0</p>
                                        <p className="mt-2"><strong>Good PRNG:</strong> Random checkerboard (50/50 black/white)</p>
                                        <p><strong>Bad PRNG:</strong> All same color, stripes, or clear patterns</p>
                                        <p className="mt-2 text-yellow-400">💡 Use bit slider to check all 32 bits</p>
                                    </>
                                )}
                                {mode === 'hamming' && (
                                    <>
                                        <p className="font-bold text-lab-accent">Hamming Weight (Population Count)</p>
                                        <p>Counts the number of 1-bits in each 32-bit output.</p>
                                        <p className="text-gray-400">• Range: 0-32 bits set</p>
                                        <p className="text-gray-400">• Darker = fewer 1s, Brighter = more 1s</p>
                                        <p className="text-gray-400">• Maps bit count to grayscale</p>
                                        <p className="mt-2"><strong>Good PRNG:</strong> Mid-gray noise (avg ~16 bits)</p>
                                        <p><strong>Bad PRNG:</strong> Too dark/bright, or visible patterns</p>
                                        <p className="mt-2 text-yellow-400">💡 Tests bit balance across entire word</p>
                                    </>
                                )}
                                {mode === 'pair' && (
                                    <>
                                        <p className="font-bold text-lab-accent">Successive Pair Plot</p>
                                        <p>Plots consecutive outputs as (x, y) coordinates on a density map.</p>
                                        <p className="text-gray-400">• X-axis = previous value mod resolution</p>
                                        <p className="text-gray-400">• Y-axis = current value mod resolution</p>
                                        <p className="text-gray-400">• Brightness = hit frequency (log scale)</p>
                                        <p className="mt-2"><strong>Good PRNG:</strong> Uniform scatter across entire canvas</p>
                                        <p><strong>Bad PRNG:</strong> Few dots, lines, patterns, or clustering</p>
                                        <p className="mt-2 text-yellow-400">💡 Reveals correlation between successive outputs</p>
                                    </>
                                )}
                                {mode === 'transition' && (
                                    <>
                                        <p className="font-bold text-lab-accent">Transition XOR Differences</p>
                                        <p>Shows XOR between consecutive outputs to reveal bit-flip patterns.</p>
                                        <p className="text-gray-400">• Computes: current ⊕ previous</p>
                                        <p className="text-gray-400">• Highlights which bits change</p>
                                        <p className="text-gray-400">• XOR difference mapped to grayscale</p>
                                        <p className="mt-2"><strong>Good PRNG:</strong> Random gray noise (high entropy changes)</p>
                                        <p><strong>Bad PRNG:</strong> Repetitive patterns or low variation</p>
                                        <p className="mt-2 text-yellow-400">💡 Detects predictable state transitions</p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Bit Statistics Panel */}
                    {showBitStats && bitStats && (
                        <div className="absolute top-4 right-4 bg-lab-800/95 backdrop-blur border border-lab-700 rounded shadow-2xl p-4 max-h-[80vh] overflow-y-auto" style={{ width: '320px' }}>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-lab-accent">Bit Statistics</h3>
                                <button 
                                    onClick={() => setShowBitStats(false)}
                                    className="px-2 py-1 hover:bg-lab-700 rounded text-xs transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="space-y-1">
                                {bitStats.map(({ bit, proportion, imbalance }) => (
                                    <div key={bit} className="flex items-center gap-2 text-xs font-mono">
                                        <span className="w-8 text-gray-400">{bit}:</span>
                                        <div className="flex-1 bg-lab-900 rounded overflow-hidden h-5 relative">
                                            <div 
                                                className="h-full bg-lab-accent/60"
                                                style={{ width: `${proportion * 100}%` }}
                                            />
                                            <span className="absolute inset-0 flex items-center justify-center text-[10px]">
                                                {(proportion * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <span className={`w-12 text-right ${
                                            imbalance > 0.1 ? 'text-red-400' : imbalance > 0.05 ? 'text-yellow-400' : 'text-green-400'
                                        }`}>
                                            {(imbalance * 100).toFixed(1)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-lab-700 text-[10px] text-gray-500">
                                <div>Proportion: % of 1s in bit position</div>
                                <div>Imbalance: |0.5 - proportion|</div>
                                <div className="mt-1">
                                    <span className="text-green-400">Green</span>: &lt;5% | 
                                    <span className="text-yellow-400"> Yellow</span>: 5-10% | 
                                    <span className="text-red-400"> Red</span>: &gt;10%
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="absolute bottom-4 left-4 right-20 bg-lab-danger border border-red-700 text-white px-4 py-3 rounded shadow-2xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-sm">Error</div>
                                    <div className="text-xs mt-1">{error}</div>
                                </div>
                                <button 
                                    onClick={() => setError(null)}
                                    className="px-2 py-1 hover:bg-red-700 rounded text-xs"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Loading Overlay */}
                    {isGenerating && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                            <div className="w-12 h-12 border-4 border-lab-accent border-t-transparent rounded-full animate-spin mb-4"></div>
                            <div className="text-lab-accent font-mono text-sm animate-pulse">Processing {resolution}×{resolution} pixels...</div>
                        </div>
                    )}
                </main>
                </>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
