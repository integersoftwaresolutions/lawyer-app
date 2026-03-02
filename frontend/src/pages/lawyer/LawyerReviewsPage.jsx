import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { lawyerApi } from "../../services/lawyer.api";
import { Card, Badge } from "../../components/ui";

export default function LawyerReviewsPage() {
  const { colors } = useTheme();
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
    return <div style={{ padding: "24px", color: colors.text.secondary }}>Loading...</div>;
  }

  return (
    <div>
      <Card style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
          <div>
            <div style={{ fontSize: "36px", fontWeight: "bold", color: colors.text.primary }}>
              {averageRating}
            </div>
            <div style={{ color: "#ffc107", fontSize: "20px", marginBottom: "4px" }}>
              {renderStars(Math.round(parseFloat(averageRating)))}
            </div>
            <div style={{ color: colors.text.secondary }}>Average Rating</div>
          </div>
          <div>
            <div style={{ fontSize: "36px", fontWeight: "bold", color: colors.text.primary }}>
              {reviews.length}
            </div>
            <div style={{ color: colors.text.secondary }}>Total Reviews</div>
          </div>
        </div>
      </Card>

      <Card title="Client Reviews">
        {reviews.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: colors.text.secondary }}>
            <p>No reviews yet.</p>
            <p style={{ fontSize: "14px", marginTop: "8px" }}>
              Complete consultations to receive reviews from clients.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {reviews.map((review) => (
              <div
                key={review._id}
                style={{
                  border: `1px solid ${colors.border}`,
                  borderRadius: "8px",
                  padding: "16px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <div style={{ color: "#ffc107", fontSize: "18px", marginBottom: "4px" }}>
                      {renderStars(review.rating)}
                    </div>
                    <div style={{ color: colors.text.secondary, fontSize: "13px" }}>
                      Client: {review.clientId?.email || "Anonymous"}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: colors.text.muted, fontSize: "13px" }}>
                      {formatDate(review.createdAt)}
                    </span>
                    {review.isDisputed && <Badge variant="warning">Disputed</Badge>}
                  </div>
                </div>
                {review.comment && (
                  <p style={{ color: colors.text.primary, margin: 0, fontSize: "14px" }}>
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
