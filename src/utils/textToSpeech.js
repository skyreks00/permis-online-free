let currentSpeechId = 0;

export const playText = async (text, onEnd, voiceIdOverride = null) => {
    stopAudio();

    if (!text) return;

    // Increment ID to invalidate any pending previous requests
    currentSpeechId++;
    const mySpeechId = currentSpeechId;

    const elevenKey = localStorage.getItem('elevenlabs_api_key');

    // 1. ELEVENLABS (Premium)
    if (elevenKey) {
        try {
            // 1. CTX: Voice Override (Preview) -> 2. Storage -> 3. Default (Adam)
            const voiceId = voiceIdOverride || localStorage.getItem('elevenlabs_voice_id') || "pNInz6obpgDQGcFmaJgB";

            const modelId = "eleven_multilingual_v2"; 

            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'xi-api-key': elevenKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    model_id: modelId,
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                    }
                })
            });

            if (!response.ok) throw new Error('ElevenLabs API Error');

            const blob = await response.blob();
            
            // RACING CONDITION CHECK: 
            // If stopAudio() or another playText() was called during fetch, ID will be different.
            if (mySpeechId !== currentSpeechId) return;

            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            window.currentAudio = audio; // Track global audio to stop it later
            
            audio.onended = () => {
                if(onEnd) onEnd();
                URL.revokeObjectURL(audioUrl);
            };
            
            audio.play().catch(e => console.error("Playback failed", e));
            return;

        } catch (e) {
            console.error("ElevenLabs failed, falling back to browser.", e);
            // Fallthrough to browser TTS
        }
    }

    // RACING CHECK AGAIN:
    // If stopped during the catch block or logic flow
    if (mySpeechId !== currentSpeechId) return;

    // 2. BROWSER TTS (Fallback)
    if (!('speechSynthesis' in window)) {
        console.warn("Speech synthesis not supported.");
        return;
    }
    const ut = new SpeechSynthesisUtterance(text);
    ut.lang = 'fr-FR';

    // Try to load preferred voice
    const prefUri = localStorage.getItem('preferred_voice_uri');
    const voices = window.speechSynthesis.getVoices();
    if (prefUri) {
        const v = voices.find(v => v.voiceURI === prefUri);
        if (v) ut.voice = v;
    } else {
        // Smart Default
        const frVoices = voices.filter(v => v.lang.startsWith('fr'));
        const best = frVoices.find(v => v.name.includes("Paul") || v.name.includes("Natural") || v.name.includes("Mobile")) || frVoices[0];
        if (best) ut.voice = best;
    }

    ut.onend = onEnd;
    window.speechSynthesis.speak(ut);
};

export const stopAudio = () => {
    // Invalidate any pending async operations
    currentSpeechId++;

    // Stop ElevenLabs
    if (window.currentAudio) {
        window.currentAudio.pause();
        window.currentAudio.currentTime = 0;
        window.currentAudio = null;
    }
    // Stop Browser TTS
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
};
