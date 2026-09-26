// AutomationWorkflow.jsx
// ══════════════════════════════════════════════════════════════════════════════
// Super Admin → Automation Workflow / Contacts / Tasks / Opportunities /
// Triggers — pulled out of SuperAdminDashboard.jsx into its own file,
// together with the CRM screens that the workflow builder reads from and
// writes to (they share the same lookups — pipelines, tasks, trigger
// links — so keeping them in one file avoids passing all of that back and
// forth between files).
//
// WIRING: import what you need into SuperAdminDashboard.jsx —
//   import { AutomationWorkflowPage, AutomationWorkflowEditorPage, ContactsPage, TasksPage, OpportunitiesPage, TriggerLinksPage } from "./AutomationWorkflow";
// and route them exactly where the old inline versions were. See
// SuperAdminDashboard.jsx's own comments for the exact route table.
//
// ── WHAT CHANGED IN THIS VERSION ─────────────────────────────────────────────
// 1. WHATSAPP NUMBERS — fixed on the backend (automation.js) — any common
//    way of writing a Pakistani number now reaches the right chat. Nothing
//    to change here on the frontend.
// 2. WAIT STEP — now three fields (hours / minutes / seconds) used
//    together, instead of one amount + one unit dropdown. The duplicate-
//    send glitch itself was a backend timing bug — also fixed in
//    automation.js — not something the old UI was doing wrong.
// 3. Trigger-specific configuration (which form, which lesson, which
//    category, which trigger link) now lives in the SAME right-side panel
//    you pick the trigger from, instead of a separate gray box under the
//    canvas.
// 4. The canvas is restyled (nicer cards, a proper "← Back to Workflows"
//    button instead of a bare arrow jammed in the corner) and steps can now
//    be reordered by dragging a card up or down.
// 5. NEW "update_task" action — a workflow can move an existing task (you
//    pick it by name) to a new status when it runs.
// 6. NEW tabs: Contacts (list, filter, CSV import), Tasks (a 3-column
//    board), Opportunities (was "Pipeline" — now supports multiple named
//    pipelines, each with its own stages, and cards move between stages by
//    dragging), Triggers (a library of named, reusable trigger links).
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { StatusBadge, SectionHeader, Btn, EmptyState } from "./SuperAdminUI";

// ── Small local Modal (dialogs for creating pipelines/tasks/trigger links) ──
function Modal({ children, onClose, title, wide }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl p-5 sm:p-6 w-full shadow-2xl max-h-[85vh] overflow-y-auto ${wide ? "max-w-2xl" : "max-w-md"}`} onClick={(e) => e.stopPropagation()}>
        {title && <h3 className="font-bold text-gray-900 mb-4">{title}</h3>}
        {children}
      </div>
    </div>
  );
}

const TRIGGER_LABELS = {
  form_submitted:          "Form Submitted",
  new_sign_up:             "New Sign Up",
  enrollment_created:      "Enrollment Created (Payment Pending)",
  payment_received:        "Payment Received",
  offer_access_granted:    "Offer Access Granted",
  payment_rejected:        "Payment Rejected",
  lesson_started:          "Lesson Started",
  lesson_completed:        "Lesson Completed",
  category_started:        "Category Started",
  category_completed:      "Category Completed",
  newsletter_subscribed:   "Newsletter Subscribed",
  opportunity_created:     "Opportunity Created",
  opportunity_status_changed: "Opportunity Status Changed",
  link_clicked:            "Link Clicked (Trigger Link)",
  whatsapp_sent:           "WhatsApp Message Sent",
  customer_replied:        "Customer Replied  (needs your provider's inbound webhook — see Settings)",
};

const ACTION_LABELS = {
  create_contact:        "Create Contact",
  add_contact_tag:       "Add Contact Tag",
  remove_contact_tag:    "Remove Contact Tag",
  assign_user:           "Assign To User",
  remove_assigned_user:  "Remove Assigned User",
  add_note:              "Add to Notes",
  internal_notification: "Send Internal Notification",
  notify_student:        "Send Student Notification",
  wait:                  "Wait",
  send_whatsapp:         "Send WhatsApp Message",
  add_to_pipeline:       "Add to Opportunities",
  update_opportunity_stage: "Update Opportunity Stage",
  update_task:           "Update Task",
  webhook:               "Call Webhook",
};

const CONTEXT_FIELDS = ["studentName", "studentEmail", "courseTitle", "amount", "reason", "lectureId", "category", "name", "email", "message"];

const TRIGGER_GROUPS = [
  { label: "Signup & Access", items: ["new_sign_up", "offer_access_granted"] },
  { label: "Courses", items: ["category_started", "category_completed", "lesson_started", "lesson_completed"] },
  { label: "Payments", items: ["enrollment_created", "payment_received", "payment_rejected"] },
  { label: "Forms & Contacts", items: ["form_submitted", "newsletter_subscribed"] },
  { label: "Pipeline", items: ["opportunity_created", "opportunity_status_changed"] },
  { label: "Engagement", items: ["link_clicked", "whatsapp_sent", "customer_replied"] },
];
const ACTION_GROUPS = [
  { label: "Contact", items: ["create_contact", "add_contact_tag", "remove_contact_tag", "assign_user", "remove_assigned_user", "add_note"] },
  { label: "Notifications", items: ["internal_notification", "notify_student"] },
  { label: "Messaging", items: ["send_whatsapp"] },
  { label: "Pipeline", items: ["add_to_pipeline", "update_opportunity_stage"] },
  { label: "Tasks", items: ["update_task"] },
  { label: "Flow Control", items: ["wait"] },
  { label: "Developer", items: ["webhook"] },
];
const TRIGGER_ICONS = {
  new_sign_up: "👤", offer_access_granted: "🔓", category_started: "▦", category_completed: "▦",
  lesson_started: "✓", lesson_completed: "✓", enrollment_created: "📝", payment_received: "💳",
  payment_rejected: "❌", form_submitted: "📋", newsletter_subscribed: "✉️", opportunity_created: "📊",
  opportunity_status_changed: "📊", link_clicked: "🔗", whatsapp_sent: "💬", customer_replied: "💬",
};
const ACTION_ICONS = {
  create_contact: "👤", add_contact_tag: "🏷️", remove_contact_tag: "🏷️", assign_user: "👥",
  remove_assigned_user: "👥", add_note: "📝", internal_notification: "🔔", notify_student: "🔔",
  send_whatsapp: "💬", add_to_pipeline: "📊", update_opportunity_stage: "📊", update_task: "✅",
  wait: "⏱️", webhook: "🔌",
};

// Wraps/inserts text into a plain <textarea> at the cursor — Bold, variable
// insertion, and the [[Label|url]] tracked-link syntax the backend rewrites
// into a real clickable, click-tracked link at send time. WhatsApp text
// messages support *bold*, _italic_, ~strikethrough~, and ```monospace``` —
// real formatting WhatsApp's app renders — and nothing beyond that (no
// headings, sizing, or highlight color in a plain message), so only those
// are offered.
function RichMessageEditor({ value, onChange, rows = 4, placeholder, triggerLinks }) {
  const ref = useRef(null);
  const [showLinkPicker, setShowLinkPicker] = useState(false);
  const wrap = (before, after = before) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart, end = el.selectionEnd;
    const next = value.slice(0, start) + before + value.slice(start, end) + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + before.length, end + before.length); });
  };
  const insertAtCursor = (text) => {
    const el = ref.current;
    const start = el ? el.selectionStart : value.length;
    onChange(value.slice(0, start) + text + value.slice(start));
  };
  const insertCustomLink = () => {
    const label = window.prompt("Link text?"); if (!label) return;
    const url = window.prompt("Link URL?"); if (!url) return;
    insertAtCursor(`[[${label}|${url}]]`);
  };
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap relative">
        <button type="button" onClick={() => wrap("*")} title="Bold" className="text-xs font-extrabold border border-gray-200 rounded px-2 py-1 bg-white hover:bg-gray-50 cursor-pointer">B</button>
        <button type="button" onClick={() => wrap("_")} title="Italic" className="text-xs italic font-bold border border-gray-200 rounded px-2 py-1 bg-white hover:bg-gray-50 cursor-pointer">I</button>
        <button type="button" onClick={() => wrap("~")} title="Strikethrough" className="text-xs line-through font-bold border border-gray-200 rounded px-2 py-1 bg-white hover:bg-gray-50 cursor-pointer">S</button>
        <button type="button" onClick={() => wrap("```")} title="Monospace" className="text-xs font-mono border border-gray-200 rounded px-2 py-1 bg-white hover:bg-gray-50 cursor-pointer">{"</>"}</button>
        <select onChange={(e) => { if (e.target.value) insertAtCursor(`{{${e.target.value}}}`); e.target.value = ""; }} defaultValue=""
          className="text-xs border border-gray-200 rounded px-2 py-1 bg-white cursor-pointer">
          <option value="" disabled>Insert variable…</option>
          {CONTEXT_FIELDS.map((f) => <option key={f} value={f}>{`{{${f}}}`}</option>)}
        </select>
        <button type="button" onClick={() => setShowLinkPicker((v) => !v)} title="Insert a trigger link" className="text-xs border border-gray-200 rounded px-2 py-1 bg-white hover:bg-gray-50 cursor-pointer">🔗 Link</button>
        {showLinkPicker && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-64 py-1">
            {(triggerLinks || []).filter((l) => l.name).length === 0 ? (
              <p className="text-xs text-gray-400 px-3 py-2">No named trigger links yet — create one on the Triggers tab, or use a one-off link below.</p>
            ) : (
              (triggerLinks || []).filter((l) => l.name).map((l) => (
                <button key={l._id} type="button" onClick={() => { insertAtCursor(`[[${l.name}|${l.url}]]`); setShowLinkPicker(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 bg-transparent border-0 cursor-pointer truncate">
                  {l.name} <span className="text-gray-400">— {l.url}</span>
                </button>
              ))
            )}
            <button type="button" onClick={() => { setShowLinkPicker(false); insertCustomLink(); }} className="w-full text-left px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 bg-transparent border-0 cursor-pointer border-t border-gray-100 mt-1 pt-2">+ One-off link…</button>
          </div>
        )}
      </div>
      <textarea ref={ref} value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-500" />
    </div>
  );
}

// Shared slide-in panel shell (fixed to the right edge, dims the page
// behind it, closes on backdrop click).
function SidePanel({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[200] flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative bg-white w-full sm:w-[420px] h-full shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-start justify-between z-10">
          <div>
            <h3 className="font-bold text-gray-900">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 bg-transparent border-none cursor-pointer text-lg leading-none">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Trigger picker + scope config — ONE panel: pick a trigger, and if it
// supports scoping (which lesson / form / category / trigger link), the
// same panel shows those fields right below instead of a separate box
// under the canvas.
// ─────────────────────────────────────────────────────────────────────────────
function TriggerSidePanel({ meta, trigger, triggerScope, allCourses, forms, triggerLinks, onPick, onSaveScope, onClose }) {
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState(trigger || "");
  const [scope, setScope] = useState(triggerScope || {});

  const choose = (t) => { setPicked(t); setScope({}); };

  const scopable = ["lesson_started", "lesson_completed", "form_submitted", "category_started", "category_completed", "link_clicked"].includes(picked);

  const save = () => {
    if (picked !== trigger) onPick(picked, scope);
    else onSaveScope(scope);
    onClose();
  };

  if (!picked) {
    const groups = TRIGGER_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((t) => (meta.triggers || []).includes(t) && (TRIGGER_LABELS[t] || t).toLowerCase().includes(search.toLowerCase())),
    })).filter((g) => g.items.length > 0);
    return (
      <SidePanel title="Add New Trigger" onClose={onClose}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search triggers…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-rose-500" />
        {groups.length === 0 && <p className="text-sm text-gray-400">No triggers match "{search}".</p>}
        {groups.map((g) => (
          <div key={g.label} className="mb-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">{g.label}</p>
            <div className="space-y-1.5">
              {g.items.map((t) => (
                <button key={t} onClick={() => choose(t)} className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-700 bg-white border border-gray-100 cursor-pointer transition shadow-sm hover:shadow">
                  <span className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-base flex-shrink-0">{TRIGGER_ICONS[t] || "⚡"}</span>
                  {TRIGGER_LABELS[t] || t}
                </button>
              ))}
            </div>
          </div>
        ))}
      </SidePanel>
    );
  }

  return (
    <SidePanel title="Trigger" subtitle={TRIGGER_LABELS[picked] || picked} onClose={onClose}>
      <button onClick={() => choose("")} className="text-xs font-semibold text-gray-500 hover:text-gray-800 bg-transparent border-none cursor-pointer p-0 mb-4 flex items-center gap-1">← Change trigger</button>

      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-100 mb-5">
        <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-base flex-shrink-0">{TRIGGER_ICONS[picked] || "⚡"}</span>
        <p className="text-sm font-bold text-rose-700">{TRIGGER_LABELS[picked] || picked}</p>
      </div>

      {(picked === "lesson_started" || picked === "lesson_completed") && (
        <div className="space-y-2 mb-5">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Scope to one lesson (optional)</p>
          <select value={scope.courseId || ""} onChange={(e) => setScope({ courseId: e.target.value || undefined })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">Any course</option>
            {allCourses.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
          {scope.courseId && (
            <select value={scope.sectionId || ""} onChange={(e) => setScope((s) => ({ ...s, sectionId: e.target.value || undefined, lectureId: undefined }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">Any section</option>
              {(allCourses.find((c) => c._id === scope.courseId)?.sections || []).map((sec) => (
                <option key={sec._id} value={sec._id}>{sec.title}</option>
              ))}
            </select>
          )}
          {scope.courseId && scope.sectionId && (
            <select value={scope.lectureId || ""} onChange={(e) => setScope((s) => ({ ...s, lectureId: e.target.value || undefined }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">Any lecture in this section</option>
              {(allCourses.find((c) => c._id === scope.courseId)?.sections?.find((sec) => sec._id === scope.sectionId)?.lectures || []).map((lec) => (
                <option key={lec._id} value={lec._id}>{lec.title}</option>
              ))}
            </select>
          )}
          {(scope.courseId || scope.sectionId || scope.lectureId) && (
            <button onClick={() => setScope({})} className="text-[11px] text-gray-400 hover:text-gray-700 bg-transparent border-none cursor-pointer p-0">Clear — fire for every lesson</button>
          )}
        </div>
      )}

      {picked === "form_submitted" && (
        <div className="space-y-2 mb-5">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Scope to one form (optional)</p>
          <select value={scope.formSlug || ""} onChange={(e) => setScope({ formSlug: e.target.value || undefined })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">Any form</option>
            {forms.map((f) => <option key={f._id} value={f.slug}>{f.name}</option>)}
          </select>
        </div>
      )}

      {(picked === "category_started" || picked === "category_completed") && (
        <div className="space-y-2 mb-5">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Scope to one category (optional)</p>
          <select value={scope.category || ""} onChange={(e) => setScope({ category: e.target.value || undefined })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">Any category</option>
            {[...new Set(allCourses.map((c) => c.category).filter(Boolean))].sort().map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      )}

      {picked === "link_clicked" && (
        <div className="space-y-2 mb-5">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Scope to one trigger link (optional)</p>
          <select value={scope.trackedLinkCode || ""} onChange={(e) => setScope({ trackedLinkCode: e.target.value || undefined })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">Any link on the site</option>
            {(triggerLinks || []).map((l) => <option key={l._id} value={l.code}>{l.name || l.url}</option>)}
          </select>
          {(triggerLinks || []).length === 0 && <p className="text-[11px] text-amber-600">No trigger links created yet — go to the Triggers tab to create one.</p>}
        </div>
      )}

      <Btn onClick={save}>{scopable ? "Save Trigger" : "Use This Trigger"}</Btn>
    </SidePanel>
  );
}

// Handles both adding a brand-new step (starts on the "pick a type" list)
// and editing an existing one (opens straight into its config form).
function StepPanel({ meta, assignableUsers, tags, selfHostedSessions, tasks, initialStep, onSave, onRemove, onClose }) {
  const [stage, setStage] = useState(initialStep ? "configure" : "pick");
  const [step, setStep] = useState(initialStep || null);
  const [search, setSearch] = useState("");

  const pickType = (kind, actionType) => {
    const defaultParams = actionType === "send_whatsapp" ? { to: "{{whatsapp}}" } : {};
    setStep(kind === "condition"
      ? { type: "condition", conditionField: "courseTitle", conditionOperator: "equals", conditionValue: "" }
      : { type: "action", actionType, params: defaultParams });
    setStage("configure");
  };
  const updateStep = (patch) => setStep((s) => ({ ...s, ...patch }));
  const updateParam = (key, value) => setStep((s) => ({ ...s, params: { ...(s.params || {}), [key]: value } }));

  if (stage === "pick") {
    const conditionMatches = "if condition flow control".includes(search.toLowerCase()) || search.trim() === "";
    const groups = ACTION_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((a) => (meta.actionTypes || []).includes(a) && (ACTION_LABELS[a] || a).toLowerCase().includes(search.toLowerCase())),
    })).filter((g) => g.items.length > 0);

    return (
      <SidePanel title="Actions" subtitle="Pick an action for this step" onClose={onClose}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Action"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-rose-500" />
        {conditionMatches && (
          <div className="mb-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Flow Control</p>
            <button onClick={() => pickType("condition")} className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-700 bg-white border border-gray-100 cursor-pointer transition shadow-sm hover:shadow">
              <span className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-base flex-shrink-0">🔀</span> If / Condition
            </button>
          </div>
        )}
        {groups.map((g) => (
          <div key={g.label} className="mb-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">{g.label}</p>
            <div className="space-y-1.5">
              {g.items.map((a) => (
                <button key={a} onClick={() => pickType("action", a)} className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-700 bg-white border border-gray-100 cursor-pointer transition shadow-sm hover:shadow">
                  <span className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-base flex-shrink-0">{ACTION_ICONS[a] || "⚙️"}</span>
                  {ACTION_LABELS[a] || a}
                </button>
              ))}
            </div>
          </div>
        ))}
      </SidePanel>
    );
  }

  // stage === "configure"
  const p = step?.params || {};
  const selectedPipeline = (meta.pipelines || []).find((pl) => pl._id === p.pipelineId) || (meta.pipelines || []).find((pl) => pl.isDefault) || (meta.pipelines || [])[0];
  return (
    <SidePanel title={step.type === "condition" ? "Condition" : (ACTION_LABELS[step.actionType] || "Action")} onClose={onClose}>
      {!initialStep && (
        <button onClick={() => setStage("pick")} className="text-xs font-semibold text-gray-500 hover:text-gray-800 bg-transparent border-none cursor-pointer p-0 mb-4 flex items-center gap-1">← Change type</button>
      )}

      {step.type === "condition" ? (
        <div className="space-y-2.5">
          <select value={step.conditionField} onChange={(e) => updateStep({ conditionField: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
            {CONTEXT_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <select value={step.conditionOperator} onChange={(e) => updateStep({ conditionOperator: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="equals">equals</option>
            <option value="not_equals">not equals</option>
            <option value="contains">contains</option>
          </select>
          <input value={step.conditionValue} onChange={(e) => updateStep({ conditionValue: e.target.value })} placeholder="value" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        </div>
      ) : (
        <div className="space-y-2.5">
          {step.actionType === "create_contact" && (
            <>
              <input value={p.name || ""} onChange={(e) => updateParam("name", e.target.value)} placeholder="Name (default: {{studentName}} / {{name}})" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <input value={p.email || ""} onChange={(e) => updateParam("email", e.target.value)} placeholder="Email (default: {{studentEmail}} / {{email}})" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <p className="text-[11px] text-gray-400">A contact is matched/created by email — running this again for the same email just updates it.</p>
            </>
          )}
          {(step.actionType === "add_contact_tag" || step.actionType === "remove_contact_tag") && (
            tags?.length > 0 ? (
              <select value={p.tag || ""} onChange={(e) => updateParam("tag", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">Choose a tag…</option>
                {tags.map((t) => <option key={t._id} value={t.name}>{t.name}</option>)}
              </select>
            ) : (
              <>
                <p className="text-[11px] text-amber-600">No tags created yet — go to Super Admin → Tags → Create Tag first, or type one here.</p>
                <input value={p.tag || ""} onChange={(e) => updateParam("tag", e.target.value)} placeholder="Tag name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </>
            )
          )}
          {step.actionType === "assign_user" && (
            <select value={p.userId || ""} onChange={(e) => updateParam("userId", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">Choose a user…</option>
              {(assignableUsers || []).map((u) => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
            </select>
          )}
          {step.actionType === "add_note" && (
            <textarea value={p.text || ""} onChange={(e) => updateParam("text", e.target.value)} rows={2} placeholder="Note text — use {{studentName}}, {{courseTitle}}, etc." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
          )}
          {step.actionType === "internal_notification" && (
            <textarea value={p.message || ""} onChange={(e) => updateParam("message", e.target.value)} rows={2} placeholder="Message shown to your admin team" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
          )}
          {step.actionType === "notify_student" && (
            <>
              <input value={p.title || ""} onChange={(e) => updateParam("title", e.target.value)} placeholder="Notification title" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <textarea value={p.message || ""} onChange={(e) => updateParam("message", e.target.value)} rows={2} placeholder="Message — use {{studentName}}, {{courseTitle}}, etc." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
            </>
          )}
          {step.actionType === "wait" && (
            <>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Wait for</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <input type="number" min="0" value={p.hours ?? ""} onChange={(e) => updateParam("hours", e.target.value)} placeholder="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-center" />
                  <p className="text-[10px] text-gray-400 text-center mt-1">hours</p>
                </div>
                <div>
                  <input type="number" min="0" value={p.minutes ?? ""} onChange={(e) => updateParam("minutes", e.target.value)} placeholder="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-center" />
                  <p className="text-[10px] text-gray-400 text-center mt-1">minutes</p>
                </div>
                <div>
                  <input type="number" min="0" value={p.seconds ?? ""} onChange={(e) => updateParam("seconds", e.target.value)} placeholder="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-center" />
                  <p className="text-[10px] text-gray-400 text-center mt-1">seconds</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">All three combine — e.g. 1 hour + 30 minutes waits 90 minutes total.</p>
            </>
          )}
          {step.actionType === "send_whatsapp" && (
            <>
              {selfHostedSessions?.length > 0 ? (
                <>
                  <select value={p.selfHostedSessionId || ""} onChange={(e) => updateParam("selfHostedSessionId", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="">Choose a connected number…</option>
                    {selfHostedSessions.map((s) => (
                      <option key={s._id} value={s._id} disabled={s.status !== "connected"}>{s.label} {s.status !== "connected" ? "(not connected)" : ""}</option>
                    ))}
                  </select>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">To — leave as {"{{whatsapp}}"} to auto-fill from the form/trigger; any Pakistani format works (03xx…, 92xx…, +92xx…)</label>
                    <input value={p.to || ""} onChange={(e) => updateParam("to", e.target.value)} placeholder="{{whatsapp}}" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
                  </div>
                  <RichMessageEditor value={p.message || ""} onChange={(v) => updateParam("message", v)} rows={4} placeholder="WhatsApp message…" triggerLinks={meta.triggerLinks} />
                </>
              ) : (
                <>
                  <p className="text-[11px] text-amber-600">No WhatsApp numbers connected yet — go to Super Admin → WhatsApp → Self-Hosted Server to add one, or this will fall back to the single Meta Cloud API connection in Settings if that's set up.</p>
                  <input value={p.to || ""} onChange={(e) => updateParam("to", e.target.value)} placeholder="To (default: {{whatsapp}})" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  <RichMessageEditor value={p.message || ""} onChange={(v) => updateParam("message", v)} rows={4} placeholder="WhatsApp message…" triggerLinks={meta.triggerLinks} />
                </>
              )}
            </>
          )}
          {step.actionType === "add_to_pipeline" && (
            <>
              <select value={p.pipelineId || selectedPipeline?._id || ""} onChange={(e) => updateParam("pipelineId", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                {(meta.pipelines || []).map((pl) => <option key={pl._id} value={pl._id}>{pl.name}{pl.isDefault ? " (default)" : ""}</option>)}
              </select>
              <select value={p.stage || ""} onChange={(e) => updateParam("stage", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">First stage (default)</option>
                {(((meta.pipelines || []).find((pl) => pl._id === (p.pipelineId || selectedPipeline?._id)))?.stages || []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input value={p.title || ""} onChange={(e) => updateParam("title", e.target.value)} placeholder="Opportunity title (default: course title)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <input type="number" value={p.value || ""} onChange={(e) => updateParam("value", e.target.value)} placeholder="Value (PKR, optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </>
          )}
          {step.actionType === "update_opportunity_stage" && (
            <>
              <select value={p.pipelineId || ""} onChange={(e) => updateParam("pipelineId", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">Any pipeline the contact is in</option>
                {(meta.pipelines || []).map((pl) => <option key={pl._id} value={pl._id}>{pl.name}</option>)}
              </select>
              <select value={p.stage || ""} onChange={(e) => updateParam("stage", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">Choose a stage…</option>
                {((meta.pipelines || []).find((pl) => pl._id === p.pipelineId)?.stages || (meta.pipelines || []).flatMap((pl) => pl.stages)).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </>
          )}
          {step.actionType === "update_task" && (
            tasks?.length > 0 ? (
              <>
                <select value={p.taskId || ""} onChange={(e) => updateParam("taskId", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">Choose a task…</option>
                  {tasks.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
                </select>
                <select value={p.status || "done"} onChange={(e) => updateParam("status", e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </>
            ) : (
              <p className="text-[11px] text-amber-600">No tasks created yet — go to the Tasks tab to create one first.</p>
            )
          )}
          {step.actionType === "webhook" && (
            <input value={p.url || ""} onChange={(e) => updateParam("url", e.target.value)} placeholder="https://…  (Zapier / Make / n8n / your own endpoint)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          )}
        </div>
      )}

      <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
        <Btn onClick={() => onSave(step)}>Save</Btn>
        {initialStep && <Btn variant="danger" onClick={onRemove}>Remove Step</Btn>}
      </div>
    </SidePanel>
  );
}

// ── Visual canvas primitives ────────────────────────────────────────────────
function Connector() { return <div className="w-0.5 h-6 bg-gray-300" />; }
function PlusButton({ onClick, title }) {
  return (
    <button onClick={onClick} title={title || "Add a step"} className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 hover:border-rose-400 hover:text-rose-500 hover:ring-4 hover:ring-rose-50 text-gray-400 flex items-center justify-center text-sm font-bold cursor-pointer transition shadow-sm">+</button>
  );
}
// NEW: draggable — grab the ⠿ handle to reorder steps by dropping on
// another step card.
function NodeCard({ icon, label, sublabel, onClick, onRemove, variant, draggableProps }) {
  return (
    <div className={`relative group ${draggableProps?.isDragOver ? "ring-2 ring-rose-400 rounded-xl" : ""}`}
      onDragOver={draggableProps?.onDragOver} onDrop={draggableProps?.onDrop} onDragLeave={draggableProps?.onDragLeave}>
      <div className={`flex items-center gap-1 rounded-xl border-2 bg-white shadow-sm hover:shadow-md transition min-w-[270px] max-w-[330px] ${variant === "trigger" ? "border-rose-200" : "border-gray-200"}`}>
        {draggableProps && (
          <span draggable onDragStart={draggableProps.onDragStart} onDragEnd={draggableProps.onDragEnd}
            title="Drag to reorder" className="pl-2 pr-1 py-3 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing select-none">⠿</span>
        )}
        <button onClick={onClick} className={`flex items-center gap-3 py-3 text-left flex-1 min-w-0 bg-transparent border-0 cursor-pointer ${draggableProps ? "pr-4" : "px-4"}`}>
          <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${variant === "trigger" ? "bg-rose-50" : "bg-gray-50"}`}>{icon}</span>
          <div className="min-w-0">
            {sublabel && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{sublabel}</p>}
            <p className="text-sm font-bold text-gray-900 truncate">{label}</p>
          </div>
        </button>
      </div>
      {onRemove && (
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} title="Remove step" className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white border border-gray-300 text-gray-400 hover:text-red-500 hover:border-red-300 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition cursor-pointer">✕</button>
      )}
    </div>
  );
}

function AutomationWorkflowListPage({ toast, navigate }) {
  const { API: api } = useAuth();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get("/admin/workflows").then((res) => setWorkflows(res.data || [])).catch(() => toast("Failed to load workflows", "error")).finally(() => setLoading(false));
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const togglePublished = async (wf) => {
    try {
      const res = await api.put(`/admin/workflows/${wf._id}`, { published: !wf.published });
      setWorkflows((prev) => prev.map((w) => (w._id === wf._id ? res.data : w)));
    } catch { toast("Failed to update workflow", "error"); }
  };

  const deleteWorkflow = async (wf) => {
    if (!window.confirm(`Delete "${wf.name}"? This can't be undone.`)) return;
    try {
      await api.delete(`/admin/workflows/${wf._id}`);
      setWorkflows((prev) => prev.filter((w) => w._id !== wf._id));
      toast("Workflow deleted", "success");
    } catch { toast("Failed to delete workflow", "error"); }
  };

  return (
    <div>
      <SectionHeader title="Automation Workflow" action={<Btn onClick={() => navigate("/superadmin/automation/new")}>+ New Workflow</Btn>} />
      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : workflows.length === 0 ? (
        <EmptyState icon="⚡" title="No workflows yet"
          body="Create your first automation — pick a trigger, then add the actions that should run when it fires."
          action={<Btn onClick={() => navigate("/superadmin/automation/new")}>+ New Workflow</Btn>} />
      ) : (
        <div className="space-y-3">
          {workflows.map((wf) => (
            <div key={wf._id} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-sm">
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/superadmin/automation/${wf._id}`)}>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-gray-900">{wf.name}</p>
                  <StatusBadge status={wf.published ? "active" : "draft"} />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Trigger: {TRIGGER_LABELS[wf.trigger] || wf.trigger} • {wf.steps?.length || 0} step{(wf.steps?.length || 0) === 1 ? "" : "s"} • Ran {wf.runCount || 0} time{(wf.runCount || 0) === 1 ? "" : "s"}
                  {wf.lastRunAt ? ` • last ${new Date(wf.lastRunAt).toLocaleString()}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Btn variant="secondary" size="sm" onClick={() => togglePublished(wf)}>{wf.published ? "Unpublish" : "Publish"}</Btn>
                <Btn variant="secondary" size="sm" onClick={() => navigate(`/superadmin/automation/${wf._id}`)}>Open</Btn>
                <Btn variant="danger" size="sm" onClick={() => deleteWorkflow(wf)}>Delete</Btn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Full dedicated page — /superadmin/automation/new or /superadmin/automation/:id
function AutomationWorkflowEditorPage({ toast, navigate, workflowId }) {
  const { API: api } = useAuth();
  const isNew = workflowId === "new";
  const [loaded, setLoaded] = useState(isNew);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("");
  const [published, setPublished] = useState(false);
  const [steps, setSteps] = useState([]);
  const [runCount, setRunCount] = useState(0);
  const [lastRunAt, setLastRunAt] = useState(null);
  const [meta, setMeta] = useState({ triggers: [], actionTypes: [], whatsappConfigured: false, pipelines: [] });
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showTriggerPicker, setShowTriggerPicker] = useState(false);
  const [insertAt, setInsertAt] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [runs, setRuns] = useState([]);
  const [runsLoading, setRunsLoading] = useState(false);
  const [triggerScope, setTriggerScope] = useState({});
  const [allCourses, setAllCourses] = useState([]);
  const [forms, setForms] = useState([]);
  const [tags, setTags] = useState([]);
  const [selfHostedSessions, setSelfHostedSessions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [triggerLinks, setTriggerLinks] = useState([]);

  // Drag-to-reorder state for the step cards.
  const dragIndexRef = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/admin/workflows/meta"), api.get("/admin/assignable-users"), api.get("/admin/courses"),
      api.get("/admin/forms"), api.get("/admin/tags"), api.get("/admin/whatsapp-server/sessions").catch(() => ({ data: [] })),
      api.get("/admin/tasks").catch(() => ({ data: [] })), api.get("/admin/trigger-links").catch(() => ({ data: [] })),
    ])
      .then(([mRes, uRes, cRes, fRes, tRes, sRes, taskRes, linkRes]) => {
        setMeta({ ...(mRes.data || {}), triggerLinks: linkRes.data || [] });
        setAssignableUsers(uRes.data || []); setAllCourses(cRes.data || []); setForms(fRes.data || []);
        setTags(tRes.data || []); setSelfHostedSessions(sRes.data || []); setTasks(taskRes.data || []);
        setTriggerLinks(linkRes.data || []);
      })
      .catch(() => {});
  }, [api]);

  useEffect(() => {
    if (isNew) return;
    api.get(`/admin/workflows/${workflowId}`)
      .then((res) => {
        const wf = res.data;
        setName(wf.name); setTrigger(wf.trigger); setPublished(!!wf.published);
        setSteps(wf.steps?.map((s) => ({ ...s, params: { ...(s.params || {}) } })) || []);
        setTriggerScope(wf.triggerScope || {});
        setRunCount(wf.runCount || 0); setLastRunAt(wf.lastRunAt);
      })
      .catch(() => toast("Failed to load workflow", "error"))
      .finally(() => setLoaded(true));
  }, [workflowId, isNew]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadRuns = useCallback(() => {
    if (isNew) return;
    setRunsLoading(true);
    api.get(`/admin/workflows/${workflowId}/runs`).then((res) => setRuns(res.data || [])).catch(() => {}).finally(() => setRunsLoading(false));
  }, [api, workflowId, isNew]);
  useEffect(() => { loadRuns(); }, [loadRuns]);

  const removeStep = (i) => setSteps((prev) => prev.filter((_, idx) => idx !== i));

  const saveStepFromPanel = (step) => {
    if (insertAt !== null) {
      setSteps((prev) => [...prev.slice(0, insertAt), step, ...prev.slice(insertAt)]);
      setInsertAt(null);
    } else if (editIndex !== null) {
      setSteps((prev) => prev.map((s, idx) => (idx === editIndex ? step : s)));
      setEditIndex(null);
    }
  };

  const reorderSteps = (fromIdx, toIdx) => {
    if (fromIdx === null || fromIdx === toIdx) return;
    setSteps((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(fromIdx < toIdx ? toIdx - 1 : toIdx, 0, moved);
      return next;
    });
  };

  const save = async (publishOverride) => {
    if (!name.trim()) { toast("Name is required", "error"); return; }
    if (!trigger) { toast("Choose a trigger first", "error"); return; }
    setSaving(true);
    try {
      const payload = { name: name.trim(), trigger, steps, triggerScope, published: publishOverride !== undefined ? publishOverride : published };
      const res = isNew ? await api.post("/admin/workflows", payload) : await api.put(`/admin/workflows/${workflowId}`, payload);
      setPublished(res.data.published);
      toast("Workflow saved", "success");
      if (isNew) navigate(`/superadmin/automation/${res.data._id}`);
    } catch (err) {
      toast(err.response?.data?.message || "Failed to save workflow", "error");
    } finally {
      setSaving(false);
    }
  };

  const testRun = async () => {
    if (isNew) { toast("Save the workflow first", "error"); return; }
    try {
      await api.post(`/admin/workflows/${workflowId}/test`);
      toast("Test run completed — see History below", "success");
      loadRuns();
    } catch (err) { toast(err.response?.data?.message || "Test run failed", "error"); }
  };

  if (!loaded) return <p className="text-sm text-gray-400 p-6">Loading…</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0 py-4 sm:py-0">
      {/* NEW: a proper toolbar-style header instead of a bare arrow jammed
          in the corner — spaced away from the edge, with a labeled,
          hoverable Back button. */}
      <div className="flex items-center justify-between gap-3 mb-6 bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate("/superadmin/automation")}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg px-2.5 py-1.5 bg-transparent border-none cursor-pointer transition flex-shrink-0">
            <span className="text-base leading-none">←</span> Back
          </button>
          <div className="w-px h-6 bg-gray-200 flex-shrink-0" />
          <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">{isNew ? "New Workflow" : (name || "Edit Workflow")}</h2>
          {!isNew && <StatusBadge status={published ? "active" : "draft"} />}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 mb-5">
        <label className="block text-xs font-bold text-gray-600 mb-1">Workflow Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Welcome new students"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" />
      </div>

      {/* Canvas — trigger node, then each condition/action as its own
          connected, draggable node, with a "+" between every pair. */}
      <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-100 py-10 px-4 mb-5 flex flex-col items-center overflow-x-auto">
        {trigger ? (
          <NodeCard icon={TRIGGER_ICONS[trigger] || "⚡"} label={TRIGGER_LABELS[trigger] || trigger} sublabel="Trigger" variant="trigger" onClick={() => setShowTriggerPicker(true)} />
        ) : (
          <button onClick={() => setShowTriggerPicker(true)} className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-dashed border-rose-300 text-rose-500 hover:bg-rose-50 bg-white cursor-pointer font-semibold text-sm transition">
            + Add New Trigger
          </button>
        )}

        {trigger && (
          <>
            <Connector />
            <PlusButton onClick={() => setInsertAt(0)} title="Add a step" />
            {steps.map((step, i) => (
              <React.Fragment key={i}>
                <Connector />
                <NodeCard
                  icon={step.type === "condition" ? "🔀" : (ACTION_ICONS[step.actionType] || "⚙️")}
                  label={step.type === "condition" ? `If ${step.conditionField} ${step.conditionOperator} "${step.conditionValue}"` : (ACTION_LABELS[step.actionType] || step.actionType)}
                  sublabel={step.type === "condition" ? "Condition" : "Action"}
                  onClick={() => setEditIndex(i)}
                  onRemove={() => removeStep(i)}
                  draggableProps={{
                    isDragOver: dragOverIndex === i,
                    onDragStart: () => { dragIndexRef.current = i; },
                    onDragEnd: () => { dragIndexRef.current = null; setDragOverIndex(null); },
                    onDragOver: (e) => { e.preventDefault(); setDragOverIndex(i); },
                    onDragLeave: () => setDragOverIndex((cur) => (cur === i ? null : cur)),
                    onDrop: (e) => { e.preventDefault(); reorderSteps(dragIndexRef.current, i); dragIndexRef.current = null; setDragOverIndex(null); },
                  }}
                />
                <Connector />
                <PlusButton onClick={() => setInsertAt(i + 1)} title="Add a step" />
              </React.Fragment>
            ))}
            <Connector />
            <div className="px-4 py-2 rounded-full bg-gray-800 text-white text-xs font-bold tracking-wide">END</div>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-8">
        <Btn onClick={() => save()} disabled={saving}>{saving ? "Saving…" : "Save"}</Btn>
        {!isNew && (
          <>
            <Btn variant={published ? "secondary" : "success"} onClick={() => save(!published)} disabled={saving}>{published ? "Unpublish" : "Publish"}</Btn>
            <Btn variant="secondary" onClick={testRun}>Test Run</Btn>
          </>
        )}
        <span className="text-xs text-gray-400 ml-1">{!isNew && `Ran ${runCount} time${runCount === 1 ? "" : "s"}${lastRunAt ? ` • last ${new Date(lastRunAt).toLocaleString()}` : ""}`}</span>
      </div>

      {!isNew && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5">
          <h3 className="font-bold text-gray-900 text-sm mb-3">Run History</h3>
          {runsLoading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : runs.length === 0 ? (
            <p className="text-sm text-gray-400">No runs yet.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {runs.map((r) => (
                <div key={r._id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <StatusBadge status={r.status === "success" ? "verified" : r.status === "failed" ? "rejected" : r.status === "waiting" ? "pending" : "draft"} />
                    <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                  {r.summary && <p className="text-xs font-semibold text-gray-700 mb-1">{r.summary}</p>}
                  <ul className="text-xs text-gray-500 space-y-0.5">
                    {(r.log || []).map((line, i) => <li key={i}>• {line}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showTriggerPicker && (
        <TriggerSidePanel
          meta={meta} trigger={trigger} triggerScope={triggerScope}
          allCourses={allCourses} forms={forms} triggerLinks={triggerLinks}
          onPick={(t, scope) => { setTrigger(t); setTriggerScope(scope || {}); }}
          onSaveScope={(scope) => setTriggerScope(scope || {})}
          onClose={() => setShowTriggerPicker(false)}
        />
      )}

      {(insertAt !== null || editIndex !== null) && (
        <StepPanel
          meta={meta}
          assignableUsers={assignableUsers}
          tags={tags}
          selfHostedSessions={selfHostedSessions}
          tasks={tasks}
          initialStep={editIndex !== null ? steps[editIndex] : null}
          onSave={saveStepFromPanel}
          onRemove={() => { removeStep(editIndex); setEditIndex(null); }}
          onClose={() => { setInsertAt(null); setEditIndex(null); }}
        />
      )}
    </div>
  );
}

export function AutomationWorkflowPage({ toast }) {
  const navigate = useNavigate();
  const { id } = useParams();
  return id
    ? <AutomationWorkflowEditorPage toast={toast} navigate={navigate} workflowId={id} />
    : <AutomationWorkflowListPage toast={toast} navigate={navigate} />;
}
export { AutomationWorkflowEditorPage };

// ─────────────────────────────────────────────────────────────────────────────
// CONTACTS — every contact, whether created by hand, by a workflow's
// "Create Contact" action, or automatically from a real form submission
// (Enrollment, Package Inquiry, Contact Us). Filter by tag / task / address
// / name; import a list from a CSV file (Excel: File → Save As → CSV).
// ─────────────────────────────────────────────────────────────────────────────
export function ContactsPage({ toast }) {
  const { API: api } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ name: "", address: "", tag: "", task: "" });
  const [noteDrafts, setNoteDrafts] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileRef = useRef(null);

  const load = useCallback((activeFilters) => {
    setLoading(true);
    const params = {};
    Object.entries(activeFilters || filters).forEach(([k, v]) => { if (v) params[k] = v; });
    api.get("/admin/contacts", { params })
      .then((res) => setContacts(res.data || []))
      .catch(() => toast("Failed to load contacts", "error"))
      .finally(() => setLoading(false));
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load({}); }, [load]);
  useEffect(() => {
    api.get("/admin/assignable-users").then((res) => setAssignableUsers(res.data || [])).catch(() => {});
    api.get("/admin/tags").then((res) => setTags(res.data || [])).catch(() => {});
  }, [api]);

  const applyFilters = () => load(filters);
  const clearFilters = () => { const empty = { name: "", address: "", tag: "", task: "" }; setFilters(empty); load(empty); };
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const assignContact = async (contact, userId) => {
    try {
      const res = await api.patch(`/admin/contacts/${contact._id}/assign`, { userId: userId || null });
      setContacts((prev) => prev.map((c) => (c._id === contact._id ? res.data : c)));
    } catch { toast("Failed to assign", "error"); }
  };

  const addNote = async (contact) => {
    const text = (noteDrafts[contact._id] || "").trim();
    if (!text) return;
    try {
      const res = await api.post(`/admin/contacts/${contact._id}/notes`, { text });
      setContacts((prev) => prev.map((c) => (c._id === contact._id ? res.data : c)));
      setNoteDrafts((prev) => ({ ...prev, [contact._id]: "" }));
    } catch { toast("Failed to add note", "error"); }
  };

  const exportCsv = () => {
    const url = `${api.defaults.baseURL}/admin/contacts/export.csv`;
    const token = localStorage.getItem("token");
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "contacts.csv";
        link.click();
      })
      .catch(() => toast("Export failed", "error"));
  };

  const importFile = async (file) => {
    if (!file) return;
    setImporting(true); setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/admin/contacts/import", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setImportResult(res.data);
      toast(`Imported ${res.data.imported} contact${res.data.imported === 1 ? "" : "s"}`, "success");
      load(filters);
    } catch (err) {
      toast(err.response?.data?.message || "Import failed", "error");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div>
      <SectionHeader title="Contacts" action={
        <div className="flex gap-2">
          <Btn variant="secondary" size="sm" onClick={() => setShowFilters((v) => !v)}>
            Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </Btn>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => importFile(e.target.files?.[0])} />
          <Btn variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={importing}>{importing ? "Importing…" : "Import CSV"}</Btn>
          <Btn variant="secondary" size="sm" onClick={exportCsv}>Export CSV</Btn>
        </div>
      } />
      <p className="text-xs text-gray-400 -mt-3 mb-4">Excel opens and saves .csv files natively, so "Import CSV" also covers Excel sheets — just save as CSV first.</p>

      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input value={filters.name} onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))} placeholder="Name contains…" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <input value={filters.address} onChange={(e) => setFilters((f) => ({ ...f, address: e.target.value }))} placeholder="Address contains…" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <select value={filters.tag} onChange={(e) => setFilters((f) => ({ ...f, tag: e.target.value }))} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
            <option value="">Any tag</option>
            {tags.map((t) => <option key={t._id} value={t.name}>{t.name}</option>)}
          </select>
          <input value={filters.task} onChange={(e) => setFilters((f) => ({ ...f, task: e.target.value }))} placeholder="Linked task contains…" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          <div className="sm:col-span-4 flex gap-2">
            <Btn size="sm" onClick={applyFilters}>Apply</Btn>
            <Btn size="sm" variant="secondary" onClick={clearFilters}>Clear</Btn>
          </div>
        </div>
      )}

      {importResult && (
        <div className={`rounded-lg p-3 text-xs mb-4 ${importResult.skipped > 0 ? "bg-amber-50 text-amber-700" : "bg-green-50 text-green-700"}`}>
          <p className="font-bold mb-1">Imported {importResult.imported}, skipped {importResult.skipped}.</p>
          {importResult.errors?.length > 0 && <ul className="space-y-0.5">{importResult.errors.map((e, i) => <li key={i}>• {e}</li>)}</ul>}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : contacts.length === 0 ? (
        <EmptyState icon="👤" title="No contacts yet" body="Contacts appear here automatically from real form submissions, or add a workflow's Create Contact action, or import a CSV." />
      ) : (
        <div className="space-y-3">
          {contacts.map((c) => (
            <div key={c._id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-bold text-gray-900">{c.name || "(no name)"}</p>
                  <p className="text-xs text-gray-500">{c.email} {c.phone ? `• ${c.phone}` : ""}</p>
                  {c.address && <p className="text-xs text-gray-400 mt-0.5">📍 {c.address}</p>}
                  {c.source && <p className="text-[11px] text-gray-400 mt-0.5">Source: {c.source}</p>}
                </div>
                <select value={c.assignedTo?._id || ""} onChange={(e) => assignContact(c, e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
                  <option value="">Unassigned</option>
                  {assignableUsers.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                </select>
              </div>
              {c.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {c.tags.map((t) => <span key={t} className="text-[10px] font-semibold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">{t}</span>)}
                </div>
              )}
              {c.notes?.length > 0 && (
                <div className="space-y-1 mb-2">
                  {c.notes.map((n, i) => <p key={i} className="text-xs text-gray-500">• {n.text}</p>)}
                </div>
              )}
              <div className="flex gap-2">
                <input value={noteDrafts[c._id] || ""} onChange={(e) => setNoteDrafts((p) => ({ ...p, [c._id]: e.target.value }))}
                  placeholder="Add a note…" className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5" />
                <Btn size="sm" variant="secondary" onClick={() => addNote(c)}>Add</Btn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TASKS — a simple 3-column board (To Do / In Progress / Done). Drag a card
// to a different column to change its status; the same status change is
// also what the "Update Task" workflow action does.
// ─────────────────────────────────────────────────────────────────────────────
const TASK_COLUMNS = [
  { key: "todo", label: "To Do", color: "bg-gray-100 text-gray-600" },
  { key: "in_progress", label: "In Progress", color: "bg-amber-100 text-amber-700" },
  { key: "done", label: "Done", color: "bg-green-100 text-green-700" },
];

export function TasksPage({ toast }) {
  const { API: api } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [dragOverCol, setDragOverCol] = useState(null);
  const dragTaskRef = useRef(null);
  const [form, setForm] = useState({ title: "", description: "", dueDate: "", assignedTo: "", contact: "" });

  const load = useCallback(() => {
    setLoading(true);
    api.get("/admin/tasks").then((res) => setTasks(res.data || [])).catch(() => toast("Failed to load tasks", "error")).finally(() => setLoading(false));
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get("/admin/contacts").then((res) => setContacts(res.data || [])).catch(() => {});
    api.get("/admin/assignable-users").then((res) => setAssignableUsers(res.data || [])).catch(() => {});
  }, [api]);

  const createTask = async () => {
    if (!form.title.trim()) { toast("Title is required", "error"); return; }
    try {
      await api.post("/admin/tasks", {
        title: form.title.trim(), description: form.description, dueDate: form.dueDate || null,
        assignedTo: form.assignedTo || null, contact: form.contact || null,
      });
      toast("Task created", "success");
      setShowCreate(false);
      setForm({ title: "", description: "", dueDate: "", assignedTo: "", contact: "" });
      load();
    } catch (err) { toast(err.response?.data?.message || "Failed to create task", "error"); }
  };

  const changeStatus = async (task, status) => {
    if (task.status === status) return;
    setTasks((prev) => prev.map((t) => (t._id === task._id ? { ...t, status } : t))); // optimistic
    try { await api.put(`/admin/tasks/${task._id}`, { status }); }
    catch { toast("Failed to update task", "error"); load(); }
  };

  const deleteTask = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try { await api.delete(`/admin/tasks/${task._id}`); setTasks((prev) => prev.filter((t) => t._id !== task._id)); }
    catch { toast("Failed to delete task", "error"); }
  };

  return (
    <div>
      <SectionHeader title="Tasks" action={<Btn onClick={() => setShowCreate(true)}>+ New Task</Btn>} />
      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : tasks.length === 0 ? (
        <EmptyState icon="✅" title="No tasks yet" body="Create a task, then reference it from an Automation Workflow's Update Task action." action={<Btn onClick={() => setShowCreate(true)}>+ New Task</Btn>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TASK_COLUMNS.map((col) => (
            <div key={col.key}
              onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.key); }}
              onDragLeave={() => setDragOverCol((c) => (c === col.key ? null : c))}
              onDrop={(e) => { e.preventDefault(); const t = dragTaskRef.current; setDragOverCol(null); if (t) changeStatus(t, col.key); }}
              className={`rounded-xl border-2 p-3 min-h-[160px] transition ${dragOverCol === col.key ? "border-rose-300 bg-rose-50/40" : "border-transparent bg-gray-50"}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${col.color}`}>{col.label}</span>
                <span className="text-xs text-gray-400">{tasks.filter((t) => t.status === col.key).length}</span>
              </div>
              <div className="space-y-2">
                {tasks.filter((t) => t.status === col.key).map((t) => (
                  <div key={t._id} draggable onDragStart={() => { dragTaskRef.current = t; }} onDragEnd={() => { dragTaskRef.current = null; }}
                    className="bg-white rounded-lg border border-gray-100 shadow-sm p-3 cursor-grab active:cursor-grabbing group relative">
                    <button onClick={() => deleteTask(t)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 bg-transparent border-none cursor-pointer text-xs opacity-0 group-hover:opacity-100 transition">✕</button>
                    <p className="text-sm font-semibold text-gray-900 pr-4">{t.title}</p>
                    {t.description && <p className="text-xs text-gray-500 mt-1">{t.description}</p>}
                    <div className="flex flex-wrap gap-2 mt-2 text-[11px] text-gray-400">
                      {t.contact?.name && <span>👤 {t.contact.name}</span>}
                      {t.assignedTo?.name && <span>→ {t.assignedTo.name}</span>}
                      {t.dueDate && <span>📅 {new Date(t.dueDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="New Task" onClose={() => setShowCreate(false)}>
          <div className="space-y-3">
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Task title" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Description (optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" />
            <input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <select value={form.assignedTo} onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">Unassigned</option>
              {assignableUsers.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
            <select value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">No linked contact</option>
              {contacts.map((c) => <option key={c._id} value={c._id}>{c.name || c.email}</option>)}
            </select>
            <Btn onClick={createTask}>Create Task</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OPPORTUNITIES (was "Pipeline") — now supports multiple named pipelines,
// each with its own stage list, chosen with a switcher at the top. Moving a
// card between stages is drag-and-drop.
// ─────────────────────────────────────────────────────────────────────────────
export function OpportunitiesPage({ toast }) {
  const { API: api } = useAuth();
  const [pipelines, setPipelines] = useState([]);
  const [activePipelineId, setActivePipelineId] = useState("");
  const [opportunities, setOpportunities] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePipeline, setShowCreatePipeline] = useState(false);
  const [pipelineForm, setPipelineForm] = useState({ name: "", stages: ["New Lead", "Contacted", "Qualified", "Customer"] });
  const [showAddOpp, setShowAddOpp] = useState(false);
  const [oppForm, setOppForm] = useState({ contactId: "", title: "", value: "" });
  const [dragOverStage, setDragOverStage] = useState(null);
  const dragOppRef = useRef(null);

  const loadPipelines = useCallback(() => {
    api.get("/admin/pipelines").then((res) => {
      setPipelines(res.data || []);
      setActivePipelineId((cur) => cur || res.data?.[0]?._id || "");
    }).catch(() => toast("Failed to load pipelines", "error"));
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadOpportunities = useCallback((pipelineId) => {
    if (!pipelineId) { setOpportunities([]); return; }
    setLoading(true);
    api.get("/admin/opportunities", { params: { pipelineId } }).then((res) => setOpportunities(res.data || [])).catch(() => toast("Failed to load opportunities", "error")).finally(() => setLoading(false));
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadPipelines(); api.get("/admin/contacts").then((res) => setContacts(res.data || [])).catch(() => {}); }, [loadPipelines]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadOpportunities(activePipelineId); }, [activePipelineId, loadOpportunities]);

  const activePipeline = pipelines.find((p) => p._id === activePipelineId);

  const createPipeline = async () => {
    if (!pipelineForm.name.trim()) { toast("Pipeline name is required", "error"); return; }
    const cleanStages = pipelineForm.stages.map((s) => s.trim()).filter(Boolean);
    if (cleanStages.length === 0) { toast("Add at least one stage", "error"); return; }
    try {
      const res = await api.post("/admin/pipelines", { name: pipelineForm.name.trim(), stages: cleanStages });
      setPipelines((prev) => [...prev, res.data]);
      setActivePipelineId(res.data._id);
      setShowCreatePipeline(false);
      setPipelineForm({ name: "", stages: ["New Lead", "Contacted", "Qualified", "Customer"] });
      toast("Pipeline created", "success");
    } catch (err) { toast(err.response?.data?.message || "Failed to create pipeline", "error"); }
  };

  const addOpportunity = async () => {
    if (!oppForm.contactId) { toast("Choose a contact", "error"); return; }
    try {
      await api.post("/admin/opportunities", { contactId: oppForm.contactId, pipelineId: activePipelineId, title: oppForm.title, value: Number(oppForm.value) || 0 });
      setShowAddOpp(false); setOppForm({ contactId: "", title: "", value: "" });
      loadOpportunities(activePipelineId);
    } catch (err) { toast(err.response?.data?.message || "Failed to add opportunity", "error"); }
  };

  const moveStage = async (opp, stage) => {
    if (opp.stage === stage) return;
    setOpportunities((prev) => prev.map((o) => (o._id === opp._id ? { ...o, stage } : o))); // optimistic
    try { await api.patch(`/admin/opportunities/${opp._id}/stage`, { stage }); }
    catch { toast("Failed to move card", "error"); loadOpportunities(activePipelineId); }
  };

  const deleteOpportunity = async (opp) => {
    if (!window.confirm("Remove this opportunity?")) return;
    try { await api.delete(`/admin/opportunities/${opp._id}`); setOpportunities((prev) => prev.filter((o) => o._id !== opp._id)); }
    catch { toast("Failed to delete", "error"); }
  };

  return (
    <div>
      <SectionHeader title="Opportunities" action={<Btn onClick={() => setShowCreatePipeline(true)}>+ Create Pipeline</Btn>} />

      {pipelines.length === 0 ? (
        <EmptyState icon="📊" title="No pipelines yet" body="Create your first pipeline — give it a name and its own list of stages." action={<Btn onClick={() => setShowCreatePipeline(true)}>+ Create Pipeline</Btn>} />
      ) : (
        <>
          <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
            {pipelines.map((p) => (
              <button key={p._id} onClick={() => setActivePipelineId(p._id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer border transition ${p._id === activePipelineId ? "bg-rose-500 text-white border-rose-500" : "bg-white text-gray-600 border-gray-200 hover:border-rose-300"}`}>
                {p.name}{p.isDefault ? " (default)" : ""}
              </button>
            ))}
            <div className="ml-auto flex-shrink-0">
              <Btn size="sm" variant="secondary" onClick={() => setShowAddOpp(true)} disabled={!activePipeline}>+ Add Opportunity</Btn>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {(activePipeline?.stages || []).map((stage) => (
                <div key={stage}
                  onDragOver={(e) => { e.preventDefault(); setDragOverStage(stage); }}
                  onDragLeave={() => setDragOverStage((s) => (s === stage ? null : s))}
                  onDrop={(e) => { e.preventDefault(); const o = dragOppRef.current; setDragOverStage(null); if (o) moveStage(o, stage); }}
                  className={`rounded-xl border-2 p-3 min-w-[240px] w-[240px] flex-shrink-0 min-h-[200px] transition ${dragOverStage === stage ? "border-rose-300 bg-rose-50/40" : "border-transparent bg-gray-50"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{stage}</span>
                    <span className="text-xs text-gray-400">{opportunities.filter((o) => o.stage === stage).length}</span>
                  </div>
                  <div className="space-y-2">
                    {opportunities.filter((o) => o.stage === stage).map((o) => (
                      <div key={o._id} draggable onDragStart={() => { dragOppRef.current = o; }} onDragEnd={() => { dragOppRef.current = null; }}
                        className="bg-white rounded-lg border border-gray-100 shadow-sm p-3 cursor-grab active:cursor-grabbing group relative">
                        <button onClick={() => deleteOpportunity(o)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 bg-transparent border-none cursor-pointer text-xs opacity-0 group-hover:opacity-100 transition">✕</button>
                        <p className="text-sm font-semibold text-gray-900 pr-4">{o.contact?.name || o.contact?.email || "Unknown"}</p>
                        {o.title && <p className="text-xs text-gray-500">{o.title}</p>}
                        {o.value > 0 && <p className="text-xs font-bold text-green-600 mt-1">PKR {o.value.toLocaleString()}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showCreatePipeline && (
        <Modal title="Create Pipeline" onClose={() => setShowCreatePipeline(false)}>
          <div className="space-y-3">
            <input value={pipelineForm.name} onChange={(e) => setPipelineForm((f) => ({ ...f, name: e.target.value }))} placeholder="Pipeline name — e.g. Digital Marketing Course" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Stages</p>
            <div className="space-y-2">
              {pipelineForm.stages.map((stage, i) => (
                <div key={i} className="flex gap-2">
                  <input value={stage} onChange={(e) => setPipelineForm((f) => ({ ...f, stages: f.stages.map((s, idx) => (idx === i ? e.target.value : s)) }))}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                  <button onClick={() => setPipelineForm((f) => ({ ...f, stages: f.stages.filter((_, idx) => idx !== i) }))} className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer px-2">✕</button>
                </div>
              ))}
            </div>
            <button onClick={() => setPipelineForm((f) => ({ ...f, stages: [...f.stages, ""] }))} className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-transparent border-none cursor-pointer p-0">+ Add stage</button>
            <Btn onClick={createPipeline}>Create Pipeline</Btn>
          </div>
        </Modal>
      )}

      {showAddOpp && (
        <Modal title="Add Opportunity" onClose={() => setShowAddOpp(false)}>
          <div className="space-y-3">
            <select value={oppForm.contactId} onChange={(e) => setOppForm((f) => ({ ...f, contactId: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">Choose a contact…</option>
              {contacts.map((c) => <option key={c._id} value={c._id}>{c.name || c.email}</option>)}
            </select>
            <input value={oppForm.title} onChange={(e) => setOppForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title (optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <input type="number" value={oppForm.value} onChange={(e) => setOppForm((f) => ({ ...f, value: e.target.value }))} placeholder="Value in PKR (optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <Btn onClick={addOpportunity}>Add</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGERS — a library of named, reusable trigger links. Create one here
// (name + destination URL) and it's ready to pick from the "Link Clicked"
// trigger's scope, or insert into a WhatsApp message from the Automation
// Workflow editor.
// ─────────────────────────────────────────────────────────────────────────────
export function TriggerLinksPage({ toast }) {
  const { API: api } = useAuth();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", url: "" });
  const [copiedId, setCopiedId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get("/admin/trigger-links").then((res) => setLinks(res.data || [])).catch(() => toast("Failed to load trigger links", "error")).finally(() => setLoading(false));
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);

  const fullUrl = (code) => `${window.location.origin.replace(/:\d+$/, "")}/l/${code}`;

  const create = async () => {
    if (!form.url.trim()) { toast("A destination URL is required", "error"); return; }
    try {
      await api.post("/admin/trigger-links", { name: form.name.trim(), url: form.url.trim() });
      toast("Trigger link created", "success");
      setShowCreate(false); setForm({ name: "", url: "" });
      load();
    } catch (err) { toast(err.response?.data?.message || "Failed to create trigger link", "error"); }
  };

  const remove = async (link) => {
    if (!window.confirm(`Delete "${link.name || link.url}"?`)) return;
    try { await api.delete(`/admin/trigger-links/${link._id}`); setLinks((prev) => prev.filter((l) => l._id !== link._id)); }
    catch { toast("Failed to delete", "error"); }
  };

  const copy = (link) => {
    navigator.clipboard?.writeText(fullUrl(link.code));
    setCopiedId(link._id);
    setTimeout(() => setCopiedId((id) => (id === link._id ? null : id)), 1500);
  };

  return (
    <div>
      <SectionHeader title="Triggers" action={<Btn onClick={() => setShowCreate(true)}>+ New Trigger Link</Btn>} />
      <p className="text-xs text-gray-400 -mt-3 mb-4">Each link is trackable — clicking it fires the "Link Clicked" trigger in Automation Workflow, scoped to this specific link if you choose.</p>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : links.length === 0 ? (
        <EmptyState icon="🔗" title="No trigger links yet" body="Create a named link once, then reuse it across workflows and messages." action={<Btn onClick={() => setShowCreate(true)}>+ New Trigger Link</Btn>} />
      ) : (
        <div className="space-y-2">
          {links.map((l) => (
            <div key={l._id} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-gray-900">{l.name || <span className="text-gray-400 font-normal italic">Unnamed (from a message link)</span>}</p>
                <p className="text-xs text-gray-500 truncate max-w-md">→ {l.url}</p>
                <p className="text-xs text-rose-600 font-mono mt-0.5">{fullUrl(l.code)}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-gray-400">{l.clicks || 0} click{l.clicks === 1 ? "" : "s"}</span>
                <Btn size="sm" variant="secondary" onClick={() => copy(l)}>{copiedId === l._id ? "Copied!" : "Copy"}</Btn>
                <Btn size="sm" variant="danger" onClick={() => remove(l)}>Delete</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="New Trigger Link" onClose={() => setShowCreate(false)}>
          <div className="space-y-3">
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name — e.g. Enroll Now" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="Destination URL — https://…" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <Btn onClick={create}>Create</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}