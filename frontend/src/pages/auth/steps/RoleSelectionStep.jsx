import { RoleSelector } from "../components/RoleSelector";

export function RoleSelectionStep({ onRoleSelect }) {
  return <RoleSelector onSelect={onRoleSelect} />;
}

