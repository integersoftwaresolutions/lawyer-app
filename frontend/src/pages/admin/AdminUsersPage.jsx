import { useState, useEffect } from "react";
import { adminApi } from "../../services/admin.api";
import { Card, Button, Badge } from "../../components/ui";

export default function AdminUsersPage() {
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

  return (
    <div>
      <Card>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-text-primary m-0">
            All Users
          </h2>
          <div className="flex gap-2">
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
          <p className="text-text-secondary">Loading...</p>
        ) : users.length === 0 ? (
          <div className="text-center py-10 text-text-secondary">
            <p>No users found</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Email</th>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Role</th>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Email Verified</th>
                <th className="text-left p-3 border-b border-border text-text-secondary text-xs font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="p-3 border-b border-border text-text-primary text-sm">{user.email}</td>
                  <td className="p-3 border-b border-border text-text-primary text-sm">{getRoleBadge(user.role)}</td>
                  <td className="p-3 border-b border-border text-text-primary text-sm">
                    <Badge variant={user.isEmailVerified ? "success" : "warning"}>
                      {user.isEmailVerified ? "Verified" : "Pending"}
                    </Badge>
                  </td>
                  <td className="p-3 border-b border-border text-text-primary text-sm">{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
