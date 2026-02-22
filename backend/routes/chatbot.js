/**
 * CHATBOT ROUTES
 * Intelligent medical chatbot powered by Google Gemini AI.
 *
 * Uses Gemini 1.5 Flash (FREE tier):
 *   - 15 req/min, 1,500 req/day, 1M tokens/month
 *   - Falls back to rule-based responses if API key is missing */

const express = require('express');
const { getChatbotResponse } = require('../utils/geminiAI');

const router = express.Router();

// ==========================================
// RULE-BASED FALLBACK KNOWLEDGE BASE
// (used when Gemini API is unavailable)
// ==========================================

const knowledgeBase = [
  {
    keywords: ['what is', 'lung nodule', 'pulmonary nodule'],
    response:
      'A lung nodule (or pulmonary nodule) is a small, round or oval-shaped growth in the lung. ' +
      'Most lung nodules are benign (non-cancerous), but some can be malignant. They are typically ' +
      'detected on chest X-rays or CT scans and are usually smaller than 3 cm in diameter.',
  },
  {
    keywords: ['benign', 'non-cancerous', 'not cancer'],
    response:
      'Benign means non-cancerous. A benign nodule will not spread to other parts of the body. ' +
      'However, it still requires monitoring through regular follow-up scans. Common causes include ' +
      'old infections, inflammation, or harmless growths. Your doctor will recommend a monitoring schedule.',
  },
  {
    keywords: ['malignant', 'cancerous', 'cancer', 'lung cancer'],
    response:
      'Malignant means cancerous. A malignant nodule has the potential to spread to other parts of the body. ' +
      'If detected, further diagnostic tests such as biopsy, PET scan, or additional imaging will be needed. ' +
      'Early detection significantly improves treatment outcomes. Please consult an oncologist immediately.',
  },
  {
    keywords: ['causes', 'why', 'risk factors', 'smoking'],
    response:
      'Lung nodules can be caused by various factors including: smoking (primary risk factor), ' +
      'exposure to asbestos or radon, previous lung infections (tuberculosis, fungal infections), ' +
      'inflammation, scar tissue, or benign tumors.',
  },
  {
    keywords: ['symptoms', 'signs', 'feel', 'pain'],
    response:
      'Most small lung nodules cause NO symptoms and are found incidentally during imaging for other reasons. ' +
      'Larger nodules or cancerous ones may cause: persistent cough, coughing up blood, chest pain, ' +
      'shortness of breath, unexplained weight loss, or fatigue.',
  },
  {
    keywords: ['treatment', 'cure', 'therapy', 'surgery'],
    response:
      'Treatment depends on the nodule characteristics:\n\n' +
      '• Benign small nodules: Regular monitoring with CT scans\n' +
      '• Suspicious nodules: May require biopsy or PET scan\n' +
      '• Malignant nodules: Surgery, radiation, chemotherapy, or targeted therapy',
  },
  {
    keywords: ['ct scan', 'x-ray', 'imaging'],
    response:
      'A CT scan uses X-rays to create detailed cross-sectional images of your lungs. ' +
      'It can detect nodules as small as 1-2mm. The scan is painless and typically takes 5-10 minutes.',
  },
  {
    keywords: ['hello', 'hi', 'hey'],
    response:
      "Hello! I'm your AI Medical Assistant powered by Google Gemini. " +
      'I can answer questions about pulmonary nodules, CT scans, treatment options, and more. ' +
      'How can I help you today?',
  },
];

const defaultFallbackResponse =
  "I'm sorry, I couldn't process that with the AI engine right now. " +
  'Please ask about lung nodules, symptoms, treatments, CT scans, or prevention strategies.';

function getRuleBasedResponse(message) {
  const lower = message.toLowerCase().trim();
  for (const entry of knowledgeBase) {
    if (entry.keywords.some(k => lower.includes(k.toLowerCase()))) {
      return entry.response;
    }
  }
  return defaultFallbackResponse;
}


// CHATBOT ENDPOINT


/**
 * POST /api/chatbot
 * Get AI-powered response to a medical question
 */
router.post('/chatbot', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'No message provided',
        reply: 'Please send a message.',
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long',
        reply: 'Please keep your question under 1000 characters.',
      });
    }

    console.log(`💬 Chatbot question: "${message.substring(0, 60)}..."`);

    let reply;
    let engine;

    // Try Gemini AI first, fall back to rule-based if unavailable
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
      try {
        reply = await getChatbotResponse(message, history);
        engine = 'gemini';
        console.log('✅ Gemini chatbot response generated');
      } catch (aiError) {
        console.warn('⚠️ Gemini chatbot error, falling back to rule-based:', aiError.message);
        reply = getRuleBasedResponse(message);
        engine = 'rule-based';
      }
    } else {
      // No API key — use rule-based fallback
      reply = getRuleBasedResponse(message);
      engine = 'rule-based';
      console.log('ℹ️  Using rule-based chatbot (no GEMINI_API_KEY set)');
    }

    res.json({
      success: true,
      reply,
      engine,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Chatbot error:', error);
    res.status(500).json({
      success: false,
      error: 'Chatbot error',
      reply: "I'm having trouble processing your request. Please try again.",
    });
  }
});


// CHATBOT INFO


/**
 * GET /api/chatbot/info
 */
router.get('/chatbot/info', (req, res) => {
  const hasApiKey =
    !!process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE';

  res.json({
    success: true,
    info: {
      name: 'Medical AI Assistant',
      version: '2.0.0',
      engine: hasApiKey ? 'Google Gemini 1.5 Flash' : 'Rule-based (fallback)',
      apiConfigured: hasApiKey,
      capabilities: [
        'Answer questions about lung nodules',
        'Explain CT scan results',
        'Provide general pulmonary health information',
        'Explain AI detection process',
        'Conversational context awareness',
      ],
      freeTierLimits: {
        requestsPerMinute: 15,
        requestsPerDay: 1500,
        tokensPerMonth: '1 million',
      },
    },
  });
});

module.exports = router;
