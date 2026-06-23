import { useMemo } from "react";
import { lawyerApi } from "../../services/lawyer.api";
import { Card, Badge, StateHandler, Avatar } from "../../components/ui";
import { useStateHandler } from "../../hooks/useStateHandler";
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
              i < rounded ? "text-warning fill-warning" : "text-text-muted/40"
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

function RatingBar({ stars, count, total }) {
  const pct = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3 text-xs text-text-muted tabular-nums">{stars}</span>
      <FiStar className="w-3.5 h-3.5 text-warning fill-warning shrink-0" />
      <div className="flex-1 h-2 rounded-full bg-surface overflow-hidden">
        <div
          className="h-full rounded-full bg-warning transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-xs text-text-muted text-right tabular-nums">{count}</span>
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
    <div className="rounded-xl border border-card-border bg-surface/30 p-4 sm:p-5 transition-colors hover:bg-surface/50">
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
                <p className="text-sm font-semibold text-text-primary m-0 truncate">
                  {clientLabel}
                </p>
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
  const { loading, error, data, retry } = useStateHandler(async () => {
    const res = await lawyerApi.getMyReviews({});
    return res.data || [];
  });

  const reviews = data || [];

  const stats = useMemo(() => {
    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    const average = total > 0 ? sum / total : 0;
    const distribution = [5, 4, 3, 2, 1].map(
      (stars) => reviews.filter((r) => r.rating === stars).length
    );
    const disputed = reviews.filter((r) => r.isDisputed).length;
    const fiveStar = distribution[0];

    return { total, average, distribution, disputed, fiveStar };
  }, [reviews]);

  return (
    <StateHandler loading={loading} error={error} retry={retry}>
      <div className="flex flex-col min-h-0">
        {/* Page header */}
        <div className="shrink-0 flex items-start gap-3 mb-4 sm:mb-6">
          <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
            <FiStar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-text-primary leading-tight">
              Client Reviews
            </h1>
            <p className="text-xs sm:text-sm text-text-muted mt-1 max-w-2xl">
              See what clients are saying about your consultations and track your reputation over
              time.
            </p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 sm:mb-6">
          <Card padding="p-4" className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-warning/10 text-warning">
              <FiStar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-text-primary leading-none m-0 tabular-nums">
                {stats.average.toFixed(1)}
              </p>
              <p className="text-xs text-text-muted mt-1 m-0">Average rating</p>
            </div>
          </Card>

          <Card padding="p-4" className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <FiMessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-text-primary leading-none m-0 tabular-nums">
                {stats.total}
              </p>
              <p className="text-xs text-text-muted mt-1 m-0">Total reviews</p>
            </div>
          </Card>

          <Card padding="p-4" className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-success/10 text-success">
              <FiTrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-text-primary leading-none m-0 tabular-nums">
                {stats.fiveStar}
              </p>
              <p className="text-xs text-text-muted mt-1 m-0">5-star reviews</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Rating breakdown */}
          <Card
            title="Rating breakdown"
            subtitle="Distribution across all reviews"
            padding="p-4 sm:p-5"
            className="lg:col-span-1"
          >
            {stats.total === 0 ? (
              <p className="text-sm text-text-muted m-0">No ratings yet.</p>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-card-border">
                  <StarRating rating={stats.average} size="lg" showValue />
                  <span className="text-xs text-text-muted">
                    based on {stats.total} review{stats.total === 1 ? "" : "s"}
                  </span>
                </div>
                {[5, 4, 3, 2, 1].map((stars, i) => (
                  <RatingBar
                    key={stars}
                    stars={stars}
                    count={stats.distribution[i]}
                    total={stats.total}
                  />
                ))}
                {stats.disputed > 0 && (
                  <p className="text-xs text-warning mt-3 mb-0">
                    {stats.disputed} disputed review{stats.disputed === 1 ? "" : "s"}
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* Reviews list */}
          <Card
            title="All reviews"
            subtitle={
              stats.total > 0
                ? `${stats.total} review${stats.total === 1 ? "" : "s"} from clients`
                : "Reviews appear after completed consultations"
            }
            padding="p-4 sm:p-5"
            className="lg:col-span-2"
          >
            {reviews.length === 0 ? (
              <div className="text-center py-10 sm:py-14">
                <div className="inline-flex p-3 rounded-2xl bg-warning/10 text-warning mb-4">
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
                {reviews.map((review) => (
                  <ReviewCard key={review._id} review={review} />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </StateHandler>
  );
}
