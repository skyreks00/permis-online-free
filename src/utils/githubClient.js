/**
 * GitHub Client Utility
 * Enhanced with question-specific save logic
 */

import { Octokit } from "octokit";

/**
 * Creates an authenticated Octokit instance.
 * @param {string} token - GitHub Personal Access Token
 */
export const getOctokit = (token) => {
    return new Octokit({ auth: token });
};

/**
 * Gets the authenticated user's details.
 */
export const getUser = async (token) => {
    const octokit = getOctokit(token);
    const { data } = await octokit.rest.users.getAuthenticated();
    return data;
};

/**
 * Saves a specific question update to a theme file on GitHub
 * ALWAYS uses PR flow to avoid SHA mismatch issues
 * @param {string} token - GitHub Token
 * @param {string} owner - Repo owner
 * @param {string} repo - Repo name  
 * @param {string} path - File path (e.g. 'public/data/7_les_pietons.json')
 * @param {number} questionId - ID of the question to update
 * @param {object} updatedQuestion - New question data
 * @param {string} message - Commit message
 * @param {object} user - User object from getUser()
 * @returns {Promise<object>} - Result with type ('pr') and url
 */
export const saveQuestionToGitHub = async (token, owner, repo, path, questionId, updatedQuestion, message, user) => {
    const octokit = getOctokit(token);

    console.log(`[saveQuestionToGitHub] Fetching latest version of ${path}...`);

    // Get the latest file content and SHA with cache busting
    const cacheBuster = Date.now();
    const { data: fileData } = await octokit.request(`GET /repos/${owner}/${repo}/contents/${path}?_=${cacheBuster}`, {
        owner,
        repo,
        path
    });

    const currentSha = fileData.sha;
    console.log(`[saveQuestionToGitHub] Current SHA: ${currentSha}`);

    // Decode content
    const currentContent = JSON.parse(decodeURIComponent(escape(atob(fileData.content))));
    const originalContentString = JSON.stringify(currentContent, null, 2);

    // Find and update the question
    const questionIndex = currentContent.questions.findIndex(q => q.id === questionId);
    if (questionIndex === -1) {
        throw new Error(`Question with ID ${questionId} not found in ${path}`);
    }

    // Merge the update
    currentContent.questions[questionIndex] = {
        ...currentContent.questions[questionIndex],
        ...updatedQuestion
    };

    const newContent = JSON.stringify(currentContent, null, 2);

    // Check if content actually changed
    if (newContent === originalContentString) {
        console.log('[saveQuestionToGitHub] Content unchanged, skipping commit');
        return { type: 'unchanged', message: 'No changes detected' };
    }

    console.log(`[saveQuestionToGitHub] Content changed, creating PR...`);

    // ALWAYS use PR flow to avoid SHA mismatch issues with direct commits
    const fork = await octokit.rest.repos.createFork({ owner, repo });
    const forkOwner = fork.data.owner.login;

    await new Promise(r => setTimeout(r, 2000));

    const branchName = `fix/question-${questionId}-${Date.now()}`;

    const { data: refData } = await octokit.rest.git.getRef({
        owner: forkOwner,
        repo,
        ref: 'heads/main'
    });

    await octokit.rest.git.createRef({
        owner: forkOwner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: refData.object.sha
    });

    await octokit.rest.repos.createOrUpdateFileContents({
        owner: forkOwner,
        repo,
        path,
        message,
        content: btoa(unescape(encodeURIComponent(newContent))),
        sha: currentSha,
        branch: branchName
    });

    const pr = await octokit.rest.pulls.create({
        owner,
        repo,
        title: message,
        head: `${forkOwner}:${branchName}`,
        base: 'main',
        body: `Proposed fix by ${user.login} using Gemini AI.`
    });

    console.log('[saveQuestionToGitHub] Successfully created PR');
    return { type: 'pr', url: pr.data.html_url };
};

/**
 * Legacy saveToGitHub for backward compatibility
 * @deprecated Use saveQuestionToGitHub instead
 */
export const saveToGitHub = async (token, owner, repo, path, content, message, user, providedSha = null) => {
    const octokit = getOctokit(token);

    //ALWAYS get the LATEST file SHA right before committing
    let sha;
    try {
        const cacheBuster = Date.now();
        const { data } = await octokit.request(`GET /repos/${owner}/${repo}/contents/${path}?_=${cacheBuster}`, {
            owner,
            repo,
            path
        });
        sha = data.sha;
        console.log(`[saveToGitHub] Fetched latest SHA with cache bypass: ${sha}`);
    } catch (e) {
        console.error("File not found on GitHub or error fetching:", e);
    }

    if (user.login === owner) {
        await octokit.rest.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message,
            content: btoa(unescape(encodeURIComponent(content))),
            sha,
        });
        return { type: 'commit', url: `https://github.com/${owner}/${repo}/blob/main/${path}` };
    } else {
        // Fork & PR logic...
        const fork = await octokit.rest.repos.createFork({ owner, repo });
        const forkOwner = fork.data.owner.login;

        await new Promise(r => setTimeout(r, 2000));

        const branchName = `fix/question-${Date.now()}`;

        const { data: refData } = await octokit.rest.git.getRef({
            owner: forkOwner,
            repo,
            ref: 'heads/main'
        });

        await octokit.rest.git.createRef({
            owner: forkOwner,
            repo,
            ref: `refs/heads/${branchName}`,
            sha: refData.object.sha
        });

        await octokit.rest.repos.createOrUpdateFileContents({
            owner: forkOwner,
            repo,
            path,
            message,
            content: btoa(unescape(encodeURIComponent(content))),
            sha,
            branch: branchName
        });

        const pr = await octokit.rest.pulls.create({
            owner,
            repo,
            title: message,
            head: `${forkOwner}:${branchName}`,
            base: 'main',
            body: `Proposed fix by ${user.login} using Gemini AI.`
        });

        return { type: 'pr', url: pr.data.html_url };
    }
};
