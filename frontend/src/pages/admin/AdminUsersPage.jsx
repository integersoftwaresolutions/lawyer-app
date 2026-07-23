import { useState } from "react";
import { FiUsers } from "react-icons/fi";
import { adminApi } from "../../services/admin.api";
import {
  Badge,
  PageHeader,
  PageShell,
  PageTabFilters,
  Table
} from "../../components/ui";

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
    <PageShell>
      <PageHeader
        icon={FiUsers}
        title="All Users"
        subtitle="Browse clients, lawyers, and administrators"
      />
      <PageTabFilters options={filterOptions} value={filter} onChange={setFilter} />
      <Table
        columns={columns}
        data={fetchUsers}
        dependencies={[filter]}
        emptyMessage="No users found"
      />
    </PageShell>
  );
}
