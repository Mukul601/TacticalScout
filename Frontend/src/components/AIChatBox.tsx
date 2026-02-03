import { useState, useRef, useEffect } from "react";
import { TacticalCard } from "./TacticalCard";
import { Bot, Send, User, Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sendCoachChat } from "@/api/chat";
import type { ScoutingReport } from "@/types/scouting";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatBoxProps {
  scoutingReport?: ScoutingReport | null;
}

export function AIChatBox({ scoutingReport = null }: AIChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "Tactical AI online. Ask a question about the current scouting report—e.g. ban strategy, counter comp, or win conditions.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(2);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    const userMessage: Message = {
      id: nextIdRef.current++,
      role: "user",
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const result = await sendCoachChat(text, scoutingReport ?? null);
      const content = result.error
        ? `Error: ${result.error}`
        : (result.response || "No response from coach AI.");
      const aiMessage: Message = {
        id: nextIdRef.current++,
        role: "assistant",
        content,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Failed to send message";
      const aiMessage: Message = {
        id: nextIdRef.current++,
        role: "assistant",
        content: `Error: ${message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = [
    "Best ban strategy?",
    "Counter their comp",
    "Win conditions?"
  ];

  return (
    <TacticalCard 
      title="Tactical AI Assistant" 
      icon={<Bot className="w-4 h-4" />}
      variant="cyan"
      badge="ONLINE"
      className="flex flex-col h-full"
    >
      <div className="flex flex-col h-[400px]">
        {/* Messages Area */}
        <ScrollArea className="flex-1 pr-2" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0
                  ${message.role === "assistant" 
                    ? "bg-primary/20 text-primary border border-primary/30" 
                    : "bg-secondary text-muted-foreground border border-border"
                  }`}
                >
                  {message.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className={`rounded-lg p-3 max-w-[80%] 
                  ${message.role === "assistant" 
                    ? "bg-secondary/50 border border-border" 
                    : "bg-primary/20 border border-primary/30"
                  }`}
                >
                  <p className="text-sm text-foreground leading-relaxed">{message.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded flex items-center justify-center bg-primary/20 text-primary border border-primary/30">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="rounded-lg p-3 bg-secondary/50 border border-border">
                  <div className="flex items-center gap-2 text-primary">
                    <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                    <span className="text-sm">Fetching response…</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Prompts */}
        <div className="flex gap-2 py-3 border-t border-border mt-3">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
              disabled={isTyping}
              className="text-xs px-2 py-1 rounded bg-secondary hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary/30 font-mono flex items-center gap-1 disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3" />
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask tactical AI..."
            className="flex-1 bg-secondary/50 border-border focus:border-primary font-rajdhani"
          />
          <Button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </TacticalCard>
  );
}
