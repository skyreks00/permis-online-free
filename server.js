import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from "@google/genai";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'public', 'data');

app.use(cors());
app.use(express.json());

// --- Proxy Endpoint for Gemini ---
app.post('/api/fix-question', async (req, res) => {
    const { question, apiKey } = req.body;

    if (!apiKey) {
        return res.status(400).json({ error: "API Key is required" });
    }

    try {
        const client = new GoogleGenAI({ apiKey: apiKey });

        const prompt = `
        You are an expert specific to driving license questions.
        Analyze the following JSON question object and fix any typos, grammatical errors, or clarity issues in the 'question', 'propositions', and 'explanation' fields.
        Also improve the explanation to be more educational.
        The output must be ONLY a valid JSON object representing the fixed question. Do not add markdown code blocks.
        
        Original Question:
        ${JSON.stringify(question, null, 2)}
        `;

        const interaction = await client.interactions.create({
            model: 'gemini-3-flash-preview',
            input: prompt,
        });

        const output = interaction.outputs[interaction.outputs.length - 1];
        const text = output.text;

        // Clean up
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const fixedQuestion = JSON.parse(jsonString);

        res.json(fixedQuestion);

    } catch (error) {
        console.error("Gemini Proxy Error:", error);
        res.status(500).json({ error: error.message, details: error });
    }
});

// --- Existing Save Endpoint ---
app.post('/api/save-question', (req, res) => {
    const { themeFile, questionId, newQuestionData } = req.body;
    const filePath = path.join(DATA_DIR, themeFile);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ success: false, message: 'File read error' });
        }

        try {
            const jsonData = JSON.parse(data);
            if (!jsonData.questions) {
                return res.status(500).json({ success: false, message: 'Invalid JSON format' });
            }

            const questionIndex = jsonData.questions.findIndex(q => q.id === questionId);
            if (questionIndex === -1) {
                return res.status(404).json({ success: false, message: 'Question not found' });
            }

            // Update the question
            jsonData.questions[questionIndex] = newQuestionData;

            fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8', (err) => {
                if (err) {
                    console.error('Error writing file:', err);
                    return res.status(500).json({ success: false, message: 'File write error' });
                }
                console.log(`Question ${questionId} updated in ${themeFile}`);
                res.json({ success: true, message: 'Saved locally' });
            });

        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            res.status(500).json({ success: false, message: 'JSON parse error' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
