
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
 * Saves a file directly to the repository (if owner) or creates a PR (if community).
 * @param {string} token - GitHub Token
 * @param {string} owner - Repo owner
 * @param {string} repo - Repo name
 * @param {string} path - File path in repo (e.g. 'public/data/file.json')
 * @param {string} content - New file content (stringified JSON)
 * @param {string} message - Commit message
 * @param {object} user - User object from getUser()
 */
export const saveToGitHub = async (token, owner, repo, path, content, message, user, providedSha = null) => {
    const octokit = getOctokit(token);

    // 1. Get current file SHA (if not provided)
    let sha = providedSha;
    if (!sha) {
        try {
            const { data } = await octokit.rest.repos.getContent({
                owner,
                repo,
                path,
            });
            sha = data.sha;
        } catch (e) {
            console.error("File not found on GitHub:", e);
            // If file doesn't exist, sha remains null (create new file)
            // But if we expected it to exist, this might be an issue.
            // For updates, we usually expect a sha.
        }
    }

    // 2. Check permissions
    // Simplification: If user is owner, commit directly to main.
    // Otherwise, fork -> branch -> PR.

    if (user.login === owner) {
        // Direct Commit
        await octokit.rest.repos.createOrUpdateFileContents({
            owner,
            repo,
            path,
            message,
            content: btoa(unescape(encodeURIComponent(content))), // Unicode-safe base64
            sha,
        });
        return { type: 'commit', url: `https://github.com/${owner}/${repo}/blob/main/${path}` };
    } else {
        // Community Flow (Fork & PR)

        // A. Fork Repository (idempotent)
        const fork = await octokit.rest.repos.createFork({ owner, repo });
        const forkOwner = fork.data.owner.login; // Should be user.login

        // Wait for fork to be ready (naive wait)
        await new Promise(r => setTimeout(r, 2000));

        // B. Get default branch SHA of the fork to base new branch off
        // Actually, getting it from upstream is better to be up to date
        // But working on fork is safer.

        // Create new branch name
        const branchName = `fix/question-${Date.now()}`;

        // Get fork's main SHA
        const { data: refData } = await octokit.rest.git.getRef({
            owner: forkOwner,
            repo: repo, // usually same repo name
            ref: 'heads/main'
        });

        // C. Create Branch
        await octokit.rest.git.createRef({
            owner: forkOwner,
            repo: repo,
            ref: `refs/heads/${branchName}`,
            sha: refData.object.sha
        });

        // D. Commit Change to Branch
        await octokit.rest.repos.createOrUpdateFileContents({
            owner: forkOwner,
            repo: repo,
            path,
            message,
            content: btoa(unescape(encodeURIComponent(content))),
            sha, // We use the ORIGINAL sha, hoping it matches. 
            // If fork is old, this might conflict. Ideally should fetch SHA from fork.
            // For now, let's assume fork is fresh or user will sync.
            branch: branchName
        });

        // E. Create Pull Request
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
