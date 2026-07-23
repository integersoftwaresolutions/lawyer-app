import { FiStar } from "react-icons/fi";
import { clientApi } from "../../services/client.api";
import { Badge, Card, PageHeader, PageShell, StateHandler } from "../../components/ui";
import { useStateHandler } from "../../hooks/useStateHandler";

export default function ClientReviewsPage() {
  const { loading, error, data, retry } = useStateHandler(
    async () => {
      const res = await clientApi.getMyReviews({});
      return res.data || [];
    }
  );

  const reviews = data || [];

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderStars = (rating) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  return (
    <StateHandler loading={loading} error={error} retry={retry}>
      <PageShell>
        <PageHeader
          icon={FiStar}
          title="My Reviews"
          subtitle="Reviews you've given to lawyers after consultations"
        />

        <Card>
          {reviews.length === 0 ? (
            <div className="text-center py-10 text-text-secondary">
              <p className="m-0">You haven&apos;t written any reviews yet.</p>
              <p className="text-sm mt-2 mb-0">
                Complete a consultation to leave a review.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.map((review) => (
                <div
                  key={review._id}
                  className="border border-card-border rounded-lg p-4 bg-surface"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-warning text-lg mb-1">
                        {renderStars(review.rating)}
                      </div>
                      <div className="text-text-secondary text-xs">
                        Lawyer: {review.lawyerUserId?.email || "N/A"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted text-xs">
                        {formatDate(review.createdAt)}
                      </span>
                      {review.isDisputed && <Badge variant="warning">Disputed</Badge>}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-text-primary m-0 text-sm">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </PageShell>
    </StateHandler>
  );
}
