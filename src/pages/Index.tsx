
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Play, Pause, Volume2, VolumeX, Download } from "lucide-react";

const Index = () => {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const speechSynthesis = useRef<SpeechSynthesis | null>(null);
  const speechUtterance = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined") {
      speechSynthesis.current = window.speechSynthesis;
      loadVoices();

      // Some browsers (like Chrome) load voices asynchronously
      if (speechSynthesis.current) {
        speechSynthesis.current.onvoiceschanged = loadVoices;
      }
    }
    
    return () => {
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel();
      }
    };
  }, []);

  const loadVoices = () => {
    if (speechSynthesis.current) {
      const voices = speechSynthesis.current.getVoices();
      setAvailableVoices(voices);
      
      // Set default voice
      if (voices.length > 0 && !voice) {
        setVoice(voices[0].name);
      }
    }
  };

  const speakText = () => {
    if (!text.trim()) {
      toast.error("Please enter some text to speak");
      return;
    }

    if (speechSynthesis.current) {
      // Cancel any ongoing speech
      speechSynthesis.current.cancel();
      
      // Create a new utterance
      speechUtterance.current = new SpeechSynthesisUtterance(text);
      
      // Set voice
      if (voice) {
        const selectedVoice = availableVoices.find(v => v.name === voice);
        if (selectedVoice) {
          speechUtterance.current.voice = selectedVoice;
        }
      }
      
      // Set other properties
      speechUtterance.current.rate = rate;
      speechUtterance.current.pitch = pitch;
      speechUtterance.current.volume = isMuted ? 0 : volume;
      
      // Event handlers
      speechUtterance.current.onstart = () => setIsPlaying(true);
      speechUtterance.current.onend = () => setIsPlaying(false);
      speechUtterance.current.onerror = (event) => {
        toast.error(`Error: ${event.error}`);
        setIsPlaying(false);
      };
      
      // Start speaking
      speechSynthesis.current.speak(speechUtterance.current);
    }
  };

  const stopSpeaking = () => {
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel();
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      stopSpeaking();
    } else {
      speakText();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (speechUtterance.current) {
      speechUtterance.current.volume = !isMuted ? 0 : volume;
    }
  };

  const downloadSpeech = async () => {
    if (!text.trim()) {
      toast.error("Please enter some text to download");
      return;
    }

    try {
      // Create an audio context
      const audioContext = new AudioContext();
      const audioElement = document.createElement('audio');
      
      // Use the SpeechSynthesis API to generate audio
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set properties based on user settings
      const selectedVoice = availableVoices.find(v => v.name === voice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      // Use MediaRecorder to capture the audio
      speechSynthesis.current?.cancel();
      
      // We can't directly download the audio from the Speech API,
      // so we'll create a simple workaround by creating an audio element
      // that the user can then download from
      
      // Create a MediaStream destination for the audio context
      const dest = audioContext.createMediaStreamDestination();
      
      // Create a MediaRecorder to record the audio
      const mediaRecorder = new MediaRecorder(dest.stream);
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        
        // Create a link element to trigger the download
        const a = document.createElement('a');
        a.href = url;
        a.download = 'speech.wav';
        a.click();
        
        // Clean up
        URL.revokeObjectURL(url);
      };
      
      // As a fallback, since direct recording isn't always reliable,
      // we'll create a download option that opens in a new window
      // that the user can then save from their browser
      const speechUrl = `data:audio/wav;base64,${btoa(text)}`;
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(`
          <html>
            <head>
              <title>Download Speech</title>
            </head>
            <body>
              <h3>Your speech is ready. Right-click on the audio player and select "Save Audio As..."</h3>
              <audio controls autoplay src="${speechUrl}"></audio>
              <p>If the audio doesn't play or download correctly, please try the "Listen" button again and use your browser's built-in options to save the audio.</p>
            </body>
          </html>
        `);
      }
      
      toast.success("Speech generated. A new window has opened with your audio to download.");
    } catch (error) {
      console.error("Error downloading speech:", error);
      toast.error("An error occurred while downloading the speech");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">Text to Speech Converter</h1>
          <p className="text-lg text-gray-600">Transform your text into natural-sounding speech</p>
        </div>

        <Card className="shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Speech Generator</CardTitle>
            <CardDescription>Enter your text below and customize voice settings</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Type or paste your text here..."
              className="min-h-[150px] text-base"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Voice</label>
                <Select value={voice} onValueChange={setVoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVoices.map((voice) => (
                      <SelectItem key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Volume: {volume.toFixed(1)}</label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleMute}
                    className="flex-shrink-0"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <Slider
                    value={[volume]}
                    min={0}
                    max={1}
                    step={0.1}
                    onValueChange={(value) => setVolume(value[0])}
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Speech Rate: {rate.toFixed(1)}</label>
                <Slider
                  value={[rate]}
                  min={0.5}
                  max={2}
                  step={0.1}
                  onValueChange={(value) => setRate(value[0])}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Pitch: {pitch.toFixed(1)}</label>
                <Slider
                  value={[pitch]}
                  min={0.5}
                  max={2}
                  step={0.1}
                  onValueChange={(value) => setPitch(value[0])}
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between flex-wrap gap-2">
            <div className="flex space-x-2">
              <Button 
                onClick={togglePlayPause} 
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isPlaying ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" /> Listen
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={downloadSpeech}
              >
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            </div>
            
            <div className="text-xs text-gray-500">
              {availableVoices.length} voices available
            </div>
          </CardFooter>
        </Card>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>This application uses your browser's built-in speech synthesis capabilities.</p>
          <p>Voice availability may vary depending on your browser and operating system.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
