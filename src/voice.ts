const checkAvailability = () =>
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window &&
    window.speechSynthesis.getVoices().length > 0 &&
    window.speechSynthesis.getVoices().filter(voice => voice.lang === "de-DE").length > 0;

export const isAvailable = checkAvailability();


const synth = isAvailable ? window.speechSynthesis : null;
const voice = isAvailable ? synth.getVoices().filter((v) => v.lang === "de-DE")[0] : null;

export const speak = (utterance: string, callback?: () => void) => {
    if (!isAvailable) {
        console.warn("Speech Synthesis is not supported in your browser");
        callback();
        return false;
    }
    const spokenNumber = new SpeechSynthesisUtterance(utterance);
    spokenNumber.voice = voice;
    synth.speak(spokenNumber);
    spokenNumber.addEventListener("end", () => callback());
    return true;
};