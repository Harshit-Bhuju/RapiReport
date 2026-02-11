import { useState, useCallback, useEffect } from "react";
import { speakText, stopSpeaking } from "../lib/utils";

export const useSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text, lang = "ne-NP") => {
    setIsSpeaking(true);
    speakText(text, lang);
  }, []);

  const stop = useCallback(() => {
    stopSpeaking();
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    const onEnd = () => setIsSpeaking(false);
    // Simple polling to check if speaking has stopped (since we can't easily attach event listener to the global utterance created in utils)
    // A better approach would be to manage the utterance instance inside the hook, but for now this is a simple wrapper.
    // Actually, let's refine this to be more robust.

    const interval = setInterval(() => {
      if (!window.speechSynthesis.speaking && isSpeaking) {
        setIsSpeaking(false);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isSpeaking]);

  return { isSpeaking, speak, stop };
};
