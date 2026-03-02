import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { clientApi } from "../../services/client.api";
import { Card, Badge } from "../../components/ui";

export default function ClientReviewsPage() {
  const { colors } = useTheme();
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
    return <div style={{ padding: "24px", color: colors.text.secondary }}>Loading...</div>;
  }

  return (
    <div>
      <Card title="My Reviews" subtitle="Reviews you've given to lawyers">
        {reviews.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: colors.text.secondary }}>
            <p>You haven't written any reviews yet.</p>
            <p style={{ fontSize: "14px", marginTop: "8px" }}>
              Complete a consultation to leave a review.
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
                      Lawyer: {review.lawyerUserId?.email || "N/A"}
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
