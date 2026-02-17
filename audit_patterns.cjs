
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'public', 'data');
const reportPath = path.join(__dirname, 'audit_patterns_report.txt');

fs.readdir(dataDir, (err, files) => {
    if (err) {
        console.error("Error reading directory:", err);
        return;
    }

    let report = [];

    files.forEach(file => {
        if (!file.endsWith('.json')) return;
        if (file === 'themes.json') return;

        const filePath = path.join(dataDir, file);
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            const json = JSON.parse(data);
            if (!json.questions) return;

            json.questions.forEach(q => {
                let issues = [];

                const questionText = (q.question || "").trim();
                const questionTextLower = questionText.toLowerCase();
                
                // 1. More aggressive check for Propositions stuck in Question field
                // Look for labels like "A)" or "A." followed by some text
                if (/[A-C]\s*[\)\.]\s+[A-Z]/i.test(questionText)) {
                     // Potential props in question, but could be "permis B. Il"
                     // Let's check for at least two such occurrences or a specific format
                     if (/(?:[A-C]\s*[\)\.]\s+).*(?:[A-C]\s*[\)\.]\s+)/i.test(questionText)) {
                        issues.push(`PROPS_IN_QUESTION_FIELD`);
                     }
                }

                if (q.propositions && Array.isArray(q.propositions)) {
                    q.propositions.forEach(p => {
                        const propText = (p.text || "").trim();
                        const propTextLower = propText.toLowerCase();

                        // 2. Question repeated in proposition (Substring match)
                        // If proposition contains at least 20 chars of the question
                        if (questionTextLower.length > 20) {
                            const snippet = questionTextLower.substring(0, 20);
                            if (propTextLower.includes(snippet)) {
                                issues.push(`POTENTIAL_REPEATED_QUESTION: Prop contains start of question.`);
                            }
                        }

                        // 3. Merged propositions patterns
                        // Look for A) ... B) ...
                        if (/[A-C]\s*[\)\.]\s+.*[A-D]\s*[\)\.]\s+/i.test(propText)) {
                             issues.push(`MULTIPLE_LETTERS_IN_PROP: "${propText}"`);
                        }
                    });
                }

                if (issues.length > 0) {
                    report.push(`FILE: ${file} | ID: ${q.id}`);
                    issues.forEach(i => report.push(`  - ${i}`));
                    // Add a small snippet of the question to help review without dumping the whole JSON
                    report.push(`    Q: "${questionText.substring(0, 100)}${questionText.length > 100 ? '...' : ''}"`);
                }
            });

        } catch (e) {
            report.push(`ERROR PARSING FILE: ${file} - ${e.message}`);
        }
    });

    if (report.length === 0) {
        fs.writeFileSync(reportPath, "No issues found with the new patterns.");
    } else {
        fs.writeFileSync(reportPath, report.join('\n'));
    }
    console.log("Pattern audit complete. Report written to audit_patterns_report.txt");
});
