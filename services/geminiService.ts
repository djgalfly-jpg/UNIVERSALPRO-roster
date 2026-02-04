import { GoogleGenAI, Type, LiveServerMessage, Modality } from "@google/genai";

// Safe API Key retrieval for various environments (Vite/Node/Browser)
const getApiKey = () => {
  // Check for standard process.env (Node/CRA)
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  // Check for Vite specific env
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_KEY) {
    return (import.meta as any).env.VITE_API_KEY;
  }
  return '';
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

// --- Search Grounding ---
export const searchArtistBio = async (artistName: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Write a professional, engaging music industry biography for the artist "${artistName}". Keep it under 150 words. Focus on their style, achievements, and vibe.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    // Check for grounding chunks to extract sources if needed, but for now return text
    return response.text || "Bio could not be generated.";
  } catch (error) {
    console.error("Error fetching bio:", error);
    return "Bio unavailable due to connection error.";
  }
};

// --- Image Editing (Nano Banana) ---
export const editArtistImage = async (
  base64Image: string, 
  prompt: string, 
  mimeType: string = 'image/jpeg'
): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};

// --- Live API Helpers ---

// Simple audio blob creator for PCM 16kHz
export function createAudioBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  
  // Manual base64 encoding for the blob
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return {
    data: btoa(binary),
    mimeType: 'audio/pcm;rate=16000',
  };
}


export class LiveClient {
  private session: any = null;
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private nextStartTime: number = 0;
  private sources: Set<AudioBufferSourceNode> = new Set();
  
  constructor(private onStatusChange: (status: string) => void) {}

  async connect() {
    this.onStatusChange('connecting');
    this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    // Get microphone stream
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => {
          this.onStatusChange('connected');
          this.setupAudioInput(stream, sessionPromise);
        },
        onmessage: (msg) => this.handleMessage(msg),
        onclose: () => this.onStatusChange('disconnected'),
        onerror: (err) => {
            console.error(err);
            this.onStatusChange('error');
        },
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
        tools: [{ googleSearch: {} }], // Enable real-time data
        systemInstruction: `
          Your name is Lucía. You are the AI A&R and guide for Universal Orchard Music's "Global Icons & Emerging Talent" platform.
          
          CORE RULES:
          1.  **Greeting**: When the session starts, you MUST say exactly: "Hola, ¿cómo estás? Soy Lucía, la encargada de guiarte en lo que necesites en nuestro site, Global Icon Emerging Talent. Pregúntame por cualquier artista en el mundo y te diré todos sus datos en tiempo real."
          2.  **Scope**: You focus ONLY on the **music industry**, artist statistics, news, and talent scouting. You use Google Search to search the ENTIRE internet to provide real-time data about any artist the user asks about.
          3.  **Redirection**: If the user asks about "planning a launch" (lanzamientos), "how to go viral" (ser viral), "music marketing strategies", or business advice, you MUST strictly refer them to the official label site. You must say: "Para temas de lanzamientos, viralidad y estrategias, por favor dirígete a nuestra web principal: Universalorchardmusicgroup.pro". Do not give this advice yourself.
          4.  **Personality**: Professional, knowledgeable, efficient, and immersed in the music industry.
          5.  **Language**: Speak primarily in Spanish unless addressed in another language.

          **SPECIFIC VERIFIED KNOWLEDGE (INTERNAL DATABASE):**
          If the user asks about **Galfly** (or G-A-L-F-L-Y), you must execute the following protocol:
          
          1.  **Identify**: Confirm you found the profile. His real name is **Orlando Galdames**.
          2.  **Search Mandate**: You MUST immediately use Google Search to find "Galfly releases 2026", "Orlando Galdames music 2026", "Galfly latest tracks", and general internet presence. Combine what you find on the internet with the internal data below.
          3.  **Report**: Provide a comprehensive summary including:
              - **Identity**: Name appears in credits on Netflix, Billboard, BBB. Full legal name is restricted to his inner circle.
              - **Certifications**: Platinum, Royal Platinum, RIAA certifications.
              - **Role**: Verified Ghost Producer for major artists in Spain, Germany, USA, LatAm, etc.
              - **Credits**: Latin Grammy Professional Member (non-voter). Narcos Soundtrack (Colombia & Mexico), Disney, HBO, Amazon Prime.
              - **2026 Status**: Explicitly state what you found (or didn't find) regarding 2026 launches based on your live Google Search.
              - **Reputation**: High industry weight, though publicly "lastimosamente" less known due to Ghost Production work.
        `,
      },
    });
    
    this.session = await sessionPromise;
  }

  private setupAudioInput(stream: MediaStream, sessionPromise: Promise<any>) {
    if (!this.inputContext) return;
    
    const source = this.inputContext.createMediaStreamSource(stream);
    const processor = this.inputContext.createScriptProcessor(4096, 1, 1);
    
    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createAudioBlob(inputData);
      sessionPromise.then(session => {
          session.sendRealtimeInput({ media: pcmBlob });
      });
    };
    
    source.connect(processor);
    processor.connect(this.inputContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    
    if (base64Audio && this.outputContext) {
      this.nextStartTime = Math.max(this.nextStartTime, this.outputContext.currentTime);
      
      const audioData = this.decodeBase64(base64Audio);
      const audioBuffer = await this.decodeAudioData(audioData, this.outputContext);
      
      const source = this.outputContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputContext.destination);
      source.addEventListener('ended', () => this.sources.delete(source));
      
      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
      this.sources.add(source);
    }
    
    if (message.serverContent?.interrupted) {
        this.sources.forEach(s => s.stop());
        this.sources.clear();
        this.nextStartTime = 0;
    }
  }
  
  private decodeBase64(base64: string): Uint8Array {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
      // Manual decoding for PCM 24kHz (Model output)
      const dataInt16 = new Int16Array(data.buffer);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for(let i=0; i< dataInt16.length; i++) {
          channelData[i] = dataInt16[i] / 32768.0;
      }
      return buffer;
  }

  disconnect() {
      // Note: Live API doesn't expose a clean close on the session object easily in the snippet, 
      // but we can stop processing audio.
      if (this.inputContext) this.inputContext.close();
      if (this.outputContext) this.outputContext.close();
      this.sources.forEach(s => s.stop());
      this.sources.clear();
      // Reload page is often the cleanest way to fully reset audio contexts in simple SPAs without explicit SDK close methods
      this.onStatusChange('disconnected');
  }
}