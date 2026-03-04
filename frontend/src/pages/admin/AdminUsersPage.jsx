import { useState } from "react";
import { adminApi } from "../../services/admin.api";
import { Card, Button, Badge, Table } from "../../components/ui";

export default function AdminUsersPage() {
  const [filter, setFilter] = useState("");

  const fetchUsers = async () => {
    const params = filter ? { role: filter } : {};
    const res = await adminApi.getUsers(params);
    return res.data || [];
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

  const columns = [
    {
      key: "email",
      label: "Email",
    },
    {
      key: "role",
      label: "Role",
      render: (value) => getRoleBadge(value),
    },
    {
      key: "isEmailVerified",
      label: "Email Verified",
      render: (value) => (
        <Badge variant={value ? "success" : "warning"}>
          {value ? "Verified" : "Pending"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (value) => formatDate(value),
    },
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

        <Table
          columns={columns}
          data={fetchUsers}
          dependencies={[filter]}
          emptyMessage="No users found"
        />
      </Card>
    </div>
  );
}
