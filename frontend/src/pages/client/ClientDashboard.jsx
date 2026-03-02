import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";
import LawyerSearch from "../public/LawyerSearch.jsx";

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const { colors } = useTheme();

  const menuItems = [
    { id: "overview", label: "Overview", icon: "🏠" },
    { id: "search", label: "Search Lawyers", icon: "🔍" },
    { id: "bookings", label: "My Bookings", icon: "📅" },
    { id: "wallet", label: "Wallet & Credits", icon: "💳" },
    { id: "reviews", label: "My Reviews", icon: "⭐" },
    { id: "profile", label: "My Profile", icon: "👤" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: colors.background,
      color: colors.text.primary,
      padding: '20px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '32px'
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: colors.text.primary
    },
    sidebar: {
      width: '250px',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      backgroundColor: colors.card,
      padding: '16px',
      height: 'fit-content'
    },
    sidebarButton: {
      width: '100%',
      padding: '12px',
      borderRadius: '4px',
      border: 'none',
      backgroundColor: 'transparent',
      color: colors.text.secondary,
      cursor: 'pointer',
      textAlign: 'left',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '8px'
    },
    sidebarButtonActive: {
      backgroundColor: colors.button.primary,
      color: colors.button.primaryText
    },
    mainContent: {
      flex: 1,
      marginLeft: '32px'
    },
    card: {
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      backgroundColor: colors.card,
      padding: '24px',
      marginBottom: '24px'
    },
    cardTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      marginBottom: '16px',
      color: colors.text.primary
    },
    statCard: {
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      backgroundColor: colors.surface,
      padding: '20px',
      textAlign: 'center'
    },
    statNumber: {
      fontSize: '32px',
      fontWeight: 'bold',
      marginBottom: '8px',
      color: colors.text.primary
    },
    statLabel: {
      fontSize: '14px',
      color: colors.text.secondary
    },
    button: {
      padding: '12px 24px',
      borderRadius: '4px',
      border: 'none',
      backgroundColor: colors.button.primary,
      color: colors.button.primaryText,
      cursor: 'pointer',
      fontWeight: '500'
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>
                Welcome back, {user?.fullName || "Client"}!
              </h2>
              <p style={{ color: colors.text.secondary, marginBottom: '24px' }}>
                Manage your legal consultations and connect with expert lawyers
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              <div style={styles.statCard}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
                <h3 style={styles.statNumber}>12</h3>
                <p style={styles.statLabel}>Lawyers Found</p>
              </div>

              <div style={styles.statCard}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
                <h3 style={styles.statNumber}>3</h3>
                <p style={styles.statLabel}>Upcoming Sessions</p>
              </div>

              <div style={styles.statCard}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>💳</div>
                <h3 style={styles.statNumber}>$250</h3>
                <p style={styles.statLabel}>Wallet Balance</p>
              </div>

              <div style={styles.statCard}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⭐</div>
                <h3 style={styles.statNumber}>4.8</h3>
                <p style={styles.statLabel}>Average Rating</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Recent Activity</h3>
                <div style={{ color: colors.text.secondary }}>
                  <p>• Consultation with John Doe completed</p>
                  <p>• New message from Sarah Smith</p>
                  <p>• Payment processed for 2 sessions</p>
                </div>
              </div>

              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Quick Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button style={styles.button} onClick={() => setActiveTab("search")}>
                    Find Lawyers
                  </button>
                  <button style={{ ...styles.button, backgroundColor: colors.button.secondary, color: colors.button.secondaryText, border: `1px solid ${colors.border}` }}>
                    Book Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "search":
        return <LawyerSearch />;

      case "bookings":
        return (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>My Bookings</h2>
            <div style={{ color: colors.text.secondary }}>
              <p>No upcoming bookings</p>
            </div>
          </div>
        );

      case "wallet":
        return (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Wallet & Credits</h2>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>$250.00</h3>
              <p style={{ color: colors.text.secondary }}>Current Balance</p>
            </div>
            <button style={styles.button}>Add Funds</button>
          </div>
        );

      case "reviews":
        return (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>My Reviews</h2>
            <div style={{ color: colors.text.secondary }}>
              <p>No reviews yet</p>
            </div>
          </div>
        );

      case "profile":
        return (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>My Profile</h2>
            <div style={{ color: colors.text.secondary }}>
              <p>Email: {user?.email}</p>
              <p>Role: {user?.role}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Client Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: colors.text.secondary }}>Welcome, {user?.fullName || "Client"}</span>
          <button
            onClick={handleLogout}
            style={{ ...styles.button, backgroundColor: '#dc3545', color: 'white' }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ display: 'flex' }}>
        <div style={styles.sidebar}>
          <nav>
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  ...styles.sidebarButton,
                  ...(activeTab === item.id ? styles.sidebarButtonActive : {})
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div style={styles.mainContent}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
