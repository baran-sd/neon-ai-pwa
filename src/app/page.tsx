"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ImageIcon, VideoIcon, Music2Icon, SparklesIcon,
  SendIcon, Trash2Icon, DownloadIcon, CopyIcon,
  SettingsIcon, PlusIcon, ZapIcon, ChevronDownIcon,
  ExternalLinkIcon, HistoryIcon, XIcon, MenuIcon,
} from "lucide-react";

interface PromptTemplate { id: string; name: string; text: string; }
interface GenerationResult {
  id: string; prompt: string; imageUrl: string;
  timestamp: number; mediaType: "image" | "video" | "audio";
}

const MODELS = [
  // ── Image (free) ──
  { value: "flux",        label: "Flux Schnell",      icon: "⚡", cat: "image", free: true },
  { value: "zimage",      label: "Z-Image Turbo",     icon: "🔷", cat: "image", free: true },
  { value: "ltx-2",       label: "LTX-2 Video",       icon: "🎬", cat: "video", free: true },
  { value: "ltx-2",       label: "LTX-2.3 Video",     icon: "🎬", cat: "video", free: true },
  { value: "wan-image",   label: "Wan 2.7 Image",     icon: "🖼️", cat: "image", free: true },
  { value: "qwen-image",  label: "Qwen Image Plus",   icon: "🀄", cat: "image", free: true },
  { value: "klein",       label: "FLUX.2 Klein 4B",   icon: "🌀", cat: "image", free: true },
  { value: "gptimage",    label: "GPT Image 1 Mini",  icon: "🤖", cat: "image", free: true },
  // ── Image (paid) ──
  { value: "kontext",     label: "FLUX Kontext",      icon: "✏️", cat: "image", free: false },
  { value: "gptimage-large", label: "GPT Image 1.5",  icon: "🤖", cat: "image", free: false },
  { value: "gpt-image-2", label: "GPT Image 2",       icon: "🤖", cat: "image", free: false },
  { value: "grok-imagine",label: "Grok Imagine",      icon: "🌌", cat: "image", free: false },
  { value: "grok-imagine-pro", label: "Grok Aurora",  icon: "🌠", cat: "image", free: false },
  { value: "wan-image-pro",label: "Wan 2.7 Pro 4K",  icon: "🖼️", cat: "image", free: false },
  { value: "nanobanana",  label: "NanoBanana (Gemini)",icon:"🍌", cat: "image", free: false },
  { value: "seedream5",   label: "Seedream 5 Lite",   icon: "🌱", cat: "image", free: false },
  // ── Video (free) ──
  { value: "ltx-2",       label: "LTX-2.3 Video",     icon: "🎬", cat: "video", free: true },
  { value: "nova-reel",   label: "Nova Reel 720p",    icon: "🎥", cat: "video", free: true },
  // ── Video (paid) ──
  { value: "wan",         label: "Wan 2.6 Video+Audio",icon:"🎞️", cat: "video", free: false },
  { value: "wan-fast",    label: "Wan 2.2 Fast 480p", icon: "🎞️", cat: "video", free: false },
  { value: "veo",         label: "Veo 3.1 Fast",      icon: "🔵", cat: "video", free: false },
  { value: "seedance",    label: "Seedance Lite",     icon: "🌱", cat: "video", free: false },
  { value: "grok-video-pro",label: "Grok Video Pro",  icon: "🌌", cat: "video", free: false },
  // ── Audio (free) ──
  { value: "elevenlabs",  label: "ElevenLabs TTS",    icon: "🎙️", cat: "audio", free: true },
  { value: "acestep",     label: "ACE-Step 1.5",      icon: "🎵", cat: "audio", free: true },
  { value: "qwen-tts",    label: "Qwen3 TTS",         icon: "🀄", cat: "audio", free: true },
  // ── Audio (paid) ──
  { value: "elevenmusic", label: "ElevenLabs Music",  icon: "🎼", cat: "audio", free: false },
  { value: "qwen-tts-instruct", label: "Qwen TTS Style", icon: "🀄", cat: "audio", free: false },
]
  // deduplicate by value+cat
  .filter((m, i, arr) => arr.findIndex(x => x.value === m.value && x.cat === m.cat) === i);

const RATIOS = [
  { value: "1024x1024", label: "Square 1:1" },
  { value: "1024x1792", label: "Portrait 9:16" },
  { value: "1792x1024", label: "Landscape 16:9" },
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1024x1024");
  const [selectedModel, setSelectedModel] = useState("flux");
  const [loading, setLoading] = useState(false);
  const [enhance, setEnhance] = useState(true);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [history, setHistory] = useState<GenerationResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showRatioMenu, setShowRatioMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const ratioMenuRef = useRef<HTMLDivElement>(null);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  useEffect(() => {
    fetch("/api/prompts")
      .then(r => r.json())
      .then(data => { setTemplates(data); if (data.length > 0) setSelectedTemplateId(data[0].id); })
      .catch(() => {});
    const saved = localStorage.getItem("gen_history");
    if (saved) { try { setHistory(JSON.parse(saved)); } catch {} }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstallBtn(false);
      setDeferredPrompt(null);
    }
  };

  // close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) setShowModelMenu(false);
      if (ratioMenuRef.current && !ratioMenuRef.current.contains(e.target as Node)) setShowRatioMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeModel = MODELS.find(m => m.value === selectedModel) || MODELS[0];
  const activeRatio = RATIOS.find(r => r.value === aspectRatio) || RATIOS[0];

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Enter a prompt first"); return; }
    setLoading(true);
    try {
      const tmpl = templates.find(t => t.id === selectedTemplateId);
      // derive category from the models table — no hardcoded list needed
      const cat: "image" | "video" | "audio" = (activeModel.cat as any) || "image";
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model: selectedModel, aspectRatio, category: cat, enhance, systemPrompt: tmpl?.text }),
      });
      const data = await res.json();
      if (data.success) {
        const item: GenerationResult = {
          id: Math.random().toString(36).slice(2),
          prompt: data.enhancedPrompt || prompt,
          imageUrl: data.imageUrl,
          timestamp: Date.now(),
          mediaType: cat,
        };
        setResult(item);
        const updated = [item, ...history];
        setHistory(updated);
        localStorage.setItem("gen_history", JSON.stringify(updated));
        toast.success("Done!");
      } else toast.error(data.error || "Failed");
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
  };

  const clearHistory = () => {
    setHistory([]); localStorage.removeItem("gen_history");
    if (result) setResult(null);
  };

  return (
    <div className="main-layout" style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#0a0a0a" }}>

      {/* ── Mobile overlay ── */}
      <div
        className={cn("sidebar-overlay", sidebarOpen && "open")}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Sidebar ── */}
      <aside className={cn("sidebar", sidebarOpen && "mobile-open")} style={{ display: "flex", flexDirection: "column" }}>
        {/* Logo */}
        <div style={{ padding: "20px 16px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#ff6b35,#ffbc6b)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <ZapIcon size={16} color="#fff" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#f2f2f2", letterSpacing: "-0.02em" }}>NeonAI</span>
          <span className="g-badge" style={{ marginLeft: "auto" }}>Pro</span>
          {/* Close button — mobile only */}
          <button onClick={() => setSidebarOpen(false)}
            style={{ display: "none", alignItems: "center", justifyContent: "center",
              width: 28, height: 28, background: "none", border: "none", cursor: "pointer", color: "#6b6b6b",
              marginLeft: 4, flexShrink: 0 }}
            className="sidebar-close-btn">
            <XIcon size={16} />
          </button>
        </div>

        {/* New chat */}
        <div style={{ padding: "8px 12px" }}>
          <button
            onClick={() => { setResult(null); setPrompt(""); }}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, padding: "8px 12px", cursor: "pointer", color: "#d4d4d4",
              fontSize: 13, fontWeight: 500, transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
          >
            <PlusIcon size={14} />
            New creation
          </button>
        </div>

        {/* Nav */}
        <nav style={{ padding: "12px", flex: 1, overflowY: "auto" }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 4px 8px" }}>
            Media
          </p>
          {[
            { icon: <ImageIcon size={14}/>, label: "Images", cat: "image" },
            { icon: <VideoIcon size={14}/>, label: "Videos", cat: "video" },
            { icon: <Music2Icon size={14}/>, label: "Audio", cat: "audio" },
          ].map(item => {
            const isActive = activeModel.cat === item.cat;
            return (
              <div key={item.cat} className={cn("nav-item", isActive && "active")} style={{ marginBottom: 2 }}
                onClick={() => {
                  const m = MODELS.find(m => m.cat === item.cat);
                  if (m) setSelectedModel(m.value);
                }}>
                {item.icon}
                <span>{item.label}</span>
              </div>
            );
          })}

          <p style={{ fontSize: 10, fontWeight: 600, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em", padding: "16px 4px 8px" }}>
            History
          </p>
          <div className="nav-item" onClick={() => setShowHistory(h => !h)}>
            <HistoryIcon size={14} />
            <span>Recent ({history.length})</span>
          </div>
          {history.length > 0 && (
            <div className="nav-item" onClick={clearHistory} style={{ color: "#ef4444" }}>
              <Trash2Icon size={14} />
              <span>Clear all</span>
            </div>
          )}
          {showInstallBtn && (
            <div className="nav-item" onClick={handleInstallClick} style={{ color: "#4ade80", marginTop: 12, background: "rgba(34,197,94,0.1)" }}>
              <DownloadIcon size={14} />
              <span>Install App</span>
            </div>
          )}
        </nav>

        {/* Style templates */}
        {templates.length > 0 && (
          <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Style
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {templates.map(t => (
                <div key={t.id} className={cn("nav-item", selectedTemplateId === t.id && "active")}
                  onClick={() => setSelectedTemplateId(t.id)}>
                  <SparklesIcon size={12} />
                  <span style={{ fontSize: 12 }}>{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* ── Main Area ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

        {/* Top bar */}
        <header className="topbar" style={{
          height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Hamburger — hidden on desktop via CSS */}
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              style={{ display: "none", alignItems: "center", justifyContent: "center",
                width: 32, height: 32, background: "none", border: "none", cursor: "pointer",
                color: "#a1a1a1", marginRight: 4, flexShrink: 0 }}>
              <MenuIcon size={18} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#f2f2f2" }}>Create</span>
            <span style={{ fontSize: 13, color: "#444" }}>/ {activeModel.label}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {result && (
              <button onClick={() => window.open(result.imageUrl, "_blank")}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8, cursor: "pointer", color: "#a1a1a1", fontSize: 12, fontWeight: 500 }}>
                <ExternalLinkIcon size={12} /> Open
              </button>
            )}
            <button style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
              background: "transparent", border: "none", cursor: "pointer", color: "#6b6b6b",
              borderRadius: 8, transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#d4d4d4")}
              onMouseLeave={e => (e.currentTarget.style.color = "#6b6b6b")}>
              <SettingsIcon size={16} />
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="content-area" style={{ flex: 1, overflowY: "auto", padding: "0 24px 24px" }}>

          {/* History panel */}
          {showHistory && history.length > 0 && (
            <div className="fade-up" style={{ marginTop: 24, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#a1a1a1" }}>Recent creations</span>
                <button onClick={() => setShowHistory(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#444" }}>
                  <XIcon size={14} />
                </button>
              </div>
              <div className="history-grid">
                {history.map(item => (
                  <div key={item.id} className="thumb" onClick={() => setResult(item)}>
                    {item.mediaType === "audio" ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", background: "#1a1a1a" }}>
                        <Music2Icon size={32} color="#ff6b35" />
                      </div>
                    ) : item.mediaType === "video" ? (
                      <video src={item.imageUrl} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <img src={item.imageUrl} alt={item.prompt} />
                    )}
                    <div className="thumb-overlay">
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", lineClamp: 2, overflow: "hidden",
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>
                        {item.prompt}
                      </p>
                      <div style={{ display: "flex", gap: 6 }}>
                        <a href={item.imageUrl} download target="_blank" rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                            padding: "4px 8px", background: "rgba(255,255,255,0.12)", border: "none",
                            borderRadius: 6, fontSize: 11, color: "#fff", textDecoration: "none", cursor: "pointer" }}>
                          <DownloadIcon size={10} /> Save
                        </a>
                        <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(item.imageUrl); toast.success("Copied!"); }}
                          style={{ width: 26, display: "flex", alignItems: "center", justifyContent: "center",
                            background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 6, cursor: "pointer", color: "#fff" }}>
                          <CopyIcon size={10} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result preview */}
          {result && !loading && (
            <div className="fade-up" style={{ marginTop: 24, marginBottom: 16 }}>
              <div className="g-card" style={{ overflow: "hidden" }}>
                <div style={{ position: "relative", background: "#111", minHeight: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {result.mediaType === "image" ? (
                    <img src={result.imageUrl} alt={result.prompt}
                      style={{ maxWidth: "100%", maxHeight: 520, objectFit: "contain", display: "block", margin: "0 auto" }} />
                  ) : result.mediaType === "video" ? (
                    <video src={result.imageUrl} controls autoPlay loop
                      style={{ maxWidth: "100%", maxHeight: 520, display: "block", margin: "0 auto" }} />
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: 40, width: "100%" }}>
                      <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,107,53,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Music2Icon size={28} color="#ff6b35" />
                      </div>
                      <audio src={result.imageUrl} controls autoPlay style={{ width: "100%", maxWidth: 400 }} />
                    </div>
                  )}
                  <button onClick={() => setResult(null)}
                    style={{ position: "absolute", top: 12, right: 12, width: 28, height: 28,
                      background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                    <XIcon size={12} />
                  </button>
                </div>
                <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 8 }}>
                  <p style={{ flex: 1, fontSize: 12, color: "#6b6b6b", lineHeight: 1.5, margin: 0 }}>{result.prompt}</p>
                  <a href={result.imageUrl} download target="_blank" rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 6, fontSize: 12, color: "#d4d4d4", textDecoration: "none", whiteSpace: "nowrap" }}>
                    <DownloadIcon size={12} /> Download
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="fade-up" style={{ marginTop: 24, marginBottom: 16 }}>
              <div className="g-card" style={{ padding: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <div style={{ position: "relative", width: 48, height: 48 }}>
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    border: "3px solid rgba(255,107,53,0.15)",
                    borderTopColor: "#ff6b35", animation: "spin-smooth 0.8s linear infinite",
                  }} />
                </div>
                <p style={{ fontSize: 13, color: "#6b6b6b", margin: 0 }}>Generating with {activeModel.label}…</p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!result && !loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              minHeight: "40vh", gap: 12, paddingTop: 40, textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16,
                background: "linear-gradient(135deg,rgba(255,107,53,0.15),rgba(255,188,107,0.08))",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
                <SparklesIcon size={24} color="#ff6b35" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#f2f2f2", margin: 0, letterSpacing: "-0.02em" }}>
                What will you create?
              </h2>
              <p style={{ fontSize: 13, color: "#6b6b6b", margin: 0, maxWidth: 340 }}>
                Describe an image, video, or audio and let AI bring it to life. Press <kbd style={{ padding: "1px 5px", background: "#1a1a1a", border: "1px solid #333", borderRadius: 4, fontSize: 11 }}>⌘ Enter</kbd> to generate.
              </p>
            </div>
          )}
        </div>

        {/* ── Input Bar ── */}
        <div className="input-bar-wrap" style={{ padding: "12px 24px 20px", flexShrink: 0 }}>
          <div className="chat-input-surface" style={{ display: "flex", flexDirection: "column", gap: 0 }}>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Describe what you want to create…"
              rows={3}
              style={{
                width: "100%", background: "transparent", border: "none", outline: "none",
                resize: "none", padding: "16px 18px 8px",
                fontSize: 14, lineHeight: 1.6, color: "#f2f2f2",
                fontFamily: "inherit",
              }}
            />

            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px 12px", flexWrap: "wrap" }}>

              {/* Model picker */}
              <div ref={modelMenuRef} style={{ position: "relative" }}>
                <button className="g-chip" onClick={() => setShowModelMenu(v => !v)}>
                  <span>{activeModel.icon}</span>
                  <span>{activeModel.label}</span>
                  <ChevronDownIcon size={10} />
                </button>
                {showModelMenu && (
                  <div style={{
                    position: "absolute", bottom: "calc(100% + 6px)", left: 0,
                    background: "#161616", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                    padding: 6, minWidth: 200, zIndex: 50, boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                  }}>
                    {(["image","video","audio"] as const).map(cat => (
                      <div key={cat}>
                        <p style={{ fontSize: 10, fontWeight: 600, color: "#3a3a3a", textTransform: "uppercase",
                          letterSpacing: "0.08em", padding: "6px 8px 4px", margin: 0 }}>{cat}</p>
                        {MODELS.filter(m => m.cat === cat).map(m => (
                          <button key={m.value} onClick={() => { setSelectedModel(m.value); setShowModelMenu(false); }}
                            style={{
                              width: "100%", display: "flex", alignItems: "center", gap: 8,
                              padding: "6px 10px",
                              background: selectedModel === m.value ? "rgba(255,107,53,0.1)" : "transparent",
                              border: "none", borderRadius: 6, cursor: "pointer",
                              color: selectedModel === m.value ? "#ff6b35" : "#a1a1a1",
                              fontSize: 13, textAlign: "left", transition: "background 0.1s",
                            }}
                            onMouseEnter={e => { if (selectedModel !== m.value) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                            onMouseLeave={e => { if (selectedModel !== m.value) e.currentTarget.style.background = "transparent"; }}>
                            <span style={{ fontSize: 14 }}>{m.icon}</span>
                            <span style={{ flex: 1 }}>{m.label}</span>
                            <span style={{
                              fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                              padding: "1px 5px", borderRadius: 4,
                              background: m.free ? "rgba(34,197,94,0.12)" : "rgba(255,107,53,0.12)",
                              color: m.free ? "#4ade80" : "#ff6b35",
                              border: `1px solid ${m.free ? "rgba(34,197,94,0.2)" : "rgba(255,107,53,0.2)"}`,
                              flexShrink: 0,
                            }}>{m.free ? "FREE" : "PRO"}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ratio picker */}
              {activeModel.cat === "image" && (
                <div ref={ratioMenuRef} style={{ position: "relative" }}>
                  <button className="g-chip" onClick={() => setShowRatioMenu(v => !v)}>
                    <span>⬜</span>
                    <span>{activeRatio.label}</span>
                    <ChevronDownIcon size={10} />
                  </button>
                  {showRatioMenu && (
                    <div style={{
                      position: "absolute", bottom: "calc(100% + 6px)", left: 0,
                      background: "#161616", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                      padding: 6, minWidth: 160, zIndex: 50, boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                    }}>
                      {RATIOS.map(r => (
                        <button key={r.value} onClick={() => { setAspectRatio(r.value); setShowRatioMenu(false); }}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", padding: "6px 10px",
                            background: aspectRatio === r.value ? "rgba(255,107,53,0.1)" : "transparent",
                            border: "none", borderRadius: 6, cursor: "pointer",
                            color: aspectRatio === r.value ? "#ff6b35" : "#a1a1a1", fontSize: 13, textAlign: "left",
                          }}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Enhance toggle */}
              <button className={cn("g-chip", enhance && "active")} onClick={() => setEnhance(v => !v)}>
                <SparklesIcon size={10} />
                {enhance ? "Enhanced" : "Fast"}
              </button>

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* Send button */}
              <button
                className="generate-btn"
                disabled={loading || !prompt.trim()}
                onClick={handleGenerate}
                style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", fontSize: 14 }}
              >
                {loading ? (
                  <>
                    <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff", borderRadius: "50%" }} className="spin" />
                    Generating
                  </>
                ) : (
                  <>Generate <SendIcon size={14} /></>
                )}
              </button>
            </div>
          </div>

          <p style={{ fontSize: 11, color: "#333", textAlign: "center", marginTop: 10, marginBottom: 0 }}>
            NeonAI can make mistakes. Verify important outputs. Powered by Pollinations.ai
          </p>
        </div>
      </main>
    </div>
  );
}
