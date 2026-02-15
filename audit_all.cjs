
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'public', 'data');
const reportPath = path.join(__dirname, 'audit_report.txt');

fs.readdir(dataDir, (err, files) => {
    if (err) {
        console.error("Error reading directory:", err);
        return;
    }

    let report = [];

    files.forEach(file => {
        if (!file.endsWith('.json')) return;

        const filePath = path.join(dataDir, file);
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            const json = JSON.parse(data);
            if (!json.questions) return;

            json.questions.forEach(q => {
                let issues = [];

                // Check for truncated questions
                if (q.question && /(?: le| la| les| un| une| des| du| de| et| ou| qui| que| dont| où| en| à| l')$/i.test(q.question.trim())) {
                    issues.push(`TRUNCATED? Ends with preposition/article: "${q.question}"`);
                }
                
                // Check for strict "number" type violations
                if (q.type === 'number') {
                     if (isNaN(parseFloat(q.correctAnswer))) {
                         issues.push(`Type "number" with non-numeric answer: "${q.correctAnswer}"`);
                     }
                }

                // Check for "multiple_choice" with no propositions
                if (q.type === 'multiple_choice' && (!q.propositions || q.propositions.length === 0)) {
                    issues.push(`Type "multiple_choice" with no propositions`);
                }

                if (issues.length > 0) {
                    report.push(`FILE: ${file} | ID: ${q.id}`);
                    issues.forEach(i => report.push(`  - ${i}`));
                }
            });

        } catch (e) {
            console.error("Error parsing JSON:", file, e.message);
            report.push(`ERROR PARSING FILE: ${file} - ${e.message}`);
        }
    });

    fs.writeFileSync(reportPath, report.join('\n'));
    console.log("Audit complete. Report written to audit_report.txt");
});
