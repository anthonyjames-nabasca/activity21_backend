import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";

const initialForm = {
  site: "",
  account_username: "",
  account_password: "",
};

export default function Accounts() {
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [accountImage, setAccountImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/api/profile");
      const userData = res.data.user || res.data;
      setUser(userData);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await api.get("/api/account");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch account items.");

      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchAccounts();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [menuOpen]);

  const resetForm = () => {
    setForm(initialForm);
    setAccountImage(null);
    setEditingId(null);
    setShowPassword(false);
    setMessage("");
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/api/logout");
    } catch (_) {
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleEdit = (item) => {
    setMessage("");
    setError("");
    setEditingId(item.account_id);
    setForm({
      site: item.site || "",
      account_username: item.account_username || "",
      account_password: item.account_password || "",
    });
    setAccountImage(null);
    setShowPassword(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Are you sure you want to delete this account item?");
    if (!ok) return;

    setMessage("");
    setError("");

    try {
      const res = await api.delete("/api/account", {
        data: { account_id: id },
      });

      setMessage(res.data.message || "Account item deleted successfully.");

      if (editingId === id) {
        resetForm();
      }

      fetchAccounts();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete account item.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      setLoading(true);

      let res;

      if (editingId) {
        const data = new FormData();
        data.append("account_id", editingId);
        data.append("site", form.site);
        data.append("account_username", form.account_username);
        data.append("account_password", form.account_password);

        if (accountImage) {
          data.append("account_image", accountImage);
        }

        res = await api.post("/api/account/update", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        const data = new FormData();
        data.append("site", form.site);
        data.append("account_username", form.account_username);
        data.append("account_password", form.account_password);

        if (accountImage) {
          data.append("account_image", accountImage);
        }

        res = await api.post("/api/account", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setMessage(
        res.data.message ||
          (editingId
            ? "Account item updated successfully."
            : "Account item created successfully.")
      );

      resetForm();
      fetchAccounts();
    } catch (err) {
      setError(err.response?.data?.message || "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
        Loading accounts...
      </div>
    );
  }

  const initial = user.fullname?.charAt(0)?.toUpperCase() || "U";

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        .accounts-page {
          min-height: 100vh;
          background: #f6f8fc;
          font-family: Arial, Helvetica, sans-serif;
          color: #202124;
        }

        .accounts-layout {
          display: flex;
          min-height: 100vh;
        }

        .sidebar {
          width: 280px;
          background: #f8f9fa;
          border-right: 1px solid #e5e7eb;
          padding: 18px 14px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .brand-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 8px;
        }

        .brand-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #1a73e8, #4285f4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 700;
          font-size: 18px;
        }

        .brand-title {
          font-size: 18px;
          font-weight: 700;
          margin: 0;
        }

        .sidebar-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sidebar-link,
        .sidebar-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 999px;
          color: #1f2937;
          text-decoration: none;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 15px;
          text-align: left;
          width: 100%;
        }

        .sidebar-link.active {
          background: #d2e3fc;
          color: #174ea6;
          font-weight: 700;
        }

        .sidebar-link:hover,
        .sidebar-btn:hover {
          background: #e8f0fe;
        }

        .sidebar-bottom {
          margin-top: auto;
        }

        .main-content {
          flex: 1;
          padding: 20px 24px 28px;
          min-width: 0;
        }

        .topbar {
          background: #ffffff;
          border-radius: 18px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.04);
          margin-bottom: 20px;
          position: relative;
        }

        .topbar-left h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }

        .topbar-left p {
          margin: 6px 0 0 0;
          color: #5f6368;
          font-size: 14px;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
        }

        .avatar-chip {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          overflow: hidden;
          background: #d2e3fc;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #174ea6;
          font-size: 18px;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        }

        .avatar-chip img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-menu {
          position: absolute;
          top: 56px;
          right: 0;
          width: 320px;
          background: #eef2f7;
          border-radius: 28px;
          box-shadow: 0 18px 40px rgba(0,0,0,0.18);
          padding: 22px 18px 18px;
          z-index: 50;
          border: 1px solid #d9e1ea;
        }

        .profile-menu-top {
          text-align: center;
          margin-bottom: 18px;
        }

        .profile-menu-email {
          margin: 0;
          font-size: 14px;
          color: #202124;
          word-break: break-word;
        }

        .profile-menu-avatar {
          width: 84px;
          height: 84px;
          border-radius: 50%;
          margin: 16px auto 12px;
          overflow: hidden;
          background: #5b2fb4;
          color: #fff;
          font-size: 42px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .profile-menu-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-menu-name {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
        }

        .profile-menu-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 18px;
        }

        .profile-menu-btn,
        .profile-menu-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 16px;
          border-radius: 999px;
          background: #ffffff;
          color: #202124;
          text-decoration: none;
          border: 1px solid #d9dee7;
          font-weight: 600;
          cursor: pointer;
          font-size: 15px;
        }

        .profile-menu-btn:hover,
        .profile-menu-link:hover {
          background: #f8fbff;
        }

        .hero-banner {
          background: #dbe8ff;
          border-radius: 28px;
          padding: 24px 28px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 22px;
        }

        .hero-text h2 {
          margin: 0 0 10px 0;
          font-size: 22px;
          font-weight: 700;
        }

        .hero-text p {
          margin: 0;
          color: #374151;
          max-width: 760px;
          line-height: 1.6;
          font-size: 14px;
        }

        .hero-badge {
          min-width: 82px;
          height: 82px;
          border-radius: 24px;
          background: linear-gradient(135deg, #1a73e8, #4285f4);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 700;
          box-shadow: 0 10px 24px rgba(26, 115, 232, 0.22);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: #fff;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
          border: 1px solid #eceff3;
        }

        .stat-card-top {
          padding: 18px 18px 14px;
          color: #fff;
          min-height: 112px;
          position: relative;
        }

        .stat-card-top.blue {
          background: linear-gradient(135deg, #4285f4, #1a73e8);
        }

        .stat-card-top.green {
          background: linear-gradient(135deg, #34a853, #188038);
        }

        .stat-card-top.orange {
          background: linear-gradient(135deg, #ff8f6b, #e6693e);
        }

        .stat-card-top h3 {
          margin: 0 0 6px 0;
          font-size: 16px;
          font-weight: 700;
        }

        .stat-card-top p {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          opacity: 0.95;
        }

        .stat-circle {
          position: absolute;
          right: 16px;
          bottom: -20px;
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: rgba(255,255,255,0.95);
          color: #1a73e8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
          box-shadow: 0 6px 16px rgba(0,0,0,0.12);
        }

        .stat-card-body {
          padding: 28px 18px 18px;
          color: #374151;
          min-height: 96px;
        }

        .form-panel {
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
          border: 1px solid #eceff3;
          padding: 20px;
          margin-bottom: 24px;
        }

        .form-panel h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 700;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group.full {
          grid-column: 1 / -1;
        }

        .form-label {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }

        .form-input {
          width: 100%;
          padding: 13px 14px;
          border-radius: 14px;
          border: 1px solid #dbe2ea;
          background: #f9fbff;
          font-size: 15px;
          outline: none;
        }

        .password-wrap {
          position: relative;
        }

        .password-input {
          padding-right: 48px;
        }

        .toggle-btn {
          position: absolute;
          top: 50%;
          right: 14px;
          transform: translateY(-50%);
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }

        .file-input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px dashed #9ca3af;
          background: #f9fafb;
          font-size: 14px;
        }

        .message-error,
        .message-success {
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 14px;
        }

        .message-error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .message-success {
          background: #ecfdf5;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .primary-btn,
        .secondary-btn,
        .danger-btn {
          border: none;
          border-radius: 14px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          padding: 14px 18px;
        }

        .primary-btn {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #fff;
          box-shadow: 0 10px 20px rgba(37, 99, 235, 0.20);
          flex: 1;
        }

        .secondary-btn {
          background: #e5e7eb;
          color: #111827;
          min-width: 140px;
        }

        .danger-btn {
          background: #dc2626;
          color: #fff;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .account-card {
          background: #fff;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
          border: 1px solid #eceff3;
          display: flex;
          flex-direction: column;
        }

        .account-card-image {
          width: 100%;
          height: 190px;
          object-fit: cover;
        }

        .account-card-placeholder {
          width: 100%;
          height: 190px;
          background: #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          font-weight: 700;
        }

        .account-card-body {
          padding: 18px;
          flex: 1;
        }

        .account-card-body h3 {
          margin: 0 0 10px 0;
          font-size: 20px;
        }

        .account-card-body p {
          margin: 0 0 8px 0;
          color: #374151;
          line-height: 1.5;
          word-break: break-word;
        }

        .account-card-meta {
          color: #6b7280 !important;
          font-size: 13px;
          margin-top: 12px !important;
        }

        .account-card-actions {
          display: flex;
          gap: 10px;
          padding: 0 18px 18px;
          flex-wrap: wrap;
        }

        .empty-box {
          background: #fff;
          border-radius: 18px;
          padding: 24px;
          border: 1px solid #eceff3;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
        }

        @media (max-width: 1180px) {
          .stats-grid,
          .cards-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 900px) {
          .accounts-layout {
            flex-direction: column;
          }

          .sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid #e5e7eb;
          }

          .hero-banner {
            flex-direction: column;
            align-items: flex-start;
          }

          .hero-badge {
            align-self: flex-end;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid,
          .cards-grid {
            grid-template-columns: 1fr;
          }

          .profile-menu {
            width: min(320px, calc(100vw - 28px));
          }
        }

        @media (max-width: 560px) {
          .main-content {
            padding: 14px;
          }

          .topbar,
          .hero-banner,
          .form-panel,
          .account-card,
          .empty-box {
            border-radius: 16px;
          }

          .topbar-left h1 {
            font-size: 20px;
          }

          .hero-text h2 {
            font-size: 18px;
          }

          .sidebar-link,
          .sidebar-btn {
            border-radius: 16px;
          }

          .form-actions,
          .account-card-actions {
            flex-direction: column;
          }

          .secondary-btn,
          .primary-btn,
          .danger-btn {
            width: 100%;
          }
        }
      `}</style>

      <div className="accounts-page">
        <div className="accounts-layout">
          <aside className="sidebar">
            <div className="brand-row">
              <div className="brand-icon">A</div>
              <div>
                <p className="brand-title">Account Manager</p>
              </div>
            </div>

            <div className="sidebar-section">
              <Link to="/profile" className="sidebar-link">
                <span>🏠</span>
                <span>Home</span>
              </Link>

              <Link to="/profile" className="sidebar-link">
                <span>👤</span>
                <span>Profile</span>
              </Link>

              <Link to="/accounts" className="sidebar-link active">
                <span>🗂️</span>
                <span>Accounts</span>
              </Link>
            </div>

            <div className="sidebar-bottom">
              <button onClick={handleLogout} className="sidebar-btn">
                <span>🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </aside>

          <main className="main-content">
            <div className="topbar" ref={menuRef}>
              <div className="topbar-left">
                <h1>Manage Your Accounts</h1>
                <p>Create, organize, and update your saved account items.</p>
              </div>

              <div className="topbar-right">
                <div
                  className="avatar-chip"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  title="Open profile menu"
                >
                  {user.profile_image ? (
                    <img src={user.profile_image} alt="Avatar" />
                  ) : (
                    initial
                  )}
                </div>

                {menuOpen && (
                  <div className="profile-menu">
                    <div className="profile-menu-top">
                      <p className="profile-menu-email">{user.email}</p>

                      <div className="profile-menu-avatar">
                        {user.profile_image ? (
                          <img src={user.profile_image} alt="Profile" />
                        ) : (
                          initial
                        )}
                      </div>

                      <h3 className="profile-menu-name">Hi, {user.fullname}!</h3>
                    </div>

                    <div className="profile-menu-actions">
                      <Link
                        to="/profile"
                        className="profile-menu-link"
                        onClick={() => setMenuOpen(false)}
                      >
                        👤 Profile
                      </Link>

                      <button
                        type="button"
                        className="profile-menu-btn"
                        onClick={handleLogout}
                      >
                        🚪 Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <section className="hero-banner">
              <div className="hero-text">
                <h2>Store and manage account items efficiently</h2>
                <p>
                  Use this workspace to add new account records, upload account
                  images, update existing items, and remove entries you no
                  longer need.
                </p>
              </div>

              <div className="hero-badge">AC</div>
            </section>

            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-card-top blue">
                  <h3>Total Account Items</h3>
                  <p>Number of saved account records currently available.</p>
                  <div className="stat-circle">{items.length}</div>
                </div>
                <div className="stat-card-body">
                  You currently have {items.length} saved account
                  {items.length === 1 ? "" : "s"} in the system.
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-top green">
                  <h3>Current Mode</h3>
                  <p>Check whether you are creating a new item or editing one.</p>
                  <div className="stat-circle">{editingId ? "E" : "+"}</div>
                </div>
                <div className="stat-card-body">
                  {editingId
                    ? "You are currently editing an account item."
                    : "You are currently creating a new account item."}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-top orange">
                  <h3>Logged In As</h3>
                  <p>Your active user identity for this dashboard.</p>
                  <div className="stat-circle">@</div>
                </div>
                <div className="stat-card-body">
                  <strong>{user.username}</strong>
                  <br />
                  <span>{user.email}</span>
                </div>
              </div>
            </section>

            <section className="form-panel">
              <h3>{editingId ? "Update Account Item" : "Create Account Item"}</h3>

              <form onSubmit={handleSubmit} className="form-grid">
                <div className="form-group">
                  <label className="form-label">Site</label>
                  <input
                    type="text"
                    name="site"
                    className="form-input"
                    placeholder="Enter site"
                    value={form.site}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Account Username</label>
                  <input
                    type="text"
                    name="account_username"
                    className="form-input"
                    placeholder="Enter account username"
                    value={form.account_username}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group full">
                  <label className="form-label">Account Password</label>
                  <div className="password-wrap">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="account_password"
                      className="form-input password-input"
                      placeholder="Enter account password"
                      value={form.account_password}
                      onChange={handleChange}
                    />

                    <button
                      type="button"
                      className="toggle-btn"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#6b7280"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12c.92-2.6 2.74-4.83 5.06-6.35" />
                          <path d="M10.58 10.58A2 2 0 1 0 13.41 13.41" />
                          <path d="M1 1l22 22" />
                          <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8a11.05 11.05 0 0 1-4.17 5.94" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#6b7280"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="form-group full">
                  <label className="form-label">
                    {editingId ? "Replace Account Image (optional)" : "Account Image"}
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="file-input"
                    onChange={(e) => setAccountImage(e.target.files[0])}
                  />
                </div>

                {error && (
                  <div className="form-group full">
                    <div className="message-error">{error}</div>
                  </div>
                )}

                {message && (
                  <div className="form-group full">
                    <div className="message-success">{message}</div>
                  </div>
                )}

                <div className="form-group full">
                  <div className="form-actions">
                    <button type="submit" className="primary-btn" disabled={loading}>
                      {loading
                        ? editingId
                          ? "Updating..."
                          : "Saving..."
                        : editingId
                        ? "Update Account"
                        : "Save Account"}
                    </button>

                    {editingId && (
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={resetForm}
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </section>

            <section className="cards-grid">
              {items.length === 0 ? (
                <div className="empty-box">No account items found.</div>
              ) : (
                items.map((item) => (
                  <div key={item.account_id} className="account-card">
                    {item.account_image ? (
                      <img
                        src={item.account_image}
                        alt={item.site}
                        className="account-card-image"
                      />
                    ) : (
                      <div className="account-card-placeholder">No Image</div>
                    )}

                    <div className="account-card-body">
                      <h3>{item.site}</h3>
                      <p>
                        <strong>Username:</strong> {item.account_username}
                      </p>
                      <p>
                        <strong>Password:</strong> {item.account_password}
                      </p>
                      <p className="account-card-meta">
                        Created:{" "}
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : "-"}
                      </p>
                    </div>

                    <div className="account-card-actions">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="danger-btn"
                        onClick={() => handleDelete(item.account_id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </section>
          </main>
        </div>
      </div>
    </>
  );
}