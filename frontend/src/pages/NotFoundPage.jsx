import { Link } from "react-router-dom";
import { Navbar } from "../components/layout";
import { Button } from "../components/ui";
import { FiHome, FiSearch, FiArrowLeft } from "react-icons/fi";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6">
        <div className="text-center max-w-[600px]">
          <div className="mb-8">
            <h1 className="text-[120px] font-bold text-primary/20 leading-none mb-4">404</h1>
            <h2 className="text-4xl font-bold mb-4 text-text-primary">
              Page Not Found
            </h2>
            <p className="text-lg text-text-secondary mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              onClick={() => window.history.back()}
              variant="secondary"
              icon={FiArrowLeft}
            >
              Go Back
            </Button>
            <Link to="/">
              <Button icon={FiHome}>
                Go Home
              </Button>
            </Link>
            <Link to="/lawyers">
              <Button variant="secondary" icon={FiSearch}>
                Find Lawyers
              </Button>
            </Link>
          </div>

          <div className="border-t border-border pt-8">
            <p className="text-sm text-text-secondary">
              If you believe this is an error, please contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

