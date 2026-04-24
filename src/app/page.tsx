"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PromptTemplate {
  id: string;
  name: string;
  text: string;
}

interface GenerationResult {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: number;
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("cadavre");
  const [aspectRatio, setAspectRatio] = useState("1024x1024");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<GenerationResult[]>([]);

  useEffect(() => {
    // Fetch templates
    fetch("/api/prompts")
      .then((res) => res.json())
      .then((data) => {
        setTemplates(data);
        if (data.length > 0) setSelectedTemplateId(data[0].id);
      })
      .catch((err) => toast.error("Failed to load prompts"));

    // Load history from localStorage
    const savedHistory = localStorage.getItem("gen_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setLoading(true);
    const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

    try {
      const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          category: "image",
          styleName: selectedTemplate?.name,
          systemPrompt: selectedTemplate?.text,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const newResult: GenerationResult = {
          id: Math.random().toString(36).substring(7),
          prompt: data.enhancedPrompt || prompt,
          imageUrl: data.imageUrl,
          timestamp: Date.now(),
        };

        const updatedHistory = [newResult, ...history];
        setHistory(updatedHistory);
        localStorage.setItem("gen_history", JSON.stringify(updatedHistory));
        toast.success("Generation complete!");
      } else {
        toast.error(data.error || "Generation failed");
      }
    } catch (err: any) {
      toast.error("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8 lg:px-16">
      {/* Header */}
      <header className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.4)]">
            <span className="material-symbols-outlined text-white font-bold">bolt</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tighter neon-text">NeonAI</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full">
            <span className="material-symbols-outlined">notifications</span>
          </Button>
          <Avatar className="w-10 h-10 border-2 border-primary/20 shadow-xl">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto space-y-12">
        {/* Input Section */}
        <section>
          <Card className="glass border-primary/20 shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden">
            <CardContent className="p-6 md:p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <span className="material-symbols-outlined text-xs">auto_fix_high</span>
                  What do you want to create?
                </label>
                <Textarea
                  placeholder="A futuristic cyber-city with neon lights and rain..."
                  className="bg-background/50 border-white/5 min-h-[120px] text-lg resize-none focus:ring-primary/50 transition-all duration-300"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Style</label>
                  <ScrollArea className="w-full whitespace-nowrap pb-2">
                    <div className="flex gap-2">
                      {templates.map((t) => (
                        <Button
                          key={t.id}
                          variant={selectedTemplateId === t.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTemplateId(t.id)}
                          className={`rounded-full transition-all duration-300 ${
                            selectedTemplateId === t.id 
                              ? "shadow-[0_0_15px_rgba(var(--primary),0.4)]" 
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          {t.name}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="w-full md:w-48 space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Aspect Ratio</label>
                  <Select value={aspectRatio} onValueChange={(val) => val && setAspectRatio(val)}>
                    <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                      <SelectValue placeholder="Ratio" />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      <SelectItem value="1024x1024">Square (1:1)</SelectItem>
                      <SelectItem value="1024x1792">Tall (9:16)</SelectItem>
                      <SelectItem value="1792x1024">Wide (16:9)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary via-primary to-secondary hover:opacity-90 shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all duration-500 group"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin material-symbols-outlined">progress_activity</span>
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Generate
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* History Section */}
        {history.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">history</span>
                Recent Creations
              </h2>
              <Button variant="ghost" size="sm" onClick={() => {
                setHistory([]);
                localStorage.removeItem("gen_history");
              }} className="text-muted-foreground hover:text-destructive">
                Clear All
              </Button>
            </div>
            
            <div className="bento-grid">
              {history.map((item, idx) => (
                <div
                  key={item.id}
                  className={`relative group rounded-3xl overflow-hidden glass border-white/5 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${
                    idx === 0 ? "bento-item-large" : ""
                  }`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.prompt}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                    <p className="text-sm line-clamp-2 mb-4 text-white/90">
                      {item.prompt}
                    </p>
                    <div className="flex gap-2">
                      <a 
                        href={item.imageUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        download 
                        className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "flex-1 rounded-xl")}
                      >
                        <span className="material-symbols-outlined text-sm mr-2">download</span>
                        Download
                      </a>
                      <Button size="sm" variant="outline" className="bg-white/5 border-white/10 backdrop-blur-md rounded-xl" onClick={() => {
                        navigator.clipboard.writeText(item.imageUrl);
                        toast.success("Link copied!");
                      }}>
                        <span className="material-symbols-outlined text-sm">content_copy</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
