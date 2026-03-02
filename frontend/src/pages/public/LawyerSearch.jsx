import { useEffect, useState } from "react";
import { lawyerApi } from "../../services/lawyer.api";
import { Link } from "react-router-dom";
import { Navbar } from "../../components/layout";
import { Input, Button, Card } from "../../components/ui";

export default function LawyerSearch() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load(params = {}) {
    setLoading(true);
    try {
      const res = await lawyerApi.search(params);
      setItems(res.data);
      setMeta(res.meta);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      load({ q, city, sort: "rating", page: 1, limit: 10 });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [q, city]);

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-[1200px] mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-text-primary">Find a Lawyer</h1>
          <p className="text-base text-text-secondary">Search and connect with qualified lawyers</p>
        </div>

        <Card className="mb-8">
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Search by name, specialization..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              containerClassName="mb-0"
            />
            <Input
              placeholder="City..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              containerClassName="mb-0"
            />
          </div>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-[3px] border-border border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-secondary">Searching lawyers...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
              {items.map((lawyer) => (
                <div
                  key={lawyer._id}
                  className="border border-border rounded-lg bg-card p-6 cursor-pointer transition-all hover:shadow-lg"
                >
                  <div>
                    <h3 className="text-lg font-bold mb-2 text-text-primary">
                      {lawyer.fullName || "Lawyer"}
                    </h3>
                    <div className="flex items-center gap-1 mb-4">
                      <span>★</span>
                      <span>{lawyer.ratingAvg ? lawyer.ratingAvg.toFixed(1) : "0.0"}</span>
                      {lawyer.ratingCount && <span>({lawyer.ratingCount} reviews)</span>}
                    </div>
                    <p className="text-sm text-text-secondary mb-1">
                      📍 {lawyer.city || "Location not specified"}
                    </p>
                    <p className="text-sm text-text-secondary mb-1">
                      💼 {lawyer.experienceYears} years experience
                    </p>
                    <p className="text-sm text-text-secondary mb-1">
                      ⚖️{" "}
                      {lawyer.specialization && lawyer.specialization.length > 0
                        ? lawyer.specialization.join(", ")
                        : "General practice"}
                    </p>
                    <p className="text-base font-bold text-text-primary">
                      ${lawyer.hourlyRate}/hour
                    </p>
                  </div>
                  <Link to={`/lawyers/${lawyer.userId}`}>
                    <Button fullWidth className="mt-4">
                      View Profile
                    </Button>
                  </Link>
                </div>
              ))}
            </div>

            {items.length === 0 && !loading && (
              <div className="text-center py-12 text-text-secondary">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-bold mb-2 text-text-primary">
                  No lawyers found
                </h3>
                <p>Try adjusting your search criteria</p>
              </div>
            )}

            {meta && meta.total > 0 && (
              <div className="text-center mt-8 text-sm text-text-secondary">
                Showing {items.length} of {meta.total} lawyers
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
