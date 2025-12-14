# PRNG Visual Analyzer 🎨

A powerful visualization tool for analyzing Pseudo-Random Number Generators (PRNGs) through visual patterns. Experiment with custom equations or built-in generators to understand their output quality and detect biases.

![PRNG Visualizer](https://img.shields.io/badge/React-18-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- **Custom Equations**: Write your own PRNG logic using mathematical operators
- **Built-in Generators**: LCG, Xorshift32, SplitMix, and intentionally flawed examples
- **Multiple Visualization Modes**: Raw output, bit planes, differential analysis
- **Split-View Comparison**: Compare two generators side-by-side
- **Bit Statistics**: Analyze bit distribution and detect biases
- **Zoom & Pan**: Inspect patterns at pixel level
- **Contrast Stretch**: Enhance subtle patterns (visual aid only)
- **Export/Import**: Save and share configurations
- **Web Workers**: Non-blocking computation for large images

## 🚀 Quick Start

### Option 1: Single File (Easiest)
Open [test.html](test.html) directly in a browser - all functionality in one file!

### Option 2: Modular Version (Development)
**⚠️ IMPORTANT**: Must use HTTP server due to CORS restrictions

```bash
# Python 3
python -m http.server 8000

# Then open: http://localhost:8000/index.html
```

## 📁 Project Structure

## 📁 Project Structure

### Modular Files (index.html)
```
├── index.html          # Entry point, loads all dependencies
├── App.js              # Main React application
├── worker.js           # PRNG computation (Web Worker)
├── styles.css          # Custom styles
├── constants.js        # Presets, modes, generator definitions
└── components/
    ├── CanvasViewport.js   # Canvas rendering with zoom
    ├── Toolbar.js          # Control panel header
    └── Panel.js            # Split-view panel
```

### Single File Version
- **test.html** - Complete standalone implementation (all features in one file)

## 🎮 How to Use

1. **Enter an Equation**: Use operators like `+`, `-`, `*`, `^` (XOR), `&`, `|`, `<<`, `>>`
   - Variable `x` represents the previous output
   - Example: `x ^ (x << 13)` creates interesting patterns

2. **Set Parameters**:
   - **Seed**: Starting value (use Random button for variety)
   - **Resolution**: Image size (256×256, 512×512, or 1024×1024)

3. **Choose Mode** (via Menu):
   - **Raw Output**: Direct PRNG output as grayscale
   - **Bit Plane**: Visualize individual bit positions
   - **Differential**: Show changes between consecutive outputs

4. **Generate**: Click to create visualization

5. **Analyze**:
   - **Zoom**: Mouse wheel or +/- buttons
   - **Pan**: Click and drag
   - **Stats**: View bit distribution (📊 button)

### Example Equations

```javascript
x ^ (x << 13)              // Good: Xorshift-like
x * 1103515245 + 12345     // Classic LCG
(x << 5) | (x >> 27)       // Rotate left
x ^ (x >> 7) ^ (x << 9)    // Multiple XOR shifts
(x * x) >> 8               // Quadratic (bad!)
```

## 🔧 Technical Details

- **React 18**: UI framework (loaded via CDN)
- **Tailwind CSS**: Styling (loaded via CDN)
- **Babel Standalone**: JSX transformation (no build step needed)
- **Web Workers**: Offload computation to separate thread
- **Canvas API**: High-performance pixel rendering

## 📊 Understanding Output

- **Good PRNGs**: Show "white noise" patterns, even bit distribution
- **Bad PRNGs**: Reveal stripes, grids, or repeating structures
- **Bit Stats**: Healthy generators have ~50% proportion per bit (low imbalance)

## 🤝 Contributing

Contributions welcome! Feel free to:
- Add new built-in generators
- Implement additional visualization modes
- Improve performance optimizations
- Fix bugs or enhance UI

## 📄 License

MIT License - feel free to use and modify!

---

## 🛠️ Development Notes

### File Loading Order (index.html)
1. React & ReactDOM
2. Babel Standalone
3. Tailwind CSS
4. constants.js
5. Component files
6. App.js

### Worker Communication
```javascript
// Send to worker
worker.postMessage({
  equation, seed, resolution, mode,
  bitPlaneIndex, contrastStretch
});

// Receive from worker
worker.onmessage = (e) => {
  const { success, buffer, resolution, stats } = e.data;
  // Draw buffer to canvas...
};
```

## Troubleshooting

### CORS / Page doesn't load
- **Problem**: Must serve via HTTP (not `file://`)
- **Solution**: Use Python/Node HTTP server or VS Code Live Server extension

### Components not showing
- Check browser console for errors
- Verify all files are in the correct directory
- Ensure constants.js loads before App.js

### Worker errors
- Verify worker.js is in the same directory as index.html
- Check browser console for worker-specific errors

---

**Made with ❤️ for understanding randomness through visualization**
