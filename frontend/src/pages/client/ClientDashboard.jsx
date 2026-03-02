import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import LawyerSearch from "../public/LawyerSearch.jsx";

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

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


  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div>
            <div className="border border-border rounded-lg bg-card p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 text-text-primary">
                Welcome back, {user?.fullName || "Client"}!
              </h2>
              <p className="text-text-secondary mb-6">
                Manage your legal consultations and connect with expert lawyers
              </p>
            </div>

            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-8">
              <div className="border border-border rounded-lg bg-surface p-5 text-center">
                <div className="text-[32px] mb-2">🔍</div>
                <h3 className="text-[32px] font-bold mb-2 text-text-primary">12</h3>
                <p className="text-sm text-text-secondary">Lawyers Found</p>
              </div>

              <div className="border border-border rounded-lg bg-surface p-5 text-center">
                <div className="text-[32px] mb-2">📅</div>
                <h3 className="text-[32px] font-bold mb-2 text-text-primary">3</h3>
                <p className="text-sm text-text-secondary">Upcoming Sessions</p>
              </div>

              <div className="border border-border rounded-lg bg-surface p-5 text-center">
                <div className="text-[32px] mb-2">💳</div>
                <h3 className="text-[32px] font-bold mb-2 text-text-primary">$250</h3>
                <p className="text-sm text-text-secondary">Wallet Balance</p>
              </div>

              <div className="border border-border rounded-lg bg-surface p-5 text-center">
                <div className="text-[32px] mb-2">⭐</div>
                <h3 className="text-[32px] font-bold mb-2 text-text-primary">4.8</h3>
                <p className="text-sm text-text-secondary">Average Rating</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="border border-border rounded-lg bg-card p-6 mb-6">
                <h3 className="text-xl font-bold mb-4 text-text-primary">Recent Activity</h3>
                <div className="text-text-secondary">
                  <p>• Consultation with John Doe completed</p>
                  <p>• New message from Sarah Smith</p>
                  <p>• Payment processed for 2 sessions</p>
                </div>
              </div>

              <div className="border border-border rounded-lg bg-card p-6 mb-6">
                <h3 className="text-xl font-bold mb-4 text-text-primary">Quick Actions</h3>
                <div className="flex flex-col gap-3">
                  <button className="py-3 px-6 rounded border-none bg-primary text-primary-text cursor-pointer font-medium" onClick={() => setActiveTab("search")}>
                    Find Lawyers
                  </button>
                  <button className="py-3 px-6 rounded border border-border bg-secondary text-secondary-text cursor-pointer font-medium">
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
          <div className="border border-border rounded-lg bg-card p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-text-primary">My Bookings</h2>
            <div className="text-text-secondary">
              <p>No upcoming bookings</p>
            </div>
          </div>
        );

      case "wallet":
        return (
          <div className="border border-border rounded-lg bg-card p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-text-primary">Wallet & Credits</h2>
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">$250.00</h3>
              <p className="text-text-secondary">Current Balance</p>
            </div>
            <button className="py-3 px-6 rounded border-none bg-primary text-primary-text cursor-pointer font-medium">Add Funds</button>
          </div>
        );

      case "reviews":
        return (
          <div className="border border-border rounded-lg bg-card p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-text-primary">My Reviews</h2>
            <div className="text-text-secondary">
              <p>No reviews yet</p>
            </div>
          </div>
        );

      case "profile":
        return (
          <div className="border border-border rounded-lg bg-card p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-text-primary">My Profile</h2>
            <div className="text-text-secondary">
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
    <div className="min-h-screen bg-background text-text-primary p-5">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-[32px] font-bold text-text-primary">Client Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-text-secondary">Welcome, {user?.fullName || "Client"}</span>
          <button
            onClick={handleLogout}
            className="py-3 px-6 rounded bg-danger text-danger-text cursor-pointer font-medium"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex">
        <div className="w-[250px] border border-border rounded-lg bg-card p-4 h-fit">
          <nav>
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full py-3 px-3 rounded border-none bg-transparent cursor-pointer text-left flex items-center gap-3 mb-2 ${
                  activeTab === item.id 
                    ? "bg-primary text-primary-text" 
                    : "text-text-secondary"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 ml-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
