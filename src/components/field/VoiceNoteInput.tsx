import { useState, useRef, useEffect } from "react";
import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceNoteInputProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySR = any;

export function VoiceNoteInput({ value, onChange, placeholder }: VoiceNoteInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = typeof window !== "undefined" ? (window as any) : null;
  const [isSupported] = useState(() => !!(w?.SpeechRecognition || w?.webkitSpeechRecognition));
  const recognitionRef = useRef<AnySR>(null);
  const finalRef = useRef(value);

  useEffect(() => { finalRef.current = value; }, [value]);

  const start = () => {
    const SR = w?.SpeechRecognition || w?.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalRef.current += e.results[i][0].transcript + " ";
          onChange(finalRef.current);
        } else {
          interim = e.results[i][0].transcript;
        }
      }
      setInterimText(interim);
    };
    rec.onend = () => { setIsListening(false); setInterimText(""); };
    rec.onerror = () => { setIsListening(false); setInterimText(""); };
    rec.start();
    recognitionRef.current = rec;
    setIsListening(true);
  };

  const stop = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimText("");
  };

  const displayText = value + (interimText ? ` ${interimText}` : "");

  return (
    <div className="space-y-3">
      {/* Mic toggle button */}
      <button
        onClick={isListening ? stop : start}
        disabled={!isSupported}
        className={cn(
          "w-full flex items-center justify-center gap-3 h-16 rounded-2xl border-2",
          "font-semibold text-base transition-all active:scale-98 select-none",
          isListening
            ? "border-destructive bg-destructive/10 text-destructive"
            : isSupported
              ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
              : "border-border bg-muted text-muted-foreground cursor-not-allowed"
        )}
      >
        {isListening ? (
          <>
            <span className="relative flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-50" />
              <Square className="relative h-5 w-5" />
            </span>
            Listening… Tap to stop
          </>
        ) : (
          <>
            <Mic className="h-6 w-6" />
            {isSupported ? "Tap to Dictate Note" : "Voice not supported (use Chrome)"}
          </>
        )}
      </button>

      {/* Transcript display */}
      <div className={cn(
        "min-h-[80px] p-4 rounded-xl border text-sm leading-relaxed transition-colors",
        displayText
          ? "bg-muted/40 border-border text-foreground"
          : "bg-muted/20 border-dashed border-border text-muted-foreground"
      )}>
        {displayText || (placeholder ?? "Dictated notes will appear here…")}
        {interimText && <span className="text-muted-foreground/60 italic"> {interimText}</span>}
      </div>

      {/* Clear button */}
      {value && (
        <button
          onClick={() => { onChange(""); setInterimText(""); finalRef.current = ""; }}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors underline"
        >
          Clear note
        </button>
      )}
    </div>
  );
}
