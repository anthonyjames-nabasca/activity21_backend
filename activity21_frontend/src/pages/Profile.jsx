import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Profile() {
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const [user, setUser] = useState(null);
  const [accountCount, setAccountCount] = useState(0);
  const [form, setForm] = useState({
    username: "",
    fullname: "",
    email: "",
    password: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchProfile = async () => {
    try {
      const res = await api.get("/api/profile");
      const userData = res.data.user || res.data;

      setUser(userData);
      setForm({
        username: userData.username || "",
        fullname: userData.fullname || "",
        email: userData.email || "",
        password: "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch profile.");

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
      setAccountCount(Array.isArray(res.data) ? res.data.length : 0);
    } catch (_) {
      setAccountCount(0);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const data = new FormData();
      data.append("username", form.username);
      data.append("fullname", form.fullname);
      data.append("email", form.email);

      if (form.password) {
        data.append("password", form.password);
      }

      if (profileImage) {
        data.append("profile_image", profileImage);
      }

      const res = await api.post("/api/profile/update", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const updatedUser = res.data.user || user;

      setMessage(res.data.message || "Profile updated successfully.");
      setUser(updatedUser);
      setProfileImage(null);
      setForm((prev) => ({
        ...prev,
        password: "",
      }));

      fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    }
  };

  if (!user) {
    return (
      <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
        Loading profile...
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

        .profile-page {
          min-height: 100vh;
          background: #f6f8fc;
          font-family: Arial, Helvetica, sans-serif;
          color: #202124;
        }

        .profile-layout {
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
          position: relative;
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

        .cards-grid {
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

        .content-grid {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 18px;
        }

        .panel {
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
          border: 1px solid #eceff3;
          padding: 20px;
        }

        .panel h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 700;
        }

        .profile-summary {
          text-align: center;
        }

        .profile-avatar {
          width: 112px;
          height: 112px;
          border-radius: 50%;
          margin: 0 auto 16px;
          overflow: hidden;
          background: #d2e3fc;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #174ea6;
          font-size: 42px;
          font-weight: 700;
          border: 4px solid #eef3fd;
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .summary-name {
          margin: 0 0 6px 0;
          font-size: 20px;
          font-weight: 700;
        }

        .summary-email {
          margin: 0 0 16px 0;
          color: #5f6368;
          font-size: 14px;
          word-break: break-word;
        }

        .mini-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 18px;
        }

        .mini-stat-box {
          background: #f8f9fa;
          border-radius: 14px;
          padding: 14px 12px;
        }

        .mini-stat-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 6px;
        }

        .mini-stat-value {
          font-size: 15px;
          font-weight: 700;
          color: #111827;
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

        .submit-btn {
          border: none;
          border-radius: 14px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #fff;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          padding: 14px 18px;
          box-shadow: 0 10px 20px rgba(37, 99, 235, 0.20);
        }

        @media (max-width: 1100px) {
          .cards-grid {
            grid-template-columns: 1fr;
          }

          .content-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 820px) {
          .profile-layout {
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
          .panel {
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
        }
      `}</style>

      <div className="profile-page">
        <div className="profile-layout">
          <aside className="sidebar">
            <div className="brand-row">
              <div className="brand-icon">A</div>
              <div>
                <p className="brand-title">Account Manager</p>
              </div>
            </div>

            <div className="sidebar-section">
              <Link to="/profile" className="sidebar-link active">
                <span>🏠</span>
                <span>Home</span>
              </Link>

              <Link to="/profile" className="sidebar-link">
                <span>👤</span>
                <span>Profile</span>
              </Link>

              <Link to="/accounts" className="sidebar-link">
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
                <h1>Welcome, {user.fullname}</h1>
                <p>Manage your profile, saved accounts, and security details.</p>
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
                        to="/accounts"
                        className="profile-menu-link"
                        onClick={() => setMenuOpen(false)}
                      >
                        🗂️ Accounts
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
                <h2>Keep your profile updated and secure</h2>
                <p>
                  This dashboard gives you a cleaner workspace for managing your
                  user profile, checking account status, and updating your
                  account information in one place.
                </p>
              </div>

              <div className="hero-badge">AM</div>
            </section>

            <section className="cards-grid">
              <div className="stat-card">
                <div className="stat-card-top blue">
                  <h3>Saved Account Items</h3>
                  <p>Monitor how many account records you currently have.</p>
                  <div className="stat-circle">{accountCount}</div>
                </div>
                <div className="stat-card-body">
                  You currently have {accountCount} saved account
                  {accountCount === 1 ? "" : "s"} in your vault.
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-top green">
                  <h3>Verification Status</h3>
                  <p>Check whether your account email has already been verified.</p>
                  <div className="stat-circle">
                    {user.is_verified ? "✓" : "!"}
                  </div>
                </div>
                <div className="stat-card-body">
                  {user.is_verified
                    ? "Your account is verified and ready for secure access."
                    : "Your account is not yet verified."}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-top orange">
                  <h3>Current Login Identity</h3>
                  <p>Your active username and registered email information.</p>
                  <div className="stat-circle">@</div>
                </div>
                <div className="stat-card-body">
                  <strong>{user.username}</strong>
                  <br />
                  <span>{user.email}</span>
                </div>
              </div>
            </section>

            <section className="content-grid">
              <div className="panel profile-summary">
                <h3>Profile Summary</h3>

                <div className="profile-avatar">
                  {user.profile_image ? (
                    <img src={user.profile_image} alt="Profile" />
                  ) : (
                    initial
                  )}
                </div>

                <h4 className="summary-name">{user.fullname}</h4>
                <p className="summary-email">{user.email}</p>

                <div className="mini-stats">
                  <div className="mini-stat-box">
                    <div className="mini-stat-label">Username</div>
                    <div className="mini-stat-value">{user.username}</div>
                  </div>

                  <div className="mini-stat-box">
                    <div className="mini-stat-label">Status</div>
                    <div className="mini-stat-value">
                      {user.is_verified ? "Verified" : "Pending"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="panel">
                <h3>Update Profile</h3>

                <form onSubmit={handleSubmit} className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Username"
                      value={form.username}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Full Name"
                      value={form.fullname}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          fullname: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="form-group full">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="Email"
                      value={form.email}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="form-group full">
                    <label className="form-label">New Password (optional)</label>
                    <div className="password-wrap">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-input password-input"
                        placeholder="Enter new password"
                        value={form.password}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
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
                    <label className="form-label">Profile Picture</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="file-input"
                      onChange={(e) => setProfileImage(e.target.files[0])}
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
                    <button type="submit" className="submit-btn">
                      Update Profile
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}