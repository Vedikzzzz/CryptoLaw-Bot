/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Button } from "@/components/ui/button";
import { SendHorizontal } from "lucide-react";
import cn from "clsx";
import { ModeToggle } from "@/components/ui/modeToggle";
import ReactMarkdown from "react-markdown";

const suggestions = [
  {
    id: 1,
    title: "What are the key regulations for launching a token in the UK?",
    description: "Summarize the legal framework for token launches in the UK.",
  },
  {
    id: 2,
    title: "How is staking taxed under UK crypto regulations?",
    description: "Get insights on how staking rewards are taxed in the UK.",
  },
  {
    id: 3,
    title: "Is my crypto project considered a security?",
    description:
      "Understand the criteria for crypto assets being classified as securities.",
  },
  {
    id: 4,
    title: "How does the FCA regulate DeFi projects?",
    description:
      "Summarize the FCA’s stance on decentralized finance (DeFi) platforms.",
  },
];

const MAX_CHARS = 2000;
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

export default function Chatbot() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    { id: string; content: string; role: "user" | "bot" }[]
  >([]);
  const [genModel, setGenModel] = useState<any | null>(null);
  const [showInitialUI, setShowInitialUI] = useState(true);
  const [centerInput, setCenterInput] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initializingBot, setInitializingBot] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeModel = async () => {
      try {
        const response = await fetch("/api/upload");
        const data = await response.json();
        if (data.success) {
          const genAI = new GoogleGenerativeAI(API_KEY);
          const model = genAI.getGenerativeModelFromCachedContent(
            data.cachedResult
          );
          console.log("Model initialized successfully");
          setGenModel(model);
          setInitializingBot(false);
        } else {
          console.error("Failed to initialize model");
        }
      } catch (error) {
        console.error("Failed to initialize model:", error);
      }
    };
    initializeModel();
  }, []);

  const handleBotResponse = async (userInput: string) => {
    if (!genModel) return;
    console.log("Generating bot response...");
    setLoading(true);

    try {
      const result = await genModel.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: userInput }],
          },
        ],
      });

      const botMessage: { id: string; content: string; role: "user" | "bot" } =
        {
          id: Date.now().toString(),
          content: result.response.text() || "No relevant answer found.",
          role: "bot",
        };

      setMessages((prev) => [...prev, botMessage]);
      scrollToBottom();
    } catch (error) {
      console.error("Error generating bot response:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Suggestion Click
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    handleFormSubmit();
  };

  // Handle Form Submit
  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const newMessage: { id: string; content: string; role: "user" | "bot" } = {
      id: Date.now().toString(),
      content: input,
      role: "user",
    };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setShowInitialUI(false);
    setCenterInput(false);
    handleBotResponse(input);
    scrollToBottom();
  };

  // Scroll to Bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <div className="absolute top-5 right-5">
        <ModeToggle />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="mx-auto w-full max-w-3xl">
          {showInitialUI && (
            <h1 className="text-4xl font-semibold text-center mt-20 mb-8">
              How can I assist you?
            </h1>
          )}

          {/* Suggestions Section */}
          {showInitialUI && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 mb-1">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  className="text-left w-full p-4 space-y-1 bg-[#ffffff] hover:bg-[#f9f9f9] dark:bg-[#171717] rounded-lg shadow-md dark:hover:bg-[#171717]/60 transition"
                  onClick={() => handleSuggestionClick(s.title)}
                >
                  <span className="block text-sm font-medium">{s.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {s.description}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Messages */}
          <div className="space-y-4 px-4 pb-32 pt-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "rounded-lg px-4 py-2 max-w-[75%]",
                  message.role === "user"
                    ? "ml-auto dark:bg-[#171717] bg-[#f3f3f3]"
                    : "bg-muted"
                )}
              >
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            ))}
            {loading && (
              <div className="px-4 py-2 rounded-lg bg-muted">Typing...</div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Section (Initially Centered) */}
      <div
        className={cn(
          "w-full max-w-3xl mx-auto transition-all duration-500",
          centerInput
            ? "absolute inset-x-0 bottom-[50%] translate-y-[50%]"
            : "sticky bottom-0"
        )}
      >
        <div className="relative px-4 py-4">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl bg-muted">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleFormSubmit();
                  }
                }}
                disabled={initializingBot}
                placeholder={
                  initializingBot
                    ? "Initializing The Bot. Please wait ><"
                    : "Start a new conversation..."
                }
                className="w-full min-h-[60px] resize-none border-0 bg-transparent p-4 text-foreground focus:ring-0"
                maxLength={MAX_CHARS}
              />
              <div className="absolute bottom-5 right-3 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {input.length}/{MAX_CHARS}
                </span>
                <Button
                  type="submit"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!input.trim()}
                >
                  <SendHorizontal className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
      <footer className="w-full bg-muted py-4 text-center text-sm text-muted-foreground">
        <p>
          ⚠️ This AI agent is not a lawyer and its responses do not constitute
          legal advice. For tailored legal advice, consult a professional.
        </p>
        <p className="mt-2">
          Need expert consultation?{" "}
          <a className="underline">Contact our legal team</a>.
        </p>
      </footer>
    </div>
  );
}
