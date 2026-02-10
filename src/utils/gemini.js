

import { GoogleGenAI } from "@google/genai";

/**
 * Fixes a question using Gemini 3 Flash Preview.
 * Uses a local proxy if available (to avoid CORS), otherwise falls back to direct SDK call.
 * @param {object} question - The question object to fix
 * @param {string} apiKey - The Gemini API Key
 * @returns {Promise<object>} - The fixed question object
 */
export const fixQuestionWithGemini = async (question, apiKey) => {
    if (!apiKey) throw new Error("API Key is missing");

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // 1. Try Local Proxy (Preferred for localhost to bypass CORS)
    if (isLocal) {
        try {
            console.log("Attempting Local Proxy...");
            const response = await fetch('http://localhost:3001/api/fix-question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, apiKey })
            });

            if (response.ok) {
                return await response.json();
            } else {
                console.warn("Proxy failed, falling back to direct SDK:", response.statusText);
            }
        } catch (err) {
            console.warn("Proxy unreachable, falling back to direct SDK:", err);
        }
    }

    // 2. Direct SDK Call (Fallback / Production)
    console.log("Attempting Direct SDK Call (generateContent)...");
    const client = new GoogleGenAI({ apiKey: apiKey });

    const prompt = `
    You are an expert specific to driving license questions.
    Your task is to FIX the following JSON question object.
    
    RULES:
    1. **Fix Typos & Grammar**: Correct any spelling or grammatical errors in 'question', 'propositions', and 'explanation'.
    2. **start** with a valid JSON structure.
    3. **Three Supported Question Types**:
       - "multiple_choice" (Standard question with options A, B, C...)
       - "true_false" (Binary question, Oui/Non)
       - "single_choice" (Only one correct answer)
       *(Keep the original type of the question unless it is clearly wrong)*.
    4. **Propositions Structure**:
       - Must be an array of objects: [{ "letter": "A", "text": "..." }, { "letter": "B", "text": "..." }]
       - Do NOT merge propositions into the question text.
       - Ensure "answer" field matches the letters (e.g., "A" or "AC").
    5. **JSON Only**: Output ONLY valid JSON.

    Original Question:
    ${JSON.stringify(question, null, 2)}
  `;

    try {
        // Switching to generateContent for better CORS support in browser
        const response = await client.models.generateContent({
            model: 'gemini-2.0-flash', // Fallback to 2.0 Flash for stability on direct calls, or try 'gemini-3-flash-preview'
            // Let's try to stick to the requested model if possible, but 'gemini-3-flash-preview' might be interactions-only?
            // Let's try 3 first.
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });

        // In new SDK, .text is a property, not a function
        const text = response.text;

        if (!text) {
            throw new Error("No text in response");
        }

        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonString);

    } catch (error) {
        console.error("Gemini Direct SDK Error:", error);
        alert("Attention: Impossible de contacter Gemini directement depuis GitHub (CORS). Cette fonctionnalité nécessite le proxy local (node server.js).");
        throw error;
    }
};
