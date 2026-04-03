import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Login() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const res = await api.post("/api/login", {
        identifier,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setIdentifier("");
      setPassword("");

      navigate("/profile");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.backgroundGlowOne}></div>
      <div style={styles.backgroundGlowTwo}></div>

      <div style={styles.card}>
        <div style={styles.brand}>
          <div style={styles.logoCircle}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="16" r="1" />
              <path d="M7 11V8a5 5 0 0 1 10 0v3" />
            </svg>
          </div>

          <h2 style={styles.title}>Account Manager</h2>
          <p style={styles.subtitle}>
            Welcome back. Sign in using your username or email.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username or Email</label>
            <input
              type="text"
              placeholder="Enter username or email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordWrap}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...styles.input, ...styles.passwordInput }}
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={styles.toggleBtn}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12c.92-2.6 2.74-4.83 5.06-6.35" />
                    <path d="M10.58 10.58A2 2 0 1 0 13.41 13.41" />
                    <path d="M1 1l22 22" />
                    <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8a11.05 11.05 0 0 1-4.17 5.94" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div style={styles.rowBetween}>
            <span style={styles.helperText}>Secure sign-in</span>
            <Link to="/forgot-password" style={styles.inlineLink}>
              Forgot password?
            </Link>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <button type="submit" style={styles.primaryButton} disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={styles.footerText}>Don’t have an account?</span>
          <Link to="/register" style={styles.footerLink}>
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "linear-gradient(180deg, #eef4ff 0%, #f7f9fc 45%, #f4f7fb 100%)",
    position: "relative",
    overflow: "hidden",
  },
  backgroundGlowOne: {
    position: "absolute",
    width: "320px",
    height: "320px",
    borderRadius: "50%",
    background: "rgba(37, 99, 235, 0.14)",
    filter: "blur(50px)",
    top: "-80px",
    left: "-60px",
  },
  backgroundGlowTwo: {
    position: "absolute",
    width: "320px",
    height: "320px",
    borderRadius: "50%",
    background: "rgba(59, 130, 246, 0.12)",
    filter: "blur(55px)",
    bottom: "-100px",
    right: "-80px",
  },
  card: {
    width: "100%",
    maxWidth: "430px",
    background: "rgba(255,255,255,0.96)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.7)",
    borderRadius: "24px",
    boxShadow: "0 18px 50px rgba(15, 23, 42, 0.12)",
    padding: "32px 28px",
    position: "relative",
    zIndex: 1,
  },
  brand: { textAlign: "center", marginBottom: "24px" },
  logoCircle: {
    width: "64px",
    height: "64px",
    borderRadius: "18px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px auto",
    boxShadow: "0 10px 25px rgba(37, 99, 235, 0.28)",
  },
  title: { margin: 0, fontSize: "28px", fontWeight: 700, color: "#0f172a" },
  subtitle: {
    margin: "10px 0 0 0",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "14px", fontWeight: 600, color: "#334155" },
  input: {
    width: "100%",
    height: "50px",
    borderRadius: "14px",
    border: "1px solid #dbe4f0",
    outline: "none",
    padding: "0 16px",
    fontSize: "14px",
    color: "#0f172a",
    background: "#ffffff",
  },
  passwordWrap: { position: "relative" },
  passwordInput: { paddingRight: "50px" },
  toggleBtn: {
    position: "absolute",
    top: "50%",
    right: "12px",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  rowBetween: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  helperText: { fontSize: "13px", color: "#64748b" },
  inlineLink: {
    fontSize: "13px",
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: 600,
  },
  errorBox: {
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "12px 14px",
    borderRadius: "14px",
    fontSize: "14px",
  },
  primaryButton: {
    height: "52px",
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(37, 99, 235, 0.22)",
  },
  footer: {
    marginTop: "22px",
    textAlign: "center",
    fontSize: "14px",
  },
  footerText: { color: "#64748b", marginRight: "6px" },
  footerLink: {
    color: "#2563eb",
    fontWeight: 700,
    textDecoration: "none",
  },
};