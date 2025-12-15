// ==========================================
// Toolbar Component
// Panel header with controls
// ==========================================

function Toolbar({ 
    panel, 
    panelSide, 
    modes, 
    builtInGenerators, 
    presets,
    onUpdatePanel,
    onGenerate 
}) {
    return (
        <div className="bg-lab-800 border-b border-lab-700 px-4 py-2 flex items-center gap-3">
            {/* Menu Button */}
            <div className="relative">
                <button 
                    onClick={() => onUpdatePanel({ showMenu: !panel.showMenu })}
                    className="p-1.5 bg-lab-700 hover:bg-lab-600 rounded transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                
                {panel.showMenu && (
                    <div className="absolute top-full left-0 mt-1 w-72 bg-lab-900 border border-lab-700 rounded shadow-xl z-50 p-3 space-y-3 max-h-[70vh] overflow-y-auto">
                        <button 
                            onClick={() => onUpdatePanel({ showMenu: false })}
                            className="absolute top-1 right-1 px-2 py-1 hover:bg-lab-700 rounded text-xs"
                        >
                            ✕
                        </button>
                        
                        <div className="text-xs font-bold text-lab-accent pt-4">
                            {panelSide.toUpperCase()} Panel Menu
                        </div>
                        
                        {/* Mode Dropdown */}
                        <div>
                            <button
                                onClick={() => onUpdatePanel({ showModeMenu: !panel.showModeMenu })}
                                className="w-full px-2 py-1.5 bg-lab-800 hover:bg-lab-700 rounded text-xs flex items-center justify-between"
                            >
                                <span>Mode: {modes.find(m => m.id === panel.mode)?.label}</span>
                                <span>{panel.showModeMenu ? '▲' : '▼'}</span>
                            </button>
                            {panel.showModeMenu && (
                                <div className="mt-1 space-y-1 pl-2">
                                    {modes.map((m) => (
                                        <button 
                                            key={m.id}
                                            onClick={() => onUpdatePanel({ mode: m.id, showModeMenu: false })}
                                            className={`w-full px-2 py-1 text-left text-xs rounded ${
                                                panel.mode === m.id ? 'bg-lab-accent text-lab-900' : 'bg-lab-800 hover:bg-lab-700'
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
                                onClick={() => onUpdatePanel({ showBuiltInMenu: !panel.showBuiltInMenu })}
                                className="w-full px-2 py-1.5 bg-lab-800 hover:bg-lab-700 rounded text-xs flex items-center justify-between"
                            >
                                <span>
                                    {panel.builtInGenerator 
                                        ? `Built-In: ${builtInGenerators.find(g => g.type === panel.builtInGenerator)?.name}` 
                                        : 'Built-In: Custom'}
                                </span>
                                <span>{panel.showBuiltInMenu ? '▲' : '▼'}</span>
                            </button>
                            {panel.showBuiltInMenu && (
                                <div className="mt-1 space-y-1 pl-2">
                                    <button 
                                        onClick={() => onUpdatePanel({ builtInGenerator: '', showBuiltInMenu: false })}
                                        className={`w-full px-2 py-1 text-left text-xs rounded ${
                                            !panel.builtInGenerator ? 'bg-lab-accent text-lab-900' : 'bg-lab-800 hover:bg-lab-700'
                                        }`}
                                    >
                                        Use Custom
                                    </button>
                                    {builtInGenerators.map((g) => (
                                        <button 
                                            key={g.type}
                                            onClick={() => onUpdatePanel({ builtInGenerator: g.type, showBuiltInMenu: false })}
                                            className={`w-full px-2 py-1 text-left text-xs rounded ${
                                                panel.builtInGenerator === g.type ? 'bg-lab-accent text-lab-900' : 'bg-lab-800 hover:bg-lab-700'
                                            }`}
                                        >
                                            <div className="font-semibold">{g.name}</div>
                                            <div className="text-[10px] text-gray-500">{g.description}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Presets */}
                        <div>
                            <button
                                onClick={() => onUpdatePanel({ showPresetsMenu: !panel.showPresetsMenu })}
                                className="w-full px-2 py-1.5 bg-lab-800 hover:bg-lab-700 rounded text-xs flex items-center justify-between"
                            >
                                <span>Presets</span>
                                <span>{panel.showPresetsMenu ? '▲' : '▼'}</span>
                            </button>
                            {panel.showPresetsMenu && (
                                <div className="mt-1 space-y-1 pl-2">
                                    {presets.map((p) => (
                                        <button 
                                            key={p.name}
                                            onClick={() => onUpdatePanel({ equation: p.code, showPresetsMenu: false })}
                                            className="w-full px-2 py-1 text-left text-xs bg-lab-800 hover:bg-lab-700 rounded"
                                        >
                                            {p.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Contrast Stretch */}
                        <div>
                            <button
                                onClick={() => onUpdatePanel({ showContrastMenu: !panel.showContrastMenu })}
                                className="w-full px-2 py-1.5 bg-lab-800 hover:bg-lab-700 rounded text-xs flex items-center justify-between"
                            >
                                <span>Contrast {panel.contrastStretch.enabled ? '✓' : ''}</span>
                                <span>{panel.showContrastMenu ? '▲' : '▼'}</span>
                            </button>
                            {panel.showContrastMenu && (
                                <div className="mt-1 bg-lab-800 rounded p-2">
                                    <div className="text-[10px] text-yellow-400 mb-2 font-bold">⚠️ VISUAL AID</div>
                                    <label className="flex items-center gap-2 mb-2">
                                        <input 
                                            type="checkbox" 
                                            checked={panel.contrastStretch.enabled}
                                            onChange={(e) => onUpdatePanel({ 
                                                contrastStretch: {...panel.contrastStretch, enabled: e.target.checked}
                                            })}
                                            className="w-3 h-3"
                                        />
                                        <span className="text-xs">Enable</span>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Equation */}
            <input
                type="text"
                value={panel.equation}
                onChange={(e) => onUpdatePanel({ equation: e.target.value })}
                className="flex-1 bg-lab-900 border border-lab-700 rounded px-2 py-1 font-mono text-xs text-green-400 focus:outline-none focus:border-lab-accent"
                placeholder="e.g. x ^ (x << 13)"
            />
            
            {/* Seed */}
            <input 
                type="number" 
                value={panel.seed}
                onChange={(e) => onUpdatePanel({ seed: e.target.value })}
                className="w-24 bg-lab-900 border border-lab-700 rounded px-2 py-1 font-mono text-xs"
                placeholder="Seed"
            />
            
            {/* Resolution */}
            <select 
                value={panel.resolution}
                onChange={(e) => onUpdatePanel({ resolution: parseInt(e.target.value) })}
                className="bg-lab-900 border border-lab-700 rounded px-2 py-1 font-mono text-xs"
            >
                <option value="256">256</option>
                <option value="512">512</option>
                <option value="1024">1024</option>
            </select>
                        {/* Value Mapping (Raw mode only) */}
            {panel.mode === 'raw' && (
                <select 
                    value={panel.mappingMode || 'linear'}
                    onChange={(e) => onUpdatePanel({ mappingMode: e.target.value })}
                    className="bg-lab-900 border border-lab-700 rounded px-2 py-1 text-xs"
                    title="Value Mapping"
                >
                    <option value="linear">Linear</option>
                    <option value="log">Log</option>
                    <option value="rank">Rank</option>
                </select>
            )}
                        {/* Generate Button */}
            <button 
                onClick={onGenerate}
                disabled={panel.isGenerating}
                className={`px-3 py-1 rounded text-xs font-bold uppercase ${
                    panel.isGenerating 
                    ? 'bg-lab-700 text-gray-500 cursor-not-allowed' 
                    : 'bg-lab-accent text-lab-900 hover:bg-white'
                }`}
            >
                {panel.isGenerating ? 'Gen...' : 'Generate'}
            </button>
            
            {/* Info Button */}
            <button 
                onClick={() => onUpdatePanel({ showModeDescription: !panel.showModeDescription })}
                className="px-2 py-1 bg-lab-700 hover:bg-lab-600 rounded text-xs transition-colors"
                title="Mode Information"
            >
                📖 Info
            </button>
        </div>
    );
}
