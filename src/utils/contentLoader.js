/**
 * Content Loader Utility
 * Loads question data from local public/data folder
 * Falls back to GitHub if needed (or vice versa, but for local dev/preview we want local data)
 */

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/skyreks00/permis-online-free/main/public/data';

/**
 * Loads JSON content from local data with GitHub as fallback
 * @param {string} filename - The filename to load (e.g., 'themes.json')
 * @param {object|null} fallbackData - Optional fallback data if fetch fails
 * @returns {Promise<object>} - The loaded JSON data
 */
export const loadFromGitHub = async (filename, fallbackData = null) => {
    // 1. Try local data first (the data folder in public/dist)
    try {
        console.log(`[ContentLoader] Fetching ${filename} from local data...`);
        // Use an absolute path or relative to origin to ensure it works on subpaths
        const response = await fetch(`${import.meta.env.BASE_URL}data/${filename}?_=${Date.now()}`);
        if (response.ok) {
            const data = await response.json();
            console.log(`[ContentLoader] Successfully loaded ${filename} from local data`);
            return data;
        }
    } catch (e) {
        console.warn(`[ContentLoader] Local fetch failed for ${filename}`, e.message);
    }

    // 2. Fallback to GitHub Raw
    const url = `${GITHUB_RAW_BASE}/${filename}?_=${Date.now()}`;

    try {
        console.log(`[ContentLoader] Fetching ${filename} from GitHub...`);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`[ContentLoader] Successfully loaded ${filename} from GitHub`);
        return data;
    } catch (error) {
        console.warn(`[ContentLoader] Failed to load ${filename} from GitHub:`, error.message);
        console.log(`[ContentLoader] Trying local fallback for ${filename}...`);
    }

    try {
        console.log(`[ContentLoader] Fetching ${filename} from local data...`);
        const response = await fetch(`data/${filename}`);
        if (response.ok) {
            const data = await response.json();
            console.log(`[ContentLoader] Successfully loaded ${filename} from local data`);
            return data;
        }
    } catch (e) {
        console.warn(`[ContentLoader] Local fetch also failed for ${filename}`);
    }

    if (fallbackData) {
        console.log(`[ContentLoader] Using bundled fallback for ${filename}`);
        return fallbackData;
    }

    throw new Error(`Failed to load ${filename} from all sources`);
};

/**
 * Loads a theme's question file from GitHub
 * @param {string} themeFile - The theme filename (e.g., '7_les_pietons.json')
 * @param {object|null} fallbackData - Optional bundled questions as fallback
 * @returns {Promise<object>} - The theme data with questions
 */
export const loadThemeQuestions = async (themeFile, fallbackData = null) => {
    return loadFromGitHub(themeFile, fallbackData);
};

/**
 * Loads the themes index file from GitHub
 * @param {object|null} fallbackData - Optional bundled themes as fallback
 * @returns {Promise<object>} - The themes index data
 */
export const loadThemesIndex = async (fallbackData = null) => {
    return loadFromGitHub('themes.json', fallbackData);
};
