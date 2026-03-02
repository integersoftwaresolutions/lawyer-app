import { useState, useEffect } from "react";
import { lawyerApi } from "../../services/lawyer.api";
import { Card, Badge } from "../../components/ui";

export default function LawyerReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const res = await lawyerApi.getMyReviews({});
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

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  if (loading) {
    return <div className="p-6 text-text-secondary">Loading...</div>;
  }

  return (
    <div>
      <Card className="mb-6">
        <div className="flex justify-around text-center">
          <div>
            <div className="text-[36px] font-bold text-text-primary">
              {averageRating}
            </div>
            <div className="text-warning text-xl mb-1">
              {renderStars(Math.round(parseFloat(averageRating)))}
            </div>
            <div className="text-text-secondary">Average Rating</div>
          </div>
          <div>
            <div className="text-[36px] font-bold text-text-primary">
              {reviews.length}
            </div>
            <div className="text-text-secondary">Total Reviews</div>
          </div>
        </div>
      </Card>

      <Card title="Client Reviews">
        {reviews.length === 0 ? (
          <div className="text-center py-10 text-text-secondary">
            <p>No reviews yet.</p>
            <p className="text-sm mt-2">
              Complete consultations to receive reviews from clients.
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
                      Client: {review.clientId?.email || "Anonymous"}
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
                    "{review.comment}"
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
