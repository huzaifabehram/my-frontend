// WhatsAppDashboard.jsx
// ══════════════════════════════════════════════════════════════════════════════
// Super Admin → WhatsApp — see the wiring notes in the previous version
// (import in SuperAdminsDashboard.jsx, route "whatsapp", shared UI from
// SuperAdminUI.jsx). Nothing about the wiring changed.
//
// WHAT CHANGED IN THIS VERSION:
// - Reconnect now opens the QR modal and shows a fresh QR code to scan
//   (before, it only showed a "Reconnecting…" toast and no QR at all).
// - The QR modal detects an expired QR and offers "Get a new QR".
// - FIX — QR code not rendering: the QR image now comes from the server as a
//   ready-made data: URL (`qrImage`, generated locally with the `qrcode`
//   package — see whatsapp.js). Previously the browser asked a third-party
//   service (api.qrserver.com) to draw it; if that domain was blocked or
//   unreachable, the QR silently never appeared and the account could never
//   connect. The old method is kept only as an automatic fallback.
// - The QR modal now shows a "still waiting on the server…" hint if nothing
//   has come back after 15 seconds, instead of staying silently blank.
// - Chat list/header: saved contact name if the number is saved, otherwise
//   the full number (+92…) with the person's own WhatsApp name as a small
//   "~name" hint, like WhatsApp Web.
// - Chat view opens scrolled to the newest message.
// - Clear History explains the next step (Reconnect → scan) to re-import
//   the full history.

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
              ) : feature === "chats" ? (
                <ChatsFeature toast={toast} session={selectedSession} />
              ) : feature === "profile" ? (
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
            </div>
          </div>
        </>
      )}

      {showAdd && <AddAccountModal toast={toast} onClose={() => setShowAdd(false)} onAdded={loadSessions} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD ACCOUNT / RECONNECT — QR scan flow
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
          // Preferred path: QR rendered locally by the server — no
          // dependency on a reachable third-party image service.
          setExpired(false);
          setQrImage(qrImageDataUrl);
        } else if (qr) {
          // Fallback only (e.g. the `qrcode` package isn't installed yet on
          // the server): render via an external image service.
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

// ─────────────────────────────────────────────────────────────────────────────
// CHATS — per-contact threads like WhatsApp Web: saved name if saved,
// otherwise the full number.
// ─────────────────────────────────────────────────────────────────────────────
function ChatsFeature({ toast, session }) {
  const { API: api } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [activeNumber, setActiveNumber] = useState("");
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [contactPhoto, setContactPhoto] = useState("");
  const [presence, setPresence] = useState(null);
  const [aboutText, setAboutText] = useState("");
  const [showContactInfo, setShowContactInfo] = useState(false);
  const scrollRef = useRef(null);

  const loadThreads = useCallback((silent = false) => {
    if (!silent) setLoadingThreads(true);
    api.get(`/admin/whatsapp/conversations?instanceId=${session.sessionId}`)
      .then((res) => setThreads(res.data || []))
      .catch(() => { if (!silent) toast("Failed to load conversations", "error"); })
      .finally(() => { if (!silent) setLoadingThreads(false); });
  }, [api, session]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadThreads(); setActiveNumber(""); setMessages([]); }, [loadThreads]);

  const refreshMessages = useCallback((number) => {
    if (!number) return;
    api.get(`/admin/whatsapp/conversations/${session.sessionId}/${encodeURIComponent(number)}`)
      .then((res) => setMessages(res.data?.messages || []))
      .catch(() => {});
  }, [session, api]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadThreads(true);
      if (activeNumber) refreshMessages(activeNumber);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeNumber, loadThreads, refreshMessages]);

  // Scroll to the newest message when a chat opens or a new message arrives
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, activeNumber]);

  const openThread = (number) => {
    setActiveNumber(number);
    setLoadingMessages(true);
    setContactPhoto(""); setPresence(null); setAboutText(""); setShowContactInfo(false);
    const n = encodeURIComponent(number);
    api.get(`/admin/whatsapp/conversations/${session.sessionId}/${n}`)
      .then((res) => setMessages(res.data?.messages || []))
      .catch(() => toast("Failed to load this conversation", "error"))
      .finally(() => setLoadingMessages(false));
    api.get(`/admin/whatsapp/profile-photo/${session.sessionId}/${n}`).then((res) => setContactPhoto(res.data?.url || "")).catch(() => setContactPhoto(""));
    api.get(`/admin/whatsapp/presence/${session.sessionId}/${n}`).then((res) => setPresence(res.data?.presence || null)).catch(() => setPresence(null));
    api.get(`/admin/whatsapp/about/${session.sessionId}/${n}`).then((res) => setAboutText(res.data?.status || "")).catch(() => setAboutText(""));
  };

  const sendReply = async () => {
    if (!replyText.trim() || !activeNumber) return;
    setSending(true);
    try {
      await api.post("/admin/whatsapp-server/send", { sessionDocId: session._id, to: activeNumber, message: replyText.trim() });
      setReplyText("");
      refreshMessages(activeNumber);
      loadThreads(true);
    } catch (err) { toast(err.response?.data?.message || "Send failed", "error"); }
    finally { setSending(false); }
  };

  const threadFor = (number) => threads.find((t) => t.number === number);
  const isLid = (number) => String(number || "").startsWith("lid:");
  const formatDisplayNumber = (number) => {
    if (!number) return "";
    if (isLid(number)) return `Contact (${number.slice(4, 10)}…)`;
    return `+${number}`;
  };
  // Saved name → full number → (only if WhatsApp hasn't revealed the number yet) their WhatsApp name
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
    if (presence.lastKnownPresence === "available") return "online";
    if (presence.lastSeen) return `last seen ${new Date(presence.lastSeen * 1000).toLocaleString()}`;
    return null;
  };

  if (session.status !== "connected") {
    return <EmptyState icon="💬" title="This account isn't connected" body='Go to Profile → Reconnect and scan the QR code to see its chats.' />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ minHeight: 420 }}>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden sm:col-span-1">
        {loadingThreads ? (
          <p className="text-sm text-gray-400 p-4">Loading…</p>
        ) : threads.length === 0 ? (
          <p className="text-sm text-gray-400 p-4">No conversations yet. If you just connected, chat history is still importing — it appears here automatically.</p>
        ) : (
          <div className="divide-y divide-gray-100 max-h-[560px] overflow-y-auto">
            {threads.map((t) => (
              <button key={t.number} onClick={() => openThread(t.number)}
                className={`w-full text-left p-3 cursor-pointer border-none bg-transparent flex items-center gap-2.5 ${activeNumber === t.number ? "bg-rose-50" : "hover:bg-gray-50"}`}>
                <ThreadAvatar sessionId={session.sessionId} number={t.number} api={api} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {displayLabel(t.number)}
                    {pushNameHint(t.number) && <span className="ml-1 text-[11px] font-normal text-gray-400">{pushNameHint(t.number)}</span>}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{t.lastDirection === "outgoing" ? "You: " : ""}{t.lastMessage}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{new Date(t.lastAt).toLocaleString()}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 sm:col-span-2 flex flex-col">
        {!activeNumber ? (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400 p-8 text-center">Select a conversation on the left to see the full chat.</div>
        ) : (
          <>
            <button onClick={() => setShowContactInfo(true)} className="p-3 flex items-center gap-2.5 w-full text-left bg-transparent border-0 border-b border-gray-100 cursor-pointer hover:bg-gray-50">
              {contactPhoto ? <img src={contactPhoto} alt="" className="w-9 h-9 rounded-full object-cover" /> : <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">👤</div>}
              <div>
                <p className="font-bold text-gray-900 text-sm">
                  {displayLabel(activeNumber)}
                  {pushNameHint(activeNumber) && <span className="ml-1 text-[11px] font-normal text-gray-400">{pushNameHint(activeNumber)}</span>}
                </p>
                {presenceLabel() && <p className="text-[11px] text-gray-400">{presenceLabel()}</p>}
              </div>
            </button>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[460px]">
              {loadingMessages ? <p className="text-xs text-gray-400">Loading…</p> : messages.map((m) => (
                <div key={m._id} className={`flex items-end gap-2 ${m.direction === "outgoing" ? "justify-end" : "justify-start"}`}>
                  {m.direction !== "outgoing" && (contactPhoto ? <img src={contactPhoto} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" /> : <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0" />)}
                  <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${m.direction === "outgoing" ? "bg-rose-100 text-gray-800" : "bg-gray-100 text-gray-700"}`}>
                    <p className="whitespace-pre-wrap break-words">{m.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(m.createdAt).toLocaleString()}{m.status === "failed" ? " — failed" : ""}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-100 flex gap-2">
              <input value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendReply()}
                placeholder="Type a reply…" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
              <Btn onClick={sendReply} disabled={sending}>Send</Btn>
            </div>
          </>
        )}
      </div>

      {showContactInfo && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={() => setShowContactInfo(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            {contactPhoto ? <img src={contactPhoto} alt="" className="w-40 h-40 rounded-full object-cover mx-auto mb-4" /> : <div className="w-40 h-40 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-5xl mx-auto mb-4">👤</div>}
            <p className="font-bold text-gray-900 text-lg">{displayLabel(activeNumber)}</p>
            {threadFor(activeNumber)?.name && <p className="text-sm text-gray-500">{formatDisplayNumber(activeNumber)}</p>}
            {pushNameHint(activeNumber) && <p className="text-sm text-gray-400">{pushNameHint(activeNumber)}</p>}
            {presenceLabel() && <p className="text-sm text-gray-400 mt-1">{presenceLabel()}</p>}
            {aboutText && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-left">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">About</p>
                <p className="text-sm text-gray-700">{aboutText}</p>
              </div>
            )}
            <Btn variant="secondary" onClick={() => setShowContactInfo(false)} className="mt-5">Close</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function ThreadAvatar({ sessionId, number, api }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    api.get(`/admin/whatsapp/profile-photo/${sessionId}/${encodeURIComponent(number)}`).then((res) => { if (!cancelled) setUrl(res.data?.url || ""); }).catch(() => {});
    return () => { cancelled = true; };
  }, [sessionId, number, api]);
  return url
    ? <img src={url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
    : <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">👤</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE — this account's info + connection controls
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
// BULK MESSAGING
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
// AUTORESPONDER — not built yet (honest placeholder)
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
// CHATBOT — AI auto-reply (ChatGPT), per-account
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
// API — external access key
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