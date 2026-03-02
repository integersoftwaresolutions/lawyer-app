import { useState, useEffect } from "react";
import { clientApi } from "../../services/client.api";
import { Card, Badge } from "../../components/ui";

export default function ClientReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const res = await clientApi.getMyReviews({});
      setReviews(res.data || []);
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return <div className="p-6 text-text-secondary">Loading...</div>;
  }

  return (
    <div>
      <Card title="My Reviews" subtitle="Reviews you've given to lawyers">
        {reviews.length === 0 ? (
          <div className="text-center py-10 text-text-secondary">
            <p>You haven't written any reviews yet.</p>
            <p className="text-sm mt-2">
              Complete a consultation to leave a review.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map((review) => (
              <div
                key={review._id}
                className="border border-border rounded-lg p-4"
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
    </div>
  );
}
