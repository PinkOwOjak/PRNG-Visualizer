// ==========================================
// Panel Component
// Split view panel with toolbar and canvas
// ==========================================

function Panel({
    panelSide,
    panel,
    canvasRef,
    modes,
    builtInGenerators,
    presets,
    onUpdatePanel,
    onGenerate,
    onWheel,
    onSetActive
}) {
    const handleZoomChange = (newScale) => {
        onUpdatePanel({ scale: newScale });
    };
    
    const handlePanChange = (newPan) => {
        onUpdatePanel({ pan: newPan });
    };
    
    return (
        <div 
            className="flex-1 flex flex-col bg-lab-900"
            onMouseEnter={onSetActive}
            onWheel={onWheel}
        >
            <Toolbar
                panel={panel}
                panelSide={panelSide}
                modes={modes}
                builtInGenerators={builtInGenerators}
                presets={presets}
                onUpdatePanel={onUpdatePanel}
                onGenerate={onGenerate}
            />
            
            <CanvasViewport
                canvasRef={canvasRef}
                panel={panel}
                onZoomChange={handleZoomChange}
                onPanChange={handlePanChange}
            />
        </div>
    );
}
