import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";

export default function LawyerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const { colors } = useTheme();

  const menuItems = [
    { id: "overview", label: "Overview", icon: "🏠" },
    { id: "profile", label: "My Profile", icon: "👤" },
    { id: "availability", label: "Availability", icon: "📅" },
    { id: "bookings", label: "Bookings", icon: "📋" },
    { id: "earnings", label: "Earnings", icon: "💰" },
    { id: "verification", label: "Verification", icon: "✅" },
    { id: "reviews", label: "Reviews", icon: "⭐" },
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
    },
    input: {
      width: '100%',
      padding: '12px',
      marginBottom: '16px',
      borderRadius: '4px',
      border: `1px solid ${colors.input.border}`,
      backgroundColor: colors.input.background,
      color: colors.input.text,
      fontSize: '14px'
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>
                Welcome back, {user?.fullName || "Lawyer"}!
              </h2>
              <p style={{ color: colors.text.secondary, marginBottom: '24px' }}>
                Manage your profile, bookings, and earnings
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              <div style={styles.statCard}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
                <h3 style={styles.statNumber}>12</h3>
                <p style={styles.statLabel}>Upcoming Sessions</p>
              </div>

              <div style={styles.statCard}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>💰</div>
                <h3 style={styles.statNumber}>$2,450</h3>
                <p style={styles.statLabel}>This Month's Earnings</p>
              </div>

              <div style={styles.statCard}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⭐</div>
                <h3 style={styles.statNumber}>4.8</h3>
                <p style={styles.statLabel}>Average Rating</p>
              </div>

              <div style={styles.statCard}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
                <h3 style={styles.statNumber}>89</h3>
                <p style={styles.statLabel}>Total Clients</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Today's Schedule</h3>
                <div style={{ color: colors.text.secondary }}>
                  <p>• 2:00 PM - John Doe (Family Law)</p>
                  <p>• 4:00 PM - ABC Corp (Contract Review)</p>
                </div>
              </div>

              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Recent Activity</h3>
                <div style={{ color: colors.text.secondary }}>
                  <p>• Session completed with Jane Smith (+$150)</p>
                  <p>• New booking from Mike Johnson</p>
                </div>
              </div>
            </div>
          </div>
        );

      case "profile":
        return (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>My Profile</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: colors.text.secondary }}>Full Name</label>
                <input
                  type="text"
                  defaultValue={user?.fullName || ""}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: colors.text.secondary }}>Email</label>
                <input
                  type="email"
                  defaultValue={user?.email || ""}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: colors.text.secondary }}>City</label>
                <input
                  type="text"
                  placeholder="New York"
                  style={styles.input}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: colors.text.secondary }}>Hourly Rate ($)</label>
                <input
                  type="number"
                  placeholder="150"
                  style={styles.input}
                />
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: colors.text.secondary }}>Professional Bio</label>
              <textarea
                rows={4}
                placeholder="Tell clients about your experience and expertise..."
                style={{ ...styles.input, minHeight: '100px', resize: 'vertical' }}
              />
            </div>
            <button style={styles.button}>Save Profile Changes</button>
          </div>
        );

      case "availability":
        return (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Availability Settings</h2>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: colors.text.primary }}>Weekly Schedule</h3>
            <div style={{ color: colors.text.secondary }}>
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                <div key={day} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '12px', border: `1px solid ${colors.border}`, borderRadius: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input type="checkbox" defaultChecked={day !== "Sunday"} style={{ marginRight: '8px' }} />
                    <span>{day}</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="time"
                      defaultValue="09:00"
                      style={{ padding: '4px 8px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.input.background, color: colors.input.text }}
                    />
                    <span>to</span>
                    <input
                      type="time"
                      defaultValue="17:00"
                      style={{ padding: '4px 8px', border: `1px solid ${colors.border}`, borderRadius: '4px', backgroundColor: colors.input.background, color: colors.input.text }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <button style={styles.button}>Save Availability</button>
          </div>
        );

      case "bookings":
        return (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Bookings</h2>
            <div style={{ color: colors.text.secondary }}>
              <p>No pending bookings</p>
            </div>
          </div>
        );

      case "earnings":
        return (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={styles.statCard}>
                <h3 style={styles.statNumber}>$24,500</h3>
                <p style={styles.statLabel}>Total Earnings</p>
              </div>
              <div style={styles.statCard}>
                <h3 style={styles.statNumber}>$2,450</h3>
                <p style={styles.statLabel}>This Month</p>
              </div>
              <div style={styles.statCard}>
                <h3 style={styles.statNumber}>$850</h3>
                <p style={styles.statLabel}>Pending Payout</p>
              </div>
            </div>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Recent Transactions</h3>
              <div style={{ color: colors.text.secondary }}>
                <p>• Session with John Doe - +$150</p>
                <p>• Session with Jane Smith - +$300</p>
                <p>• Platform Fee - -$45</p>
              </div>
            </div>
          </div>
        );

      case "verification":
        return (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Verification Status</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: colors.text.primary }}>Current Status</h3>
                <p style={{ color: colors.text.secondary }}>Your verification documents are under review</p>
              </div>
              <span style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: '#ffc107', color: '#000', fontSize: '14px', fontWeight: '500' }}>
                Pending Review
              </span>
            </div>
            <div style={{ color: colors.text.secondary }}>
              <p>• Bar License: Pending</p>
              <p>• Government ID: Verified</p>
              <p>• Professional Certificate: Not uploaded</p>
            </div>
          </div>
        );

      case "reviews":
        return (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Client Reviews</h2>
            <div style={{ color: colors.text.secondary }}>
              <p>No reviews yet</p>
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
        <h1 style={styles.title}>Lawyer Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: colors.text.secondary }}>Welcome, {user?.fullName || "Lawyer"}</span>
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
