/**
 * GEMINI AI INTEGRATION — SMART MODEL CASCADE
 * ============================================
 * Real AI-powered pulmonary nodule detection.
 * Automatically tries multiple models so quota issues on one
 * never block the analysis.
 *
 * Free Tier (Google AI Studio):
 *   Get a FREE key at: https://aistudio.google.com/app/apikey
 *
 * Model priority order (fastest/newest first):
 *   1. gemini-2.0-flash     – 15 RPM, 1500 RPD
 *   2. gemini-2.0-flash-lite – 30 RPM, 1500 RPD (lighter quota)
 *   3. gemini-2.5-flash     – 10 RPM, 500 RPD
 *   4. gemini-flash-lite-latest – alias for flash-lite
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Models tried in order — first success wins
const VISION_MODELS = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.5-flash',
    'gemini-flash-lite-latest',
];

const CHAT_MODELS = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.5-flash',
    'gemini-flash-lite-latest',
];

// ==========================================
// HELPERS
// ==========================================

function isQuotaError(err) {
    return err.message.includes('429') ||
        err.message.includes('Too Many') ||
        err.message.includes('quota') ||
        err.message.includes('RESOURCE_EXHAUSTED');
}

function isNotFoundError(err) {
    return err.message.includes('404') || err.message.includes('not found');
}

/**
 * Try each model in turn; skip to the next on quota/404 errors.
 */
async function tryModels(models, fn) {
    const errors = [];
    for (const modelName of models) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await fn(model, modelName);
            console.log(`✅ Used model: ${modelName}`);
            return { result, modelName };
        } catch (err) {
            if (isQuotaError(err) || isNotFoundError(err)) {
                console.warn(`⚠️  ${modelName} unavailable (${err.message.includes('429') ? 'quota' : '404'}) — trying next model`);
                errors.push(`${modelName}: ${err.message.includes('429') ? 'quota exceeded' : 'not found'}`);
                continue;
            }
            // Non-quota error — throw immediately
            throw err;
        }
    }
    // All models exhausted
    throw new Error(
        `All Gemini models quota-exceeded. Please wait a minute and try again.\n` +
        `Details: ${errors.join(' | ')}\n` +
        `Free tier allows 15–30 req/min. If you sent many requests in a row, wait 60 seconds.`
    );
}

// ==========================================
// CT SCAN ANALYSIS
// ==========================================

const VISION_PROMPT = `You are an AI medical imaging assistant specialized in pulmonary radiology.
Analyze this image and respond ONLY with a valid JSON object (no markdown, no extra text):

{
  "result": "<one of: 'Nodule Detected - Benign', 'Nodule Detected - Malignant', 'No Nodule Detected', 'Indeterminate - Further Evaluation Required'>",
  "confidence": <integer 60-98>,
  "riskLevel": "<one of: none, low, moderate, high>",
  "description": "<2-3 sentence clinical description>",
  "technicalDetails": {
    "noduleSize": "<e.g. '8.5 mm' or 'N/A'>",
    "location": "<e.g. 'Right Upper Lobe' or 'N/A'>",
    "shape": "<e.g. 'Round, well-defined' or 'N/A'>",
    "density": "<e.g. 'Solid', 'Ground-glass', 'Part-solid' or 'N/A'>"
  },
  "recommendations": ["<rec 1>","<rec 2>","<rec 3>","<rec 4>"],
  "imageQuality": "<one of: Good, Fair, Poor, Not a CT scan>",
  "findings": "<radiological findings 2-4 sentences based only on what is visible>"
}

If this is not a real CT scan (e.g., a regular photo or synthetic image), still analyze it fully and set imageQuality to 'Not a CT scan'.`;

/**
 * Analyze a CT scan image using the best available Gemini Vision model.
 * @param {string} imagePath - Absolute path to the uploaded image
 * @returns {Object} Structured prediction result
 */
async function analyzeCTScan(imagePath) {
    const startTime = Date.now();

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
        throw new Error('GEMINI_API_KEY is not configured. Please add your API key to backend/.env. Get a FREE key at https://aistudio.google.com/app/apikey');
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = path.extname(imagePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';

    const imagePart = { inlineData: { mimeType, data: base64Image } };

    console.log('🤖 Starting Gemini Vision analysis (cascade mode)...');

    const { result: geminiResult, modelName } = await tryModels(VISION_MODELS, async (model) => {
        return model.generateContent([VISION_PROMPT, imagePart]);
    });

    const text = geminiResult.response.text();
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`📊 Analysis complete via ${modelName} (${processingTime}s)`);

    // Parse JSON — strip markdown fences if present
    let parsed;
    try {
        const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        parsed = JSON.parse(clean);
    } catch {
        console.warn('⚠️  JSON parse failed — using text-based fallback extractor');
        parsed = extractFallback(text);
    }

    return {
        result: str(parsed.result, 'Indeterminate - Further Evaluation Required'),
        confidence: parseFloat((parsed.confidence || 75).toFixed(2)),
        riskLevel: str(parsed.riskLevel, 'moderate'),
        description: str(parsed.description, 'Analysis completed. Please consult a medical professional.'),
        technicalDetails: {
            noduleSize: parsed.technicalDetails?.noduleSize || 'N/A',
            location: parsed.technicalDetails?.location || 'N/A',
            shape: parsed.technicalDetails?.shape || 'N/A',
            density: parsed.technicalDetails?.density || 'N/A',
        },
        recommendations: Array.isArray(parsed.recommendations) && parsed.recommendations.length
            ? parsed.recommendations
            : defaultRecommendations(),
        imageQuality: str(parsed.imageQuality, 'Fair'),
        findings: str(parsed.findings, 'Image analyzed by Gemini Vision AI.'),
        processingTime: parseFloat(processingTime),
        timestamp: new Date().toISOString(),
        modelVersion: modelName,
        analysisEngine: 'Google Gemini Vision AI',
    };
}

// ==========================================
// INTELLIGENT CHATBOT
// ==========================================

const SYSTEM_INSTRUCTION = `You are a knowledgeable and empathetic medical information assistant for a Pulmonary Nodule Detection web application.

Help patients and healthcare professionals understand:
- Pulmonary (lung) nodules — what they are, types, causes
- The AI detection system and its limitations
- Medical terms in CT scan reports
- General lung health, prevention, lifestyle
- Next steps after nodule detection
- When to seek urgent medical care

Guidelines:
- Encourage consulting qualified medical professionals for actual diagnosis
- Never provide a personal diagnosis
- Be empathetic, clear, and use plain language (avoid jargon)
- Keep responses to 2-3 paragraphs max`;

/**
 * Get an intelligent chatbot response using the best available model.
 */
async function getChatbotResponse(userMessage, conversationHistory = []) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
        throw new Error('GEMINI_API_KEY not configured');
    }

    const { result, modelName } = await tryModels(CHAT_MODELS, async (model) => {
        const m = genAI.getGenerativeModel({ model: model.model, systemInstruction: SYSTEM_INSTRUCTION });
        const chat = m.startChat({
            history: conversationHistory
                .filter(m => m.role === 'user' || m.role === 'model')
                .map(m => ({ role: m.role, parts: [{ text: m.text }] })),
        });
        return chat.sendMessage(userMessage);
    });

    console.log(`💬 Chatbot response via ${modelName}`);
    return result.response.text();
}

// ==========================================
// UTILITIES
// ==========================================

function str(val, fallback) {
    return typeof val === 'string' && val.trim() ? val.trim() : fallback;
}

function defaultRecommendations() {
    return [
        'Consult with a pulmonologist for proper evaluation',
        'Consider additional imaging if clinically indicated',
        'Regular follow-up as recommended by your physician',
        'Maintain healthy lifestyle and avoid smoking',
    ];
}

function extractFallback(text) {
    const lower = text.toLowerCase();
    let result = 'Indeterminate - Further Evaluation Required', riskLevel = 'moderate', confidence = 74;
    if (lower.includes('benign')) { result = 'Nodule Detected - Benign'; riskLevel = 'low'; confidence = 78; }
    else if (lower.includes('malignant') || lower.includes('cancer')) { result = 'Nodule Detected - Malignant'; riskLevel = 'high'; confidence = 72; }
    else if (lower.includes('no nodule') || lower.includes('normal')) { result = 'No Nodule Detected'; riskLevel = 'none'; confidence = 88; }
    return {
        result, confidence, riskLevel,
        description: 'Analysis completed.',
        technicalDetails: { noduleSize: 'N/A', location: 'N/A', shape: 'N/A', density: 'N/A' },
        recommendations: defaultRecommendations(),
        imageQuality: 'Fair',
        findings: text.substring(0, 500),
    };
}

module.exports = { analyzeCTScan, getChatbotResponse };
