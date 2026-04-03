import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!token) {
      setError("Reset token is missing.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/api/reset-password", {
        token,
        newPassword,
      });

      setMessage(res.data.message);

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Reset password failed.");
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
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 17v.01" />
              <path d="M7 10V7a5 5 0 0 1 10 0v3" />
              <rect x="5" y="10" width="14" height="11" rx="2" />
            </svg>
          </div>

          <h2 style={styles.title}>Reset Password</h2>
          <p style={styles.subtitle}>
            Create a new secure password for your account and continue safely.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>New Password</label>
            <div style={styles.passwordWrap}>
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ ...styles.input, ...styles.passwordInput }}
              />

              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                style={styles.toggleBtn}
              >
                {showNewPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password</label>
            <div style={styles.passwordWrap}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ ...styles.input, ...styles.passwordInput }}
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                style={styles.toggleBtn}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}
          {message && <div style={styles.successBox}>{message}</div>}

          <button type="submit" style={styles.primaryButton} disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={styles.footerText}>Back to account access?</span>
          <Link to="/login" style={styles.footerLink}>
            Login
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
  subtitle: { margin: "10px 0 0 0", color: "#64748b", fontSize: "14px", lineHeight: 1.6 },
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
  passwordInput: { paddingRight: "70px" },
  toggleBtn: {
    position: "absolute",
    top: "50%",
    right: "12px",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: "#2563eb",
    fontWeight: 700,
  },
  errorBox: {
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "12px 14px",
    borderRadius: "14px",
    fontSize: "14px",
  },
  successBox: {
    background: "#dcfce7",
    color: "#166534",
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
  footer: { marginTop: "22px", textAlign: "center", fontSize: "14px" },
  footerText: { color: "#64748b", marginRight: "6px" },
  footerLink: { color: "#2563eb", fontWeight: 700, textDecoration: "none" },
};