// ==========================================
// Constants & Configuration
// ==========================================

const PRNGConstants = {
    presets: [
        { name: "LCG", code: "(x * 1664525) + 1013904223" },
        { name: "Xorshift32", code: "x ^ (x << 13)" },
        { name: "Xorshift with ROL", code: "x ^ (x ROL 13)" },
        { name: "Counter", code: "x + 1" },
        { name: "Bad (Low Bits)", code: "x + 4" },
        { name: "Complex Mix", code: "(x ^ (x >> 15)) * (x | 0x55555555)" }
    ],

    builtInGenerators: [
        { name: "LCG", type: "lcg", description: "Linear Congruential Generator" },
        { name: "Xorshift32", type: "xorshift32", description: "Fast XOR-shift based generator" },
        { name: "SplitMix", type: "splitmix", description: "High-quality hash-based generator" },
        { name: "Bad: +4", type: "bad1", description: "Intentionally poor: x+4" },
        { name: "Bad: x2", type: "bad2", description: "Intentionally poor: x*2" }
    ],

    modes: [
        { id: 'raw', label: 'Raw Value' },
        { id: 'bit', label: 'Bit Plane' },
        { id: 'hamming', label: 'Hamming Weight' },
        { id: 'pair', label: 'Successive Pair' },
        { id: 'transition', label: 'Transition' },
    ]
};
