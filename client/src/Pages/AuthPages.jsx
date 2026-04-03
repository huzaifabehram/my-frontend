// src/Pages/AuthPages.jsx
import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthPage({ mode = "login" }) {
  const navigate            = useNavigate();
  const [searchParams]      = useSearchParams();          // ← reads ?redirect=
  const { login, register } = useAuth();
  const isLogin             = mode === "login";

  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "student",
  });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  }

  function getErrorMessage(err) {
    if (!err.response) {
      return "❌ Cannot reach the server.\n\nMake sure your backend is running:\ncd server && npm run dev";
    }
    const msg    = err.response?.data?.message;
    const status = err.response?.status;
    if (msg)            return msg;
    if (status === 401) return "Wrong email or password.";
    if (status === 409) return "Email already registered. Please sign in.";
    if (status === 500) return "Server error. Check your terminal.";
    return "Something went wrong. Try again.";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password.trim()) {
      setError("Email and password are required."); return;
    }
    if (!isLogin && !form.name.trim()) {
      setError("Full name is required."); return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters."); return;
    }

    setLoading(true);
    try {
      const user = isLogin
        ? await login(form.email.trim(), form.password)
        : await register(form.name.trim(), form.email.trim(), form.password, form.role);

      // ── REDIRECT LOGIC ────────────────────────────────────────────────
      // If the user came from a course page (e.g. clicked "Enroll"),
      // ?redirect=/portal will be in the URL — send them there.
      // Otherwise fall back to role-based default dashboard.
      const redirectTo =
        searchParams.get("redirect") ||
        (user.role === "instructor" ? "/instructor" : "/portal");

      navigate(redirectTo, { replace: true });

    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // ── Keep login/register links so the ?redirect param is preserved ────────
  const authBase     = isLogin ? "/auth/register" : "/auth/login";
  const redirectParam = searchParams.get("redirect")
    ? `?redirect=${searchParams.get("redirect")}`
    : "";
  const switchLink = `${authBase}${redirectParam}`;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1c1d1f 0%, #3b1f6b 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, fontFamily: "Segoe UI, system-ui, sans-serif",
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "40px 36px",
        width: "100%", maxWidth: 420,
        boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 54, height: 54, background: "#a435f0", borderRadius: 15,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: 14,
          }}>
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
              <path d="M8 32l12-24 12 24M12 26h16"
                stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#111", margin: "0 0 6px", letterSpacing: "-0.5px" }}>
            LearnFlow
          </h1>
          <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
            {isLogin ? "Welcome back! Sign in to continue." : "Create your free account today."}
          </p>

          {/* Show a hint if user was redirected from a course enroll click */}
          {searchParams.get("redirect") && (
            <div style={{
              marginTop: 12, background: "#eff6ff", border: "1px solid #bfdbfe",
              borderRadius: 8, padding: "8px 14px",
            }}>
              <p style={{ fontSize: 12, color: "#1d4ed8", margin: 0 }}>
                🔒 {isLogin ? "Sign in" : "Create a free account"} to enroll in this course
              </p>
            </div>
          )}
        </div>

        {/* Error box */}
        {error && (
          <div style={{
            background: "#fef2f2", border: "1.5px solid #fca5a5",
            borderRadius: 10, padding: "12px 16px", marginBottom: 20,
          }}>
            <p style={{ color: "#dc2626", fontSize: 13, margin: 0, lineHeight: 1.6, whiteSpace: "pre-line" }}>
              {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Name — register only */}
          {!isLogin && (
            <div>
              <label style={labelSt}>Full Name</label>
              <input name="name" value={form.name} onChange={handleChange}
                placeholder="e.g. John Doe" autoComplete="name" style={inputSt}/>
            </div>
          )}

          {/* Email */}
          <div>
            <label style={labelSt}>Email Address</label>
            <input name="email" type="email" value={form.email}
              onChange={handleChange} placeholder="you@email.com"
              autoComplete="email" style={inputSt}/>
          </div>

          {/* Password */}
          <div>
            <label style={labelSt}>Password</label>
            <input name="password" type="password" value={form.password}
              onChange={handleChange} placeholder="Minimum 6 characters"
              autoComplete={isLogin ? "current-password" : "new-password"}
              style={inputSt}/>
          </div>

          {/* Role selector — register only */}
          {!isLogin && (
            <div>
              <label style={labelSt}>I want to...</label>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { value: "student",    emoji: "🎓", label: "Learn", sub: "Enroll in courses" },
                  { value: "instructor", emoji: "🏫", label: "Teach", sub: "Create & sell courses" },
                ].map(r => (
                  <label key={r.value} style={{
                    flex: 1, display: "flex", flexDirection: "column",
                    alignItems: "center", gap: 4,
                    border: `2px solid ${form.role === r.value ? "#a435f0" : "#e5e7eb"}`,
                    borderRadius: 12, padding: "14px 10px", cursor: "pointer",
                    background: form.role === r.value ? "#faf5ff" : "#fff",
                    transition: "all 0.15s", textAlign: "center",
                  }}>
                    <input type="radio" name="role" value={r.value}
                      checked={form.role === r.value} onChange={handleChange}
                      style={{ display: "none" }}/>
                    <span style={{ fontSize: 26 }}>{r.emoji}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>{r.label}</span>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>{r.sub}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading} style={{
            background: loading ? "#c084fc" : "#a435f0",
            color: "#fff", border: "none", borderRadius: 12,
            padding: "14px", fontSize: 16, fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: 6, transition: "background 0.2s",
          }}>
            {loading ? "Please wait..." : isLogin ? "Sign In →" : "Create Account →"}
          </button>
        </form>

        {/* Switch login ↔ register — preserves ?redirect param */}
        <p style={{ textAlign: "center", marginTop: 22, fontSize: 14, color: "#6b7280" }}>
          {isLogin ? (
            <>Don't have an account?{" "}
              <Link to={switchLink} style={{ color: "#a435f0", fontWeight: 800, textDecoration: "none" }}>
                Register free
              </Link>
            </>
          ) : (
            <>Already have an account?{" "}
              <Link to={switchLink} style={{ color: "#a435f0", fontWeight: 800, textDecoration: "none" }}>
                Login here
              </Link>
            </>
          )}
        </p>

        {/* Server reminder */}
        <div style={{
          marginTop: 16, padding: "10px 14px",
          background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a",
        }}>
          <p style={{ fontSize: 11, color: "#92400e", margin: 0, lineHeight: 1.5 }}>
            ⚡ Backend must be running: <code style={codeSt}>cd server && npm run dev</code>
          </p>
        </div>

      </div>
    </div>
  );
}

const labelSt = { display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 };
const inputSt = {
  width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 10,
  padding: "11px 14px", fontSize: 14, color: "#111",
  outline: "none", boxSizing: "border-box", background: "#fff",
};
const codeSt = { background: "#e5e7eb", padding: "1px 6px", borderRadius: 4, fontSize: 11, fontFamily: "monospace" };