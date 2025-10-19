const express = require('express');
const router = express.Router();
const axios = require('axios');
const { auth } = require('../middleware/auth');
const ChatSession = require('../models/ChatSession');

// Ensure API key is provided via env
function getGeminiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return key;
}

// List sessions for the authenticated user
router.get('/sessions', auth, async (req, res) => {
  try {
    const sessions = await ChatSession.find({ user: req.user.id })
      .sort({ updatedAt: -1 })
      .select({ messages: { $slice: -1 }, title: 1, updatedAt: 1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load chat sessions' });
  }
});

// Get a specific session
router.get('/sessions/:id', auth, async (req, res) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, user: req.user.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load session' });
  }
});

// Create a new session
router.post('/sessions', auth, async (req, res) => {
  try {
    const title = req.body.title || 'New Chat';
    const session = await ChatSession.create({ user: req.user.id, title, messages: [] });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Send a message to Gemini and store response
router.post('/sessions/:id/message', auth, async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const session = await ChatSession.findOne({ _id: req.params.id, user: req.user.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Push user message
    session.messages.push({ role: 'user', content: message });

    // Build Gemini Prompt from last N messages for context
    const contextMessages = session.messages.slice(-12).map(m => ({ role: m.role, content: m.content }));

    const apiKey = getGeminiKey();
    // Using Gemini REST (compatible with Google Generative Language API)
    const url = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent';
    const payload = {
      contents: contextMessages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
    };

    const response = await axios.post(`${url}?key=${apiKey}`, payload, { timeout: 30000 });
    const text = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

    // Store assistant reply
    session.messages.push({ role: 'assistant', content: text });
    await session.save();

    res.json({ reply: text, sessionId: session._id });
  } catch (err) {
    console.error('Chat error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'Failed to get response from Gemini' });
  }
});

module.exports = router;


