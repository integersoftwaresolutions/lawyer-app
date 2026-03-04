import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { lawyerApi } from "../../services/lawyer.api";
import { constantsApi } from "../../services/constants.api";
import { Card, Button, Input, Select, Badge, StateHandler } from "../../components/ui";
import { useStateHandler } from "../../hooks/useStateHandler";

export default function ClientSearchPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    q: "",
    city: "",
    specialization: "",
    minRate: "",
    maxRate: "",
    sort: "rating",
  });

  const { loading: constantsLoading, data: constantsData } = useStateHandler(
    async () => {
      const res = await constantsApi.getConstants();
      return res.data || { specializations: [], cities: [] };
    },
    { autoFetch: true }
  );

  const constants = constantsData || { specializations: [], cities: [] };

  const { loading, error, data, retry } = useStateHandler(
    async () => {
      const params = {};
      if (filters.q) params.q = filters.q;
      if (filters.city) params.city = filters.city;
      if (filters.specialization) params.specialization = filters.specialization;
      if (filters.minRate) params.minRate = filters.minRate;
      if (filters.maxRate) params.maxRate = filters.maxRate;
      if (filters.sort) params.sort = filters.sort;
      
      const res = await lawyerApi.search(params);
      return res.data || [];
    },
    { dependencies: [filters.q, filters.city, filters.specialization, filters.minRate, filters.maxRate, filters.sort] }
  );

  const lawyers = data || [];

  const handleSearch = () => {
    retry();
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
      <Card className="mb-6">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-3 items-end">
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
          <Button onClick={handleSearch} className="mb-4">
            Search
          </Button>
        </div>
      </Card>

      <StateHandler loading={loading} error={error} retry={retry}>
        {lawyers.length === 0 ? (
        <Card>
          <div className="text-center py-10 text-text-secondary">
            <p>No lawyers found matching your criteria.</p>
            <p className="text-sm mt-2">
              Try adjusting your filters or search terms.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
          {lawyers.map((lawyer) => (
            <Card key={lawyer._id} className="cursor-pointer" onClick={() => navigate(`/lawyers/${lawyer.userId}`)}>
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center text-[32px] flex-shrink-0">
                  {lawyer.profileImage ? (
                    <img
                      src={lawyer.profileImage}
                      alt={lawyer.fullName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    "👤"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-text-primary m-0">
                      {lawyer.fullName}
                    </h3>
                    {lawyer.verificationStatus === "APPROVED" && (
                      <Badge variant="success" size="sm">Verified</Badge>
                    )}
                    {lawyer.isFeatured && (
                      <Badge variant="warning" size="sm">Featured</Badge>
                    )}
                  </div>
                  <div className="text-warning text-sm mb-1">
                    {renderStars(lawyer.ratingAvg || 0)} ({lawyer.ratingCount || 0})
                  </div>
                  <div className="text-text-secondary text-xs mb-2">
                    {lawyer.city || "Location not specified"} • {lawyer.experienceYears || 0} years exp.
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(lawyer.specialization || []).slice(0, 3).map((spec) => (
                      <Badge key={spec} size="sm">{spec}</Badge>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-text-primary">
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
      </StateHandler>
    </div>
  );
}
