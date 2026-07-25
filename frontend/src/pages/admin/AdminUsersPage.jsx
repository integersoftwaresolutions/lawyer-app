import { useCallback, useState } from "react";
import { FiUsers } from "react-icons/fi";
import { adminApi } from "../../services/admin.api";
import {
  Badge,
  DataList,
  DataTable,
  PageFilters,
  PageHeader,
  PageShell,
  PageTabFilters,
  Pagination
} from "../../components/ui";
import { usePaginatedQuery } from "../../hooks/usePaginatedQuery";

export default function AdminUsersPage() {
  const [filter, setFilter] = useState("");

  const fetchUsers = useCallback(
    (params) => adminApi.getUsers({ ...params, ...(filter ? { role: filter } : {}) }),
    [filter]
  );

  const { items, meta, setPage, loading, error, retry } = usePaginatedQuery(fetchUsers, {
    dependencies: [filter],
    defaultLimit: 20
  });

  const getRoleBadge = (role) => {
    const variants = { ADMIN: "danger", LAWYER: "info", CLIENT: "default" };
    return <Badge variant={variants[role] || "default"}>{role}</Badge>;
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });

  const filterOptions = [
    { value: "", label: "All" },
    { value: "CLIENT", label: "Clients" },
    { value: "LAWYER", label: "Lawyers" },
    { value: "ADMIN", label: "Admins" }
  ];

  const columns = [
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (value) => getRoleBadge(value)
    },
    {
      key: "isEmailVerified",
      label: "Email verified",
      render: (value) => (
        <Badge variant={value ? "success" : "warning"}>{value ? "Verified" : "Pending"}</Badge>
      )
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (value) => formatDate(value)
    }
  ];

  return (
    <PageShell>
      <PageHeader
        icon={FiUsers}
        title="All Users"
        subtitle="Browse clients, lawyers, and administrators"
      />
      <DataList
        filters={
          <PageFilters>
            <PageTabFilters options={filterOptions} value={filter} onChange={setFilter} />
          </PageFilters>
        }
        pagination={<Pagination meta={meta} onPageChange={setPage} />}
      >
        <DataTable
          columns={columns}
          data={items}
          keyField="_id"
          loading={loading}
          error={error}
          retry={retry}
          emptyMessage="No users found"
          emptyDescription="Try a different role filter."
        />
      </DataList>
    </PageShell>
  );
}
