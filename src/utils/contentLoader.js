/**
 * Content Loader Utility
 * Loads question data from GitHub Raw URLs with cache-busting
 * Falls back to bundled content if GitHub is unavailable
 */

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/skyreks00/permis-online-free/main/public/data';

/**
 * Loads JSON content from GitHub Raw URL with cache busting
 * @param {string} filename - The filename to load (e.g., 'themes.json')
 * @param {object|null} fallbackData - Optional fallback data if fetch fails
 * @returns {Promise<object>} - The loaded JSON data
 */
export const loadFromGitHub = async (filename, fallbackData = null) => {
    // Add cache-busting timestamp to force fresh data
    const cacheBuster = Date.now();
    const url = `${GITHUB_RAW_BASE}/${filename}?_=${cacheBuster}`;

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

        if (fallbackData) {
            console.log(`[ContentLoader] Using bundled fallback for ${filename}`);
            return fallbackData;
        }

        throw error;
    }
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
