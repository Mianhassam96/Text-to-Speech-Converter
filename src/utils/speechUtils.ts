
import { toast } from "sonner";

/**
 * Converts text to speech and returns an audio blob
 */
export const textToSpeech = async (
  text: string,
  voice: SpeechSynthesisVoice | null,
  rate: number,
  pitch: number,
  volume: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // Check if text is provided
    if (!text.trim()) {
      reject(new Error("Please enter some text to convert"));
      return;
    }

    // Create an audio context for recording
    const audioContext = new window.AudioContext();
    const mediaStreamDestination = audioContext.createMediaStreamDestination();
    const mediaRecorder = new MediaRecorder(mediaStreamDestination.stream);
    const audioChunks: BlobPart[] = [];

    // Set up the recorder
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      resolve(audioBlob);
      audioContext.close();
    };

    // Create a speech utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    // Start recording
    mediaRecorder.start();
    
    utterance.onend = () => {
      mediaRecorder.stop();
    };

    utterance.onerror = (event) => {
      mediaRecorder.stop();
      reject(new Error(`Speech synthesis error: ${event.error}`));
    };

    // Start speech synthesis
    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    window.speechSynthesis.speak(utterance);
  });
};

/**
 * Downloads the audio blob as a file
 */
export const downloadAudio = (blob: Blob, filename: string = "speech.wav") => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};

/**
 * Convert text to speech and download it as an audio file
 */
export const convertAndDownload = async (
  text: string,
  voice: SpeechSynthesisVoice | null,
  rate: number,
  pitch: number,
  volume: number
) => {
  try {
    if (!text.trim()) {
      toast.error("Please enter some text to convert");
      return;
    }
    
    toast.info("Converting text to speech...");
    
    const audioBlob = await textToSpeech(text, voice, rate, pitch, volume);
    
    // Generate a filename based on the first few words of the text
    const words = text.trim().split(/\s+/).slice(0, 3).join('_');
    const filename = `${words}_speech.wav`;
    
    downloadAudio(audioBlob, filename);
    
    toast.success("Download complete!");
  } catch (error) {
    console.error("Error:", error);
    toast.error(error instanceof Error ? error.message : "Failed to convert text to speech");
  }
};
