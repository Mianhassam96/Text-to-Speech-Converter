
import { toast } from "sonner";

/**
 * Get supported MIME type for recording
 */
const getSupportedMimeType = (preferredFormat: 'mp3' | 'wav'): string => {
  const supportedTypes = [
    'audio/webm',
    'audio/ogg',
    'audio/wav',
    'audio/mp3',
    'audio/mpeg'
  ];
  
  // Try the preferred format first
  const preferredMimeType = preferredFormat === 'mp3' ? 'audio/mpeg' : 'audio/wav';
  
  if (MediaRecorder.isTypeSupported(preferredMimeType)) {
    return preferredMimeType;
  }
  
  // Fall back to any supported type
  for (const type of supportedTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  
  // Default to audio/webm which is widely supported
  return 'audio/webm';
};

/**
 * Get file extension from MIME type
 */
const getFileExtFromMimeType = (mimeType: string): string => {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('wav')) return 'wav';
  if (mimeType.includes('mp3') || mimeType.includes('mpeg')) return 'mp3';
  return 'webm'; // Default
};

/**
 * Converts text to speech and returns an audio blob
 */
export const textToSpeech = async (
  text: string,
  voice: SpeechSynthesisVoice | null,
  rate: number,
  pitch: number,
  volume: number,
  format: 'mp3' | 'wav' = 'mp3'
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
    
    // Get a supported MIME type
    const mimeType = getSupportedMimeType(format);
    
    // Create media recorder with supported type
    const mediaRecorder = new MediaRecorder(mediaStreamDestination.stream, {
      mimeType: mimeType
    });
    const audioChunks: BlobPart[] = [];

    // Set up the recorder
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: mimeType });
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
export const downloadAudio = (blob: Blob, filename: string) => {
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
  volume: number,
  format: 'mp3' | 'wav' = 'mp3'
) => {
  try {
    if (!text.trim()) {
      toast.error("Please enter some text to convert");
      return;
    }
    
    toast.info(`Converting text to audio...`);
    
    const audioBlob = await textToSpeech(text, voice, rate, pitch, volume, format);
    
    // Get the actual file extension based on the MIME type
    const actualExtension = getFileExtFromMimeType(audioBlob.type);
    
    // Generate a filename based on the first few words of the text
    const words = text.trim().split(/\s+/).slice(0, 3).join('_');
    const filename = `${words}_speech.${actualExtension}`;
    
    downloadAudio(audioBlob, filename);
    
    toast.success(`Audio download complete! (${actualExtension.toUpperCase()} format)`);
  } catch (error) {
    console.error("Error:", error);
    toast.error(error instanceof Error ? error.message : "Failed to convert text to speech");
  }
};
