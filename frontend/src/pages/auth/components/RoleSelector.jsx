import { FiUser, FiBriefcase } from "react-icons/fi";

const ROLES = [
  {
    value: "CLIENT",
    icon: FiUser,
    title: "Client",
    description: "Find legal help"
  },
  {
    value: "LAWYER",
    icon: FiBriefcase,
    title: "Lawyer",
    description: "Offer services"
  }
];

export function RoleSelector({ selectedRole, onSelect, className = "" }) {
  return (
    <div className={`flex gap-3 ${className}`}>
      {ROLES.map((role) => {
        const Icon = role.icon;
        const isSelected = selectedRole === role.value;
        
        return (
          <button
            key={role.value}
            type="button"
            onClick={() => onSelect(role.value)}
            className={`
              flex-1 py-5 px-4 rounded-lg border-2 cursor-pointer text-center 
              transition-all duration-200
              ${isSelected 
                ? "border-primary bg-primary/10 text-text-primary" 
                : "border-border bg-card hover:bg-card-hover text-text-primary"
              }
            `}
          >
            <div className="flex justify-center mb-2">
              <Icon className={`text-3xl ${isSelected ? "text-primary" : "text-text-secondary"}`} />
            </div>
            <div className="font-semibold mb-1">{role.title}</div>
            <div className="text-xs text-text-secondary">
              {role.description}
            </div>
          </button>
        );
      })}
    </div>
  );
}

