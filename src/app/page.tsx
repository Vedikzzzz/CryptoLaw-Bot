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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BotDP from "../../public/bot-image.png";
import TypingIndicator from "@/components/ui/typingIndicator";

interface Suggestion {
  id: number;
  title: string;
  description: string;
  icon: string;
}

interface Message {
  id: string;
  content: string;
  role: "user" | "bot";
}

const suggestions: Suggestion[] = [
  {
    id: 1,
    title: "What are the key regulations for launching a token in the UK?",
    description: "Summarize the legal framework for token launches in the UK.",
    icon: "🚀",
  },
  {
    id: 2,
    title: "How is staking taxed under UK crypto regulations?",
    description: "Get insights on how staking rewards are taxed in the UK.",
    icon: "💰",
  },
  {
    id: 3,
    title: "Explain what is Tokenomics in Web3?",
    description:
      "Understand the what are Tokens and its economics deeply.",
    icon: "🔐",
  },
  {
    id: 4,
    title: "How does the FCA regulate DeFi projects?",
    description:
      "Summarize the FCA's stance on decentralized finance (DeFi) platforms.",
    icon: "⚖️",
  },
];

const MAX_CHARS = 2000;
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

export default function Chatbot() {
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [genModel, setGenModel] = useState<any | null>(null);
  const [showInitialUI, setShowInitialUI] = useState<boolean>(true);
  const [centerInput, setCenterInput] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [initializingBot, setInitializingBot] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const initializeModel = async (): Promise<void> => {
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

  const handleBotResponse = async (userInput: string): Promise<void> => {
    if (!genModel) return;
    console.log("Generating bot response...");
    setLoading(true);

    try {
      const result = await genModel.generateContent({
        contents: [{ role: "user", parts: [{ text: userInput }] }],
      });

      const botMessage: Message = {
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

  const handleSuggestionClick = (suggestion: string): void => {
    if(initializingBot) return;
    setInput(suggestion);
    handleFormSubmit();
  };

  const handleFormSubmit = (e?: React.FormEvent): void => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const newMessage: Message = {
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

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex h-screen flex-col  bg-background text-foreground transition-all duration-500">
      <div className="absolute top-5 right-5">
        <ModeToggle />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="mx-auto w-full max-w-3xl">
          {showInitialUI && (
            <h1 className="text-4xl font-semibold text-center mt-20 mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              How can I assist you?
            </h1>
          )}

          {showInitialUI && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 mb-1">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSuggestionClick(s.title)}
                  className="text-left w-full p-4 space-y-1 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-zinc-800 rounded-xl  transition-all duration-300 group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{s.icon}</span>
                    <span className="block text-sm font-medium">{s.title}</span>
                  </div>
                  <span className="block text-xs text-zinc-600 dark:text-zinc-400">
                    {s.description}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="space-y-4 px-4 pb-32 pt-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-3",
                  message.role === "user" && "flex-row-reverse"
                )}
              >
                <Avatar className="w-8 h-8 mt-[8px]">
                  {message.role === "bot" ? (
                    <AvatarImage src={BotDP.src} alt="Bot" />
                  ) : (
                    <AvatarImage
                      src="https://avatars.githubusercontent.com/u/116568350?v=4"
                      alt="User"
                    />
                  )}
                  <AvatarFallback>
                    {message.role === "bot" ? "AI" : "You"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "rounded-xl px-4 py-2 max-w-[75%] backdrop-blur-sm transition-all duration-300",
                    message.role === "user"
                      ? "ml-auto bg-[#f3f3f3]/80 dark:bg-zinc-800/80 mr-2 mt-1 "
                      : ""
                  )}
                >
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-start ">
                <Avatar className="w-8 h-8 " >
                  <AvatarImage src={BotDP.src} alt="Bot" />
                </Avatar> 
                <TypingIndicator />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

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
            <div className="relative overflow-hidden rounded-xl bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
                className="w-full min-h-[60px] resize-none border-0 bg-transparent p-4 focus:ring-0"
                maxLength={MAX_CHARS}
              />
              <div className="absolute bottom-5 right-3 flex items-center gap-2">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  {input.length}/{MAX_CHARS}
                </span>
                <Button
                  type="submit"
                  size="icon"
                  className="h-8 w-8  hover:opacity-90"
                  disabled={!input.trim()}
                >
                  <SendHorizontal className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
      <footer className="w-full bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm py-4 text-center text-sm text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-700">
        <p>
          ⚠️ This AI agent is not a lawyer and its responses do not constitute
          legal advice. For tailored legal advice, consult a professional.
        </p>
        <p className="mt-2">
          Need expert consultation?{" "}
          <a className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
            Contact our legal team
          </a>
        </p>
      </footer>
    </div>
  );
}
