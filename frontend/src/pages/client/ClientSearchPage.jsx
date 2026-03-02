import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { lawyerApi } from "../../services/lawyer.api";
import { constantsApi } from "../../services/constants.api";
import { Card, Button, Input, Select, Badge } from "../../components/ui";

export default function ClientSearchPage() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [constants, setConstants] = useState({ specializations: [], cities: [] });
  const [filters, setFilters] = useState({
    q: "",
    city: "",
    specialization: "",
    minRate: "",
    maxRate: "",
    sort: "rating",
  });

  useEffect(() => {
    loadConstants();
    loadLawyers();
  }, []);

  const loadConstants = async () => {
    try {
      const res = await constantsApi.getConstants();
      setConstants(res.data || { specializations: [], cities: [] });
    } catch (error) {
      console.error("Failed to load constants:", error);
    }
  };

  const loadLawyers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.q) params.q = filters.q;
      if (filters.city) params.city = filters.city;
      if (filters.specialization) params.specialization = filters.specialization;
      if (filters.minRate) params.minRate = filters.minRate;
      if (filters.maxRate) params.maxRate = filters.maxRate;
      if (filters.sort) params.sort = filters.sort;
      
      const res = await lawyerApi.search(params);
      setLawyers(res.data || []);
    } catch (error) {
      console.error("Failed to load lawyers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadLawyers();
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
  };

  const sortOptions = [
    { value: "rating", label: "Highest Rated" },
    { value: "rate_low", label: "Price: Low to High" },
    { value: "rate_high", label: "Price: High to Low" },
    { value: "experience", label: "Most Experienced" },
  ];

  return (
    <div>
      <Card style={{ marginBottom: "24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr auto", gap: "12px", alignItems: "flex-end" }}>
          <Input
            label="Search"
            placeholder="Search by name or keyword..."
            value={filters.q}
            onChange={(e) => handleFilterChange("q", e.target.value)}
            containerStyle={{ marginBottom: 0 }}
          />
          <Select
            label="City"
            value={filters.city}
            onChange={(e) => handleFilterChange("city", e.target.value)}
            options={constants.cities.map((c) => ({ value: c, label: c }))}
            placeholder="All Cities"
            containerStyle={{ marginBottom: 0 }}
          />
          <Select
            label="Specialization"
            value={filters.specialization}
            onChange={(e) => handleFilterChange("specialization", e.target.value)}
            options={constants.specializations.map((s) => ({ value: s, label: s }))}
            placeholder="All"
            containerStyle={{ marginBottom: 0 }}
          />
          <Select
            label="Sort By"
            value={filters.sort}
            onChange={(e) => handleFilterChange("sort", e.target.value)}
            options={sortOptions}
            containerStyle={{ marginBottom: 0 }}
          />
          <Input
            label="Max Rate"
            type="number"
            placeholder="Max $"
            value={filters.maxRate}
            onChange={(e) => handleFilterChange("maxRate", e.target.value)}
            containerStyle={{ marginBottom: 0 }}
          />
          <Button onClick={handleSearch} style={{ marginBottom: "16px" }}>
            Search
          </Button>
        </div>
      </Card>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: colors.text.secondary }}>
          Loading lawyers...
        </div>
      ) : lawyers.length === 0 ? (
        <Card>
          <div style={{ textAlign: "center", padding: "40px", color: colors.text.secondary }}>
            <p>No lawyers found matching your criteria.</p>
            <p style={{ fontSize: "14px", marginTop: "8px" }}>
              Try adjusting your filters or search terms.
            </p>
          </div>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
          {lawyers.map((lawyer) => (
            <Card key={lawyer._id} style={{ cursor: "pointer" }} onClick={() => navigate(`/lawyers/${lawyer.userId}`)}>
              <div style={{ display: "flex", gap: "16px" }}>
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    backgroundColor: colors.surface,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "32px",
                    flexShrink: 0,
                  }}
                >
                  {lawyer.profileImage ? (
                    <img
                      src={lawyer.profileImage}
                      alt={lawyer.fullName}
                      style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    "👤"
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "600", color: colors.text.primary, margin: 0 }}>
                      {lawyer.fullName}
                    </h3>
                    {lawyer.verificationStatus === "APPROVED" && (
                      <Badge variant="success" size="sm">Verified</Badge>
                    )}
                    {lawyer.isFeatured && (
                      <Badge variant="warning" size="sm">Featured</Badge>
                    )}
                  </div>
                  <div style={{ color: "#ffc107", fontSize: "14px", marginBottom: "4px" }}>
                    {renderStars(lawyer.ratingAvg || 0)} ({lawyer.ratingCount || 0})
                  </div>
                  <div style={{ color: colors.text.secondary, fontSize: "13px", marginBottom: "8px" }}>
                    {lawyer.city || "Location not specified"} • {lawyer.experienceYears || 0} years exp.
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
                    {(lawyer.specialization || []).slice(0, 3).map((spec) => (
                      <Badge key={spec} size="sm">{spec}</Badge>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: "600", color: colors.text.primary }}>
                      ${lawyer.hourlyRate || 0}/hr
                    </span>
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/lawyers/${lawyer.userId}`); }}>
                      View Profile
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
