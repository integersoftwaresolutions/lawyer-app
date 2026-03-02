import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Button from "../../components/ui/Button";

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Lawyer Marketplace</h1>

      <div className="flex gap-3">
        <Link to={user ? "/lawyers" : "/login"}>
          <Button>Search Lawyers</Button>
        </Link>
        {!user ? (
          <>
            <Link to="/login">
              <Button className="bg-blue-600">Login</Button>
            </Link>
            <Link to="/register">
              <Button className="bg-gray-700">Register</Button>
            </Link>
          </>
        ) : (
          <>
            <Link to="/wallet">
              <Button className="bg-green-700">Wallet</Button>
            </Link>
            <Button className="bg-red-600" onClick={logout}>
              Logout
            </Button>
          </>
        )}
      </div>

      <p className="text-gray-600">
        Phase 1 scaffold: auth, RBAC, lawyer discovery, booking/session skeleton, wallet skeleton, chat skeleton.
      </p>
    </div>
  );
}
