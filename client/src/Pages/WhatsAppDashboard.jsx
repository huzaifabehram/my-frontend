// WhatsAppDashboard.jsx
// Version: chats v2 (fast cache, media, voice, polls, events, contacts, tags)
// ══════════════════════════════════════════════════════════════════════════════
// Super Admin → WhatsApp — wiring unchanged (import in SuperAdminsDashboard.jsx,
// route "whatsapp", shared UI from SuperAdminUI.jsx).
//
// WHAT CHANGED IN THIS VERSION (Chats tab only — Add account / QR, Profile,
// Bulk, Autoresponder, Chatbot and API are unchanged):
// - Smooth & fast: chats are cached in memory + browser storage, so switching
//   tabs, leaving the WhatsApp page or refreshing shows chats instantly; only
//   new/changed chats and messages are fetched in the background. Messages
//   load in pages (scroll up for older). Sending is instant (optimistic).
// - Chat list: last-message time like WhatsApp (3:10 PM / Yesterday /
//   Monday / date), blue unread-count badge, tags.
// - Colors: sent = green bubble + white text, received = dark bubble + white text.
// - Send photos, videos, documents, voice notes, polls, events, contacts;
//   emoji picker. Received media can be viewed full-screen, played and downloaded.
// - Chat header: call options, tags, contact info (number, about, common
//   groups, block / unblock, clear chat).

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { Btn, SectionHeader, EmptyState, StatusBadge } from "./SuperAdminUI";

const FEATURES = [
  { key: "chats",         label: "Chats",         icon: "💬", desc: "Every conversation on this number" },
  { key: "profile",       label: "Profile",       icon: "👤", desc: "WhatsApp account info" },
  { key: "bulk",          label: "Bulk messaging", icon: "📤", desc: "Send to multiple recipients" },
  { key: "autoresponder", label: "Autoresponder", icon: "↩️", desc: "Send a pre-written message" },
  { key: "chatbot",       label: "Chatbot",       icon: "🤖", desc: "Communicate with users" },
  { key: "api",           label: "API",           icon: "🔌", desc: "WhatsApp REST API" },
];

export default function WhatsAppDashboard({ toast }) {
  const { API: api } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [feature, setFeature] = useState("chats");
  const [showAdd, setShowAdd] = useState(false);

  const loadSessions = useCallback(() => {
    setLoadingSessions(true);
    api.get("/admin/whatsapp-server/sessions")
      .then((res) => {
        const list = res.data || [];
        setSessions(list);
        setSelectedSessionId((prev) => (prev && list.some((s) => s._id === prev) ? prev : list[0]?._id || ""));
      })
      .catch(() => toast("Failed to load WhatsApp accounts — is the self-hosted server installed?", "error"))
      .finally(() => setLoadingSessions(false));
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const selectedSession = sessions.find((s) => s._id === selectedSessionId) || null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <SectionHeader title="WhatsApp" />
        <Btn onClick={() => setShowAdd(true)}>+ Add account</Btn>
      </div>

      {loadingSessions && sessions.length === 0 ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : sessions.length === 0 ? (
        <EmptyState icon="💬" title="No WhatsApp accounts yet" body='Click "+ Add account" to connect your first number by scanning a QR code.' action={<Btn onClick={() => setShowAdd(true)}>+ Add account</Btn>} />
      ) : (
        <>
          {sessions.length > 1 && (
            <select value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white mb-4">
              {sessions.map((s) => <option key={s._id} value={s._id}>{s.label} {s.status !== "connected" ? "(not connected)" : ""}</option>)}
            </select>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="sm:w-56 flex-shrink-0 space-y-1">
              {FEATURES.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFeature(f.key)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg cursor-pointer border-none transition ${feature === f.key ? "bg-[#e8540a] text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                >
                  <div className="flex items-center gap-2">
                    <span>{f.icon}</span>
                    <span className="font-semibold text-sm">{f.label}</span>
                  </div>
                  <p className={`text-[11px] mt-0.5 ${feature === f.key ? "text-white/80" : "text-gray-400"}`}>{f.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex-1 min-w-0">
              {!selectedSession ? (
                <EmptyState icon="💬" title="Select an account" body="Choose a WhatsApp account above to see its details." />
              ) : (
                <>
                  {/* Chats stays mounted while you use other tabs → no reloading when you come back */}
                  <div style={{ display: feature === "chats" ? "block" : "none" }}>
                    <ChatsFeature key={selectedSession._id} toast={toast} session={selectedSession} active={feature === "chats"} />
                  </div>
                  {feature === "chats" ? null : feature === "profile" ? (
                    <ProfileFeature toast={toast} session={selectedSession} onChanged={loadSessions} />
                  ) : feature === "bulk" ? (
                    <BulkMessagingFeature toast={toast} session={selectedSession} />
                  ) : feature === "autoresponder" ? (
                    <AutoresponderFeature />
                  ) : feature === "chatbot" ? (
                    <ChatbotFeature toast={toast} sessions={sessions} />
                  ) : (
                    <ApiFeature toast={toast} />
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {showAdd && <AddAccountModal toast={toast} onClose={() => setShowAdd(false)} onAdded={loadSessions} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD ACCOUNT / RECONNECT — QR scan flow (unchanged)
// Pass `existingSession` to skip the name step and go straight to the QR
// (used by Profile → Reconnect).
// ─────────────────────────────────────────────────────────────────────────────
function AddAccountModal({ toast, onClose, onAdded, existingSession }) {
  const { API: api } = useAuth();
  const [step, setStep] = useState(existingSession ? "qr" : "name"); // name | qr
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [session, setSession] = useState(existingSession || null);
  const [qrImage, setQrImage] = useState("");
  const [expired, setExpired] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [waitedLong, setWaitedLong] = useState(false);

  const createAccount = async () => {
    if (!label.trim()) { toast("Name this account first", "error"); return; }
    setCreating(true);
    try {
      const res = await api.post("/admin/whatsapp-server/sessions", { label: label.trim() });
      setSession(res.data);
      setStep("qr");
    } catch (err) { toast(err.response?.data?.message || "Failed to create account", "error"); }
    finally { setCreating(false); }
  };

  const getNewQr = async () => {
    if (!session) return;
    setRetrying(true);
    try {
      await api.post(`/admin/whatsapp-server/sessions/${session._id}/reconnect`);
      setExpired(false);
      setQrImage("");
      setWaitedLong(false);
    } catch (err) { toast(err.response?.data?.message || "Failed to get a new QR", "error"); }
    finally { setRetrying(false); }
  };

  useEffect(() => {
    if (step !== "qr" || !session) return;
    let stopped = false;
    setWaitedLong(false);
    const longWaitTimer = setTimeout(() => { if (!stopped) setWaitedLong(true); }, 15000);

    const poll = async () => {
      try {
        const res = await api.get(`/admin/whatsapp-server/sessions/${session._id}/qr`);
        if (stopped) return;
        const { qr, qrImage: qrImageDataUrl, status } = res.data || {};
        if (status === "connected") {
          stopped = true;
          toast(`"${session.label}" connected! Chat history is importing in the background.`, "success");
          onAdded();
          onClose();
          return;
        }
        if (qrImageDataUrl) {
          setExpired(false);
          setQrImage(qrImageDataUrl);
        } else if (qr) {
          setExpired(false);
          setQrImage(`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qr)}`);
        } else {
          setQrImage("");
          if (status === "disconnected") setExpired(true);
        }
      } catch { /* keep polling */ }
    };
    poll();
    const interval = setInterval(poll, 2500);
    return () => { stopped = true; clearInterval(interval); clearTimeout(longWaitTimer); };
  }, [step, session, api]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
        {step === "name" ? (
          <>
            <h3 className="font-bold text-gray-900 mb-3">Add a WhatsApp account</h3>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Name this account — e.g. Sales, Support"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
            <div className="flex gap-2 justify-center">
              <Btn onClick={createAccount} disabled={creating}>{creating ? "Creating…" : "Continue"}</Btn>
              <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
            </div>
          </>
        ) : (
          <>
            <h3 className="font-bold text-gray-900 mb-1">Scan to connect "{session?.label}"</h3>
            <p className="text-xs text-gray-500 mb-4">Open WhatsApp on that phone → Linked Devices → Link a Device, then scan this code.</p>
            {expired ? (
              <div className="py-8">
                <p className="text-sm text-gray-500 mb-3">This QR code expired.</p>
                <Btn onClick={getNewQr} disabled={retrying}>{retrying ? "Getting QR…" : "Get a new QR"}</Btn>
              </div>
            ) : qrImage ? (
              <img src={qrImage} alt="WhatsApp QR code" className="w-56 h-56 mx-auto rounded-lg border border-gray-100" />
            ) : (
              <div className="py-10">
                <p className="text-sm text-gray-400">Waiting for the QR code…</p>
                {waitedLong && (
                  <p className="text-xs text-amber-600 mt-3 px-2">
                    This is taking longer than usual. Check your server's logs for a line starting with
                    "[Self-hosted WhatsApp]" — if it says a package isn't installed, install it and redeploy.
                  </p>
                )}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-4">Checking connection status automatically…</p>
            <Btn variant="secondary" onClick={onClose} className="mt-3">Close</Btn>
          </>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// CHATS — shared cache + helpers
// ═════════════════════════════════════════════════════════════════════════════
// Lives outside React, so it survives switching tabs / leaving the WhatsApp
// page. Thread list + recent chats are also saved to browser storage so a
// page refresh shows them instantly.
const waCache = {
  threads: {},        // sessionId → thread list
  serverTime: {},     // sessionId → last sync time (for "only what changed")
  messages: {},       // `${sessionId}|${number}` → messages
  msgServerTime: {},  // `${sessionId}|${number}` → last sync time
  hasMore: {},        // `${sessionId}|${number}` → older messages available
  photos: {},         // `${sessionId}|${number}` → Promise<url>
  media: {},          // messageId → Promise<blob url>
  contacts: {},       // sessionId → saved contacts (share contact)
  mru: {},            // sessionId → recently opened numbers
  hydrated: {},
};
const lsKey = (sid) => `wa_chat_cache_v1_${sid}`;
function hydrateFromStorage(sid) {
  if (waCache.hydrated[sid]) return;
  waCache.hydrated[sid] = true;
  try {
    const raw = localStorage.getItem(lsKey(sid));
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!waCache.threads[sid] && Array.isArray(data.threads)) waCache.threads[sid] = data.threads;
    for (const [num, msgs] of Object.entries(data.messages || {})) {
      const k = `${sid}|${num}`;
      if (!waCache.messages[k] && Array.isArray(msgs)) waCache.messages[k] = msgs;
    }
    waCache.mru[sid] = Array.isArray(data.mru) ? data.mru : [];
  } catch { /* ignore broken cache */ }
}
const persistTimers = {};
function schedulePersist(sid) {
  clearTimeout(persistTimers[sid]);
  persistTimers[sid] = setTimeout(() => {
    try {
      const mru = (waCache.mru[sid] || []).slice(0, 25);
      const messages = {};
      for (const num of mru) {
        const list = waCache.messages[`${sid}|${num}`];
        if (list) messages[num] = list.filter((m) => !String(m._id).startsWith("tmp-")).slice(-60);
      }
      localStorage.setItem(lsKey(sid), JSON.stringify({ threads: (waCache.threads[sid] || []).slice(0, 1500), messages, mru }));
    } catch { try { localStorage.removeItem(lsKey(sid)); } catch { /* ignore */ } }
  }, 1500);
}
function touchMru(sid, num) {
  const list = (waCache.mru[sid] || []).filter((n) => n !== num);
  list.unshift(num);
  waCache.mru[sid] = list.slice(0, 40);
}

function mergeThreads(prev, updates) {
  const map = new Map(prev.map((t) => [t.number, t]));
  for (const t of updates) map.set(t.number, { ...(map.get(t.number) || {}), ...t });
  return [...map.values()].sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));
}

// Merges messages by id; removes optimistic "tmp-" bubbles once the real
// message has arrived (or 20s after they were confirmed sent).
function mergeMessages(prev, incoming) {
  const map = new Map(prev.map((m) => [m._id, m]));
  for (const m of incoming) map.set(m._id, m);
  let list = [...map.values()];
  const realOutgoing = incoming.filter((m) => m.direction === "outgoing" && !String(m._id).startsWith("tmp-"));
  const usedTemps = new Set();
  for (const real of realOutgoing) {
    const tmp = list.find((m) => String(m._id).startsWith("tmp-") && !usedTemps.has(m._id) && (
      (m.msgType || "text") === "text" ? (real.msgType || "text") === "text" && m.message === real.message : (real.msgType || "text") === m.msgType
    ));
    if (tmp) usedTemps.add(tmp._id);
  }
  const now = Date.now();
  list = list.filter((m) => !usedTemps.has(m._id) && !(String(m._id).startsWith("tmp-") && m.status === "sent" && now - (m.sentAt || now) > 20000));
  return list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function getMediaUrl(api, id) {
  if (!waCache.media[id]) {
    waCache.media[id] = api.get(`/admin/whatsapp/media/${id}`, { responseType: "blob" })
      .then((res) => URL.createObjectURL(res.data))
      .catch((err) => { delete waCache.media[id]; throw err; });
  }
  return waCache.media[id];
}
function getPhoto(api, sid, number) {
  const key = `${sid}|${number}`;
  if (!waCache.photos[key]) {
    waCache.photos[key] = api.get(`/admin/whatsapp/profile-photo/${sid}/${encodeURIComponent(number)}`)
      .then((res) => res.data?.url || "")
      .catch(() => "");
  }
  return waCache.photos[key];
}
function triggerDownload(url, name) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name || "download";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function useInView(ref, rootMargin = "250px") {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (seen || !ref.current) return;
    if (typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); ob.disconnect(); } }, { rootMargin });
    ob.observe(ref.current);
    return () => ob.disconnect();
  }, [seen, rootMargin, ref]);
  return seen;
}

// ── Time formats (like WhatsApp) ────────────────────────────────────────────
const timeOnly = (d) => new Date(d).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
function daysAgo(d) {
  const date = new Date(d);
  const now = new Date();
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const b = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((a - b) / 86400000);
}
function listTime(d) {
  if (!d) return "";
  const n = daysAgo(d);
  if (n <= 0) return timeOnly(d);
  if (n === 1) return "Yesterday";
  if (n < 7) return new Date(d).toLocaleDateString([], { weekday: "long" });
  return new Date(d).toLocaleDateString();
}
function dayLabel(d) {
  const n = daysAgo(d);
  if (n <= 0) return "Today";
  if (n === 1) return "Yesterday";
  if (n < 7) return new Date(d).toLocaleDateString([], { weekday: "long" });
  return new Date(d).toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });
}
const fmtSeconds = (s) => `${Math.floor((s || 0) / 60)}:${String(Math.round(s || 0) % 60).padStart(2, "0")}`;

// Text of a media message that's only the placeholder (not a real caption)
function captionOf(m) {
  const t = m.message || "";
  if (!t || (m.msgType || "text") === "text") return "";
  if (/^(📷 Photo|🎥 Video|🎤 Voice message|🎵 Audio|Sticker|📄 |📊 |📅 |👤 |📍 )/.test(t)) return "";
  return t;
}

const SENT_BG = "#005c4b";     // WhatsApp green (sent)
const RECEIVED_BG = "#202c33"; // WhatsApp dark (received)

const EMOJI_GROUPS = [
  { icon: "😀", list: "😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥳 😏 😒 😞 😔 😟 😕 🙁 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🤗 🤔 🤭 🤫 🤥 😶 😐 😑 😬 🙄 😯 😦 😧 😮 😲 🥱 😴 🤤 😪 😵 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕" },
  { icon: "👍", list: "👍 👎 👌 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ ✋ 🤚 🖐️ 🖖 👋 👏 🙌 👐 🤲 🤝 🙏 💪 ✍️ 👀 🧠 🙋 🙆 🙅 🤷 🤦" },
  { icon: "❤️", list: "❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💋 🌹 🌸 🌺 🌻 💐" },
  { icon: "🎉", list: "🎉 🎊 🎁 🎂 🎈 🔥 ⭐ 🌟 ✨ 💯 ✅ ❌ ⚠️ 📌 📍 📞 📱 💻 📷 🎥 🎤 📄 📊 📅 ⏰ 💰 💵 🛒 📦 🚀 🏆 🎯 💡 🔔 📢 🎓 📚 ✏️" },
  { icon: "☕", list: "☀️ 🌙 ⛅ 🌧️ ❄️ 🌈 ☕ 🍵 🍕 🍔 🍟 🌮 🍰 🍫 🍩 🍎 🍉 🍓 🍌 🥭 🍗 🍚 🥤 🧃" },
].map((g) => ({ ...g, list: g.list.split(" ") }));

// ─────────────────────────────────────────────────────────────────────────────
// CHATS — per-contact threads like WhatsApp Web
// ─────────────────────────────────────────────────────────────────────────────
function ChatsFeature({ toast, session, active }) {
  const { API: api } = useAuth();
  const sid = session.sessionId;
  hydrateFromStorage(sid);

  const [threads, setThreadsState] = useState(() => waCache.threads[sid] || []);
  const [loadingThreads, setLoadingThreads] = useState(() => !waCache.threads[sid]);
  const [activeNumber, setActiveNumber] = useState("");
  const [messages, setMessagesState] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [contactPhoto, setContactPhoto] = useState("");
  const [presence, setPresence] = useState(null);
  const [aboutText, setAboutText] = useState("");
  const [modal, setModal] = useState(null); // info | tags | poll | event | contact | call
  const [menu, setMenu] = useState(null);   // plus | emoji
  const [pendingFiles, setPendingFiles] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const mediaInputRef = useRef(null);
  const docInputRef = useRef(null);
  const activeRef = useRef("");
  const stickToBottomRef = useRef(true);
  const syncingRef = useRef(false);
  const lastFullRef = useRef(0);
  const msgSyncingRef = useRef(false);
  const recRef = useRef(null);
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const activeTabRef = useRef(active);
  activeTabRef.current = active;

  // ── state setters that keep the shared cache in sync ──────────────────────
  const setThreads = useCallback((updater) => {
    setThreadsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      waCache.threads[sid] = next;
      schedulePersist(sid);
      return next;
    });
  }, [sid]);

  const setMessagesFor = useCallback((number, updater) => {
    const key = `${sid}|${number}`;
    const prev = waCache.messages[key] || [];
    const next = typeof updater === "function" ? updater(prev) : updater;
    waCache.messages[key] = next;
    if (activeRef.current === number) setMessagesState(next);
    schedulePersist(sid);
  }, [sid]);

  const markRead = useCallback((number, force = false) => {
    const t = (waCache.threads[sid] || []).find((x) => x.number === number);
    if (!force && !(t?.unreadCount > 0)) return;
    setThreads((prev) => prev.map((x) => (x.number === number ? { ...x, unreadCount: 0 } : x)));
    api.post(`/admin/whatsapp/conversations/${sid}/${encodeURIComponent(number)}/read`).catch(() => {});
  }, [api, sid, setThreads]);

  // ── background sync: only what changed ───────────────────────────────────
  const syncThreads = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    try {
      const since = waCache.serverTime[sid];
      const full = !since || Date.now() - lastFullRef.current > 60000;
      const res = await api.get("/admin/whatsapp/conversations", { params: { instanceId: sid, v: 2, ...(full ? {} : { since }) } });
      const { threads: list = [], serverTime } = res.data || {};
      const fixed = list.map((t) => (t.number === activeRef.current ? { ...t, unreadCount: 0 } : t));
      if (full) { lastFullRef.current = Date.now(); setThreads(fixed); }
      else if (fixed.length) setThreads((prev) => mergeThreads(prev, fixed));
      if (serverTime) waCache.serverTime[sid] = serverTime;
    } catch {
      if (!waCache.threads[sid]) toastRef.current("Failed to load conversations", "error");
    } finally {
      syncingRef.current = false;
      setLoadingThreads(false);
    }
  }, [api, sid, setThreads]);

  const syncMessages = useCallback(async (number) => {
    const key = `${sid}|${number}`;
    const after = waCache.msgServerTime[key];
    if (!number || !after || msgSyncingRef.current) return;
    msgSyncingRef.current = true;
    try {
      const res = await api.get(`/admin/whatsapp/conversations/${sid}/${encodeURIComponent(number)}`, { params: { after } });
      const { messages: list = [], serverTime } = res.data || {};
      if (serverTime) waCache.msgServerTime[key] = serverTime;
      if (list.length) {
        setMessagesFor(number, (prev) => mergeMessages(prev, list));
        if (list.some((m) => m.direction === "incoming") && activeTabRef.current && !document.hidden && activeRef.current === number) markRead(number, true);
      }
    } catch { /* next tick */ }
    finally { msgSyncingRef.current = false; }
  }, [api, sid, setMessagesFor, markRead]);

  useEffect(() => {
    syncThreads();
    const tick = () => {
      if (document.hidden) return;
      syncThreads();
      if (activeRef.current && activeTabRef.current) syncMessages(activeRef.current);
    };
    const interval = setInterval(tick, active ? 3000 : 15000);
    const onVis = () => { if (!document.hidden) tick(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", onVis); };
  }, [active, syncThreads, syncMessages]);

  // ── open a chat: cached messages instantly, then fetch the latest ────────
  const openThread = (number) => {
    const key = `${sid}|${number}`;
    activeRef.current = number;
    setActiveNumber(number);
    touchMru(sid, number);
    const cached = waCache.messages[key] || [];
    setMessagesState(cached);
    setLoadingMessages(cached.length === 0);
    stickToBottomRef.current = true;
    setContactPhoto(""); setPresence(null); setAboutText(""); setModal(null); setMenu(null); setReplyText("");

    const n = encodeURIComponent(number);
    api.get(`/admin/whatsapp/conversations/${sid}/${n}`, { params: { limit: 80 } })
      .then((res) => {
        const { messages: list = [], serverTime, hasMore } = res.data || {};
        waCache.hasMore[key] = !!hasMore;
        if (serverTime) waCache.msgServerTime[key] = serverTime;
        setMessagesFor(number, (prev) => mergeMessages(prev.filter((m) => String(m._id).startsWith("tmp-")), list));
      })
      .catch(() => { if (!cached.length) toastRef.current("Failed to load this conversation", "error"); })
      .finally(() => { if (activeRef.current === number) setLoadingMessages(false); });
    markRead(number);
    getPhoto(api, sid, number).then((url) => { if (activeRef.current === number) setContactPhoto(url); });
    api.get(`/admin/whatsapp/presence/${sid}/${n}`).then((res) => { if (activeRef.current === number) setPresence(res.data?.presence || null); }).catch(() => {});
    api.get(`/admin/whatsapp/about/${sid}/${n}`).then((res) => { if (activeRef.current === number) setAboutText(res.data?.status || ""); }).catch(() => {});
  };

  // ── older messages when scrolling up ─────────────────────────────────────
  const loadOlder = async () => {
    const number = activeRef.current;
    const key = `${sid}|${number}`;
    if (!number || loadingOlder || !waCache.hasMore[key]) return;
    const oldest = (waCache.messages[key] || []).find((m) => !String(m._id).startsWith("tmp-"));
    if (!oldest) return;
    setLoadingOlder(true);
    const el = scrollRef.current;
    const prevHeight = el ? el.scrollHeight : 0;
    try {
      const res = await api.get(`/admin/whatsapp/conversations/${sid}/${encodeURIComponent(number)}`, { params: { before: oldest.createdAt, limit: 80 } });
      const { messages: list = [], hasMore } = res.data || {};
      waCache.hasMore[key] = !!hasMore;
      stickToBottomRef.current = false;
      setMessagesFor(number, (prev) => mergeMessages(prev, list));
      requestAnimationFrame(() => { if (el) el.scrollTop = el.scrollHeight - prevHeight + el.scrollTop; });
    } catch { /* ignore */ }
    finally { setLoadingOlder(false); }
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (el.scrollTop < 80) loadOlder();
  };

  useEffect(() => {
    if (stickToBottomRef.current && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, activeNumber, active]);

  // ── sending (instant / optimistic) ───────────────────────────────────────
  const bumpThread = (number, text) => {
    setThreads((prev) => {
      const existing = prev.find((t) => t.number === number) || { number, name: "", pushName: "", tags: [], count: 0 };
      return mergeThreads(prev, [{ ...existing, lastMessage: text, lastDirection: "outgoing", lastAt: new Date().toISOString(), unreadCount: 0 }]);
    });
  };
  const addTemp = (number, fields) => {
    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    stickToBottomRef.current = true;
    setMessagesFor(number, (prev) => [...prev, { _id: tempId, direction: "outgoing", status: "sending", createdAt: new Date().toISOString(), msgType: "text", ...fields }]);
    return tempId;
  };
  const updateTemp = (number, tempId, patch) => setMessagesFor(number, (prev) => prev.map((m) => (m._id === tempId ? { ...m, ...patch } : m)));
  const afterSend = (number, tempId, ok) => {
    updateTemp(number, tempId, ok ? { status: "sent", sentAt: Date.now() } : { status: "failed" });
    if (ok) setTimeout(() => syncMessages(number), 300);
  };

  const sendReply = () => {
    const text = replyText.trim();
    const number = activeNumber;
    if (!text || !number) return;
    setReplyText("");
    setMenu(null);
    const tempId = addTemp(number, { message: text });
    bumpThread(number, text);
    api.post("/admin/whatsapp-server/send", { sessionDocId: session._id, to: number, message: text })
      .then(() => afterSend(number, tempId, true))
      .catch((err) => { afterSend(number, tempId, false); toast(err.response?.data?.message || "Send failed", "error"); });
  };

  const sendFile = async (number, file, kind, caption = "", extra = {}) => {
    if (file.size > 64 * 1024 * 1024) { toast(`"${file.name}" is bigger than 64 MB`, "error"); return; }
    const label = kind === "voice" ? "🎤 Voice message" : kind === "image" ? (caption || "📷 Photo") : kind === "video" ? (caption || "🎥 Video") : (caption || `📄 ${file.name}`);
    const localUrl = ["image", "video", "voice"].includes(kind) ? URL.createObjectURL(file) : "";
    const tempId = addTemp(number, {
      msgType: kind === "voice" ? "audio" : kind, ptt: kind === "voice", localUrl, fileName: file.name,
      mimetype: file.type, seconds: extra.seconds || 0, message: caption || label,
    });
    bumpThread(number, label);
    const params = new URLSearchParams({
      sessionDocId: session._id, to: number, kind, fileName: file.name || "", mimetype: file.type || "", caption: caption || "",
      ...(extra.seconds ? { seconds: String(extra.seconds) } : {}),
    });
    try {
      await api.post(`/admin/whatsapp-server/send-media?${params.toString()}`, file, {
        headers: { "Content-Type": "application/octet-stream" }, maxBodyLength: Infinity, maxContentLength: Infinity,
      });
      afterSend(number, tempId, true);
    } catch (err) {
      afterSend(number, tempId, false);
      toast(err.response?.data?.message || `Couldn't send ${file.name}`, "error");
    }
  };

  const sendSpecial = async (kind, payload, label, tempFields) => {
    const number = activeNumber;
    if (!number) return;
    setModal(null);
    const tempId = addTemp(number, { msgType: kind, message: label, ...tempFields });
    bumpThread(number, label);
    try {
      const res = await api.post("/admin/whatsapp-server/send-special", { sessionDocId: session._id, to: number, kind, payload });
      if (res.data?.fallback) {
        setMessagesFor(number, (prev) => prev.filter((m) => m._id !== tempId));
        syncMessages(number);
        toast("Sent as a formatted message — your server's WhatsApp library can't send native events yet.", "success");
      } else afterSend(number, tempId, true);
    } catch (err) {
      afterSend(number, tempId, false);
      toast(err.response?.data?.message || "Send failed", "error");
    }
  };

  // ── attachments ──────────────────────────────────────────────────────────
  const pickFiles = (files, asDocument) => {
    const list = Array.from(files || []).map((file) => {
      const kind = asDocument ? "document" : file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "document";
      return { file, kind, previewUrl: kind === "image" || kind === "video" ? URL.createObjectURL(file) : "" };
    });
    if (list.length) setPendingFiles(list);
    setMenu(null);
  };
  const sendPendingFiles = async (caption) => {
    const number = activeNumber;
    const list = pendingFiles;
    setPendingFiles([]);
    for (let i = 0; i < list.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      await sendFile(number, list[i].file, list[i].kind, i === 0 ? caption : "");
    }
  };

  // ── voice notes ──────────────────────────────────────────────────────────
  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { toast("This browser can't record audio", "error"); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/ogg;codecs=opus", "audio/webm;codecs=opus", "audio/webm"].find((t) => MediaRecorder.isTypeSupported?.(t)) || "";
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const rec = { recorder, stream, chunks: [], start: Date.now(), cancelled: false, number: activeRef.current, timer: null };
      recorder.ondataavailable = (e) => { if (e.data && e.data.size) rec.chunks.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(rec.timer);
        if (rec.cancelled || !rec.chunks.length) return;
        const type = recorder.mimeType || mime || "audio/webm";
        const blob = new Blob(rec.chunks, { type });
        const seconds = Math.max(1, Math.round((Date.now() - rec.start) / 1000));
        const file = new File([blob], `voice-${Date.now()}.${type.includes("ogg") ? "ogg" : "webm"}`, { type });
        sendFile(rec.number, file, "voice", "", { seconds });
      };
      rec.timer = setInterval(() => setRecSeconds(Math.round((Date.now() - rec.start) / 1000)), 500);
      recRef.current = rec;
      recorder.start();
      setRecSeconds(0);
      setRecording(true);
    } catch { toast("Microphone permission was denied", "error"); }
  };
  const stopRecording = (send) => {
    const rec = recRef.current;
    if (!rec) return;
    rec.cancelled = !send;
    try { rec.recorder.stop(); } catch { /* already stopped */ }
    recRef.current = null;
    setRecording(false);
  };
  useEffect(() => () => { if (recRef.current) { recRef.current.cancelled = true; try { recRef.current.recorder.stop(); } catch { /* ignore */ } } }, []);

  const insertEmoji = (emoji) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? replyText.length;
    const end = el?.selectionEnd ?? start;
    setReplyText(replyText.slice(0, start) + emoji + replyText.slice(end));
    requestAnimationFrame(() => { if (el) { el.focus(); el.selectionStart = el.selectionEnd = start + emoji.length; } });
  };

  // ── labels ───────────────────────────────────────────────────────────────
  const threadFor = (number) => threads.find((t) => t.number === number);
  const isLid = (number) => String(number || "").startsWith("lid:");
  const formatDisplayNumber = (number) => {
    if (!number) return "";
    if (isLid(number)) return `Contact (${number.slice(4, 10)}…)`;
    return `+${number}`;
  };
  const displayLabel = (number) => {
    const t = threadFor(number);
    if (t?.name) return t.name;
    if (isLid(number) && t?.pushName) return `~${t.pushName}`;
    return formatDisplayNumber(number);
  };
  const pushNameHint = (number) => {
    const t = threadFor(number);
    return !t?.name && !isLid(number) && t?.pushName ? `~${t.pushName}` : "";
  };
  const presenceLabel = () => {
    if (!presence) return null;
    if (presence.lastKnownPresence === "composing") return "typing…";
    if (presence.lastKnownPresence === "recording") return "recording audio…";
    if (presence.lastKnownPresence === "available") return "online";
    if (presence.lastSeen) return `last seen ${listTime(presence.lastSeen * 1000).toLowerCase()} ${daysAgo(presence.lastSeen * 1000) > 0 ? `at ${timeOnly(presence.lastSeen * 1000)}` : ""}`;
    return null;
  };

  const saveTags = async (number, tags) => {
    try {
      const res = await api.post(`/admin/whatsapp/conversations/${sid}/${encodeURIComponent(number)}/tags`, { tags });
      setThreads((prev) => prev.map((t) => (t.number === number ? { ...t, tags: res.data?.tags || tags } : t)));
      toast("Tags saved", "success");
    } catch { toast("Failed to save tags", "error"); }
  };
  const clearChat = async (number) => {
    if (!window.confirm(`Clear all messages with ${displayLabel(number)} from this dashboard?`)) return;
    try {
      await api.delete(`/admin/whatsapp/conversations/${sid}/${encodeURIComponent(number)}/messages`);
      setMessagesFor(number, []);
      setThreads((prev) => prev.filter((t) => t.number !== number));
      setModal(null);
      setActiveNumber(""); activeRef.current = "";
      toast("Chat cleared", "success");
    } catch { toast("Failed to clear chat", "error"); }
  };

  if (session.status !== "connected") {
    return <EmptyState icon="💬" title="This account isn't connected" body='Go to Profile → Reconnect and scan the QR code to see its chats.' />;
  }

  const activeThread = threadFor(activeNumber);
  let lastDay = "";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ minHeight: 420 }}>
      {/* ── chat list ── */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden sm:col-span-1">
        {loadingThreads && threads.length === 0 ? (
          <p className="text-sm text-gray-400 p-4">Loading…</p>
        ) : threads.length === 0 ? (
          <p className="text-sm text-gray-400 p-4">No conversations yet. If you just connected, chat history is still importing — it appears here automatically.</p>
        ) : (
          <div className="divide-y divide-gray-100 max-h-[620px] overflow-y-auto">
            {threads.map((t) => {
              const unread = t.unreadCount > 0 && activeNumber !== t.number;
              return (
                <button key={t.number} onClick={() => openThread(t.number)}
                  className={`w-full text-left p-3 cursor-pointer border-none flex items-center gap-2.5 ${activeNumber === t.number ? "bg-gray-100" : "bg-transparent hover:bg-gray-50"}`}>
                  <ThreadAvatar sessionId={sid} number={t.number} api={api} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {displayLabel(t.number)}
                        {pushNameHint(t.number) && <span className="ml-1 text-[11px] font-normal text-gray-400">{pushNameHint(t.number)}</span>}
                      </p>
                      <span className={`text-[11px] flex-shrink-0 ${unread ? "text-blue-600 font-semibold" : "text-gray-400"}`}>{listTime(t.lastAt)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={`text-xs truncate ${unread ? "text-gray-800 font-medium" : "text-gray-500"}`}>{t.lastDirection === "outgoing" ? "You: " : ""}{t.lastMessage}</p>
                      {unread && (
                        <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                          {t.unreadCount > 999 ? "999+" : t.unreadCount}
                        </span>
                      )}
                    </div>
                    {t.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {t.tags.slice(0, 3).map((tag) => <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">{tag}</span>)}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── open chat ── */}
      <div className="bg-white rounded-xl border border-gray-100 sm:col-span-2 flex flex-col relative">
        {!activeNumber ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400 p-8 text-center">Select a conversation on the left to see the full chat.</div>
        ) : (
          <>
            <div className="p-3 flex items-center gap-2.5 border-b border-gray-100">
              <button onClick={() => setModal("info")} className="flex items-center gap-2.5 flex-1 min-w-0 text-left bg-transparent border-0 cursor-pointer p-0">
                {contactPhoto ? <img src={contactPhoto} alt="" className="w-9 h-9 rounded-full object-cover" /> : <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">👤</div>}
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">
                    {displayLabel(activeNumber)}
                    {pushNameHint(activeNumber) && <span className="ml-1 text-[11px] font-normal text-gray-400">{pushNameHint(activeNumber)}</span>}
                  </p>
                  {presenceLabel() ? <p className="text-[11px] text-gray-400">{presenceLabel()}</p> : <p className="text-[11px] text-gray-400">Tap for contact info</p>}
                  {activeThread?.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {activeThread.tags.map((tag) => <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">{tag}</span>)}
                    </div>
                  )}
                </div>
              </button>
              <HeaderIcon title="Call" onClick={() => setModal("call")}>📞</HeaderIcon>
              <HeaderIcon title="Tags" onClick={() => setModal("tags")}>🏷️</HeaderIcon>
              <HeaderIcon title="Contact info" onClick={() => setModal("info")}>ⓘ</HeaderIcon>
            </div>

            <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto p-3 space-y-1.5 max-h-[480px] min-h-[320px]" style={{ background: "#efeae2" }}>
              {loadingOlder && <p className="text-center text-[11px] text-gray-500">Loading older messages…</p>}
              {loadingMessages && messages.length === 0 ? <p className="text-xs text-gray-500">Loading…</p> : messages.map((m) => {
                const day = dayLabel(m.createdAt);
                const showDay = day !== lastDay;
                lastDay = day;
                const out = m.direction === "outgoing";
                return (
                  <React.Fragment key={m._id}>
                    {showDay && (
                      <div className="flex justify-center my-2">
                        <span className="text-[11px] px-2.5 py-1 rounded-md bg-white/90 text-gray-600 shadow-sm">{day}</span>
                      </div>
                    )}
                    <div className={`flex ${out ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[78%] rounded-lg px-2.5 py-1.5 text-sm text-white shadow-sm" style={{ background: out ? SENT_BG : RECEIVED_BG }}>
                        <MessageBody m={m} api={api} onLightbox={setLightbox} onMessageNumber={openThread} />
                        <p className="text-[10px] mt-1 text-right" style={{ color: "rgba(255,255,255,0.6)" }}>
                          {timeOnly(m.createdAt)}
                          {out && (m.status === "sending" ? " 🕓" : m.status === "failed" ? " ⚠️ failed" : " ✓")}
                        </p>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* ── composer ── */}
            <div className="p-2.5 border-t border-gray-100 relative">
              {menu === "emoji" && <EmojiPicker onPick={insertEmoji} onClose={() => setMenu(null)} />}
              {menu === "plus" && (
                <div className="absolute bottom-full left-2 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-20 w-56">
                  <MenuItem icon="🖼️" label="Photos & videos" onClick={() => mediaInputRef.current?.click()} />
                  <MenuItem icon="📄" label="Document" onClick={() => docInputRef.current?.click()} />
                  <MenuItem icon="👤" label="Contact" onClick={() => { setMenu(null); setModal("contact"); }} />
                  <MenuItem icon="📊" label="Poll" onClick={() => { setMenu(null); setModal("poll"); }} />
                  <MenuItem icon="📅" label="Event" onClick={() => { setMenu(null); setModal("event"); }} />
                </div>
              )}
              <input ref={mediaInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => { pickFiles(e.target.files, false); e.target.value = ""; }} />
              <input ref={docInputRef} type="file" multiple className="hidden" onChange={(e) => { pickFiles(e.target.files, true); e.target.value = ""; }} />

              {recording ? (
                <div className="flex items-center gap-3">
                  <button onClick={() => stopRecording(false)} title="Cancel" className="w-10 h-10 rounded-full bg-gray-100 border-0 cursor-pointer text-lg">🗑️</button>
                  <div className="flex-1 flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" /> Recording {fmtSeconds(recSeconds)}
                  </div>
                  <button onClick={() => stopRecording(true)} title="Send voice message" className="w-10 h-10 rounded-full border-0 cursor-pointer text-white text-lg" style={{ background: SENT_BG }}>➤</button>
                </div>
              ) : (
                <div className="flex items-end gap-1.5">
                  <button onClick={() => setMenu(menu === "emoji" ? null : "emoji")} title="Emoji" className="w-10 h-10 rounded-full bg-transparent hover:bg-gray-100 border-0 cursor-pointer text-xl flex-shrink-0">😊</button>
                  <button onClick={() => setMenu(menu === "plus" ? null : "plus")} title="Attach" className="w-10 h-10 rounded-full bg-transparent hover:bg-gray-100 border-0 cursor-pointer text-2xl text-gray-600 flex-shrink-0">+</button>
                  <textarea
                    ref={inputRef}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                    rows={1}
                    placeholder="Type a message"
                    className="flex-1 border border-gray-200 rounded-2xl px-3.5 py-2 text-sm resize-none max-h-28 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    style={{ height: "auto", minHeight: 40 }}
                    onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = `${Math.min(e.target.scrollHeight, 112)}px`; }}
                  />
                  {replyText.trim() ? (
                    <button onClick={sendReply} title="Send" className="w-10 h-10 rounded-full border-0 cursor-pointer text-white flex-shrink-0" style={{ background: SENT_BG }}>➤</button>
                  ) : (
                    <button onClick={startRecording} title="Record voice message" className="w-10 h-10 rounded-full border-0 cursor-pointer text-white flex-shrink-0 text-lg" style={{ background: SENT_BG }}>🎤</button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── modals ── */}
      {pendingFiles.length > 0 && <AttachmentModal files={pendingFiles} onCancel={() => setPendingFiles([])} onSend={sendPendingFiles} />}
      {lightbox && <Lightbox item={lightbox} onClose={() => setLightbox(null)} />}
      {modal === "poll" && <PollModal onClose={() => setModal(null)} onSend={(p) => sendSpecial("poll", p, `📊 ${p.name}`, { meta: { name: p.name, options: p.options, selectableCount: p.multiple ? 0 : 1 } })} />}
      {modal === "event" && <EventModal onClose={() => setModal(null)} onSend={(p) => sendSpecial("event", p, `📅 ${p.name}`, { meta: p })} />}
      {modal === "contact" && <ContactShareModal api={api} sid={sid} onClose={() => setModal(null)} onSend={(contacts) => sendSpecial("contact", { contacts }, `👤 ${contacts.length === 1 ? contacts[0].name || `+${contacts[0].number}` : `${contacts.length} contacts`}`, { meta: { contacts } })} />}
      {modal === "tags" && activeNumber && <TagsModal initial={activeThread?.tags || []} onClose={() => setModal(null)} onSave={(tags) => { saveTags(activeNumber, tags); setModal(null); }} />}
      {modal === "call" && activeNumber && <CallModal number={activeNumber} isLid={isLid(activeNumber)} label={displayLabel(activeNumber)} onClose={() => setModal(null)} />}
      {modal === "info" && activeNumber && (
        <ContactInfoModal
          api={api} sid={sid} toast={toast} number={activeNumber} isLid={isLid(activeNumber)}
          label={displayLabel(activeNumber)} phone={formatDisplayNumber(activeNumber)} pushName={pushNameHint(activeNumber)}
          photo={contactPhoto} presence={presenceLabel()} about={aboutText} tags={activeThread?.tags || []}
          onEditTags={() => setModal("tags")} onClear={() => clearChat(activeNumber)} onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHATS — small building blocks
// ─────────────────────────────────────────────────────────────────────────────
function HeaderIcon({ title, onClick, children }) {
  return (
    <button title={title} aria-label={title} onClick={onClick}
      className="w-9 h-9 rounded-full bg-transparent hover:bg-gray-100 border-0 cursor-pointer text-lg text-gray-600 flex items-center justify-center flex-shrink-0">
      {children}
    </button>
  );
}

function MenuItem({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="w-full text-left px-4 py-2 text-sm text-gray-700 bg-transparent hover:bg-gray-50 border-0 cursor-pointer flex items-center gap-3">
      <span className="text-lg">{icon}</span>{label}
    </button>
  );
}

// Profile photo, loaded only when the row scrolls into view and cached.
function ThreadAvatar({ sessionId, number, api }) {
  const ref = useRef(null);
  const visible = useInView(ref);
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!visible || !sessionId) return;
    let cancelled = false;
    getPhoto(api, sessionId, number).then((u) => { if (!cancelled) setUrl(u); });
    return () => { cancelled = true; };
  }, [visible, sessionId, number, api]);
  return (
    <div ref={ref} className="w-10 h-10 flex-shrink-0">
      {url
        ? <img src={url} alt="" className="w-10 h-10 rounded-full object-cover" />
        : <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">👤</div>}
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl p-5 w-full shadow-2xl max-h-[90vh] overflow-y-auto ${wide ? "max-w-lg" : "max-w-sm"}`} onClick={(e) => e.stopPropagation()}>
        {title && <h3 className="font-bold text-gray-900 mb-3">{title}</h3>}
        {children}
      </div>
    </div>
  );
}

// ── message content by type ─────────────────────────────────────────────────
function MessageBody({ m, api, onLightbox, onMessageNumber }) {
  const type = m.msgType || "text";
  const caption = captionOf(m);
  const canLoad = m.hasMedia || !!m.localUrl;

  if (["image", "sticker", "video", "audio", "document"].includes(type) && !canLoad) {
    return (
      <div>
        <p className="whitespace-pre-wrap break-words">{m.message}</p>
        <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>Media not available for older imported messages</p>
      </div>
    );
  }
  if (type === "image" || type === "sticker") {
    return <>{<MediaImage m={m} api={api} onLightbox={onLightbox} sticker={type === "sticker"} />}{caption && <p className="whitespace-pre-wrap break-words mt-1">{caption}</p>}</>;
  }
  if (type === "video") {
    return <>{<MediaVideo m={m} api={api} onLightbox={onLightbox} />}{caption && <p className="whitespace-pre-wrap break-words mt-1">{caption}</p>}</>;
  }
  if (type === "audio") return <MediaAudio m={m} api={api} />;
  if (type === "document") return <>{<MediaDocument m={m} api={api} />}{caption && <p className="whitespace-pre-wrap break-words mt-1">{caption}</p>}</>;

  if (type === "poll" && m.meta) {
    return (
      <div className="min-w-[200px]">
        <p className="text-[11px] mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>📊 Poll{m.meta.selectableCount === 1 ? "" : " · select one or more"}</p>
        <p className="font-semibold mb-2">{m.meta.name}</p>
        {(m.meta.options || []).map((o, i) => (
          <div key={i} className="flex items-center gap-2 py-1 border-t border-white/10">
            <span className="w-3.5 h-3.5 rounded-full border border-white/60 flex-shrink-0" />{o}
          </div>
        ))}
        <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>Votes are shown in WhatsApp on the phone</p>
      </div>
    );
  }
  if (type === "event" && m.meta) {
    return (
      <div className="min-w-[200px]">
        <p className="text-[11px] mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>📅 Event</p>
        <p className="font-semibold">{m.meta.name}</p>
        {m.meta.startTime && <p className="text-xs mt-1">🕒 {new Date(m.meta.startTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}{m.meta.endTime ? ` – ${new Date(m.meta.endTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}` : ""}</p>}
        {m.meta.location && <p className="text-xs mt-0.5">📍 {m.meta.location}</p>}
        {m.meta.description && <p className="text-xs mt-1 whitespace-pre-wrap">{m.meta.description}</p>}
      </div>
    );
  }
  if (type === "contact" && m.meta?.contacts) {
    return (
      <div className="min-w-[200px] space-y-2">
        {m.meta.contacts.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">👤</div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">{c.name || `+${c.number}`}</p>
              {c.number && <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>+{c.number}</p>}
            </div>
            {c.number && <button onClick={() => onMessageNumber(c.number)} className="text-xs px-2 py-1 rounded bg-white/15 text-white border-0 cursor-pointer">Message</button>}
          </div>
        ))}
      </div>
    );
  }
  if (type === "location" && m.meta) {
    return (
      <a href={`https://www.google.com/maps?q=${m.meta.lat},${m.meta.lng}`} target="_blank" rel="noreferrer" className="text-white underline">
        📍 {m.meta.name || "Open location in Google Maps"}
      </a>
    );
  }
  return <p className="whitespace-pre-wrap break-words">{m.message}</p>;
}

function useMediaUrl(m, api, shouldLoad) {
  const [url, setUrl] = useState(m.localUrl || "");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (url || !shouldLoad || !m.hasMedia) return;
    let off = false;
    getMediaUrl(api, m._id).then((u) => { if (!off) setUrl(u); }).catch(() => { if (!off) setFailed(true); });
    return () => { off = true; };
  }, [shouldLoad, url, m._id, m.hasMedia, api]);
  return { url, failed };
}

function MediaImage({ m, api, onLightbox, sticker }) {
  const ref = useRef(null);
  const visible = useInView(ref);
  const { url, failed } = useMediaUrl(m, api, visible);
  const name = m.fileName || `photo-${m.waMessageId || m._id}.jpg`;
  return (
    <div ref={ref}>
      {url ? (
        <img src={url} alt="" onClick={() => !sticker && onLightbox({ url, type: "image", fileName: name })}
          className={sticker ? "w-32 h-32 object-contain" : "rounded-md max-h-72 max-w-full object-cover cursor-pointer"} />
      ) : (
        <div className={`${sticker ? "w-32 h-32" : "w-60 h-40"} max-w-full rounded-md bg-black/20 flex items-center justify-center text-xs`} style={{ color: "rgba(255,255,255,0.7)" }}>
          {failed ? "Photo couldn't be loaded" : "Loading photo…"}
        </div>
      )}
    </div>
  );
}

function MediaVideo({ m, api, onLightbox }) {
  const [load, setLoad] = useState(!!m.localUrl);
  const { url, failed } = useMediaUrl(m, api, load);
  const name = m.fileName || `video-${m.waMessageId || m._id}.mp4`;
  if (url) {
    return (
      <div>
        <video src={url} controls className="rounded-md max-h-72 max-w-full" />
        <div className="flex gap-3 mt-1 text-[11px]">
          <button onClick={() => onLightbox({ url, type: "video", fileName: name })} className="bg-transparent border-0 text-white/80 cursor-pointer p-0">⤢ Full view</button>
          <button onClick={() => triggerDownload(url, name)} className="bg-transparent border-0 text-white/80 cursor-pointer p-0">⬇ Download</button>
        </div>
      </div>
    );
  }
  return (
    <button onClick={() => setLoad(true)} className="w-60 max-w-full h-36 rounded-md bg-black/25 border-0 cursor-pointer text-white flex flex-col items-center justify-center gap-1">
      <span className="text-3xl">{load && !failed ? "⏳" : "▶️"}</span>
      <span className="text-xs">{failed ? "Video couldn't be loaded — tap to retry" : load ? "Loading video…" : `Play video${m.seconds ? ` (${fmtSeconds(m.seconds)})` : ""}`}</span>
    </button>
  );
}

function MediaAudio({ m, api }) {
  const [load, setLoad] = useState(!!m.localUrl);
  const { url, failed } = useMediaUrl(m, api, load);
  if (url) {
    return (
      <div className="flex items-center gap-2">
        <span>{m.ptt ? "🎤" : "🎵"}</span>
        <audio src={url} controls autoPlay={!m.localUrl} className="h-9 max-w-[240px]" />
      </div>
    );
  }
  return (
    <button onClick={() => setLoad(true)} className="flex items-center gap-2 bg-transparent border-0 cursor-pointer text-white p-0">
      <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">{load && !failed ? "⏳" : "▶"}</span>
      <span className="text-sm">{failed ? "Couldn't load — tap to retry" : `${m.ptt ? "Voice message" : "Audio"}${m.seconds ? ` · ${fmtSeconds(m.seconds)}` : ""}`}</span>
    </button>
  );
}

function MediaDocument({ m, api }) {
  const [busy, setBusy] = useState(false);
  const name = m.fileName || "Document";
  const get = async () => {
    if (m.localUrl) return m.localUrl;
    setBusy(true);
    try { return await getMediaUrl(api, m._id); } finally { setBusy(false); }
  };
  const open = async () => { try { const u = await get(); window.open(u, "_blank", "noopener"); } catch { alert("This document couldn't be loaded from WhatsApp."); } };
  const download = async () => { try { triggerDownload(await get(), name); } catch { alert("This document couldn't be loaded from WhatsApp."); } };
  return (
    <div className="flex items-center gap-2.5 bg-black/20 rounded-md p-2 min-w-[220px]">
      <span className="text-2xl">📄</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm truncate">{name}</p>
        <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.6)" }}>{(m.mimetype || "").split("/").pop()?.split(";")[0]?.toUpperCase() || "FILE"}</p>
      </div>
      <button onClick={open} disabled={busy} className="text-xs px-2 py-1 rounded bg-white/15 text-white border-0 cursor-pointer">{busy ? "…" : "Open"}</button>
      <button onClick={download} disabled={busy} className="text-xs px-2 py-1 rounded bg-white/15 text-white border-0 cursor-pointer">⬇</button>
    </div>
  );
}

function Lightbox({ item, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 bg-black/95 z-[300] flex flex-col" onClick={onClose}>
      <div className="flex justify-end gap-2 p-3" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => triggerDownload(item.url, item.fileName)} className="px-3 py-1.5 rounded-lg bg-white/10 text-white border-0 cursor-pointer text-sm">⬇ Download</button>
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg bg-white/10 text-white border-0 cursor-pointer text-sm">✕ Close</button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 min-h-0" onClick={(e) => e.stopPropagation()}>
        {item.type === "video"
          ? <video src={item.url} controls autoPlay className="max-w-full max-h-full" />
          : <img src={item.url} alt="" className="max-w-full max-h-full object-contain" />}
      </div>
    </div>
  );
}

function EmojiPicker({ onPick, onClose }) {
  const [group, setGroup] = useState(0);
  return (
    <div className="absolute bottom-full left-2 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 z-20 w-[320px] max-w-[calc(100vw-3rem)]">
      <div className="flex border-b border-gray-100">
        {EMOJI_GROUPS.map((g, i) => (
          <button key={g.icon} onClick={() => setGroup(i)} className={`flex-1 py-2 text-lg border-0 cursor-pointer ${group === i ? "bg-gray-100" : "bg-transparent"}`}>{g.icon}</button>
        ))}
        <button onClick={onClose} className="px-3 bg-transparent border-0 cursor-pointer text-gray-400" aria-label="Close emoji picker">✕</button>
      </div>
      <div className="grid grid-cols-8 gap-0.5 p-2 max-h-56 overflow-y-auto">
        {EMOJI_GROUPS[group].list.map((e, i) => (
          <button key={`${e}-${i}`} onClick={() => onPick(e)} className="text-xl h-9 rounded hover:bg-gray-100 bg-transparent border-0 cursor-pointer">{e}</button>
        ))}
      </div>
    </div>
  );
}

// ── send dialogs ────────────────────────────────────────────────────────────
function AttachmentModal({ files, onCancel, onSend }) {
  const [caption, setCaption] = useState("");
  const first = files[0];
  return (
    <Modal title={files.length === 1 ? "Send file" : `Send ${files.length} files`} onClose={onCancel} wide>
      <div className="bg-gray-50 rounded-lg p-3 mb-3 flex items-center justify-center min-h-[160px]">
        {first.kind === "image" ? <img src={first.previewUrl} alt="" className="max-h-72 max-w-full rounded" />
          : first.kind === "video" ? <video src={first.previewUrl} controls className="max-h-72 max-w-full rounded" />
          : <div className="text-center"><p className="text-4xl">📄</p><p className="text-sm text-gray-700 mt-2 break-all">{first.file.name}</p></div>}
      </div>
      {files.length > 1 && <p className="text-xs text-gray-500 mb-2">{files.map((f) => f.file.name).join(", ")}</p>}
      <input value={caption} onChange={(e) => setCaption(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onSend(caption.trim())}
        placeholder="Add a caption (optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
      <div className="flex gap-2 justify-end">
        <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
        <Btn onClick={() => onSend(caption.trim())}>Send</Btn>
      </div>
    </Modal>
  );
}

function PollModal({ onClose, onSend }) {
  const [name, setName] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [multiple, setMultiple] = useState(false);
  const setOpt = (i, v) => setOptions((prev) => prev.map((o, j) => (j === i ? v : o)));
  const clean = options.map((o) => o.trim()).filter(Boolean);
  const valid = name.trim() && clean.length >= 2;
  return (
    <Modal title="Create poll" onClose={onClose}>
      <label className="block text-xs font-bold text-gray-600 mb-1">Question</label>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ask a question" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
      <label className="block text-xs font-bold text-gray-600 mb-1">Options</label>
      {options.map((o, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input value={o} onChange={(e) => setOpt(i, e.target.value)} placeholder={`Option ${i + 1}`} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          {options.length > 2 && <button onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))} className="px-2 bg-transparent border-0 cursor-pointer text-gray-400" aria-label="Remove option">✕</button>}
        </div>
      ))}
      {options.length < 12 && <button onClick={() => setOptions((p) => [...p, ""])} className="text-sm text-emerald-700 bg-transparent border-0 cursor-pointer p-0 mb-3">+ Add option</button>}
      <label className="flex items-center gap-2 text-sm text-gray-700 mb-4 cursor-pointer">
        <input type="checkbox" checked={multiple} onChange={(e) => setMultiple(e.target.checked)} className="w-4 h-4" /> Allow multiple answers
      </label>
      <div className="flex gap-2 justify-end">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn disabled={!valid} onClick={() => onSend({ name: name.trim(), options: clean, multiple })}>Send poll</Btn>
      </div>
    </Modal>
  );
}

function EventModal({ onClose, onSend }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [location, setLocation] = useState("");
  const valid = name.trim() && start;
  return (
    <Modal title="Create event" onClose={onClose}>
      <label className="block text-xs font-bold text-gray-600 mb-1">Event name</label>
      <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
      <label className="block text-xs font-bold text-gray-600 mb-1">Description (optional)</label>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 resize-none" />
      <label className="block text-xs font-bold text-gray-600 mb-1">Starts</label>
      <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
      <label className="block text-xs font-bold text-gray-600 mb-1">Ends (optional)</label>
      <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3" />
      <label className="block text-xs font-bold text-gray-600 mb-1">Location (optional)</label>
      <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4" />
      <div className="flex gap-2 justify-end">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn disabled={!valid} onClick={() => onSend({
          name: name.trim(), description: description.trim(), location: location.trim(),
          startTime: new Date(start).toISOString(), endTime: end ? new Date(end).toISOString() : null,
        })}>Send event</Btn>
      </div>
    </Modal>
  );
}

function ContactShareModal({ api, sid, onClose, onSend }) {
  const [contacts, setContacts] = useState(waCache.contacts[sid] || null);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState({});
  const [manualName, setManualName] = useState("");
  const [manualNumber, setManualNumber] = useState("");
  useEffect(() => {
    if (contacts) return;
    api.get(`/admin/whatsapp/contacts/${sid}`).then((res) => { waCache.contacts[sid] = res.data || []; setContacts(res.data || []); }).catch(() => setContacts([]));
  }, [api, sid, contacts]);
  const q = search.trim().toLowerCase();
  const shown = (contacts || []).filter((c) => !q || c.name.toLowerCase().includes(q) || c.number.includes(q)).slice(0, 200);
  const selected = Object.values(picked);
  const send = () => {
    const list = [...selected];
    const digits = manualNumber.replace(/[^\d]/g, "");
    if (digits) list.push({ name: manualName.trim(), number: digits });
    if (list.length) onSend(list);
  };
  return (
    <Modal title="Share contact" onClose={onClose} wide>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search saved contacts" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2" />
      <div className="border border-gray-100 rounded-lg max-h-56 overflow-y-auto mb-3">
        {contacts === null ? <p className="text-xs text-gray-400 p-3">Loading…</p> : shown.length === 0 ? <p className="text-xs text-gray-400 p-3">No saved contacts found.</p> : shown.map((c) => (
          <label key={c.number} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
            <input type="checkbox" checked={!!picked[c.number]} onChange={(e) => setPicked((p) => { const n = { ...p }; if (e.target.checked) n[c.number] = c; else delete n[c.number]; return n; })} />
            <span className="flex-1 truncate">{c.name}</span>
            <span className="text-xs text-gray-400">+{c.number}</span>
          </label>
        ))}
      </div>
      <p className="text-xs font-bold text-gray-600 mb-1">Or enter a contact</p>
      <div className="flex gap-2 mb-4">
        <input value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Name" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <input value={manualNumber} onChange={(e) => setManualNumber(e.target.value)} placeholder="923001234567" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2 justify-end">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn disabled={!selected.length && !manualNumber.replace(/[^\d]/g, "")} onClick={send}>Send</Btn>
      </div>
    </Modal>
  );
}

function TagsModal({ initial, onClose, onSave }) {
  const [tags, setTags] = useState(initial);
  const [input, setInput] = useState("");
  const add = () => {
    const t = input.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setInput("");
  };
  return (
    <Modal title="Chat tags" onClose={onClose}>
      <div className="flex flex-wrap gap-1.5 mb-3 min-h-[28px]">
        {tags.length === 0 && <p className="text-xs text-gray-400">No tags yet — e.g. Lead, Paid, Follow up.</p>}
        {tags.map((t) => (
          <span key={t} className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 flex items-center gap-1">
            {t}<button onClick={() => setTags(tags.filter((x) => x !== t))} className="bg-transparent border-0 cursor-pointer text-emerald-700 p-0" aria-label={`Remove ${t}`}>✕</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2 mb-4">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="New tag" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <Btn variant="secondary" onClick={add}>Add</Btn>
      </div>
      <div className="flex gap-2 justify-end">
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={() => onSave(input.trim() && !tags.includes(input.trim()) ? [...tags, input.trim()] : tags)}>Save tags</Btn>
      </div>
    </Modal>
  );
}

function CallModal({ number, isLid, label, onClose }) {
  return (
    <Modal title={`Call ${label}`} onClose={onClose}>
      {isLid ? (
        <p className="text-sm text-gray-600 mb-4">WhatsApp hasn't shared this contact's phone number, so it can't be called from here.</p>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-3">WhatsApp doesn't allow voice or video calls through a linked server, so calls open on your phone or the WhatsApp app.</p>
          <div className="space-y-2 mb-4">
            <a href={`https://wa.me/${number}`} target="_blank" rel="noreferrer" className="block w-full text-center px-3 py-2.5 rounded-lg text-white text-sm font-semibold no-underline" style={{ background: SENT_BG }}>Open in WhatsApp app to call</a>
            <a href={`tel:+${number}`} className="block w-full text-center px-3 py-2.5 rounded-lg bg-gray-100 text-gray-800 text-sm font-semibold no-underline">Normal phone call (+{number})</a>
          </div>
        </>
      )}
      <div className="flex justify-end"><Btn variant="secondary" onClick={onClose}>Close</Btn></div>
    </Modal>
  );
}

function ContactInfoModal({ api, sid, toast, number, isLid, label, phone, pushName, photo, presence, about, tags, onEditTags, onClear, onClose }) {
  const [groups, setGroups] = useState(null);
  const [blocked, setBlocked] = useState(null);
  const [busy, setBusy] = useState(false);
  const n = encodeURIComponent(number);
  useEffect(() => {
    api.get(`/admin/whatsapp/common-groups/${sid}/${n}`).then((res) => setGroups(res.data?.groups || [])).catch(() => setGroups([]));
    api.get(`/admin/whatsapp/block-status/${sid}/${n}`).then((res) => setBlocked(!!res.data?.blocked)).catch(() => setBlocked(false));
  }, [api, sid, n]);
  const toggleBlock = async () => {
    const block = !blocked;
    if (!window.confirm(block ? `Block ${label}? They won't be able to message or call you.` : `Unblock ${label}?`)) return;
    setBusy(true);
    try { await api.post(`/admin/whatsapp/block/${sid}/${n}`, { block }); setBlocked(block); toast(block ? "Blocked" : "Unblocked", "success"); }
    catch (err) { toast(err.response?.data?.message || "Failed", "error"); }
    finally { setBusy(false); }
  };
  return (
    <Modal onClose={onClose} wide>
      <div className="text-center">
        {photo ? <img src={photo} alt="" className="w-32 h-32 rounded-full object-cover mx-auto mb-3" /> : <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-4xl mx-auto mb-3">👤</div>}
        <p className="font-bold text-gray-900 text-lg">{label}</p>
        <p className="text-sm text-gray-600">{isLid ? "Phone number hidden by WhatsApp" : phone}</p>
        {pushName && <p className="text-sm text-gray-400">{pushName}</p>}
        {presence && <p className="text-xs text-gray-400 mt-1">{presence}</p>}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs font-bold text-gray-500 mb-1">About</p>
        <p className="text-sm text-gray-700">{about || "—"}</p>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-bold text-gray-500">Tags</p>
          <button onClick={onEditTags} className="text-xs text-emerald-700 bg-transparent border-0 cursor-pointer p-0">Edit</button>
        </div>
        <div className="flex flex-wrap gap-1">
          {tags.length === 0 ? <p className="text-sm text-gray-400">No tags</p> : tags.map((t) => <span key={t} className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">{t}</span>)}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs font-bold text-gray-500 mb-1">{groups ? `${groups.length} group${groups.length === 1 ? "" : "s"} in common` : "Groups in common"}</p>
        {groups === null ? <p className="text-sm text-gray-400">Loading…</p> : groups.length === 0 ? <p className="text-sm text-gray-400">None</p> : (
          <div className="max-h-40 overflow-y-auto space-y-1">
            {groups.map((g) => (
              <div key={g.id} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs">👥</span>
                <span className="flex-1 truncate">{g.subject}</span>
                <span className="text-xs text-gray-400">{g.size}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
        <Btn size="sm" variant="danger" onClick={toggleBlock} disabled={busy || blocked === null}>{blocked === null ? "…" : blocked ? `Unblock ${label}` : `Block ${label}`}</Btn>
        <Btn size="sm" variant="secondary" onClick={onClear}>Clear chat</Btn>
        <Btn size="sm" variant="secondary" onClick={onClose}>Close</Btn>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE — this account's info + connection controls (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function ProfileFeature({ toast, session, onChanged }) {
  const { API: api } = useAuth();
  const [busy, setBusy] = useState(false);
  const [qrSession, setQrSession] = useState(null);

  const reconnect = async () => {
    if (!window.confirm(`Reconnect "${session.label}"?\n\nThis unlinks the current connection and shows a NEW QR code. Scanning it also re-imports the full chat history.`)) return;
    setBusy(true);
    try {
      await api.post(`/admin/whatsapp-server/sessions/${session._id}/reconnect`);
      setQrSession(session); // opens the QR modal
    }
    catch (err) { toast(err.response?.data?.message || "Failed to reconnect", "error"); }
    finally { setBusy(false); }
  };
  const clearHistory = async () => {
    if (!window.confirm(`Clear all stored message history for "${session.label}"?\n\nThis doesn't disconnect the account. To re-import the full history afterwards, click Reconnect and scan the QR.`)) return;
    try {
      const res = await api.delete(`/admin/whatsapp-server/sessions/${session._id}/messages`);
      toast(`Cleared ${res.data?.deletedCount || 0} message(s). Now click Reconnect and scan the QR to re-import the full history.`, "success");
    }
    catch { toast("Failed to clear history", "error"); }
  };
  const removeAccount = async () => {
    if (!window.confirm(`Remove "${session.label}"? This logs it out completely.`)) return;
    try { await api.delete(`/admin/whatsapp-server/sessions/${session._id}`); toast("Removed", "success"); onChanged(); }
    catch { toast("Failed to remove", "error"); }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 text-lg">{session.label}</h3>
        <StatusBadge status={session.status === "connected" ? "verified" : session.status === "disconnected" ? "rejected" : "pending"} />
      </div>
      <div className="space-y-2 text-sm mb-5">
        <div className="flex justify-between"><span className="text-gray-400">Phone number</span><span className="text-gray-800 font-semibold">{session.phoneNumber || "Not connected yet"}</span></div>
        <div className="flex justify-between"><span className="text-gray-400">Status</span><span className="text-gray-800 font-semibold capitalize">{session.status.replace("_", " ")}</span></div>
        <div className="flex justify-between"><span className="text-gray-400">Instance ID</span><span className="text-gray-800 font-mono text-xs">{session.sessionId}</span></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Btn size="sm" variant="secondary" onClick={reconnect} disabled={busy}>{busy ? "Starting…" : "Reconnect"}</Btn>
        <Btn size="sm" variant="secondary" onClick={clearHistory}>Clear History</Btn>
        <Btn size="sm" variant="danger" onClick={removeAccount} disabled={busy}>Remove Account</Btn>
      </div>

      {qrSession && (
        <AddAccountModal
          toast={toast}
          existingSession={qrSession}
          onAdded={onChanged}
          onClose={() => { setQrSession(null); onChanged(); }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BULK MESSAGING (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function BulkMessagingFeature({ toast, session }) {
  const { API: api } = useAuth();
  const [numbers, setNumbers] = useState("");
  const [message, setMessage] = useState("");
  const [starting, setStarting] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [job, setJob] = useState(null);

  const start = async () => {
    const list = numbers.split(/[\n,]+/).map((n) => n.trim()).filter(Boolean);
    if (list.length === 0 || !message.trim()) { toast("Add at least one number and a message", "error"); return; }
    setStarting(true);
    try {
      const res = await api.post("/admin/whatsapp-server/send-bulk", { sessionDocId: session._id, numbers: list, message: message.trim() });
      setJobId(res.data.jobId);
      toast(`Bulk send started for ${list.length} number${list.length === 1 ? "" : "s"}`, "success");
    } catch (err) { toast(err.response?.data?.message || "Failed to start bulk send", "error"); }
    finally { setStarting(false); }
  };

  useEffect(() => {
    if (!jobId) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/admin/whatsapp-server/bulk-jobs/${jobId}`);
        setJob(res.data);
        if (res.data?.status === "done") clearInterval(interval);
      } catch { /* keep polling */ }
    }, 2000);
    return () => clearInterval(interval);
  }, [jobId, api]);

  const total = job?.numbers.length || 0;
  const sent = job?.results.filter((r) => r.success).length || 0;
  const failed = job?.results.filter((r) => !r.success).length || 0;

  return (
    <div className="max-w-lg">
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center"><p className="text-2xl font-bold text-gray-900">{total}</p><p className="text-xs text-gray-500">Total</p></div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{sent}</p><p className="text-xs text-gray-500">Sent</p></div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center"><p className="text-2xl font-bold text-red-500">{failed}</p><p className="text-xs text-gray-500">Failed</p></div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <p className="text-xs text-gray-500 mb-3">One number per line (or comma-separated). Sent with a few seconds' pace between each — this takes a while for a large list, and that's intentional, to reduce the chance of the number getting flagged for bulk sending.</p>
        <textarea value={numbers} onChange={(e) => setNumbers(e.target.value)} rows={5} placeholder={"923001234567\n923009876543"} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none mb-2 font-mono" disabled={!!jobId} />
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Message…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none mb-3" disabled={!!jobId} />
        <Btn onClick={start} disabled={starting || !!jobId}>{starting ? "Starting…" : "Start Bulk Send"}</Btn>
        {job && (
          <div className="mt-4 border border-gray-100 rounded-lg p-3 bg-gray-50 max-h-40 overflow-y-auto space-y-1">
            {job.results.map((r, i) => <p key={i} className={`text-[11px] ${r.success ? "text-emerald-600" : "text-red-500"}`}>{r.number} — {r.success ? "sent" : r.error}</p>)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTORESPONDER — not built yet (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function AutoresponderFeature() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 max-w-md">
      <h3 className="font-bold text-gray-900 mb-1">Autoresponder</h3>
      <p className="text-sm text-gray-500">Not built yet. This would be a simple, fixed message sent automatically (no AI) — different from the Chatbot tab, which uses ChatGPT to write real replies. Ask if you'd like this built as its own feature.</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHATBOT — AI auto-reply (ChatGPT), per-account (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function ChatbotFeature({ toast, sessions }) {
  const { API: api } = useAuth();
  const [tokenConnected, setTokenConnected] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [tokenLoading, setTokenLoading] = useState(true);
  const [savingToken, setSavingToken] = useState(false);
  const [settings, setSettings] = useState({ enabled: false, instructions: "", model: "gpt-4o-mini", enabledInstanceIds: [] });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testInput, setTestInput] = useState("");
  const [testHistory, setTestHistory] = useState([]);
  const [testing, setTesting] = useState(false);

  const loadToken = useCallback(() => {
    setTokenLoading(true);
    api.get("/admin/settings/openai").then((res) => setTokenConnected(!!res.data?.connected)).catch(() => {}).finally(() => setTokenLoading(false));
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps
  const loadSettings = useCallback(() => {
    setLoadingSettings(true);
    api.get("/admin/whatsapp/bot-settings").then((res) => setSettings(res.data || {})).catch(() => toast("Failed to load bot settings", "error")).finally(() => setLoadingSettings(false));
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadToken(); loadSettings(); }, [loadToken, loadSettings]);

  const saveToken = async () => {
    if (!tokenInput.trim()) { toast("Enter your OpenAI API key", "error"); return; }
    setSavingToken(true);
    try { await api.post("/admin/settings/openai", { apiKey: tokenInput.trim() }); setTokenInput(""); setTokenConnected(true); toast("OpenAI API connected", "success"); }
    catch (err) { toast(err.response?.data?.message || "Failed to save key", "error"); }
    finally { setSavingToken(false); }
  };
  const disconnectToken = async () => {
    if (!window.confirm("Disconnect the OpenAI API key? The chatbot will stop working until you reconnect.")) return;
    try { await api.delete("/admin/settings/openai"); setTokenConnected(false); toast("Disconnected", "success"); }
    catch { toast("Failed to disconnect", "error"); }
  };
  const saveSettings = async (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    setSaving(true);
    try { const res = await api.post("/admin/whatsapp/bot-settings", next); setSettings(res.data); }
    catch (err) { toast(err.response?.data?.message || "Failed to save", "error"); }
    finally { setSaving(false); }
  };
  const toggleInstanceEnabled = (sessionId) => {
    const has = settings.enabledInstanceIds.includes(sessionId);
    saveSettings({ enabledInstanceIds: has ? settings.enabledInstanceIds.filter((id) => id !== sessionId) : [...settings.enabledInstanceIds, sessionId] });
  };
  const sendTest = async () => {
    if (!testInput.trim()) return;
    const userMsg = { role: "user", content: testInput.trim() };
    setTestHistory((prev) => [...prev, userMsg]);
    setTestInput("");
    setTesting(true);
    try { const res = await api.post("/admin/whatsapp/bot-test", { message: userMsg.content, history: testHistory }); setTestHistory((prev) => [...prev, { role: "assistant", content: res.data?.reply || "" }]); }
    catch (err) { toast(err.response?.data?.message || "Test failed", "error"); setTestHistory((prev) => prev.slice(0, -1)); }
    finally { setTesting(false); }
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-5">Auto-replies to incoming WhatsApp messages using ChatGPT, based on the instructions you write below. It only runs on accounts you explicitly turn it on for.</p>

      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-gray-800 text-sm">OpenAI API</h3>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${tokenConnected ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>{tokenConnected ? "Connected" : "Not connected"}</span>
        </div>
        <p className="text-xs text-gray-500 mb-3">Get a key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-rose-600 underline">platform.openai.com</a> → API Keys.</p>
        {tokenLoading ? <p className="text-xs text-gray-400">Loading…</p> : (
          <div className="flex flex-wrap gap-2">
            <input type="password" value={tokenInput} onChange={(e) => setTokenInput(e.target.value)} placeholder={tokenConnected ? "Enter a new key to replace it" : "Paste your OpenAI API key"} className="flex-1 min-w-[220px] border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <Btn onClick={saveToken} disabled={savingToken}>{savingToken ? "Saving…" : tokenConnected ? "Update" : "Connect"}</Btn>
            {tokenConnected && <Btn variant="danger" onClick={disconnectToken}>Disconnect</Btn>}
          </div>
        )}
      </div>

      {loadingSettings ? <p className="text-sm text-gray-400">Loading…</p> : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-sm">Bot Status</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={settings.enabled} onChange={(e) => saveSettings({ enabled: e.target.checked })} className="w-4 h-4 accent-rose-600" disabled={!tokenConnected} />
                <span className="text-sm font-semibold text-gray-700">{settings.enabled ? "Enabled" : "Disabled"}</span>
              </label>
            </div>
            {!tokenConnected && <p className="text-xs text-amber-600 mb-3">Connect your OpenAI API key above first.</p>}
            <label className="block text-xs font-bold text-gray-600 mb-1">Model</label>
            <select value={settings.model} onChange={(e) => saveSettings({ model: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white mb-4">
              <option value="gpt-4o-mini">GPT-4o mini — fastest, cheapest</option>
              <option value="gpt-4o">GPT-4o — more capable, a bit slower</option>
            </select>
            <label className="block text-xs font-bold text-gray-600 mb-1">Which accounts should auto-reply?</label>
            <div className="space-y-1.5">
              {sessions.map((s) => (
                <label key={s._id} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={settings.enabledInstanceIds.includes(s.sessionId)} onChange={() => toggleInstanceEnabled(s.sessionId)} className="w-4 h-4 accent-rose-600" />
                  {s.label}
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-6">
            <h3 className="font-bold text-gray-800 text-sm mb-1">Train the Bot</h3>
            <p className="text-xs text-gray-500 mb-3">Describe your business, what it should answer, its tone, and when it should say it can't help and a human will follow up.</p>
            <textarea value={settings.instructions} onChange={(e) => setSettings((s) => ({ ...s, instructions: e.target.value }))} onBlur={() => saveSettings({ instructions: settings.instructions })} rows={8}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
            {saving && <p className="text-[11px] text-gray-400 mt-1">Saving…</p>}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
            <h3 className="font-bold text-gray-800 text-sm mb-1">Test Chat</h3>
            <p className="text-xs text-gray-500 mb-3">Try it here — this never touches real WhatsApp.</p>
            <div className="border border-gray-100 rounded-lg p-3 h-64 overflow-y-auto mb-3 bg-gray-50 space-y-2">
              {testHistory.length === 0 ? <p className="text-xs text-gray-400 text-center py-8">Send a message below to try it out.</p> : testHistory.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "bg-rose-100 text-gray-800" : "bg-white border border-gray-200 text-gray-700"}`}>{m.content}</div>
                </div>
              ))}
              {testing && <p className="text-xs text-gray-400">Thinking…</p>}
            </div>
            <div className="flex gap-2">
              <input value={testInput} onChange={(e) => setTestInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendTest()} placeholder="Type a message as a customer would…" disabled={!tokenConnected}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <Btn onClick={sendTest} disabled={testing || !tokenConnected}>Send</Btn>
              {testHistory.length > 0 && <Btn variant="secondary" onClick={() => setTestHistory([])}>Clear</Btn>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// API — external access key (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
function ApiFeature({ toast }) {
  const { API: api } = useAuth();
  const [apiKey, setApiKey] = useState("");
  const [generating, setGenerating] = useState(false);

  const loadKey = useCallback(() => {
    api.get("/admin/settings/whatsapp-server-key").then((res) => setApiKey(res.data?.apiKey || "")).catch(() => {});
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadKey(); }, [loadKey]);

  const generateKey = async () => {
    setGenerating(true);
    try { const res = await api.post("/admin/settings/whatsapp-server-key"); setApiKey(res.data?.apiKey || ""); toast("New API key generated", "success"); }
    catch { toast("Failed to generate key", "error"); }
    finally { setGenerating(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 max-w-lg">
      <h3 className="font-bold text-gray-800 text-sm mb-1">External API Access</h3>
      <p className="text-xs text-gray-500 mb-3">Let another app or service send through your connected accounts — no Super Admin login needed, just this key. POST to <code className="bg-gray-100 px-1 rounded">/api/whatsapp-server/external/send</code> with <code className="bg-gray-100 px-1 rounded">{"{ apiKey, sessionId, to, message }"}</code> (sessionId is the connected account's Instance ID from its Profile).</p>
      <div className="flex flex-wrap gap-2 items-center">
        <input readOnly value={apiKey || "No key generated yet"} className="flex-1 min-w-[220px] border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 font-mono" />
        <Btn variant="secondary" onClick={generateKey} disabled={generating}>{generating ? "Generating…" : apiKey ? "Regenerate" : "Generate Key"}</Btn>
      </div>
    </div>
  );
}