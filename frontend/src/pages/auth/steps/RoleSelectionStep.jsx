import { Button } from "../../../components/ui";
import { RoleSelector } from "../components/RoleSelector";

export function RoleSelectionStep({ selectedRole, onRoleSelect, onContinue }) {
  return (
    <>
      <RoleSelector 
        selectedRole={selectedRole}
        onSelect={onRoleSelect}
        className="mb-6"
      />
      <Button 
        fullWidth 
        onClick={onContinue} 
        disabled={!selectedRole}
      >
        Continue
      </Button>
    </>
  );
}

