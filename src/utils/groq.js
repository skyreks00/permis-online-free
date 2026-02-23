import Groq from 'groq-sdk';

/**
 * Fix a question using Groq API (Llama 3)
 * @param {object} question - The question object to fix
 * @param {string} apiKey - Groq API Key
 * @returns {Promise<object>} - The fixed question object
 */
export const fixQuestionWithGroq = async (question, apiKey) => {
    const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

    const prompt = `
    You are an expert specific to driving license questions.
    Your task is to FIX the following JSON question object.
    
    RULES:
    1. **LANGUAGE: IMPERATIVELY FRENCH**. All text (question, propositions, explanation) MUST be in correct French.
    2. **Fix Typos & Grammar**: Correct any spelling or grammatical errors in 'question', 'propositions', and 'explanation'.
    3. **Start** with a valid JSON structure.
    4. **Three Supported Question Types**:
       - "multiple_choice" (Standard question with options A, B, C... used for BOTH single and multiple valid answers)
       - "true_false" (Binary question, Oui/Non)
       - "number" (Open numeric field, NO propositions)
       
       *CRITICAL RULES FOR TYPES:*
       - If the question has options/propositions (A, B, C), the type MUST be "multiple_choice".
       - NEVER use "single_choice" (it does not exist in the system).
       - NEVER use "number" type if there are possibilities/propositions.
       - ONLY use "number" type if the user must type a value and 'correctAnswer' is a raw number (e.g. "50", "0.5").
       - Must be an array of objects: [{ "letter": "A", "text": "..." }, { "letter": "B", "text": "..." }]
       - Do NOT merge propositions into the question text.
       - Ensure "answer" field matches the letters (e.g., "A" or "AC").
    5. **JSON Only**: Output ONLY valid JSON, no markdown formatting (no \`\`\`json).
    6. **IMMUTABLE ANSWER**: The 'answer' field MUST remain exactly the same as the original (e.g., if it was "A", it MUST remain "A"). Do NOT change which option is the correct one.
    7. **AMBIGUITY FIX**: If multiple propositions have the EXACT SAME text (e.g. both are "Signal"), you MUST append the proposition letter to the text to differentiate them (e.g., "Signal" -> "Signal A", "Signal" -> "Signal B"). This is important for clarity.

    Original Question to Fix:
    ${JSON.stringify(question, null, 2)}
  `;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "meta-llama/llama-4-scout-17b-16e-instruct", // User requested model
            // fallback if not available: "llama3-70b-8192"
            temperature: 0.2, // Lower temperature for more deterministic JSON
            max_completion_tokens: 1024,
            top_p: 1,
            stream: false,
            response_format: { type: "json_object" } // Force JSON mode if supported, otherwise prompt handles it
        });

        const content = chatCompletion.choices[0]?.message?.content || "{}";
        console.log("Groq Raw Response:", content);

        // Clean up potential markdown code blocks if the model ignores the instruction
        const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();

        const result = JSON.parse(jsonString);

        // Handle array response (unwrapping)
        if (Array.isArray(result)) {
            return result[0];
        }

        // Sometimes models wrap in a root object like { "question": { ... } }
        if (result.question && result.question.id && result.question.type) {
            // It might be nested, let's check
            if (result.type) return result; // It has type at root, so it's likely fine
            return result.question;
        }

        return result;

    } catch (error) {
        console.error("Groq API Error:", error);
        throw new Error("Impossible de corriger la question avec Groq : " + error.message);
    }
};
export const getChatResponse = async (apiKey, messages) => {
    const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: "meta-llama/llama-4-scout-17b-16e-instruct", // User request: same as correction
            temperature: 0.5,
            max_completion_tokens: 512,
            top_p: 1,
            stream: false
        });

        return chatCompletion.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("Groq Chat Error:", error);
        throw new Error("Impossible de discuter avec l'IA : " + error.message);
    }
};
export const analyzeMistakesWithGroq = async (mistakes, apiKey) => {
    const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

    const prompt = `
    Tu es un expert pédagogique pour le permis de conduire belge (catégorie B).
    On va te donner une liste de questions que l'utilisateur a ratées, avec leurs thèmes associés.
    Ton but est de faire une analyse synthétique et encourageante pour aider l'utilisateur à savoir sur quoi s'entraîner.

    Données (questions ratées) :
    ${JSON.stringify(mistakes.map(m => ({ question: m.question, themes: m.themes })), null, 2)}

    CONSIGNES :
    1. **LANGUE : FRANÇAIS UNIQUEMENT**.
    2. Analyse les thèmes récurrents dans les erreurs.
    3. Identifie les points forts (si certains thèmes majeurs ne sont PAS dans la liste d'erreurs, ou si peu d'erreurs sont présentes).
    4. Donne des conseils concrets de révision.
    5. Utilise un ton motivant et professionnel.
    6. Formate ta réponse en **Markdown**.
    7. Sois concis : environ 200-300 mots maximum.
    8. Ne mentionne pas de numéros d'ID de questions, parle de concepts.
    `;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            temperature: 0.7,
            max_completion_tokens: 1024,
            top_p: 1,
            stream: false
        });

        return chatCompletion.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer l'analyse.";
    } catch (error) {
        console.error("Groq Analysis Error:", error);
        throw new Error("Impossible de générer l'analyse avec l'IA : " + error.message);
    }
};
