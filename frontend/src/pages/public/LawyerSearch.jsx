import { useState, useEffect } from "react";
import { lawyerApi } from "../../services/lawyer.api";
import { constantsApi } from "../../services/constants.api";
import { Link } from "react-router-dom";
import { Navbar } from "../../components/layout";
import { 
  Input, 
  Button, 
  Card, 
  StateHandler, 
  Avatar, 
  Badge, 
  Select,
  Checkbox,
  Sidebar,
  Pagination
} from "../../components/ui";
import { useStateHandler } from "../../hooks/useStateHandler";
import { 
  FiSearch, 
  FiFilter, 
  FiX, 
  FiStar, 
  FiMapPin, 
  FiBriefcase,
  FiDollarSign,
  FiShield,
  FiTrendingUp,
  FiClock
} from "react-icons/fi";

export default function LawyerSearch() {
  // Mobile sidebar open state (controlled via Navbar hamburger)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({
    q: "",
    city: "",
    specialization: "",
    verified: false,
    minExp: "",
    maxExp: "",
    minRate: "",
    maxRate: "",
    minRating: "",
    sort: "rating"
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [page, setPage] = useState(1);

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
      if (appliedFilters.q) params.q = appliedFilters.q;
      if (appliedFilters.city) params.city = appliedFilters.city;
      if (appliedFilters.specialization) params.specialization = appliedFilters.specialization;
      if (appliedFilters.verified) params.verified = "true";
      if (appliedFilters.minExp) params.minExp = Number(appliedFilters.minExp);
      if (appliedFilters.maxExp) params.maxExp = Number(appliedFilters.maxExp);
      if (appliedFilters.minRate) params.minRate = Number(appliedFilters.minRate);
      if (appliedFilters.maxRate) params.maxRate = Number(appliedFilters.maxRate);
      if (appliedFilters.minRating) params.minRating = Number(appliedFilters.minRating);
      if (appliedFilters.sort) params.sort = appliedFilters.sort;
      
      const res = await lawyerApi.search({ 
        ...params,
        page, 
        limit: 20 
      });
      return {
        items: res.items || [],
        meta: res.meta || null,
      };
    },
    { 
      dependencies: [
        appliedFilters.q, 
        appliedFilters.city, 
        appliedFilters.specialization, 
        appliedFilters.verified,
        appliedFilters.minExp,
        appliedFilters.maxExp,
        appliedFilters.minRate,
        appliedFilters.maxRate,
        appliedFilters.minRating,
        appliedFilters.sort,
        page
      ],
      autoFetch: true 
    }
  );

  const items = data?.items || [];
  const meta = data?.meta || null;

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters(filters);
    setSidebarOpen(false); // Close sidebar on mobile after applying
  };

  const clearFilters = () => {
    setPage(1);
    const clearedFilters = {
      q: "",
      city: "",
      specialization: "",
      verified: false,
      minExp: "",
      maxExp: "",
      minRate: "",
      maxRate: "",
      minRating: "",
      sort: "rating"
    };
    setFilters(clearedFilters);
    setAppliedFilters(clearedFilters);
  };

  const activeFiltersCount = Object.entries(appliedFilters).filter(([key, value]) => {
    if (key === "sort") return false;
    if (key === "verified") return value === true;
    return value !== "" && value !== false;
  }).length;

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    const hasHalf = (rating || 0) % 1 >= 0.5;
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={i < fullStars ? "text-warning" : i === fullStars && hasHalf ? "text-warning/50" : "text-text-muted"}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const filterFields = (
    <div className="space-y-6">
              {/* Header Actions */}
              {activeFiltersCount > 0 && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              )}

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Search
                </label>
                <Input
                  placeholder="Name, specialization..."
                  value={filters.q}
                  onChange={(e) => handleFilterChange("q", e.target.value)}
                  icon={<FiSearch />}
                  containerClassName="mb-0"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <FiMapPin className="inline mr-1" size={14} />
                  City
                </label>
                <Select
                  value={filters.city}
                  onChange={(e) => handleFilterChange("city", e.target.value)}
                  options={[
                    { value: "", label: "All Cities" },
                    ...constants.cities.map(city => ({ value: city, label: city }))
                  ]}
                  placeholder="Select city"
                />
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Specialization
                </label>
                <Select
                  value={filters.specialization}
                  onChange={(e) => handleFilterChange("specialization", e.target.value)}
                  options={[
                    { value: "", label: "All Specializations" },
                    ...constants.specializations.map(spec => ({ value: spec, label: spec }))
                  ]}
                  placeholder="Select specialization"
                />
              </div>

              {/* Verified Only */}
              <div>
                <Checkbox
                  label="Verified Lawyers Only"
                  checked={filters.verified}
                  onChange={(checked) => handleFilterChange("verified", checked)}
                  containerClassName="mb-0"
                />
              </div>

              {/* Experience Range */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <FiBriefcase className="inline mr-1" size={14} />
                  Experience (Years)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minExp}
                    onChange={(e) => handleFilterChange("minExp", e.target.value)}
                    min="0"
                    containerClassName="mb-0"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxExp}
                    onChange={(e) => handleFilterChange("maxExp", e.target.value)}
                    min="0"
                    containerClassName="mb-0"
                  />
                </div>
              </div>

              {/* Hourly Rate Range */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <FiDollarSign className="inline mr-1" size={14} />
                  Hourly Rate ($)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minRate}
                    onChange={(e) => handleFilterChange("minRate", e.target.value)}
                    min="0"
                    containerClassName="mb-0"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxRate}
                    onChange={(e) => handleFilterChange("maxRate", e.target.value)}
                    min="0"
                    containerClassName="mb-0"
                  />
                </div>
              </div>

              {/* Minimum Rating */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <FiStar className="inline mr-1" size={14} />
                  Minimum Rating
                </label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={filters.minRating}
                  onChange={(e) => handleFilterChange("minRating", e.target.value)}
                  min="0"
                  max="5"
                  step="0.1"
                  containerClassName="mb-0"
                />
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <FiTrendingUp className="inline mr-1" size={14} />
                  Sort By
                </label>
                <Select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange("sort", e.target.value)}
                  options={[
                    { value: "rating", label: "Highest Rated" },
                    { value: "rate_low", label: "Price: Low to High" },
                    { value: "rate_high", label: "Price: High to Low" },
                    { value: "experience", label: "Most Experienced" }
                  ]}
                />
              </div>

            </div>
  );

  const filterFooter = (
    <>
      <Button onClick={applyFilters} fullWidth className="mb-2">
        Apply Filters
      </Button>
      {activeFiltersCount > 0 && (
        <Button onClick={clearFilters} variant="secondary" fullWidth size="sm">
          Clear All
        </Button>
      )}
    </>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <div className="shrink-0">
        <Navbar
          onSidebarToggle={() => setSidebarOpen((open) => !open)}
          showSidebarToggle
        />
      </div>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          title="Filters"
          width="w-72"
          footer={filterFooter}
        >
          {filterFields}
        </Sidebar>

        <div className="flex-1 min-w-0 min-h-0 overflow-y-auto">
            <div className="p-4 md:p-6 lg:p-8">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
                      Find a Lawyer
                    </h1>
                    <p className="text-text-secondary">
                      {meta?.total ? `${meta.total} lawyer${meta.total !== 1 ? 's' : ''} found` : "Search and connect with qualified lawyers"}
                    </p>
                  </div>
                  {/* Active filter count badge on mobile */}
                  {activeFiltersCount > 0 && (
                    <div className="md:hidden flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full bg-primary text-primary-text text-xs font-medium">
                        {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Search Bar (Desktop) */}
                <div className="hidden md:block">
                  <Input
                    placeholder="Search by name, specialization, or keywords..."
                    value={filters.q}
                    onChange={(e) => handleFilterChange("q", e.target.value)}
                    icon={<FiSearch />}
                    className="max-w-2xl"
                  />
                </div>
              </div>

              {/* Results */}
              <StateHandler loading={loading} error={error} retry={retry}>
                {items.length === 0 && !loading ? (
                  <Card className="text-center py-16">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-bold mb-2 text-text-primary">
                      No lawyers found
                    </h3>
                    <p className="text-text-secondary mb-4">
                      Try adjusting your search criteria or filters
                    </p>
                    {activeFiltersCount > 0 && (
                      <Button variant="secondary" onClick={clearFilters}>
                        Clear Filters
                      </Button>
                    )}
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {items.map((lawyer) => (
                      <Card
                        key={lawyer._id}
                        className="group hover:shadow-lg transition-all duration-300 border-border hover:border-primary-border overflow-hidden"
                      >
                        <Link to={`/lawyers/${lawyer.userId}`} className="block">
                          <div className="flex flex-col">
                            {/* Header with Avatar and Name */}
                            <div className="flex items-start gap-4 mb-4">
                              <Avatar
                                user={lawyer}
                                size="xl"
                                showBorder={true}
                                className="flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-1">
                                    {lawyer.fullName || "Lawyer"}
                                  </h3>
                                  {lawyer.verificationStatus === "APPROVED" && (
                                    <Badge variant="success" size="sm" className="flex-shrink-0">
                                      <FiShield size={12} className="mr-1" />
                                      Verified
                                    </Badge>
                                  )}
                                </div>
                                {lawyer.isFeatured && (
                                  <Badge variant="warning" size="sm" className="mb-2">
                                    Featured
                                  </Badge>
                                )}
                                {/* Rating */}
                                <div className="flex items-center gap-2 mb-2">
                                  {renderStars(lawyer.ratingAvg || 0)}
                                  <span className="text-sm font-medium text-text-primary">
                                    {(lawyer.ratingAvg || 0).toFixed(1)}
                                  </span>
                                  {lawyer.ratingCount > 0 && (
                                    <span className="text-xs text-text-secondary">
                                      ({lawyer.ratingCount} review{lawyer.ratingCount !== 1 ? 's' : ''})
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-2 mb-4">
                              {lawyer.city && (
                                <div className="flex items-center gap-2 text-sm text-text-secondary">
                                  <FiMapPin size={14} />
                                  <span>{lawyer.city}</span>
                                </div>
                              )}
                              {lawyer.experienceYears > 0 && (
                                <div className="flex items-center gap-2 text-sm text-text-secondary">
                                  <FiBriefcase size={14} />
                                  <span>{lawyer.experienceYears} years experience</span>
                                </div>
                              )}
                              {lawyer.specialization && lawyer.specialization.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {lawyer.specialization.slice(0, 3).map((spec, idx) => (
                                    <Badge key={idx} size="sm" variant="secondary">
                                      {spec}
                                    </Badge>
                                  ))}
                                  {lawyer.specialization.length > 3 && (
                                    <Badge size="sm" variant="secondary">
                                      +{lawyer.specialization.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Footer with Price and CTA */}
                            <div className="flex items-center justify-between pt-4 border-t border-border">
                              <div>
                                <div className="text-xs text-text-secondary mb-1">Hourly Rate</div>
                                <div className="text-xl font-bold text-text-primary">
                                  ${lawyer.hourlyRate || 0}
                                  <span className="text-sm font-normal text-text-secondary">/hr</span>
                                </div>
                              </div>
                              <Button size="sm" variant="primary" className="flex-shrink-0">
                                View Profile
                              </Button>
                            </div>
                          </div>
                        </Link>
                      </Card>
                    ))}
                  </div>
                )}
                {meta ? (
                  <Pagination
                    className="mt-6"
                    meta={meta}
                    onPageChange={setPage}
                  />
                ) : null}
              </StateHandler>
            </div>
        </div>
      </div>
    </div>
  );
}
