// ==========================================
// PRNG Visualizer Worker
// ==========================================

self.onmessage = function(e) {
    const { equation, seed, resolution, mode, bitPlaneIndex, contrastStretch, useBuiltIn, builtInType } = e.data;
    
    try {
        let finalEquation = equation;
        if (useBuiltIn && builtInType) {
            finalEquation = builtInType;
        }
        
        const result = generateImage(finalEquation, seed, resolution, mode, bitPlaneIndex, contrastStretch, true);
        
        self.postMessage({ 
            success: true, 
            buffer: result.buffer, 
            stats: result.stats, 
            resolution: resolution 
        }, [result.buffer]);
        
    } catch (err) {
        console.error('Worker error:', err);
        self.postMessage({ success: false, error: err.message });
    }
};

function tokenize(eq) {
    const cleanEq = eq.replace(/\s+/g, '');
    
    // Check for orphan hex letters (A-F without 0x prefix)
    // First remove valid 0x hex numbers, then check for remaining hex letters
    const withoutValidHex = cleanEq.replace(/0x[0-9a-fA-F]+/g, '');
    const orphanHexPattern = /[a-fA-F]+/g;
    const orphanHexMatches = withoutValidHex.match(orphanHexPattern);
    if (orphanHexMatches) {
        // Filter out 'x' variable and ROL/ROR which are valid
        const invalidHex = orphanHexMatches.filter(m => 
            m.toLowerCase() !== 'x' && 
            m.toUpperCase() !== 'rol' && 
            m.toUpperCase() !== 'ror' &&
            m.toLowerCase() !== 'r' &&
            m.toLowerCase() !== 'o' &&
            m.toLowerCase() !== 'l'
        );
        if (invalidHex.length > 0) {
            throw new Error(`Invalid hex notation: ${[...new Set(invalidHex)].join(', ')}. Hex numbers must use 0x prefix (e.g., 0xFF not FF)`);
        }
    }
    
    // First, extract ROL/ROR and replace temporarily to validate other chars
    const tempEq = cleanEq.replace(/ROL|ROR/gi, '');
    const validPattern = /^[0-9a-fA-Fx+\-*^&|~()<>,]*$/;
    if (!validPattern.test(tempEq)) {
        const invalidChars = tempEq.match(/[^0-9a-fA-Fx+\-*^&|~()<>,]/g);
        throw new Error(`Invalid characters in equation: ${[...new Set(invalidChars)].join(', ')}. Only these are allowed: 0-9, x, +, -, *, ^, &, |, ~, <<, >>, (, ), ROL, ROR`);
    }
    
    const regex = /(ROL|ROR)|((?:0x[0-9a-fA-F]+)|\d+)|(<<|>>)|([+\-*^&|~()])|(,)|(x)/gi;
    const tokens = [];
    let match;
    let lastIndex = 0;
    
    while ((match = regex.exec(cleanEq)) !== null) {
        if (match[1]) tokens.push({ type: 'OP', value: match[1].toUpperCase() });
        else if (match[2]) tokens.push({ type: 'NUM', value: parseInt(match[2]) });
        else if (match[3]) tokens.push({ type: 'OP', value: match[3] });
        else if (match[4]) tokens.push({ type: match[4] === '(' || match[4] === ')' ? 'PAREN' : 'OP', value: match[4] });
        else if (match[5]) {} // Skip commas - they're just separators
        else if (match[6]) tokens.push({ type: 'VAR', value: 'x' });
        lastIndex = regex.lastIndex;
    }
    
    if (tokens.length === 0) {
        throw new Error('Empty or invalid equation');
    }
    
    return tokens;
}

function toRPN(tokens) {
    const outputQueue = [];
    const opStack = [];
    
    const precedence = {
        '~': 6,
        '*': 5,
        '+': 4, '-': 4,
        '<<': 3, '>>': 3, 'ROL': 3, 'ROR': 3,
        '&': 2,
        '^': 1,
        '|': 0
    };

    tokens.forEach(token => {
        if (token.type === 'NUM' || token.type === 'VAR') {
            outputQueue.push(token);
        } else if (token.type === 'OP') {
            if (token.value === '~') {
                opStack.push(token);
            } else {
                while (
                    opStack.length > 0 &&
                    opStack[opStack.length - 1].type === 'OP' &&
                    precedence[opStack[opStack.length - 1].value] >= precedence[token.value]
                ) {
                    outputQueue.push(opStack.pop());
                }
                opStack.push(token);
            }
        } else if (token.value === '(') {
            opStack.push(token);
        } else if (token.value === ')') {
            while (opStack.length > 0 && opStack[opStack.length - 1].value !== '(') {
                outputQueue.push(opStack.pop());
            }
            if (opStack.length === 0) throw new Error("Mismatched parentheses");
            opStack.pop();
        }
    });

    while (opStack.length > 0) {
        const op = opStack.pop();
        if (op.value === '(') throw new Error("Mismatched parentheses");
        outputQueue.push(op);
    }

    return outputQueue;
}

function evaluateRPN(rpn, x_val) {
    const stack = [];
    const len = rpn.length;
    
    for (let i = 0; i < len; i++) {
        const token = rpn[i];
        const type = token.type;
        
        if (type === 'NUM') {
            stack.push(token.value);
        } else if (type === 'VAR') {
            stack.push(x_val);
        } else {
            const op = token.value;
            if (op === '~') {
                stack.push((~stack.pop()) >>> 0);
            } else {
                const b = stack.pop();
                const a = stack.pop();
                let res;
                
                if (op === '+') res = (a + b) | 0;
                else if (op === '-') res = (a - b) | 0;
                else if (op === '*') res = Math.imul(a, b);
                else if (op === '&') res = a & b;
                else if (op === '|') res = a | b;
                else if (op === '^') res = a ^ b;
                else if (op === '<<') res = a << (b & 31);
                else if (op === '>>') res = a >>> (b & 31);
                else if (op === 'ROL') res = (a << (b & 31)) | (a >>> (32 - (b & 31)));
                else if (op === 'ROR') res = (a >>> (b & 31)) | (a << (32 - (b & 31)));
                else throw new Error("Unknown operator: " + op);
                
                stack.push(res >>> 0);
            }
        }
    }
    
    return stack[0];
}

function popcount(n) {
    n = n - ((n >>> 1) & 0x55555555);
    n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
    return ((n + (n >>> 4) & 0xF0F0F0F) * 0x1010101) >>> 24;
}

// Built-in Reference Generators
function lcg(x) {
    return ((x * 1664525) + 1013904223) >>> 0;
}

function xorshift32(x) {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return x >>> 0;
}

function splitmix(x) {
    // Using 32-bit safe multipliers instead of 64-bit constants
    x = (x ^ (x >>> 16)) * 0x85ebca6b;
    x = (x ^ (x >>> 13)) * 0xc2b2ae35;
    x = x ^ (x >>> 16);
    return x >>> 0;
}

function badGenerator1(x) {
    return (x + 4) >>> 0;
}

function badGenerator2(x) {
    return (x * 2) >>> 0;
}

function generateImage(eqStr, seed, res, mode, bitPlaneIndex, contrastStretch, onProgress) {
    const totalPixels = res * res;
    
    // Check if using built-in generator
    const builtInGenerators = {
        'lcg': lcg,
        'xorshift32': xorshift32,
        'splitmix': splitmix,
        'bad1': badGenerator1,
        'bad2': badGenerator2
    };
    
    const isBuiltIn = builtInGenerators.hasOwnProperty(eqStr);
    const generatorFunc = isBuiltIn ? builtInGenerators[eqStr] : null;
    
    let tokens, rpn;
    if (!isBuiltIn) {
        if (/[/%]/.test(eqStr)) throw new Error("Division (/) and Modulo (%) are forbidden.");
        if (/[.]/.test(eqStr)) throw new Error("Floating points are forbidden.");
        
        tokens = tokenize(eqStr);
        rpn = toRPN(tokens);
    }
    
    const buffer = new Uint8ClampedArray(totalPixels * 4);
    const bitCounts = new Uint32Array(32);
    const rawValues = new Uint32Array(totalPixels);
    
    let x = seed >>> 0;
    let progressReportInterval = Math.floor(totalPixels / 100) || 1000;
    
    if (mode === 'pair') {
        const density = new Uint32Array(totalPixels);
        let maxHits = 0;
        
        for (let i = 0; i < totalPixels; i++) {
            x = isBuiltIn ? generatorFunc(x) : evaluateRPN(rpn, x);
            
            const px = (seed >>> 0) % res;
            const py = x % res;
            
            const idx = (py * res) + px;
            density[idx]++;
            if (density[idx] > maxHits) maxHits = density[idx];
            
            seed = x;
            
            if (onProgress && i % progressReportInterval === 0) {
                self.postMessage({ type: 'progress', progress: (i / totalPixels) * 100 });
            }
        }
        
        // Use logarithmic scaling for better visibility of low-density points
        for (let i = 0; i < totalPixels; i++) {
            let val = 0;
            if (density[i] > 0) {
                // Log scale: log(hits + 1) normalized to 0-255
                const logMax = Math.log(maxHits + 1);
                val = Math.floor((Math.log(density[i] + 1) / logMax) * 255);
            }
            const pIdx = i << 2;
            buffer[pIdx] = val;
            buffer[pIdx + 1] = val;
            buffer[pIdx + 2] = val;
            buffer[pIdx + 3] = 255;
        }
        
        return { buffer: buffer.buffer, stats: { maxHits } };
    } 
    
    else {
        let prev_x = x;
        const inv = 1 / 4294967296;
        let minVal = 255, maxVal = 0;
        
        // Fast path: single-pass when contrast stretch is disabled
        if (!contrastStretch || !contrastStretch.enabled) {
            console.log('[generateImage] Taking FAST path (no contrast stretch)');
            for (let i = 0; i < totalPixels; i++) {
                x = isBuiltIn ? generatorFunc(x) : evaluateRPN(rpn, x);
                
                for (let bit = 0; bit < 32; bit++) {
                    if ((x >>> bit) & 1) bitCounts[bit]++;
                }
                
                let gray = 0;
                
                if (mode === 'raw') {
                    gray = (x * inv * 255) | 0;
                } 
                else if (mode === 'bit') {
                    gray = ((x >>> bitPlaneIndex) & 1) * 255;
                } 
                else if (mode === 'hamming') {
                    const weight = popcount(x);
                    gray = Math.floor((weight / 32) * 255);
                } 
                else if (mode === 'transition') {
                    const diff = x ^ prev_x;
                    gray = Math.floor((diff >>> 0) / 4294967296 * 255);
                    prev_x = x;
                }
                
                const pIdx = i << 2;
                buffer[pIdx] = gray;
                buffer[pIdx + 1] = gray;
                buffer[pIdx + 2] = gray;
                buffer[pIdx + 3] = 255;
                
                if (gray < minVal) minVal = gray;
                if (gray > maxVal) maxVal = gray;
                
                if (onProgress && i % progressReportInterval === 0) {
                    self.postMessage({ type: 'progress', progress: (i / totalPixels) * 100 });
                }
            }
            
            console.log('[Fast path] After generation - minVal:', minVal, 'maxVal:', maxVal);
            // Sample some buffer values
            const samples = [];
            for (let i = 0; i < 40; i += 4) samples.push(buffer[i]);
            console.log('[Fast path] First 10 R values:', samples);
        } 
        // Slow path: two-pass when contrast stretch is enabled
        else {
            // First pass: generate and store raw values
            for (let i = 0; i < totalPixels; i++) {
                x = isBuiltIn ? generatorFunc(x) : evaluateRPN(rpn, x);
                rawValues[i] = x;
                
                for (let bit = 0; bit < 32; bit++) {
                    if ((x >>> bit) & 1) bitCounts[bit]++;
                }
                
                if (onProgress && i % progressReportInterval === 0) {
                    self.postMessage({ type: 'progress', progress: (i / totalPixels) * 50 });
                }
            }
            
            // Second pass: Find min/max from RAW values (for contrast stretch in raw mode)
            let rawMin = 0xFFFFFFFF, rawMax = 0;
            if (mode === 'raw') {
                for (let i = 0; i < totalPixels; i++) {
                    const val = rawValues[i];
                    if (val < rawMin) rawMin = val;
                    if (val > rawMax) rawMax = val;
                }
            }
            
            // Compute grayscale values
            const tempGray = new Uint8Array(totalPixels);
            x = seed >>> 0;
            prev_x = x;
            
            for (let i = 0; i < totalPixels; i++) {
                x = rawValues[i];
                let gray = 0;
                
                if (mode === 'raw') {
                    // Apply contrast stretch to RAW values before converting to grayscale
                    const rawRange = rawMax - rawMin;
                    if (rawRange > 0) {
                        gray = Math.floor(((x - rawMin) / rawRange) * 255);
                    } else {
                        gray = (x * inv * 255) | 0;
                    }
                } 
                else if (mode === 'bit') {
                    gray = ((x >>> bitPlaneIndex) & 1) * 255;
                } 
                else if (mode === 'hamming') {
                    const weight = popcount(x);
                    gray = Math.floor((weight / 32) * 255);
                } 
                else if (mode === 'transition') {
                    const diff = x ^ prev_x;
                    gray = Math.floor((diff >>> 0) / 4294967296 * 255);
                    prev_x = x;
                }
                
                tempGray[i] = gray;
                if (gray < minVal) minVal = gray;
                if (gray > maxVal) maxVal = gray;
                
                if (onProgress && i % progressReportInterval === 0) {
                    self.postMessage({ type: 'progress', progress: 50 + (i / totalPixels) * 50 });
                }
            }
            
            // Apply contrast stretch (for non-raw modes, raw already handled)
            // For raw mode, contrast stretch was already applied above
            const useMin = (mode === 'raw') ? 0 : (contrastStretch.auto ? minVal : contrastStretch.min);
            const useMax = (mode === 'raw') ? 255 : (contrastStretch.auto ? maxVal : contrastStretch.max);
            const range = useMax - useMin;
            
            if (mode === 'raw') {
                // Raw mode already has contrast applied, just copy to buffer
                for (let i = 0; i < totalPixels; i++) {
                    const pIdx = i << 2;
                    buffer[pIdx] = tempGray[i];
                    buffer[pIdx + 1] = tempGray[i];
                    buffer[pIdx + 2] = tempGray[i];
                    buffer[pIdx + 3] = 255;
                }
            } else if (range > 0) {
                for (let i = 0; i < totalPixels; i++) {
                    const stretched = ((tempGray[i] - useMin) * 255) / range;
                    const pIdx = i << 2;
                    buffer[pIdx] = stretched | 0;
                    buffer[pIdx + 1] = stretched | 0;
                    buffer[pIdx + 2] = stretched | 0;
                    buffer[pIdx + 3] = 255;
                    
                    if (onProgress && i % progressReportInterval === 0) {
                        self.postMessage({ type: 'progress', progress: 50 + (i / totalPixels) * 50 });
                    }
                }
            } else {
                for (let i = 0; i < totalPixels; i++) {
                    const pIdx = i << 2;
                    buffer[pIdx] = tempGray[i];
                    buffer[pIdx + 1] = tempGray[i];
                    buffer[pIdx + 2] = tempGray[i];
                    buffer[pIdx + 3] = 255;
                }
            }
        }
        
        const bitStats = [];
        for (let bit = 0; bit < 32; bit++) {
            const proportion = bitCounts[bit] / totalPixels;
            const imbalance = Math.abs(0.5 - proportion);
            bitStats.push({ bit, proportion, imbalance });
        }
        
        if (onProgress) {
            self.postMessage({ type: 'progress', progress: 100 });
        }
        
        return { buffer: buffer.buffer, stats: { bitStats, minVal, maxVal } };
    }
}
