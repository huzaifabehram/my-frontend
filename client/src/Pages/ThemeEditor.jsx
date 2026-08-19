import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme, deepMerge, DEFAULT_THEME } from "../context/ThemeContext";
import { API } from "../context/AuthContext";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getNestedValue(obj, path) {
  return path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
}
function setNestedValue(obj, path, value) {
  const result = JSON.parse(JSON.stringify(obj));
  const keys = path.split(".");
  let current = result;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== "object") current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
  return result;
}
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ─── Editor Controls ─────────────────────────────────────────────────────────
function ColorControl({ label, value, onChange, onReset, defaultValue }) {
  const [text, setText] = useState(value || "");
  useEffect(() => setText(value || ""), [value]);
  return (
    <div className="flex items-center gap-2 py-1.5">
      <label className="text-xs text-gray-400 flex-1 min-w-0 truncate" title={label}>{label}</label>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <input type="color" value={value || "#000000"} onChange={(e) => { setText(e.target.value); onChange(e.target.value); }}
          className="w-7 h-7 rounded border border-gray-600 cursor-pointer p-0" style={{ appearance: "none", WebkitAppearance: "none" }} />
        <input type="text" value={text} onChange={(e) => { setText(e.target.value); if (/^#[0-9a-fA-F]{3,8}$/.test(e.target.value) || /^rgb/.test(e.target.value)) onChange(e.target.value); }}
          className="w-20 text-xs bg-gray-800 border border-gray-600 rounded px-1.5 py-1 text-gray-200 font-mono" />
        {onReset && <button onClick={onReset} className="text-[10px] text-gray-500 hover:text-gray-300 px-1" title="Reset">↺</button>}
      </div>
    </div>
  );
}

function TextControl({ label, value, onChange, placeholder, multiline }) {
  return (
    <div className="py-1.5">
      <label className="text-xs text-gray-400 block mb-1">{label}</label>
      {multiline ? (
        <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-gray-200 resize-y min-h-[60px]" />
      ) : (
        <input type="text" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-gray-200" />
      )}
    </div>
  );
}

function NumberControl({ label, value, onChange, min, max, step, unit }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <label className="text-xs text-gray-400 flex-1 min-w-0 truncate">{label}</label>
      <div className="flex items-center gap-1 flex-shrink-0">
        <input type="number" value={parseFloat(value) || 0} onChange={(e) => onChange(unit ? `${e.target.value}${unit}` : e.target.value)}
          min={min} max={max} step={step || 1}
          className="w-16 text-xs bg-gray-800 border border-gray-600 rounded px-1.5 py-1 text-gray-200 text-right" />
        {unit && <span className="text-[10px] text-gray-500">{unit}</span>}
      </div>
    </div>
  );
}

function SliderControl({ label, value, onChange, min, max, step, unit }) {
  const numVal = parseFloat(value) || min || 0;
  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs text-gray-400">{label}</label>
        <span className="text-xs text-gray-300 font-mono">{numVal}{unit || ""}</span>
      </div>
      <input type="range" value={numVal} onChange={(e) => onChange(unit ? `${e.target.value}${unit}` : Number(e.target.value))}
        min={min || 0} max={max || 100} step={step || 1}
        className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-purple-500" />
    </div>
  );
}

function ToggleControl({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <label className="text-xs text-gray-400">{label}</label>
      <button onClick={() => onChange(!value)}
        className={`w-9 h-5 rounded-full transition-colors relative ${value ? "bg-purple-600" : "bg-gray-600"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow ${value ? "left-[18px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function SelectControl({ label, value, onChange, options }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <label className="text-xs text-gray-400 flex-1 min-w-0 truncate">{label}</label>
      <select value={value || ""} onChange={(e) => onChange(e.target.value)}
        className="text-xs bg-gray-800 border border-gray-600 rounded px-1.5 py-1 text-gray-200 max-w-[140px]">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function FontControl({ label, value, onChange }) {
  const fonts = [
    { value: "", label: "Default" },
    { value: "'DM Sans', sans-serif", label: "DM Sans" },
    { value: "'Playfair Display', serif", label: "Playfair Display" },
    { value: "'Inter', sans-serif", label: "Inter" },
    { value: "'Poppins', sans-serif", label: "Poppins" },
    { value: "'Montserrat', sans-serif", label: "Montserrat" },
    { value: "'Roboto', sans-serif", label: "Roboto" },
    { value: "'Lato', sans-serif", label: "Lato" },
    { value: "'Open Sans', sans-serif", label: "Open Sans" },
    { value: "'Oswald', sans-serif", label: "Oswald" },
    { value: "'Raleway', sans-serif", label: "Raleway" },
    { value: "'Source Sans 3', sans-serif", label: "Source Sans" },
    { value: "'Merriweather', serif", label: "Merriweather" },
    { value: "'Cormorant Garamond', serif", label: "Cormorant Garamond" },
    { value: "'Libre Baskerville', serif", label: "Libre Baskerville" },
    { value: "'Georgia', serif", label: "Georgia" },
    { value: "'Times New Roman', serif", label: "Times New Roman" },
    { value: "system-ui, sans-serif", label: "System UI" },
  ];
  return <SelectControl label={label} value={value} onChange={onChange} options={fonts} />;
}

function ResponsiveControl({ label, value, onChange }) {
  const val = typeof value === "object" ? value : { desktop: value || "", tablet: value || "", mobile: value || "" };
  return (
    <div className="py-1.5">
      <label className="text-xs text-gray-400 block mb-1">{label}</label>
      <div className="grid grid-cols-3 gap-1">
        {["desktop", "tablet", "mobile"].map((bp) => (
          <div key={bp}>
            <span className="text-[9px] text-gray-500 uppercase">{bp[0].toUpperCase()}</span>
            <input type="text" value={val[bp] || ""} onChange={(e) => onChange({ ...val, [bp]: e.target.value })}
              className="w-full text-[11px] bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-gray-200" placeholder="auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionGroup({ title, children, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);
  return (
    <div className="border-b border-gray-700/50">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-800/50 transition">
        <span className="uppercase tracking-wider">{title}</span>
        <span className={`transition-transform text-gray-500 ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

function ImageUploadControl({ label, value, onChange }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await API.post("/upload/image", fd, { headers: { "Content-Type": "multipart/form-data" } });
      onChange(res.data.url || res.data.secure_url);
    } catch (err) { console.error("Upload failed:", err); }
    finally { setUploading(false); }
  };
  return (
    <div className="py-1.5">
      <label className="text-xs text-gray-400 block mb-1">{label}</label>
      {value && <img src={value} alt="" className="w-full h-20 object-cover rounded mb-1.5 bg-gray-800" />}
      <div className="flex gap-1.5">
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="text-[10px] px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded transition disabled:opacity-50">
          {uploading ? "Uploading..." : value ? "Replace" : "Upload"}
        </button>
        {value && <button onClick={() => onChange("")} className="text-[10px] px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition">Remove</button>}
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
    </div>
  );
}

// ─── Section sidebar items ───────────────────────────────────────────────────
const SIDEBAR_SECTIONS = [
  { id: "global", label: "Global Theme", icon: "🎨" },
  { id: "colors", label: "Colors", icon: "🌈" },
  { id: "typography", label: "Typography", icon: "Aa" },
  { id: "layout", label: "Spacing & Layout", icon: "⊞" },
  { id: "buttons", label: "Button System", icon: "▢" },
  { id: "announcementBar", label: "Announcement Bar", icon: "📢" },
  { id: "header", label: "Header", icon: "▤" },
  { id: "breadcrumbs", label: "Breadcrumbs", icon: "›" },
  { id: "hero", label: "Course Hero", icon: "🖼" },
  { id: "stickyCta", label: "Sticky CTA", icon: "🛒" },
  { id: "whatYoullLearn", label: "What You'll Learn", icon: "✓" },
  { id: "curriculum", label: "Course Content", icon: "📋" },
  { id: "requirements", label: "Requirements", icon: "📌" },
  { id: "description", label: "Description", icon: "📝" },
  { id: "instructorSection", label: "Instructor", icon: "👤" },
  { id: "ratings", label: "Ratings", icon: "⭐" },
  { id: "reviews", label: "Student Reviews", icon: "💬" },
  { id: "testimonials", label: "Testimonials", icon: "🗣" },
  { id: "videoReviews", label: "Video Reviews", icon: "🎥" },
  { id: "relatedCourses", label: "Related Courses", icon: "📚" },
  { id: "footer", label: "Footer", icon: "▬" },
  { id: "sectionOrder", label: "Section Order", icon: "↕" },
  { id: "presets", label: "Presets", icon: "💾" },
  { id: "importExport", label: "Import / Export", icon: "⇄" },
  { id: "history", label: "Version History", icon: "🕐" },
];

// ─── Main Editor ─────────────────────────────────────────────────────────────
export default function ThemeEditor() {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(null);
  const [settings, setSettings] = useState(null);
  const [activeSection, setActiveSection] = useState("global");
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [presets, setPresets] = useState([]);
  const [versionHistory, setVersionHistory] = useState([]);
  const [lastSaved, setLastSaved] = useState(null);
  const autoSaveTimer = useRef(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Access check
  useEffect(() => {
    API.get("/theme/access").then((r) => setHasAccess(r.data.hasAccess)).catch(() => setHasAccess(false));
  }, []);

  // Load draft
  useEffect(() => {
    if (hasAccess !== true) return;
    API.get("/theme/draft").then((r) => {
      const merged = deepMerge(DEFAULT_THEME, r.data?.settings || {});
      setSettings(merged);
      setHistory([merged]);
      setHistoryIndex(0);
    }).catch(() => {
      setSettings({ ...DEFAULT_THEME });
      setHistory([{ ...DEFAULT_THEME }]);
      setHistoryIndex(0);
    });
  }, [hasAccess]);

  // Load presets
  useEffect(() => {
    if (hasAccess !== true) return;
    API.get("/theme/presets").then((r) => setPresets(r.data || [])).catch(() => {});
  }, [hasAccess]);

  const updateSetting = useCallback((path, value) => {
    setSettings((prev) => {
      const next = setNestedValue(prev, path, value);
      setHistory((h) => {
        const newH = h.slice(0, historyIndex + 1);
        newH.push(next);
        if (newH.length > 100) newH.shift();
        return newH;
      });
      setHistoryIndex((i) => Math.min(i + 1, 100));
      return next;
    });
    // Debounced autosave
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      setSettings((s) => {
        if (s) API.put("/theme/draft", { settings: s }).then(() => setLastSaved(new Date())).catch(() => {});
        return s;
      });
    }, 2000);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIdx = historyIndex - 1;
    setHistoryIndex(newIdx);
    setSettings(history[newIdx]);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const newIdx = historyIndex + 1;
    setHistoryIndex(newIdx);
    setSettings(history[newIdx]);
  }, [history, historyIndex]);

  const saveDraft = useCallback(async () => {
    setSaving(true);
    try {
      await API.put("/theme/draft", { settings });
      setLastSaved(new Date());
      showToast("Draft saved");
    } catch { showToast("Failed to save", "error"); }
    finally { setSaving(false); }
  }, [settings, showToast]);

  const publish = useCallback(async () => {
    setPublishing(true);
    try {
      await API.post("/theme/publish", { settings });
      showToast("Theme published!");
    } catch { showToast("Failed to publish", "error"); }
    finally { setPublishing(false); }
  }, [settings, showToast]);

  const resetTheme = useCallback(() => {
    if (!window.confirm("Reset entire theme to defaults? This cannot be undone.")) return;
    setSettings({ ...DEFAULT_THEME });
    API.post("/theme/reset").catch(() => {});
    showToast("Theme reset to defaults");
  }, [showToast]);

  const resetSection = useCallback((sectionKey) => {
    if (!DEFAULT_THEME[sectionKey]) return;
    updateSetting(sectionKey, JSON.parse(JSON.stringify(DEFAULT_THEME[sectionKey])));
    showToast(`${sectionKey} reset`);
  }, [updateSetting, showToast]);

  // ── Access denied or loading ───────────────────────────────────────────────
  if (hasAccess === null) return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (hasAccess === false) return <div className="flex items-center justify-center h-[60vh] text-gray-400"><p>Access denied. You do not have theme editor permissions.</p></div>;
  if (!settings) return <div className="flex items-center justify-center h-[60vh]"><div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;

  const filteredSections = searchQuery
    ? SIDEBAR_SECTIONS.filter((s) => s.label.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.toLowerCase().includes(searchQuery.toLowerCase()))
    : SIDEBAR_SECTIONS;

  const previewWidth = previewDevice === "desktop" ? "100%" : previewDevice === "tablet" ? "768px" : "375px";

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#111] text-white overflow-hidden">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-[100] px-4 py-2 rounded-lg text-sm font-medium shadow-xl ${toast.type === "error" ? "bg-red-600" : "bg-green-600"} text-white`}>
          {toast.msg}
        </div>
      )}

      {/* LEFT SIDEBAR — Section Navigation */}
      <div className="w-56 bg-[#1a1a1a] border-r border-gray-800 flex flex-col flex-shrink-0 overflow-hidden">
        <div className="p-2 border-b border-gray-800">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settings..."
            className="w-full text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-gray-200 placeholder-gray-500" />
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {filteredSections.map((s) => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition truncate ${
                activeSection === s.id ? "bg-purple-600/20 text-purple-400 font-semibold" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              }`}>
              <span className="w-5 text-center flex-shrink-0">{s.icon}</span>
              <span className="truncate">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CENTER — Preview */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            {["desktop", "tablet", "mobile"].map((d) => (
              <button key={d} onClick={() => setPreviewDevice(d)}
                className={`px-3 py-1.5 text-xs rounded transition ${previewDevice === d ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-200"}`}>
                {d === "desktop" ? "🖥 Desktop" : d === "tablet" ? "📱 Tablet" : "📲 Mobile"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={undo} disabled={historyIndex <= 0} title="Undo"
              className="px-2 py-1 text-xs bg-gray-800 text-gray-400 rounded hover:text-white disabled:opacity-30 transition">↶ Undo</button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo"
              className="px-2 py-1 text-xs bg-gray-800 text-gray-400 rounded hover:text-white disabled:opacity-30 transition">↷ Redo</button>
            <span className="text-[10px] text-gray-600">{lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : ""}</span>
            <button onClick={saveDraft} disabled={saving}
              className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition disabled:opacity-50">
              {saving ? "Saving..." : "Save Draft"}
            </button>
            <button onClick={publish} disabled={publishing}
              className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded transition disabled:opacity-50 font-semibold">
              {publishing ? "Publishing..." : "Publish"}
            </button>
            <button onClick={resetTheme}
              className="px-2 py-1 text-xs bg-gray-800 text-red-400 hover:text-red-300 rounded transition">Reset</button>
          </div>
        </div>

        {/* Preview iframe area */}
        <div className="flex-1 overflow-auto bg-[#0a0a0a] flex items-start justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300" style={{ width: previewWidth, maxWidth: "100%", minHeight: "600px" }}>
            <div className="p-6 text-center text-gray-400 text-sm">
              <p className="mb-2 text-lg font-semibold text-gray-600">Live Preview</p>
              <p className="text-xs text-gray-500 mb-4">Preview updates as you change settings. Open your course page to see changes after publishing.</p>
              <PreviewRenderer settings={settings} device={previewDevice} />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR — Settings Panel */}
      <div className="w-72 bg-[#1a1a1a] border-l border-gray-800 flex flex-col flex-shrink-0 overflow-hidden">
        <div className="px-3 py-2.5 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
            {SIDEBAR_SECTIONS.find((s) => s.id === activeSection)?.label || "Settings"}
          </h3>
          {DEFAULT_THEME[activeSection] && (
            <button onClick={() => resetSection(activeSection)} className="text-[10px] text-gray-500 hover:text-red-400 transition">Reset Section</button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          <SettingsPanel section={activeSection} settings={settings} updateSetting={updateSetting} presets={presets} setPresets={setPresets}
            versionHistory={versionHistory} setVersionHistory={setVersionHistory} showToast={showToast} />
        </div>
      </div>
    </div>
  );
}

// ─── Preview Renderer ────────────────────────────────────────────────────────
function PreviewRenderer({ settings, device }) {
  const s = settings;
  const isMobile = device === "mobile";
  const isTablet = device === "tablet";
  const fs = (responsive) => {
    if (!responsive || typeof responsive === "string") return responsive;
    return isMobile ? responsive.mobile : isTablet ? responsive.tablet : responsive.desktop;
  };

  return (
    <div className="text-left" style={{ fontFamily: s.typography?.bodyFont || "'DM Sans', sans-serif", color: s.colors?.bodyText, background: s.colors?.background }}>
      {/* Announcement Bar */}
      {s.sectionVisibility?.announcementBar && s.announcementBar?.enabled && (
        <div style={{ background: s.announcementBar.backgroundColor, color: s.announcementBar.textColor, padding: "8px 16px", fontSize: fs(s.announcementBar.fontSize), fontWeight: s.announcementBar.fontWeight, textAlign: "center" }}>
          {s.announcementBar.text?.replace("{discount}", "76") || "🎉 Limited Time Offer"}
        </div>
      )}
      {/* Header */}
      {s.sectionVisibility?.header && (
        <div style={{ background: s.header?.backgroundColor, padding: "12px 16px", borderBottom: `1px solid ${s.colors?.borderColor}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: s.typography?.headingFont, fontWeight: 800, fontSize: "1.25rem", color: s.colors?.headingColor }}>
            {s.header?.logoText || "Lerni"}<span style={{ color: s.header?.logoAccentColor || s.colors?.primary }}>{s.header?.logoAccent || "ni"}</span>
          </span>
          <span style={{ background: s.header?.loginButtonBg || s.colors?.primary, color: s.header?.loginButtonColor, padding: "6px 16px", borderRadius: s.header?.loginButtonRadius || "6px", fontSize: "0.8rem", fontWeight: 600 }}>
            {s.header?.loginButtonText || "Log In"}
          </span>
        </div>
      )}
      {/* Breadcrumb */}
      {s.sectionVisibility?.breadcrumbs && s.breadcrumbs?.enabled && (
        <div style={{ background: s.breadcrumbs?.backgroundColor, color: s.breadcrumbs?.textColor, padding: "6px 16px", fontSize: s.breadcrumbs?.fontSize || "0.75rem", borderBottom: `1px solid ${s.colors?.borderColor}` }}>
          Development {s.breadcrumbs?.separator || "›"} Category {s.breadcrumbs?.separator || "›"} <span style={{ color: s.breadcrumbs?.activeTextColor, fontWeight: 600 }}>Course Title</span>
        </div>
      )}
      {/* Hero */}
      {s.sectionVisibility?.hero && (
        <div style={{ background: s.hero?.backgroundColor || s.colors?.darkSection, padding: isMobile ? "24px 16px" : "40px 24px", color: "#fff" }}>
          {s.hero?.badge?.enabled && (
            <span style={{ display: "inline-block", background: s.hero.badge.backgroundColor, color: s.hero.badge.textColor, padding: s.hero.badge.padding || "4px 10px", borderRadius: s.hero.badge.radius || "4px", fontSize: s.hero.badge.fontSize || "0.75rem", fontWeight: 600, marginBottom: "12px" }}>
              Beginner
            </span>
          )}
          <div style={{ fontFamily: s.hero?.title?.fontFamily || s.typography?.headingFont, fontSize: fs(s.hero?.title?.fontSize) || (isMobile ? "1.5rem" : "2rem"), fontWeight: s.hero?.title?.fontWeight || 700, lineHeight: s.hero?.title?.lineHeight || 1.15, color: s.hero?.title?.color || "#fff", marginBottom: "8px" }}>
            Complete Course Title Here
          </div>
          <div style={{ color: s.hero?.subtitle?.color || "#c8bfaf", fontSize: fs(s.hero?.subtitle?.fontSize) || "0.9rem", marginBottom: "16px" }}>
            Learn everything you need to master this skill
          </div>
          <div style={{ background: "#000", height: isMobile ? "180px" : "250px", borderRadius: s.hero?.image?.borderRadius || "0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", position: "relative" }}>
            <div style={{ width: s.hero?.image?.playButtonSize || "48px", height: s.hero?.image?.playButtonSize || "48px", borderRadius: "50%", background: s.hero?.image?.playButtonColor || s.colors?.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1.2rem" }}>▶</div>
            {s.hero?.image?.freeLectureBadge && (
              <span style={{ position: "absolute", bottom: "12px", left: "50%", transform: "translateX(-50%)", background: s.hero.image.freeLectureBg, color: s.hero.image.freeLectureColor, padding: "6px 16px", borderRadius: "999px", fontSize: "0.8rem", fontWeight: 600 }}>
                {s.hero?.image?.freeLectureText || "Free Lectures"}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "0.8rem", color: s.hero?.meta?.textColor || "#c8bfaf", flexWrap: "wrap" }}>
            {s.hero?.meta?.ratingVisible !== false && <span style={{ color: s.colors?.ratingStarColor }}>★ 4.8</span>}
            {s.hero?.meta?.studentsVisible !== false && <span>• 23.4K students</span>}
            {s.hero?.meta?.languageVisible !== false && <span>• English</span>}
          </div>
        </div>
      )}
      {/* Enroll CTA preview */}
      {s.sectionVisibility?.stickyCta && (
        <div style={{ background: s.stickyCta?.backgroundColor || "#fff", padding: s.stickyCta?.padding || "12px 16px", borderTop: `2px solid ${s.colors?.borderColor}` }}>
          <div style={{ background: s.stickyCta?.buttonBackground || s.colors?.primary, color: s.stickyCta?.buttonTextColor || "#fff", padding: "10px", borderRadius: s.stickyCta?.borderRadius || "8px", textAlign: "center", fontWeight: s.stickyCta?.fontWeight || 800, fontSize: fs(s.stickyCta?.fontSize) || "0.875rem", fontFamily: s.stickyCta?.fontFamily, boxShadow: s.stickyCta?.shadow }}>
            Enroll Now In PKR 3,360 • <span style={{ color: s.stickyCta?.discountTextColor || "#000" }}>76% OFF</span>
          </div>
        </div>
      )}
      {/* What You'll Learn */}
      {s.sectionVisibility?.whatYoullLearn && s.whatYoullLearn?.enabled !== false && (
        <div style={{ padding: isMobile ? "24px 16px" : "32px 24px" }}>
          <div style={{ fontFamily: s.whatYoullLearn?.headingFont || s.typography?.headingFont, fontSize: s.whatYoullLearn?.headingSize || (isMobile ? "1.25rem" : "1.5rem"), fontWeight: 700, color: s.whatYoullLearn?.headingColor || s.colors?.headingColor, marginBottom: "16px" }}>
            {s.whatYoullLearn?.heading || "What you'll learn"}
          </div>
          <div style={{ background: s.whatYoullLearn?.backgroundColor, border: s.whatYoullLearn?.border, borderRadius: s.whatYoullLearn?.borderRadius, padding: fs(s.whatYoullLearn?.padding) || "16px" }}>
            {["Build real-world projects", "Master core concepts", "Deploy to production"].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "8px" }}>
                <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: s.whatYoullLearn?.iconBackground || s.colors?.primary, color: s.whatYoullLearn?.iconColor || "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", flexShrink: 0 }}>✓</span>
                <span style={{ color: s.whatYoullLearn?.textColor, fontSize: fs(s.whatYoullLearn?.textSize) || "0.875rem" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Course Content */}
      {s.sectionVisibility?.curriculum && s.curriculum?.enabled !== false && (
        <div style={{ padding: isMobile ? "24px 16px" : "32px 24px" }}>
          <div style={{ fontFamily: s.curriculum?.headingFont || s.typography?.headingFont, fontSize: s.curriculum?.headingSize || (isMobile ? "1.25rem" : "1.5rem"), fontWeight: 700, color: s.curriculum?.headingColor || s.colors?.headingColor, marginBottom: "16px" }}>
            {s.curriculum?.heading || "Course Content"}
          </div>
          {["Getting Started", "Core Concepts"].map((sec, i) => (
            <div key={i} style={{ border: s.curriculum?.border, borderRadius: s.curriculum?.borderRadius || "8px", marginBottom: s.curriculum?.sectionSpacing || "8px", overflow: "hidden" }}>
              <div style={{ background: s.curriculum?.sectionHeaderBg, padding: "12px 16px", fontWeight: 700, fontSize: "0.875rem", color: s.curriculum?.lectureColor || s.colors?.headingColor }}>{sec}</div>
              <div style={{ background: s.curriculum?.cardBackground || "#fff" }}>
                <div style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${s.colors?.dividerColor}`, fontSize: "0.8rem" }}>
                  <span style={{ color: s.curriculum?.lectureColor }}>Introduction</span>
                  {s.curriculum?.freeLectureBadge !== false && (
                    <span style={{ background: s.curriculum?.freeLectureBadgeBg, color: s.curriculum?.freeLectureBadgeColor, padding: "2px 8px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700 }}>Free Lecture</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Footer */}
      {s.sectionVisibility?.footer && s.footer?.enabled !== false && (
        <div style={{ background: s.footer?.backgroundColor || s.colors?.footerBackground, color: s.footer?.textColor || s.colors?.footerText, padding: isMobile ? "24px 16px" : "32px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: "16px", marginBottom: "16px" }}>
            {(s.footer?.columns || []).slice(0, isMobile ? 4 : 6).map((col, i) => (
              <div key={i}>
                <div style={{ color: s.footer?.headingColor || s.colors?.footerHeading, fontWeight: 700, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>{col.heading}</div>
                {col.links?.slice(0, 3).map((l, j) => (
                  <div key={j} style={{ fontSize: "0.7rem", marginBottom: "4px", color: s.footer?.linkColor || s.colors?.footerLink }}>{l.text}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${s.colors?.borderColor || "#2d2416"}`, paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: s.typography?.headingFont, fontWeight: 800, color: "#fff" }}>
              {s.footer?.logoText || "Lerni"}<span style={{ color: s.footer?.logoAccentColor || s.colors?.accent }}>{s.footer?.logoAccent || "ni"}</span>
            </span>
            <span style={{ fontSize: "0.6rem" }}>{s.footer?.copyrightText || "© 2024"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Settings Panel Router ───────────────────────────────────────────────────
function SettingsPanel({ section, settings, updateSetting, presets, setPresets, versionHistory, setVersionHistory, showToast }) {
  const s = settings;
  const u = updateSetting;

  switch (section) {
    case "global":
      return (
        <div>
          <SectionGroup title="Quick Theme" defaultOpen>
            <ColorControl label="Primary Color" value={s.colors?.primary} onChange={(v) => u("colors.primary", v)} defaultValue={DEFAULT_THEME.colors.primary} onReset={() => u("colors.primary", DEFAULT_THEME.colors.primary)} />
            <ColorControl label="Background" value={s.colors?.background} onChange={(v) => u("colors.background", v)} onReset={() => u("colors.background", DEFAULT_THEME.colors.background)} />
            <ColorControl label="Text Color" value={s.colors?.headingColor} onChange={(v) => u("colors.headingColor", v)} onReset={() => u("colors.headingColor", DEFAULT_THEME.colors.headingColor)} />
            <ColorControl label="Accent" value={s.colors?.accent} onChange={(v) => u("colors.accent", v)} onReset={() => u("colors.accent", DEFAULT_THEME.colors.accent)} />
            <FontControl label="Heading Font" value={s.typography?.headingFont} onChange={(v) => u("typography.headingFont", v)} />
            <FontControl label="Body Font" value={s.typography?.bodyFont} onChange={(v) => u("typography.bodyFont", v)} />
            <SliderControl label="Border Radius" value={parseFloat(s.layout?.borderRadius)} onChange={(v) => u("layout.borderRadius", `${v}rem`)} min={0} max={3} step={0.125} unit="rem" />
          </SectionGroup>
          <SectionGroup title="Section Visibility">
            {Object.entries(s.sectionVisibility || {}).map(([k, v]) => (
              <ToggleControl key={k} label={k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())} value={v} onChange={(val) => u(`sectionVisibility.${k}`, val)} />
            ))}
          </SectionGroup>
        </div>
      );

    case "colors":
      return (
        <div>
          <SectionGroup title="Core Colors" defaultOpen>
            {Object.entries(s.colors || {}).map(([k, v]) => (
              <ColorControl key={k} label={k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())} value={v} onChange={(val) => u(`colors.${k}`, val)} onReset={() => u(`colors.${k}`, DEFAULT_THEME.colors[k])} />
            ))}
          </SectionGroup>
          <SectionGroup title="Section Colors">
            {Object.entries(s.sectionColors || {}).map(([section, colors]) => (
              <SectionGroup key={section} title={section.replace(/([A-Z])/g, " $1")}>
                {Object.entries(colors).map(([k, v]) => (
                  <ColorControl key={k} label={k} value={v} onChange={(val) => u(`sectionColors.${section}.${k}`, val)} />
                ))}
              </SectionGroup>
            ))}
          </SectionGroup>
        </div>
      );

    case "typography":
      return (
        <div>
          <SectionGroup title="Font Families" defaultOpen>
            <FontControl label="Primary Font" value={s.typography?.primaryFont} onChange={(v) => u("typography.primaryFont", v)} />
            <FontControl label="Heading Font" value={s.typography?.headingFont} onChange={(v) => u("typography.headingFont", v)} />
            <FontControl label="Body Font" value={s.typography?.bodyFont} onChange={(v) => u("typography.bodyFont", v)} />
            <FontControl label="Button Font" value={s.typography?.buttonFont} onChange={(v) => u("typography.buttonFont", v)} />
            <FontControl label="Navigation Font" value={s.typography?.navigationFont} onChange={(v) => u("typography.navigationFont", v)} />
            <FontControl label="Label Font" value={s.typography?.labelFont} onChange={(v) => u("typography.labelFont", v)} />
            <FontControl label="Price Font" value={s.typography?.priceFont} onChange={(v) => u("typography.priceFont", v)} />
          </SectionGroup>
          {["h1", "h2", "h3", "h4", "h5", "h6"].map((h) => (
            <SectionGroup key={h} title={h.toUpperCase()}>
              <ResponsiveControl label="Font Size" value={s.typography?.headings?.[h]?.fontSize} onChange={(v) => u(`typography.headings.${h}.fontSize`, v)} />
              <SelectControl label="Font Weight" value={s.typography?.headings?.[h]?.fontWeight} onChange={(v) => u(`typography.headings.${h}.fontWeight`, v)}
                options={[{ value: "400", label: "Regular" }, { value: "500", label: "Medium" }, { value: "600", label: "Semi Bold" }, { value: "700", label: "Bold" }, { value: "800", label: "Extra Bold" }, { value: "900", label: "Black" }]} />
              <TextControl label="Line Height" value={s.typography?.headings?.[h]?.lineHeight} onChange={(v) => u(`typography.headings.${h}.lineHeight`, v)} />
              <TextControl label="Letter Spacing" value={s.typography?.headings?.[h]?.letterSpacing} onChange={(v) => u(`typography.headings.${h}.letterSpacing`, v)} />
              <SelectControl label="Text Transform" value={s.typography?.headings?.[h]?.textTransform} onChange={(v) => u(`typography.headings.${h}.textTransform`, v)}
                options={[{ value: "none", label: "None" }, { value: "uppercase", label: "UPPERCASE" }, { value: "capitalize", label: "Capitalize" }, { value: "lowercase", label: "lowercase" }]} />
              <ColorControl label="Color" value={s.typography?.headings?.[h]?.color} onChange={(v) => u(`typography.headings.${h}.color`, v)} />
            </SectionGroup>
          ))}
          <SectionGroup title="Body Text">
            <TextControl label="Font Size" value={s.typography?.body?.fontSize} onChange={(v) => u("typography.body.fontSize", v)} />
            <SelectControl label="Font Weight" value={s.typography?.body?.fontWeight} onChange={(v) => u("typography.body.fontWeight", v)}
              options={[{ value: "300", label: "Light" }, { value: "400", label: "Regular" }, { value: "500", label: "Medium" }]} />
            <TextControl label="Line Height" value={s.typography?.body?.lineHeight} onChange={(v) => u("typography.body.lineHeight", v)} />
            <TextControl label="Letter Spacing" value={s.typography?.body?.letterSpacing} onChange={(v) => u("typography.body.letterSpacing", v)} />
          </SectionGroup>
          <SectionGroup title="Button Text">
            <TextControl label="Font Size" value={s.typography?.buttons?.fontSize} onChange={(v) => u("typography.buttons.fontSize", v)} />
            <SelectControl label="Font Weight" value={s.typography?.buttons?.fontWeight} onChange={(v) => u("typography.buttons.fontWeight", v)}
              options={[{ value: "500", label: "Medium" }, { value: "600", label: "Semi Bold" }, { value: "700", label: "Bold" }, { value: "800", label: "Extra Bold" }]} />
            <SelectControl label="Text Transform" value={s.typography?.buttons?.textTransform} onChange={(v) => u("typography.buttons.textTransform", v)}
              options={[{ value: "none", label: "None" }, { value: "uppercase", label: "UPPERCASE" }, { value: "capitalize", label: "Capitalize" }]} />
          </SectionGroup>
        </div>
      );

    case "layout":
      return (
        <div>
          <SectionGroup title="Page Layout" defaultOpen>
            <TextControl label="Page Max Width" value={s.layout?.pageMaxWidth} onChange={(v) => u("layout.pageMaxWidth", v)} />
            <TextControl label="Container Width" value={s.layout?.containerWidth} onChange={(v) => u("layout.containerWidth", v)} />
          </SectionGroup>
          <SectionGroup title="Section Padding">
            <ResponsiveControl label="Padding Top" value={s.layout?.sectionPadding?.top} onChange={(v) => u("layout.sectionPadding.top", v)} />
            <ResponsiveControl label="Padding Bottom" value={s.layout?.sectionPadding?.bottom} onChange={(v) => u("layout.sectionPadding.bottom", v)} />
            <TextControl label="Padding Left" value={s.layout?.sectionPadding?.left} onChange={(v) => u("layout.sectionPadding.left", v)} />
            <TextControl label="Padding Right" value={s.layout?.sectionPadding?.right} onChange={(v) => u("layout.sectionPadding.right", v)} />
          </SectionGroup>
          <SectionGroup title="Spacing">
            <TextControl label="Element Gap" value={s.layout?.elementGap} onChange={(v) => u("layout.elementGap", v)} />
            <TextControl label="Grid Gap" value={s.layout?.gridGap} onChange={(v) => u("layout.gridGap", v)} />
            <TextControl label="Card Gap" value={s.layout?.cardGap} onChange={(v) => u("layout.cardGap", v)} />
          </SectionGroup>
          <SectionGroup title="Border & Shadow">
            <TextControl label="Border Radius" value={s.layout?.borderRadius} onChange={(v) => u("layout.borderRadius", v)} />
            <TextControl label="Button Radius" value={s.layout?.buttonRadius} onChange={(v) => u("layout.buttonRadius", v)} />
            <TextControl label="Image Radius" value={s.layout?.imageRadius} onChange={(v) => u("layout.imageRadius", v)} />
            <TextControl label="Shadow" value={s.layout?.shadow} onChange={(v) => u("layout.shadow", v)} />
            <TextControl label="Border Width" value={s.layout?.borderWidth} onChange={(v) => u("layout.borderWidth", v)} />
            <TextControl label="Global Card Radius" value={s.layout?.globalCardRadius} onChange={(v) => u("layout.globalCardRadius", v)} />
            <TextControl label="Global Button Radius" value={s.layout?.globalButtonRadius} onChange={(v) => u("layout.globalButtonRadius", v)} />
            <TextControl label="Global Shadow" value={s.layout?.globalShadow} onChange={(v) => u("layout.globalShadow", v)} />
          </SectionGroup>
        </div>
      );

    case "buttons":
      return (
        <div>
          {["primary", "secondary", "outline", "ghost"].map((btnType) => (
            <SectionGroup key={btnType} title={`${btnType.charAt(0).toUpperCase() + btnType.slice(1)} Button`} defaultOpen={btnType === "primary"}>
              <ColorControl label="Background" value={s.buttons?.[btnType]?.background} onChange={(v) => u(`buttons.${btnType}.background`, v)} />
              <ColorControl label="Text Color" value={s.buttons?.[btnType]?.textColor} onChange={(v) => u(`buttons.${btnType}.textColor`, v)} />
              <ColorControl label="Hover Background" value={s.buttons?.[btnType]?.hoverBackground} onChange={(v) => u(`buttons.${btnType}.hoverBackground`, v)} />
              <ColorControl label="Hover Text" value={s.buttons?.[btnType]?.hoverText} onChange={(v) => u(`buttons.${btnType}.hoverText`, v)} />
              <TextControl label="Border" value={s.buttons?.[btnType]?.border} onChange={(v) => u(`buttons.${btnType}.border`, v)} />
              <TextControl label="Radius" value={s.buttons?.[btnType]?.radius} onChange={(v) => u(`buttons.${btnType}.radius`, v)} />
              <TextControl label="Padding" value={s.buttons?.[btnType]?.padding} onChange={(v) => u(`buttons.${btnType}.padding`, v)} />
              <FontControl label="Font" value={s.buttons?.[btnType]?.fontFamily} onChange={(v) => u(`buttons.${btnType}.fontFamily`, v)} />
              <TextControl label="Font Size" value={s.buttons?.[btnType]?.fontSize} onChange={(v) => u(`buttons.${btnType}.fontSize`, v)} />
              <SelectControl label="Font Weight" value={s.buttons?.[btnType]?.fontWeight} onChange={(v) => u(`buttons.${btnType}.fontWeight`, v)}
                options={[{ value: "400", label: "Regular" }, { value: "500", label: "Medium" }, { value: "600", label: "Semi Bold" }, { value: "700", label: "Bold" }, { value: "800", label: "Extra Bold" }]} />
              <TextControl label="Letter Spacing" value={s.buttons?.[btnType]?.letterSpacing} onChange={(v) => u(`buttons.${btnType}.letterSpacing`, v)} />
              <TextControl label="Shadow" value={s.buttons?.[btnType]?.shadow} onChange={(v) => u(`buttons.${btnType}.shadow`, v)} />
            </SectionGroup>
          ))}
        </div>
      );

    case "announcementBar":
      return (
        <div>
          <SectionGroup title="Announcement Bar" defaultOpen>
            <ToggleControl label="Enable" value={s.announcementBar?.enabled} onChange={(v) => u("announcementBar.enabled", v)} />
            <TextControl label="Text" value={s.announcementBar?.text} onChange={(v) => u("announcementBar.text", v)} placeholder="Use {discount} for dynamic %" />
            <ColorControl label="Background" value={s.announcementBar?.backgroundColor} onChange={(v) => u("announcementBar.backgroundColor", v)} />
            <ColorControl label="Text Color" value={s.announcementBar?.textColor} onChange={(v) => u("announcementBar.textColor", v)} />
            <FontControl label="Font" value={s.announcementBar?.fontFamily} onChange={(v) => u("announcementBar.fontFamily", v)} />
            <ResponsiveControl label="Font Size" value={s.announcementBar?.fontSize} onChange={(v) => u("announcementBar.fontSize", v)} />
            <SelectControl label="Font Weight" value={s.announcementBar?.fontWeight} onChange={(v) => u("announcementBar.fontWeight", v)}
              options={[{ value: "400", label: "Regular" }, { value: "500", label: "Medium" }, { value: "600", label: "Semi Bold" }, { value: "700", label: "Bold" }]} />
            <TextControl label="Padding" value={s.announcementBar?.padding} onChange={(v) => u("announcementBar.padding", v)} />
            <TextControl label="Letter Spacing" value={s.announcementBar?.letterSpacing} onChange={(v) => u("announcementBar.letterSpacing", v)} />
            <TextControl label="Link URL" value={s.announcementBar?.link} onChange={(v) => u("announcementBar.link", v)} />
            <SelectControl label="Link Target" value={s.announcementBar?.linkTarget} onChange={(v) => u("announcementBar.linkTarget", v)}
              options={[{ value: "_self", label: "Same Tab" }, { value: "_blank", label: "New Tab" }]} />
            <ToggleControl label="Close Button" value={s.announcementBar?.closeButton} onChange={(v) => u("announcementBar.closeButton", v)} />
            <SliderControl label="Scroll Speed" value={s.announcementBar?.speed} onChange={(v) => u("announcementBar.speed", v)} min={5} max={60} step={1} unit="s" />
          </SectionGroup>
        </div>
      );

    case "header":
      return (
        <div>
          <SectionGroup title="Logo" defaultOpen>
            <TextControl label="Logo Text" value={s.header?.logoText} onChange={(v) => u("header.logoText", v)} />
            <TextControl label="Accent Text" value={s.header?.logoAccent} onChange={(v) => u("header.logoAccent", v)} />
            <ColorControl label="Accent Color" value={s.header?.logoAccentColor} onChange={(v) => u("header.logoAccentColor", v)} />
            <ImageUploadControl label="Logo Image" value={s.header?.logoImage} onChange={(v) => u("header.logoImage", v)} />
            <TextControl label="Logo Width" value={s.header?.logoWidth} onChange={(v) => u("header.logoWidth", v)} />
            <TextControl label="Logo Height" value={s.header?.logoHeight} onChange={(v) => u("header.logoHeight", v)} />
          </SectionGroup>
          <SectionGroup title="Header Style">
            <ColorControl label="Background" value={s.header?.backgroundColor} onChange={(v) => u("header.backgroundColor", v)} />
            <TextControl label="Height" value={s.header?.height} onChange={(v) => u("header.height", v)} />
            <TextControl label="Padding" value={s.header?.padding} onChange={(v) => u("header.padding", v)} />
          </SectionGroup>
          <SectionGroup title="Navigation">
            <FontControl label="Font" value={s.header?.navigationFont} onChange={(v) => u("header.navigationFont", v)} />
            <ColorControl label="Nav Color" value={s.header?.navigationColor} onChange={(v) => u("header.navigationColor", v)} />
            <ColorControl label="Nav Hover" value={s.header?.navigationHoverColor} onChange={(v) => u("header.navigationHoverColor", v)} />
          </SectionGroup>
          <SectionGroup title="Login Button">
            <TextControl label="Text" value={s.header?.loginButtonText} onChange={(v) => u("header.loginButtonText", v)} />
            <ColorControl label="Background" value={s.header?.loginButtonBg} onChange={(v) => u("header.loginButtonBg", v)} />
            <ColorControl label="Text Color" value={s.header?.loginButtonColor} onChange={(v) => u("header.loginButtonColor", v)} />
            <ColorControl label="Hover Bg" value={s.header?.loginButtonHoverBg} onChange={(v) => u("header.loginButtonHoverBg", v)} />
            <TextControl label="Radius" value={s.header?.loginButtonRadius} onChange={(v) => u("header.loginButtonRadius", v)} />
          </SectionGroup>
          <SectionGroup title="Mobile Menu">
            <ColorControl label="Menu Background" value={s.header?.mobileMenuBg} onChange={(v) => u("header.mobileMenuBg", v)} />
          </SectionGroup>
        </div>
      );

    case "breadcrumbs":
      return (
        <div>
          <SectionGroup title="Breadcrumbs" defaultOpen>
            <ToggleControl label="Show" value={s.breadcrumbs?.enabled} onChange={(v) => u("breadcrumbs.enabled", v)} />
            <ColorControl label="Background" value={s.breadcrumbs?.backgroundColor} onChange={(v) => u("breadcrumbs.backgroundColor", v)} />
            <ColorControl label="Text Color" value={s.breadcrumbs?.textColor} onChange={(v) => u("breadcrumbs.textColor", v)} />
            <ColorControl label="Active Text" value={s.breadcrumbs?.activeTextColor} onChange={(v) => u("breadcrumbs.activeTextColor", v)} />
            <FontControl label="Font" value={s.breadcrumbs?.fontFamily} onChange={(v) => u("breadcrumbs.fontFamily", v)} />
            <TextControl label="Font Size" value={s.breadcrumbs?.fontSize} onChange={(v) => u("breadcrumbs.fontSize", v)} />
            <TextControl label="Separator" value={s.breadcrumbs?.separator} onChange={(v) => u("breadcrumbs.separator", v)} />
            <ColorControl label="Separator Color" value={s.breadcrumbs?.separatorColor} onChange={(v) => u("breadcrumbs.separatorColor", v)} />
            <TextControl label="Padding" value={s.breadcrumbs?.padding} onChange={(v) => u("breadcrumbs.padding", v)} />
          </SectionGroup>
        </div>
      );

    case "hero":
      return (
        <div>
          <SectionGroup title="Hero Background" defaultOpen>
            <ColorControl label="Background" value={s.hero?.backgroundColor} onChange={(v) => u("hero.backgroundColor", v)} />
            <ImageUploadControl label="Background Image" value={s.hero?.backgroundImage} onChange={(v) => u("hero.backgroundImage", v)} />
            <TextControl label="Gradient" value={s.hero?.gradient} onChange={(v) => u("hero.gradient", v)} placeholder="e.g. linear-gradient(...)" />
            <ColorControl label="Overlay" value={s.hero?.overlayColor} onChange={(v) => u("hero.overlayColor", v)} />
            <SliderControl label="Overlay Opacity" value={s.hero?.overlayOpacity} onChange={(v) => u("hero.overlayOpacity", v)} min={0} max={1} step={0.05} />
          </SectionGroup>
          <SectionGroup title="Badge">
            <ToggleControl label="Show Badge" value={s.hero?.badge?.enabled} onChange={(v) => u("hero.badge.enabled", v)} />
            <ColorControl label="Background" value={s.hero?.badge?.backgroundColor} onChange={(v) => u("hero.badge.backgroundColor", v)} />
            <ColorControl label="Text Color" value={s.hero?.badge?.textColor} onChange={(v) => u("hero.badge.textColor", v)} />
            <TextControl label="Font Size" value={s.hero?.badge?.fontSize} onChange={(v) => u("hero.badge.fontSize", v)} />
            <TextControl label="Padding" value={s.hero?.badge?.padding} onChange={(v) => u("hero.badge.padding", v)} />
            <TextControl label="Radius" value={s.hero?.badge?.radius} onChange={(v) => u("hero.badge.radius", v)} />
          </SectionGroup>
          <SectionGroup title="Title">
            <FontControl label="Font" value={s.hero?.title?.fontFamily} onChange={(v) => u("hero.title.fontFamily", v)} />
            <ResponsiveControl label="Font Size" value={s.hero?.title?.fontSize} onChange={(v) => u("hero.title.fontSize", v)} />
            <SelectControl label="Font Weight" value={s.hero?.title?.fontWeight} onChange={(v) => u("hero.title.fontWeight", v)}
              options={[{ value: "400", label: "Regular" }, { value: "600", label: "Semi Bold" }, { value: "700", label: "Bold" }, { value: "800", label: "Extra Bold" }, { value: "900", label: "Black" }]} />
            <TextControl label="Line Height" value={s.hero?.title?.lineHeight} onChange={(v) => u("hero.title.lineHeight", v)} />
            <ColorControl label="Color" value={s.hero?.title?.color} onChange={(v) => u("hero.title.color", v)} />
            <TextControl label="Max Width" value={s.hero?.title?.maxWidth} onChange={(v) => u("hero.title.maxWidth", v)} />
          </SectionGroup>
          <SectionGroup title="Subtitle">
            <ColorControl label="Color" value={s.hero?.subtitle?.color} onChange={(v) => u("hero.subtitle.color", v)} />
            <ResponsiveControl label="Font Size" value={s.hero?.subtitle?.fontSize} onChange={(v) => u("hero.subtitle.fontSize", v)} />
          </SectionGroup>
          <SectionGroup title="Course Image / Video">
            <TextControl label="Border Radius" value={s.hero?.image?.borderRadius} onChange={(v) => u("hero.image.borderRadius", v)} />
            <TextControl label="Play Button Size" value={s.hero?.image?.playButtonSize} onChange={(v) => u("hero.image.playButtonSize", v)} />
            <ColorControl label="Play Button Color" value={s.hero?.image?.playButtonColor} onChange={(v) => u("hero.image.playButtonColor", v)} />
            <ColorControl label="Play Hover Color" value={s.hero?.image?.playButtonHoverColor} onChange={(v) => u("hero.image.playButtonHoverColor", v)} />
            <ToggleControl label="Free Lecture Badge" value={s.hero?.image?.freeLectureBadge} onChange={(v) => u("hero.image.freeLectureBadge", v)} />
            <TextControl label="Free Lecture Text" value={s.hero?.image?.freeLectureText} onChange={(v) => u("hero.image.freeLectureText", v)} />
            <ColorControl label="Badge Background" value={s.hero?.image?.freeLectureBg} onChange={(v) => u("hero.image.freeLectureBg", v)} />
            <ColorControl label="Badge Text Color" value={s.hero?.image?.freeLectureColor} onChange={(v) => u("hero.image.freeLectureColor", v)} />
          </SectionGroup>
          <SectionGroup title="Course Meta">
            <ToggleControl label="Show Rating" value={s.hero?.meta?.ratingVisible} onChange={(v) => u("hero.meta.ratingVisible", v)} />
            <ToggleControl label="Show Students" value={s.hero?.meta?.studentsVisible} onChange={(v) => u("hero.meta.studentsVisible", v)} />
            <ToggleControl label="Show Instructor" value={s.hero?.meta?.instructorVisible} onChange={(v) => u("hero.meta.instructorVisible", v)} />
            <ToggleControl label="Show Updated Date" value={s.hero?.meta?.updatedDateVisible} onChange={(v) => u("hero.meta.updatedDateVisible", v)} />
            <ToggleControl label="Show Language" value={s.hero?.meta?.languageVisible} onChange={(v) => u("hero.meta.languageVisible", v)} />
            <ColorControl label="Text Color" value={s.hero?.meta?.textColor} onChange={(v) => u("hero.meta.textColor", v)} />
            <TextControl label="Spacing" value={s.hero?.meta?.spacing} onChange={(v) => u("hero.meta.spacing", v)} />
          </SectionGroup>
        </div>
      );

    case "stickyCta":
      return (
        <div>
          <SectionGroup title="Sticky CTA" defaultOpen>
            <ToggleControl label="Desktop Sticky" value={s.stickyCta?.enableDesktop} onChange={(v) => u("stickyCta.enableDesktop", v)} />
            <ToggleControl label="Mobile Sticky" value={s.stickyCta?.enableMobile} onChange={(v) => u("stickyCta.enableMobile", v)} />
            <ColorControl label="Background" value={s.stickyCta?.backgroundColor} onChange={(v) => u("stickyCta.backgroundColor", v)} />
            <TextControl label="Button Background" value={s.stickyCta?.buttonBackground} onChange={(v) => u("stickyCta.buttonBackground", v)} placeholder="Color or gradient" />
            <ColorControl label="Button Text" value={s.stickyCta?.buttonTextColor} onChange={(v) => u("stickyCta.buttonTextColor", v)} />
            <ColorControl label="Discount Text" value={s.stickyCta?.discountTextColor} onChange={(v) => u("stickyCta.discountTextColor", v)} />
            <FontControl label="Font" value={s.stickyCta?.fontFamily} onChange={(v) => u("stickyCta.fontFamily", v)} />
            <ResponsiveControl label="Font Size" value={s.stickyCta?.fontSize} onChange={(v) => u("stickyCta.fontSize", v)} />
            <SelectControl label="Font Weight" value={s.stickyCta?.fontWeight} onChange={(v) => u("stickyCta.fontWeight", v)}
              options={[{ value: "600", label: "Semi Bold" }, { value: "700", label: "Bold" }, { value: "800", label: "Extra Bold" }]} />
            <TextControl label="Border Radius" value={s.stickyCta?.borderRadius} onChange={(v) => u("stickyCta.borderRadius", v)} />
            <TextControl label="Shadow" value={s.stickyCta?.shadow} onChange={(v) => u("stickyCta.shadow", v)} />
            <TextControl label="Padding" value={s.stickyCta?.padding} onChange={(v) => u("stickyCta.padding", v)} />
            <ToggleControl label="Safe Area" value={s.stickyCta?.safeArea} onChange={(v) => u("stickyCta.safeArea", v)} />
          </SectionGroup>
        </div>
      );

    case "whatYoullLearn":
    case "requirements":
      return <SectionSettingsPanel sectionKey={section} settings={s} updateSetting={u} />;

    case "curriculum":
      return (
        <div>
          <SectionGroup title="Curriculum" defaultOpen>
            <ToggleControl label="Enable" value={s.curriculum?.enabled} onChange={(v) => u("curriculum.enabled", v)} />
            <TextControl label="Heading" value={s.curriculum?.heading} onChange={(v) => u("curriculum.heading", v)} />
            <FontControl label="Heading Font" value={s.curriculum?.headingFont} onChange={(v) => u("curriculum.headingFont", v)} />
            <ColorControl label="Heading Color" value={s.curriculum?.headingColor} onChange={(v) => u("curriculum.headingColor", v)} />
            <ColorControl label="Background" value={s.curriculum?.backgroundColor} onChange={(v) => u("curriculum.backgroundColor", v)} />
            <ColorControl label="Card Background" value={s.curriculum?.cardBackground} onChange={(v) => u("curriculum.cardBackground", v)} />
            <TextControl label="Border" value={s.curriculum?.border} onChange={(v) => u("curriculum.border", v)} />
            <TextControl label="Border Radius" value={s.curriculum?.borderRadius} onChange={(v) => u("curriculum.borderRadius", v)} />
            <TextControl label="Section Spacing" value={s.curriculum?.sectionSpacing} onChange={(v) => u("curriculum.sectionSpacing", v)} />
            <FontControl label="Lecture Font" value={s.curriculum?.lectureFont} onChange={(v) => u("curriculum.lectureFont", v)} />
            <ColorControl label="Lecture Color" value={s.curriculum?.lectureColor} onChange={(v) => u("curriculum.lectureColor", v)} />
            <ToggleControl label="Free Lecture Badge" value={s.curriculum?.freeLectureBadge} onChange={(v) => u("curriculum.freeLectureBadge", v)} />
            <ColorControl label="Badge Color" value={s.curriculum?.freeLectureBadgeColor} onChange={(v) => u("curriculum.freeLectureBadgeColor", v)} />
            <ColorControl label="Badge Background" value={s.curriculum?.freeLectureBadgeBg} onChange={(v) => u("curriculum.freeLectureBadgeBg", v)} />
            <ColorControl label="Section Header Bg" value={s.curriculum?.sectionHeaderBg} onChange={(v) => u("curriculum.sectionHeaderBg", v)} />
            <ColorControl label="Section Header Hover" value={s.curriculum?.sectionHeaderHoverBg} onChange={(v) => u("curriculum.sectionHeaderHoverBg", v)} />
            <SelectControl label="Style" value={s.curriculum?.style} onChange={(v) => u("curriculum.style", v)}
              options={[{ value: "accordion", label: "Accordion" }, { value: "compact", label: "Compact" }, { value: "spacious", label: "Spacious" }]} />
          </SectionGroup>
        </div>
      );

    case "description":
      return (
        <div>
          <SectionGroup title="Description" defaultOpen>
            <ToggleControl label="Enable" value={s.description?.enabled} onChange={(v) => u("description.enabled", v)} />
            <TextControl label="Heading" value={s.description?.heading} onChange={(v) => u("description.heading", v)} />
            <FontControl label="Heading Font" value={s.description?.headingFont} onChange={(v) => u("description.headingFont", v)} />
            <ColorControl label="Heading Color" value={s.description?.headingColor} onChange={(v) => u("description.headingColor", v)} />
            <FontControl label="Body Font" value={s.description?.bodyFont} onChange={(v) => u("description.bodyFont", v)} />
            <ResponsiveControl label="Body Size" value={s.description?.bodySize} onChange={(v) => u("description.bodySize", v)} />
            <TextControl label="Line Height" value={s.description?.lineHeight} onChange={(v) => u("description.lineHeight", v)} />
            <ColorControl label="Text Color" value={s.description?.textColor} onChange={(v) => u("description.textColor", v)} />
            <TextControl label="Max Width" value={s.description?.maxWidth} onChange={(v) => u("description.maxWidth", v)} />
            <TextControl label="Show More Text" value={s.description?.readMoreText} onChange={(v) => u("description.readMoreText", v)} />
            <TextControl label="Show Less Text" value={s.description?.readLessText} onChange={(v) => u("description.readLessText", v)} />
            <ColorControl label="Show More Color" value={s.description?.readMoreColor} onChange={(v) => u("description.readMoreColor", v)} />
            <TextControl label="Collapsed Height" value={s.description?.collapsedHeight} onChange={(v) => u("description.collapsedHeight", v)} />
          </SectionGroup>
        </div>
      );

    case "instructorSection":
      return (
        <div>
          <SectionGroup title="Instructor Section" defaultOpen>
            <ToggleControl label="Enable" value={s.instructorSection?.enabled} onChange={(v) => u("instructorSection.enabled", v)} />
            <TextControl label="Heading" value={s.instructorSection?.heading} onChange={(v) => u("instructorSection.heading", v)} />
            <FontControl label="Heading Font" value={s.instructorSection?.headingFont} onChange={(v) => u("instructorSection.headingFont", v)} />
            <ColorControl label="Heading Color" value={s.instructorSection?.headingColor} onChange={(v) => u("instructorSection.headingColor", v)} />
          </SectionGroup>
          <SectionGroup title="Instructor Image">
            <TextControl label="Image Size" value={s.instructorSection?.imageSize} onChange={(v) => u("instructorSection.imageSize", v)} />
            <SelectControl label="Shape" value={s.instructorSection?.imageShape} onChange={(v) => u("instructorSection.imageShape", v)}
              options={[{ value: "square", label: "Square" }, { value: "circle", label: "Circle" }, { value: "rounded", label: "Rounded" }]} />
            <TextControl label="Radius" value={s.instructorSection?.imageRadius} onChange={(v) => u("instructorSection.imageRadius", v)} />
            <SelectControl label="Object Fit" value={s.instructorSection?.imageObjectFit} onChange={(v) => u("instructorSection.imageObjectFit", v)}
              options={[{ value: "contain", label: "Contain" }, { value: "cover", label: "Cover" }, { value: "fill", label: "Fill" }]} />
          </SectionGroup>
          <SectionGroup title="Name & Title">
            <FontControl label="Name Font" value={s.instructorSection?.nameFont} onChange={(v) => u("instructorSection.nameFont", v)} />
            <ResponsiveControl label="Name Size" value={s.instructorSection?.nameSize} onChange={(v) => u("instructorSection.nameSize", v)} />
            <FontControl label="Username Font" value={s.instructorSection?.usernameFont} onChange={(v) => u("instructorSection.usernameFont", v)} />
          </SectionGroup>
          <SectionGroup title="Stat Cards">
            <ColorControl label="Card Background" value={s.instructorSection?.statCardBg} onChange={(v) => u("instructorSection.statCardBg", v)} />
            <TextControl label="Card Border" value={s.instructorSection?.statCardBorder} onChange={(v) => u("instructorSection.statCardBorder", v)} />
            <TextControl label="Card Radius" value={s.instructorSection?.statCardRadius} onChange={(v) => u("instructorSection.statCardRadius", v)} />
            <TextControl label="Card Shadow" value={s.instructorSection?.statCardShadow} onChange={(v) => u("instructorSection.statCardShadow", v)} />
          </SectionGroup>
        </div>
      );

    case "ratings":
      return (
        <div>
          <SectionGroup title="Ratings" defaultOpen>
            <ToggleControl label="Enable" value={s.ratings?.enabled} onChange={(v) => u("ratings.enabled", v)} />
            <ColorControl label="Star Color" value={s.ratings?.starColor} onChange={(v) => u("ratings.starColor", v)} />
            <ColorControl label="Empty Star" value={s.ratings?.emptyStarColor} onChange={(v) => u("ratings.emptyStarColor", v)} />
            <ResponsiveControl label="Star Size" value={s.ratings?.starSize} onChange={(v) => u("ratings.starSize", v)} />
            <FontControl label="Rating Font" value={s.ratings?.ratingFont} onChange={(v) => u("ratings.ratingFont", v)} />
            <ResponsiveControl label="Rating Size" value={s.ratings?.ratingSize} onChange={(v) => u("ratings.ratingSize", v)} />
            <TextControl label="Spacing" value={s.ratings?.spacing} onChange={(v) => u("ratings.spacing", v)} />
          </SectionGroup>
        </div>
      );

    case "reviews":
      return (
        <div>
          <SectionGroup title="Student Reviews" defaultOpen>
            <ToggleControl label="Enable" value={s.reviews?.enabled} onChange={(v) => u("reviews.enabled", v)} />
            <TextControl label="Heading" value={s.reviews?.heading} onChange={(v) => u("reviews.heading", v)} />
            <ResponsiveControl label="Card Width" value={s.reviews?.cardWidth} onChange={(v) => u("reviews.cardWidth", v)} />
            <ColorControl label="Card Background" value={s.reviews?.cardBackground} onChange={(v) => u("reviews.cardBackground", v)} />
            <TextControl label="Border" value={s.reviews?.border} onChange={(v) => u("reviews.border", v)} />
            <TextControl label="Border Radius" value={s.reviews?.borderRadius} onChange={(v) => u("reviews.borderRadius", v)} />
            <TextControl label="Shadow" value={s.reviews?.shadow} onChange={(v) => u("reviews.shadow", v)} />
            <ResponsiveControl label="Reviewer Image Size" value={s.reviews?.reviewerImageSize} onChange={(v) => u("reviews.reviewerImageSize", v)} />
            <FontControl label="Reviewer Name Font" value={s.reviews?.reviewerNameFont} onChange={(v) => u("reviews.reviewerNameFont", v)} />
            <FontControl label="Review Text Font" value={s.reviews?.reviewTextFont} onChange={(v) => u("reviews.reviewTextFont", v)} />
            <ColorControl label="Star Color" value={s.reviews?.starColor} onChange={(v) => u("reviews.starColor", v)} />
            <ColorControl label="Date Color" value={s.reviews?.dateColor} onChange={(v) => u("reviews.dateColor", v)} />
            <ToggleControl label="Autoplay" value={s.reviews?.autoplay} onChange={(v) => u("reviews.autoplay", v)} />
            <NumberControl label="Autoplay Speed" value={s.reviews?.autoplaySpeed} onChange={(v) => u("reviews.autoplaySpeed", Number(v))} min={1000} max={15000} step={500} unit="ms" />
          </SectionGroup>
        </div>
      );

    case "testimonials":
      return (
        <div>
          <SectionGroup title="Student Testimonials" defaultOpen>
            <ToggleControl label="Enable" value={s.testimonials?.enabled} onChange={(v) => u("testimonials.enabled", v)} />
            <TextControl label="Heading" value={s.testimonials?.heading} onChange={(v) => u("testimonials.heading", v)} />
            <TextControl label="Subtitle" value={s.testimonials?.subtitle} onChange={(v) => u("testimonials.subtitle", v)} />
            <FontControl label="Heading Font" value={s.testimonials?.headingFont} onChange={(v) => u("testimonials.headingFont", v)} />
            <TextControl label="Card Width" value={s.testimonials?.cardWidth} onChange={(v) => u("testimonials.cardWidth", v)} />
            <TextControl label="Card Height" value={s.testimonials?.cardHeight} onChange={(v) => u("testimonials.cardHeight", v)} />
            <TextControl label="Image Radius" value={s.testimonials?.imageRadius} onChange={(v) => u("testimonials.imageRadius", v)} />
            <TextControl label="Spacing" value={s.testimonials?.spacing} onChange={(v) => u("testimonials.spacing", v)} />
            <ColorControl label="Background" value={s.testimonials?.backgroundColor} onChange={(v) => u("testimonials.backgroundColor", v)} />
            <SliderControl label="Carousel Speed" value={s.testimonials?.speed} onChange={(v) => u("testimonials.speed", v)} min={1} max={20} step={1} unit="s/card" />
          </SectionGroup>
        </div>
      );

    case "videoReviews":
      return (
        <div>
          <SectionGroup title="Video Reviews" defaultOpen>
            <ToggleControl label="Enable" value={s.videoReviews?.enabled} onChange={(v) => u("videoReviews.enabled", v)} />
            <TextControl label="Heading" value={s.videoReviews?.heading} onChange={(v) => u("videoReviews.heading", v)} />
            <TextControl label="Subtitle" value={s.videoReviews?.subtitle} onChange={(v) => u("videoReviews.subtitle", v)} />
            <FontControl label="Heading Font" value={s.videoReviews?.headingFont} onChange={(v) => u("videoReviews.headingFont", v)} />
            <TextControl label="Card Width" value={s.videoReviews?.cardWidth} onChange={(v) => u("videoReviews.cardWidth", v)} />
            <TextControl label="Card Height" value={s.videoReviews?.cardHeight} onChange={(v) => u("videoReviews.cardHeight", v)} />
            <TextControl label="Video Radius" value={s.videoReviews?.videoRadius} onChange={(v) => u("videoReviews.videoRadius", v)} />
            <TextControl label="Shadow" value={s.videoReviews?.videoShadow} onChange={(v) => u("videoReviews.videoShadow", v)} />
            <TextControl label="Gap" value={s.videoReviews?.gap} onChange={(v) => u("videoReviews.gap", v)} />
            <ColorControl label="Play Button Color" value={s.videoReviews?.playButtonColor} onChange={(v) => u("videoReviews.playButtonColor", v)} />
            <TextControl label="Play Button Size" value={s.videoReviews?.playButtonSize} onChange={(v) => u("videoReviews.playButtonSize", v)} />
          </SectionGroup>
        </div>
      );

    case "relatedCourses":
      return (
        <div>
          <SectionGroup title="Related Courses" defaultOpen>
            <ToggleControl label="Enable" value={s.relatedCourses?.enabled} onChange={(v) => u("relatedCourses.enabled", v)} />
            <TextControl label="Heading" value={s.relatedCourses?.heading} onChange={(v) => u("relatedCourses.heading", v)} />
            <FontControl label="Heading Font" value={s.relatedCourses?.headingFont} onChange={(v) => u("relatedCourses.headingFont", v)} />
            <SelectControl label="Layout" value={s.relatedCourses?.cardLayout} onChange={(v) => u("relatedCourses.cardLayout", v)}
              options={[{ value: "grid", label: "Grid" }, { value: "carousel", label: "Carousel" }]} />
            <NumberControl label="Number of Cards" value={s.relatedCourses?.numberOfCards} onChange={(v) => u("relatedCourses.numberOfCards", Number(v))} min={1} max={8} />
            <TextControl label="Image Aspect Ratio" value={s.relatedCourses?.imageAspectRatio} onChange={(v) => u("relatedCourses.imageAspectRatio", v)} />
            <TextControl label="Image Radius" value={s.relatedCourses?.imageRadius} onChange={(v) => u("relatedCourses.imageRadius", v)} />
            <ColorControl label="Card Background" value={s.relatedCourses?.cardBackground} onChange={(v) => u("relatedCourses.cardBackground", v)} />
            <TextControl label="Border" value={s.relatedCourses?.border} onChange={(v) => u("relatedCourses.border", v)} />
            <TextControl label="Shadow" value={s.relatedCourses?.shadow} onChange={(v) => u("relatedCourses.shadow", v)} />
            <TextControl label="Spacing" value={s.relatedCourses?.spacing} onChange={(v) => u("relatedCourses.spacing", v)} />
          </SectionGroup>
        </div>
      );

    case "footer":
      return (
        <div>
          <SectionGroup title="Footer" defaultOpen>
            <ToggleControl label="Enable" value={s.footer?.enabled} onChange={(v) => u("footer.enabled", v)} />
            <ColorControl label="Background" value={s.footer?.backgroundColor} onChange={(v) => u("footer.backgroundColor", v)} />
            <ColorControl label="Text Color" value={s.footer?.textColor} onChange={(v) => u("footer.textColor", v)} />
            <ColorControl label="Heading Color" value={s.footer?.headingColor} onChange={(v) => u("footer.headingColor", v)} />
            <ColorControl label="Link Color" value={s.footer?.linkColor} onChange={(v) => u("footer.linkColor", v)} />
            <ColorControl label="Link Hover" value={s.footer?.linkHoverColor} onChange={(v) => u("footer.linkHoverColor", v)} />
            <FontControl label="Font" value={s.footer?.fontFamily} onChange={(v) => u("footer.fontFamily", v)} />
          </SectionGroup>
          <SectionGroup title="Footer Logo">
            <TextControl label="Logo Text" value={s.footer?.logoText} onChange={(v) => u("footer.logoText", v)} />
            <TextControl label="Accent Text" value={s.footer?.logoAccent} onChange={(v) => u("footer.logoAccent", v)} />
            <ColorControl label="Accent Color" value={s.footer?.logoAccentColor} onChange={(v) => u("footer.logoAccentColor", v)} />
            <TextControl label="Copyright" value={s.footer?.copyrightText} onChange={(v) => u("footer.copyrightText", v)} />
          </SectionGroup>
          <SectionGroup title="Footer Columns">
            {(s.footer?.columns || []).map((col, i) => (
              <div key={i} className="mb-3 p-2 bg-gray-800/50 rounded">
                <div className="flex items-center justify-between mb-1">
                  <TextControl label={`Column ${i + 1} Heading`} value={col.heading} onChange={(v) => {
                    const cols = [...(s.footer?.columns || [])];
                    cols[i] = { ...cols[i], heading: v };
                    u("footer.columns", cols);
                  }} />
                  <button onClick={() => {
                    const cols = (s.footer?.columns || []).filter((_, j) => j !== i);
                    u("footer.columns", cols);
                  }} className="text-[10px] text-red-400 hover:text-red-300 px-1 flex-shrink-0">✕</button>
                </div>
                {col.links?.map((link, j) => (
                  <div key={j} className="flex gap-1 mb-1">
                    <input type="text" value={link.text} onChange={(e) => {
                      const cols = JSON.parse(JSON.stringify(s.footer?.columns || []));
                      cols[i].links[j].text = e.target.value;
                      u("footer.columns", cols);
                    }} className="flex-1 text-[10px] bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-gray-300" />
                    <input type="text" value={link.url} onChange={(e) => {
                      const cols = JSON.parse(JSON.stringify(s.footer?.columns || []));
                      cols[i].links[j].url = e.target.value;
                      u("footer.columns", cols);
                    }} className="w-16 text-[10px] bg-gray-800 border border-gray-700 rounded px-1 py-0.5 text-gray-300" placeholder="URL" />
                    <button onClick={() => {
                      const cols = JSON.parse(JSON.stringify(s.footer?.columns || []));
                      cols[i].links.splice(j, 1);
                      u("footer.columns", cols);
                    }} className="text-[10px] text-red-400">✕</button>
                  </div>
                ))}
                <button onClick={() => {
                  const cols = JSON.parse(JSON.stringify(s.footer?.columns || []));
                  cols[i].links.push({ text: "New Link", url: "/" });
                  u("footer.columns", cols);
                }} className="text-[10px] text-purple-400 hover:text-purple-300 mt-1">+ Add Link</button>
              </div>
            ))}
            <button onClick={() => {
              const cols = [...(s.footer?.columns || []), { heading: "New Column", links: [{ text: "Link", url: "/" }] }];
              u("footer.columns", cols);
            }} className="text-xs text-purple-400 hover:text-purple-300 py-1">+ Add Column</button>
          </SectionGroup>
        </div>
      );

    case "sectionOrder":
      return (
        <div>
          <SectionGroup title="Section Order" defaultOpen>
            <p className="text-[10px] text-gray-500 mb-2">Drag to reorder sections (click arrows to move)</p>
            {(s.sectionOrder || []).map((sec, i) => (
              <div key={sec} className="flex items-center gap-2 py-1.5 px-2 bg-gray-800/50 rounded mb-1">
                <div className="flex flex-col gap-0.5">
                  <button disabled={i === 0} onClick={() => {
                    const order = [...(s.sectionOrder || [])];
                    [order[i - 1], order[i]] = [order[i], order[i - 1]];
                    u("sectionOrder", order);
                  }} className="text-[10px] text-gray-500 hover:text-white disabled:opacity-20">▲</button>
                  <button disabled={i === (s.sectionOrder?.length || 0) - 1} onClick={() => {
                    const order = [...(s.sectionOrder || [])];
                    [order[i + 1], order[i]] = [order[i], order[i + 1]];
                    u("sectionOrder", order);
                  }} className="text-[10px] text-gray-500 hover:text-white disabled:opacity-20">▼</button>
                </div>
                <span className="text-xs text-gray-300 flex-1">{sec.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}</span>
                <ToggleControl label="" value={s.sectionVisibility?.[sec] !== false} onChange={(v) => u(`sectionVisibility.${sec}`, v)} />
              </div>
            ))}
          </SectionGroup>
        </div>
      );

    case "presets":
      return <PresetsPanel settings={s} updateSetting={u} presets={presets} setPresets={setPresets} showToast={showToast} />;

    case "importExport":
      return <ImportExportPanel settings={s} updateSetting={u} showToast={showToast} />;

    case "history":
      return <HistoryPanel versionHistory={versionHistory} setVersionHistory={setVersionHistory} updateSetting={u} showToast={showToast} />;

    default:
      return <p className="text-xs text-gray-500 p-3">Select a section from the left sidebar.</p>;
  }
}

// Reusable section settings (whatYoullLearn, requirements)
function SectionSettingsPanel({ sectionKey, settings, updateSetting }) {
  const s = settings[sectionKey] || {};
  const u = (k, v) => updateSetting(`${sectionKey}.${k}`, v);
  return (
    <div>
      <SectionGroup title="General" defaultOpen>
        <ToggleControl label="Enable" value={s.enabled} onChange={(v) => u("enabled", v)} />
        <TextControl label="Heading" value={s.heading} onChange={(v) => u("heading", v)} />
        <FontControl label="Heading Font" value={s.headingFont} onChange={(v) => u("headingFont", v)} />
        <TextControl label="Heading Size" value={s.headingSize} onChange={(v) => u("headingSize", v)} />
        <ColorControl label="Heading Color" value={s.headingColor} onChange={(v) => u("headingColor", v)} />
        <ColorControl label="Background" value={s.backgroundColor} onChange={(v) => u("backgroundColor", v)} />
        <TextControl label="Border" value={s.border} onChange={(v) => u("border", v)} />
        <TextControl label="Border Radius" value={s.borderRadius} onChange={(v) => u("borderRadius", v)} />
        <TextControl label="Shadow" value={s.shadow} onChange={(v) => u("shadow", v)} />
        <ResponsiveControl label="Padding" value={s.padding} onChange={(v) => u("padding", v)} />
        <TextControl label="Item Spacing" value={s.itemSpacing || s.spacing} onChange={(v) => u(sectionKey === "whatYoullLearn" ? "itemSpacing" : "spacing", v)} />
      </SectionGroup>
      <SectionGroup title="Icon & Text">
        <ColorControl label="Icon Background" value={s.iconBackground} onChange={(v) => u("iconBackground", v)} />
        <ColorControl label="Icon Color" value={s.iconColor} onChange={(v) => u("iconColor", v)} />
        <ColorControl label="Text Color" value={s.textColor} onChange={(v) => u("textColor", v)} />
        <FontControl label="Text Font" value={s.textFont} onChange={(v) => u("textFont", v)} />
        <ResponsiveControl label="Text Size" value={s.textSize || ""} onChange={(v) => u("textSize", v)} />
      </SectionGroup>
    </div>
  );
}

// ─── Presets Panel ───────────────────────────────────────────────────────────
function PresetsPanel({ settings, updateSetting, presets, setPresets, showToast }) {
  const [newName, setNewName] = useState("");
  const savePreset = async () => {
    if (!newName.trim()) return;
    try {
      const res = await API.post("/theme/presets", { name: newName, settings });
      setPresets((p) => [res.data, ...p]);
      setNewName("");
      showToast("Preset saved");
    } catch { showToast("Failed to save preset", "error"); }
  };
  const applyPreset = (preset) => {
    if (!window.confirm(`Apply preset "${preset.name}"? This will replace current settings.`)) return;
    const merged = deepMerge(DEFAULT_THEME, preset.settings);
    Object.entries(merged).forEach(([k, v]) => updateSetting(k, v));
    showToast(`Applied: ${preset.name}`);
  };
  const deletePreset = async (id) => {
    try {
      await API.delete(`/theme/presets/${id}`);
      setPresets((p) => p.filter((x) => x._id !== id));
      showToast("Preset deleted");
    } catch { showToast("Failed to delete", "error"); }
  };
  return (
    <div className="p-3">
      <div className="mb-4">
        <label className="text-xs text-gray-400 block mb-1">Save Current as Preset</label>
        <div className="flex gap-1">
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Preset name"
            className="flex-1 text-xs bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-gray-200" />
          <button onClick={savePreset} className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded">Save</button>
        </div>
      </div>
      <div className="space-y-2">
        {presets.map((p) => (
          <div key={p._id} className="flex items-center justify-between py-2 px-2 bg-gray-800/50 rounded">
            <span className="text-xs text-gray-300">{p.name}</span>
            <div className="flex gap-1">
              <button onClick={() => applyPreset(p)} className="text-[10px] px-2 py-0.5 bg-purple-600/30 text-purple-400 hover:bg-purple-600/50 rounded">Apply</button>
              <button onClick={() => deletePreset(p._id)} className="text-[10px] px-2 py-0.5 text-red-400 hover:text-red-300 rounded">Delete</button>
            </div>
          </div>
        ))}
        {presets.length === 0 && <p className="text-xs text-gray-500">No presets saved yet.</p>}
      </div>
    </div>
  );
}

// ─── Import/Export Panel ─────────────────────────────────────────────────────
function ImportExportPanel({ settings, updateSetting, showToast }) {
  const fileRef = useRef(null);
  const exportTheme = async () => {
    try {
      const res = await API.get("/theme/export");
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `theme-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Theme exported");
    } catch { showToast("Export failed", "error"); }
  };
  const importTheme = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const themeSettings = data.settings || data;
      const res = await API.post("/theme/import", { settings: themeSettings });
      const merged = deepMerge(DEFAULT_THEME, res.data.settings);
      Object.entries(merged).forEach(([k, v]) => updateSetting(k, v));
      showToast("Theme imported");
    } catch { showToast("Import failed — invalid file", "error"); }
  };
  return (
    <div className="p-3 space-y-3">
      <button onClick={exportTheme} className="w-full px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition">⬇ Export Theme JSON</button>
      <button onClick={() => fileRef.current?.click()} className="w-full px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition">⬆ Import Theme JSON</button>
      <input ref={fileRef} type="file" accept=".json" onChange={importTheme} className="hidden" />
      <p className="text-[10px] text-gray-500">Theme files contain only visual settings. No passwords, tokens, or private data.</p>
    </div>
  );
}

// ─── History Panel ───────────────────────────────────────────────────────────
function HistoryPanel({ versionHistory, setVersionHistory, updateSetting, showToast }) {
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    API.get("/theme/history").then((r) => setVersionHistory(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, [setVersionHistory]);

  const restore = async (id) => {
    if (!window.confirm("Restore this version? Current draft will be replaced.")) return;
    try {
      const res = await API.post(`/theme/restore/${id}`);
      const merged = deepMerge(DEFAULT_THEME, res.data.settings);
      Object.entries(merged).forEach(([k, v]) => updateSetting(k, v));
      showToast("Version restored");
    } catch { showToast("Restore failed", "error"); }
  };

  if (loading) return <div className="p-3 text-xs text-gray-500">Loading history...</div>;
  return (
    <div className="p-3 space-y-2">
      {versionHistory.length === 0 && <p className="text-xs text-gray-500">No version history yet. Publish a theme to create history.</p>}
      {versionHistory.map((h) => (
        <div key={h._id} className="py-2 px-2 bg-gray-800/50 rounded">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-300 font-semibold">Version {h.version}</span>
              <p className="text-[10px] text-gray-500">{new Date(h.createdAt).toLocaleString()}</p>
              <p className="text-[10px] text-gray-500">{h.changedBy?.name || "Admin"}</p>
            </div>
            <button onClick={() => restore(h._id)} className="text-[10px] px-2 py-1 bg-purple-600/30 text-purple-400 hover:bg-purple-600/50 rounded">Restore</button>
          </div>
        </div>
      ))}
    </div>
  );
}
