import fs from 'fs';
import path from 'path';
import Groq from 'groq-sdk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.join(__dirname, '../public/data/examen_B.json');
const BACKUP_PATH = path.join(__dirname, '../public/data/examen_B.bak.json');
const API_KEY = process.env.GROQ_API_KEY;

if (!API_KEY) {
    console.error("GROQ_API_KEY environment variable is required.");
    process.exit(1);
}

const groq = new Groq({ apiKey: API_KEY });

async function reworkBatch(questions) {
    const prompt = `
    Tu es un moniteur d'auto-école belge expert (Catégorie B).
    Ta mission est d'améliorer ou de rédiger des explications claires et pédagogiques pour les questions de code de la route suivantes.

    CONSIGNES :
    1. **LANGUE : FRANÇAIS UNIQUEMENT**.
    2. Pour chaque question, fournis une explication DÉTAILLÉE et PÉDAGOGIQUE.
    3. Rappelle précisément la règle du code de la route belge (Catégorie B) et explique POURQUOI c'est la bonne réponse.
    4. Ne donne pas une réponse simpliste (ex: "C'est la règle"). Développe le concept (ex: distances de sécurité, priorité de droite, signalisation spécifique).
    5. Utilise un ton professionnel et encourageant.
    6. Réponds UNIQUEMENT sous forme d'un objet JSON dont les clés sont les IDs des questions et les valeurs sont les nouvelles explications chaînes de caractères.
    7. Ne change pas le sens de la question ni la réponse correcte.
    
    QUESTIONS :
    ${JSON.stringify(questions.map(q => ({
        id: q.id,
        question: q.question,
        propositions: q.propositions,
        correctAnswer: q.correctAnswer,
        currentExplanation: q.explanation
    })), null, 2)}
    `;

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            temperature: 0.3,
            response_format: { type: "json_object" }
        });

        return JSON.parse(completion.choices[0]?.message?.content || "{}");
    } catch (error) {
        console.error("Error in batch:", error);
        return null;
    }
}

async function main() {
    console.log("Loading data for cleanup pass...");
    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    
    // Backup
    if (!fs.existsSync(BACKUP_PATH)) {
        fs.writeFileSync(BACKUP_PATH, JSON.stringify(data, null, 2));
        console.log("Backup created.");
    }

    const batchSize = 50;
    // Filter questions that need a rework
    const targetQuestions = data.questions.filter(q => {
        const exp = String(q.explanation || "");
        return exp.trim() === "" || exp.length < 50;
    });

    console.log(`Processing ${targetQuestions.length} questions for cleanup...`);

    for (let i = 0; i < targetQuestions.length; i += batchSize) {
        const batch = targetQuestions.slice(i, i + batchSize);
        console.log(`Processing batch ${i / batchSize + 1}/${Math.ceil(targetQuestions.length / batchSize)}...`);
        
        const results = await reworkBatch(batch);

        if (results) {
            batch.forEach(q => {
                const newExp = results[q.id.toString()];
                if (newExp) {
                    q.explanation = newExp;
                }
            });
            
            // Save after each batch
            fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
        }
    }

    console.log(`\nCleanup pass finished.`);
}

main();
