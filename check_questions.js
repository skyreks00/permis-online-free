
const fs = require('fs');
const path = require('path');

const dataDir = './public/data';

fs.readdir(dataDir, (err, files) => {
    if (err) {
        console.error("Error reading directory:", err);
        return;
    }

    files.forEach(file => {
        if (path.extname(file) === '.json' && file !== 'themes.json' && file !== 'examen_B.json') {
            const filePath = path.join(dataDir, file);
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error("Error reading file:", file, err);
                    return;
                }
                try {
                    const json = JSON.parse(data);
                    if (json.questions) {
                        json.questions.forEach(q => {
                            if (q.type === 'number') {
                                // Check if answer is not a number
                                const isAnswerNumber = !isNaN(parseFloat(q.correctAnswer)) && isFinite(q.correctAnswer);
                                
                                // Check if question text looks like it has options (A., B., 1., 2.)
                                const hasOptionsInText = /[A-C]\.|[1-3]\./.test(q.question);

                                if (!isAnswerNumber || hasOptionsInText) {
                                    console.log(`SUSPICIOUS: ${file} - ID: ${q.id}`);
                                    console.log(`  Question: ${q.question}`);
                                    console.log(`  Answer: ${q.correctAnswer}`);
                                    console.log('---');
                                }
                            }
                        });
                    }
                } catch (e) {
                    console.error("Error parsing JSON:", file, e);
                }
            });
        }
    });
});
