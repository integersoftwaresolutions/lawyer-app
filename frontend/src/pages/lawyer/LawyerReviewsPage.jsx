import { useCallback } from "react";
import { lawyerApi } from "../../services/lawyer.api";
import {
  Card,
  Badge,
  StateHandler,
  Avatar,
  PageHeader,
  PageShell,
  Pagination,
  DataList
} from "../../components/ui";
import { useStateHandler } from "../../hooks/useStateHandler";
import { usePaginatedQuery } from "../../hooks/usePaginatedQuery";
import { FiStar, FiMessageSquare, FiTrendingUp } from "react-icons/fi";

function StarRating({ rating, size = "md", showValue = false }) {
  const rounded = Math.round(rating || 0);
  const sizeClass = size === "lg" ? "w-5 h-5" : size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <FiStar
            key={i}
            className={`${sizeClass} ${
              i < rounded ? "text-warning fill-warning" : "text-text-muted"
            }`}
          />
        ))}
      </div>
      {showValue && (
        <span className="text-sm font-semibold text-text-primary tabular-nums">
          {(rating || 0).toFixed(1)}
        </span>
      )}
    </div>
  );
}

function ReviewCard({ review }) {
  const clientLabel =
    review.clientId?.fullName || review.clientId?.email?.split("@")[0] || "Client";

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });

  return (
    <div className="rounded-xl border border-card-border bg-surface p-4 sm:p-5 transition-colors hover:bg-surface-hover">
      <div className="flex items-start gap-3">
        <Avatar
          user={review.clientId}
          name={clientLabel}
          size="sm"
          showBorder
          className="shrink-0"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-text-primary m-0 truncate">{clientLabel}</p>
                {review.isDisputed && (
                  <Badge variant="warning" size="sm">
                    Disputed
                  </Badge>
                )}
              </div>
              <StarRating rating={review.rating} size="sm" />
            </div>
            <span className="text-xs text-text-muted shrink-0">{formatDate(review.createdAt)}</span>
          </div>

          {review.comment ? (
            <p className="text-sm text-text-secondary mt-3 mb-0 leading-relaxed">
              &ldquo;{review.comment}&rdquo;
            </p>
          ) : (
            <p className="text-xs text-text-muted mt-3 mb-0 italic">No written comment</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LawyerReviewsPage() {
  const {
    loading: profileLoading,
    error: profileError,
    data: profileRes,
    retry: retryProfile
  } = useStateHandler(async () => lawyerApi.getMyProfile());

  const fetchReviews = useCallback((params) => lawyerApi.getMyReviews(params), []);
  const { items, meta, setPage, loading, error, retry } = usePaginatedQuery(fetchReviews, {
    defaultLimit: 10
  });

  const profile = profileRes?.data || profileRes || {};
  const average = Number(profile.ratingAvg) || 0;
  const total = Number(profile.ratingCount) || meta?.total || 0;

  return (
    <PageShell>
      <PageHeader
        icon={FiStar}
        title="Client Reviews"
        subtitle="See what clients are saying about your consultations and track your reputation over time"
      />

      <StateHandler
        loading={profileLoading}
        error={profileError}
        retry={retryProfile}
        className="mb-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card padding="p-4" className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-warning-light text-warning">
              <FiStar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-text-primary leading-none m-0 tabular-nums">
                {average.toFixed(1)}
              </p>
              <p className="text-xs text-text-muted mt-1 m-0">Average rating</p>
            </div>
          </Card>

          <Card padding="p-4" className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary-light text-primary">
              <FiMessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-text-primary leading-none m-0 tabular-nums">
                {total}
              </p>
              <p className="text-xs text-text-muted mt-1 m-0">Total reviews</p>
            </div>
          </Card>

          <Card padding="p-4" className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-success-light text-success">
              <FiTrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <StarRating rating={average} size="md" showValue />
              <p className="text-xs text-text-muted mt-1 m-0">Overall score</p>
            </div>
          </Card>
        </div>
      </StateHandler>

      <DataList pagination={<Pagination meta={meta} onPageChange={setPage} />}>
        <StateHandler loading={loading} error={error} retry={retry}>
          <Card
            title="All reviews"
            subtitle={
              total > 0
                ? `${total} review${total === 1 ? "" : "s"} from clients`
                : "Reviews appear after completed consultations"
            }
            padding="p-4 sm:p-5"
          >
            {items.length === 0 ? (
              <div className="text-center py-10 sm:py-14">
                <div className="inline-flex p-3 rounded-2xl bg-warning-light text-warning mb-4">
                  <FiStar className="w-8 h-8" />
                </div>
                <p className="text-base font-medium text-text-primary m-0">No reviews yet</p>
                <p className="text-sm text-text-muted mt-2 mb-0 max-w-sm mx-auto">
                  Complete consultations with clients to start building your reputation and receive
                  feedback here.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {items.map((review) => (
                  <ReviewCard key={review._id} review={review} />
                ))}
              </div>
            )}
          </Card>
        </StateHandler>
      </DataList>
    </PageShell>
  );
}
