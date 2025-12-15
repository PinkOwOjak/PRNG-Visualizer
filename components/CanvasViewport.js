// ==========================================
// CanvasViewport Component
// Handles canvas rendering with zoom and pan
// ==========================================

function CanvasViewport({ canvasRef, panel, onZoomChange, onPanChange }) {
    return (
        <div className="flex-1 relative bg-gray-900">
            <canvas 
                ref={canvasRef}
                style={{ imageRendering: 'pixelated', display: 'block' }}
            />
            
            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-1 bg-lab-800/80 backdrop-blur border border-lab-700 rounded p-1">
                <button 
                    onClick={() => onZoomChange(Math.min(panel.scale * 1.2, 10))}
                    className="px-2 py-0.5 bg-lab-700 hover:bg-lab-600 rounded text-xs"
                >
                    +
                </button>
                <div className="text-[10px] text-center text-gray-400">
                    {Math.round(panel.scale * 100)}%
                </div>
                <button 
                    onClick={() => onZoomChange(Math.max(panel.scale / 1.2, 0.1))}
                    className="px-2 py-0.5 bg-lab-700 hover:bg-lab-600 rounded text-xs"
                >
                    −
                </button>
                <button 
                    onClick={() => {
                        onZoomChange(1);
                        onPanChange({ x: 0, y: 0 });
                    }}
                    className="px-2 py-0.5 bg-lab-700 hover:bg-lab-600 rounded text-[10px] mt-1"
                >
                    Reset
                </button>
            </div>
        </div>
    );
}
