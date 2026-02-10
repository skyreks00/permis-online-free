
/**
 * Saves a question update to the local server.
 * @param {string} themeFile - The filename of the theme (e.g., '3_la_piste_cyclable.json')
 * @param {number|string} questionId - The ID of the question to update
 * @param {object} newQuestionData - The new data for the question
 * @returns {Promise<object>} - The response from the server
 */
export const saveQuestionLocally = async (themeFile, questionId, newQuestionData) => {
    try {
        const response = await fetch('http://localhost:3001/api/save-question', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                themeFile,
                questionId,
                newQuestionData,
            }),
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to save question locally:', error);
        throw error;
    }
};
