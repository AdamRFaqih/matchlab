"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bot,
  User,
  Send,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { sendCandidateMessageAction } from "../actions";
import type { ChatMessage, InterviewSessionData } from "../types";

interface ScreeningChatRoomProps {
  initialSession: InterviewSessionData;
}

const MAX_CHAR_LIMIT = 1200;

export function ScreeningChatRoom({ initialSession }: ScreeningChatRoomProps) {
  const [session, setSession] = useState<InterviewSessionData>(initialSession);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.messages, isSending]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (session.isCompleted || isSending) return;

    const trimmed = inputValue.trim();
    if (!trimmed) return;

    if (trimmed.length > MAX_CHAR_LIMIT) {
      setErrorMessage(`Pesan melebihi batas maksimal ${MAX_CHAR_LIMIT} karakter.`);
      return;
    }

    setErrorMessage(null);
    setIsSending(true);

    // Optimistically append candidate message to UI
    const optimisticUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setSession((prev) => ({
      ...prev,
      messages: [...prev.messages, optimisticUserMessage],
    }));
    setInputValue("");

    try {
      const res = await sendCandidateMessageAction(session.id, trimmed);

      if (res.success && res.session) {
        setSession(res.session);
      } else {
        setErrorMessage(res.error || "Gagal mengirim pesan.");
        // Rollback optimistic message on failure
        setSession((prev) => ({
          ...prev,
          messages: prev.messages.filter((m) => m.id !== optimisticUserMessage.id),
        }));
        setInputValue(trimmed);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi gangguan koneksi.");
      setInputValue(trimmed);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const progressPercentage = Math.min(
    100,
    Math.round((session.turnCount / session.maxTurns) * 100)
  );

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-5rem)] py-2 sm:py-4 px-2 sm:px-4">
      {/* Header card with progress bar */}
      <Card className="rounded-b-none border-b-0 shrink-0 bg-card">
        <CardHeader className="py-3 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg">{session.jobTitle}</span>
                {session.isCompleted ? (
                  <Badge variant="outline" className="text-muted-foreground border-border text-xs">
                    <Lock className="w-3 h-3 mr-1" /> Wawancara Selesai
                  </Badge>
                ) : (
                  <Badge variant="default" className="bg-emerald-600 text-white text-xs">
                    <span className="w-2 h-2 rounded-full bg-white mr-1.5 animate-pulse" /> Sesi Berlangsung
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs mt-0.5">
                Kandidat: <span className="font-medium text-foreground">{session.candidateName}</span>
              </CardDescription>
            </div>

            <div className="flex flex-col sm:items-end gap-1">
              <span className="text-xs font-mono font-semibold">
                Giliran {session.turnCount} dari {session.maxTurns} ({progressPercentage}%)
              </span>
              <div className="w-full sm:w-36 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  style={{ width: `${progressPercentage}%` }}
                  className={`h-full transition-all duration-300 ${
                    session.isCompleted ? "bg-emerald-600" : "bg-primary"
                  }`}
                />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 border-x bg-muted/20">
        {session.messages.map((msg) => {
          const isAssistant = msg.role === "assistant";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isAssistant ? "justify-start" : "justify-end"}`}
            >
              {isAssistant && (
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                  isAssistant
                    ? "bg-card border text-card-foreground rounded-tl-xs"
                    : "bg-primary text-primary-foreground rounded-tr-xs"
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                <div
                  className={`text-[10px] mt-1.5 opacity-60 ${
                    isAssistant ? "text-muted-foreground text-left" : "text-primary-foreground text-right"
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              {!isAssistant && (
                <div className="w-8 h-8 rounded-full bg-muted text-foreground flex items-center justify-center shrink-0 mt-0.5 border">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* AI Typing Indicator */}
        {isSending && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-card border rounded-2xl px-4 py-3 text-sm rounded-tl-xs flex items-center gap-1.5 text-muted-foreground shadow-xs">
              <Sparkles className="w-4 h-4 text-primary animate-spin" />
              <span>AI sedang menganalisis jawaban dan menyiapkan skenario...</span>
            </div>
          </div>
        )}

        {/* Completed banner */}
        {session.isCompleted && (
          <Card className="border-emerald-500/40 bg-emerald-500/10 my-4">
            <CardHeader className="py-4">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <CardTitle className="text-base font-bold">Wawancara Selesai (Batas {session.maxTurns} Giliran Tercapai)</CardTitle>
              </div>
              <CardDescription className="text-emerald-700 dark:text-emerald-300 text-xs leading-relaxed pt-1">
                Terima kasih, <strong>{session.candidateName}</strong>! Sesi wawancara awalmu telah otomatis
                terkunci dan terkirim ke sistem evaluasi MatchLab. Pihak perekrut akan mengabari informasi
                selanjutnya via email.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input or Locked footer */}
      <Card className="rounded-t-none border-t shrink-0 bg-card">
        <CardContent className="p-3 sm:p-4 space-y-2">
          {errorMessage && (
            <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 p-2 rounded-md border border-destructive/20">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {session.isCompleted ? (
            <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground font-medium">
              <Lock className="w-4 h-4" />
              Sesi wawancara telah dikunci. Jawaban kamu sedang diproses dalam leaderboard penilai.
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="space-y-2">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  rows={3}
                  placeholder="Ketik jawabanmu di sini... (Tekan Enter untuk kirim, Shift+Enter untuk baris baru)"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSending}
                  className="pr-12 text-sm resize-none"
                  maxLength={MAX_CHAR_LIMIT}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span
                  className={`text-xs ${
                    inputValue.length > MAX_CHAR_LIMIT - 100
                      ? "text-destructive font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {inputValue.length} / {MAX_CHAR_LIMIT} karakter
                </span>

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSending || !inputValue.trim()}
                  className="gap-1.5 font-semibold"
                >
                  <Send className="w-4 h-4" />
                  Kirim Jawaban
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
