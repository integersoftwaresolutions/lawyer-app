import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { adminApi } from "../../services/admin.api";
import { Card, Button, Badge } from "../../components/ui";

export default function AdminUsersPage() {
  const { colors } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    loadUsers();
  }, [filter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = filter ? { role: filter } : {};
      const res = await adminApi.getUsers(params);
      setUsers(res.data || []);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const variants = {
      ADMIN: "danger",
      LAWYER: "info",
      CLIENT: "default",
    };
    return <Badge variant={variants[role] || "default"}>{role}</Badge>;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filterOptions = [
    { value: "", label: "All" },
    { value: "CLIENT", label: "Clients" },
    { value: "LAWYER", label: "Lawyers" },
    { value: "ADMIN", label: "Admins" },
  ];

  const tableStyles = {
    width: "100%",
    borderCollapse: "collapse",
  };

  const thStyles = {
    textAlign: "left",
    padding: "12px",
    borderBottom: `1px solid ${colors.border}`,
    color: colors.text.secondary,
    fontSize: "13px",
    fontWeight: "600",
  };

  const tdStyles = {
    padding: "12px",
    borderBottom: `1px solid ${colors.border}`,
    color: colors.text.primary,
    fontSize: "14px",
  };

  return (
    <div>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", color: colors.text.primary, margin: 0 }}>
            All Users
          </h2>
          <div style={{ display: "flex", gap: "8px" }}>
            {filterOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={filter === opt.value ? "primary" : "secondary"}
                size="sm"
                onClick={() => setFilter(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <p style={{ color: colors.text.secondary }}>Loading...</p>
        ) : users.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: colors.text.secondary }}>
            <p>No users found</p>
          </div>
        ) : (
          <table style={tableStyles}>
            <thead>
              <tr>
                <th style={thStyles}>Email</th>
                <th style={thStyles}>Role</th>
                <th style={thStyles}>Email Verified</th>
                <th style={thStyles}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td style={tdStyles}>{user.email}</td>
                  <td style={tdStyles}>{getRoleBadge(user.role)}</td>
                  <td style={tdStyles}>
                    <Badge variant={user.isEmailVerified ? "success" : "warning"}>
                      {user.isEmailVerified ? "Verified" : "Pending"}
                    </Badge>
                  </td>
                  <td style={tdStyles}>{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
