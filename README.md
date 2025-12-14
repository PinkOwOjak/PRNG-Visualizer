# PRNG Visualizer - Project Structure

## File Organization

### 1. HTML (Entry Point)
- **index.html** - Thin shell that loads all dependencies and scripts
  - Loads React, ReactDOM, Babel, Tailwind CSS
  - Defines root div
  - Loads scripts in correct order

### 2. CSS
- **styles.css** - Custom styles
  - Body and canvas viewport styles
  - Custom scrollbar styling
  - Pixelated image rendering

### 3. Worker Code
- **worker.js** - PRNG computation worker (runs in separate thread)
  - Tokenizer and RPN evaluator
  - Built-in generators (LCG, Xorshift32, SplitMix, etc.)
  - Image generation with fast/slow paths
  - Progress reporting

### 4. Constants
- **constants.js** - Configuration and data
  - Presets (equation templates)
  - Built-in generator definitions
  - Visualization modes

### 5. UI Components
- **components/CanvasViewport.js** - Canvas with zoom controls
- **components/Toolbar.js** - Panel header with inputs and menu
- **components/Panel.js** - Complete split-view panel
- **App.js** - Main application logic

## Usage

### Development

**IMPORTANT**: Due to CORS restrictions, you must serve the files via HTTP, not open them directly as `file://`.

#### Option 1: Python HTTP Server
```bash
# Python 3
python -m http.server 8000

# Then open: http://localhost:8000/index.html
```

#### Option 2: Node.js HTTP Server
```bash
npx http-server -p 8000

# Then open: http://localhost:8000/index.html
```

#### Option 3: VS Code Live Server Extension
- Install "Live Server" extension
- Right-click index.html → "Open with Live Server"

### Loading Worker
The worker is loaded from `worker.js` directly:
```javascript
const worker = new Worker('worker.js');
```

### Component Structure
```
App
├── Single View Mode
│   ├── Header (Menu, Equation, Seed, Resolution, Generate)
│   └── Canvas (with zoom/pan)
└── Split View Mode
    ├── Exit Button
    ├── Left Panel
    │   ├── Toolbar
    │   └── CanvasViewport
    └── Right Panel
        ├── Toolbar
        └── CanvasViewport
```

## Troubleshooting

### Page doesn't load / Components not showing
1. Make sure you're serving via HTTP (not `file://`)
2. Check browser console for errors
3. Verify all files are in correct directories
4. Check that constants.js loads before components

### Worker errors
1. Verify worker.js is in the same directory as index.html
2. Check browser console for worker errors
3. Ensure CORS is not blocking worker loading

## Benefits of Separation

1. **Maintainability** - Each file has a single responsibility
2. **Worker Performance** - Computation runs in separate thread
3. **CSS Organization** - Styles in dedicated file, easy to modify
4. **Component Reusability** - Panel/Toolbar/Canvas can be reused
5. **Debugging** - Easier to locate and fix issues
