import { useEffect, useState } from "react";
import { lawyerApi } from "../../services/lawyer.api";
import { useTheme } from "../../context/ThemeContext";
import { Link } from "react-router-dom";
import { Navbar } from "../../components/layout";
import { Input, Button, Card } from "../../components/ui";

export default function LawyerSearch() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();

  async function load(params = {}) {
    setLoading(true);
    try {
      const res = await lawyerApi.search(params);
      setItems(res.data);
      setMeta(res.meta);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      load({ q, city, sort: "rating", page: 1, limit: 10 });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [q, city]);

  const styles = {
    container: {
      padding: '24px',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      marginBottom: '32px'
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      marginBottom: '8px',
      color: colors.text.primary
    },
    subtitle: {
      fontSize: '16px',
      color: colors.text.secondary
    },
    searchCard: {
      marginBottom: '32px'
    },
    searchRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '24px'
    },
    lawyerCard: {
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      backgroundColor: colors.card,
      padding: '24px',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    lawyerName: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '8px',
      color: colors.text.primary
    },
    lawyerInfo: {
      fontSize: '14px',
      color: colors.text.secondary,
      marginBottom: '4px'
    },
    rating: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginBottom: '16px'
    },
    loadingContainer: {
      textAlign: 'center',
      padding: '48px'
    },
    spinner: {
      width: '32px',
      height: '32px',
      border: '3px solid ' + colors.border,
      borderTop: '3px solid ' + colors.button.primary,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 16px'
    },
    emptyState: {
      textAlign: 'center',
      padding: '48px',
      color: colors.text.secondary
    }
  };

  return (
    <>
    <Navbar />
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Find a Lawyer</h1>
        <p style={styles.subtitle}>Search and connect with qualified lawyers</p>
      </div>

      <Card style={styles.searchCard}>
        <div style={styles.searchRow}>
          <Input
            placeholder="Search by name, specialization..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            containerStyle={{ marginBottom: 0 }}
          />
          <Input
            placeholder="City..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            containerStyle={{ marginBottom: 0 }}
          />
        </div>
      </Card>

      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={{ color: colors.text.secondary }}>Searching lawyers...</p>
        </div>
      ) : (
        <>
          <div style={styles.grid}>
            {items.map((lawyer) => (
              <div key={lawyer._id} style={styles.lawyerCard}>
                <div>
                  <h3 style={styles.lawyerName}>{lawyer.fullName || "Lawyer"}</h3>
                  <div style={styles.rating}>
                    <span>★</span>
                    <span>{lawyer.ratingAvg ? lawyer.ratingAvg.toFixed(1) : "0.0"}</span>
                    {lawyer.ratingCount && <span>({lawyer.ratingCount} reviews)</span>}
                  </div>
                  <p style={styles.lawyerInfo}>
                    📍 {lawyer.city || "Location not specified"}
                  </p>
                  <p style={styles.lawyerInfo}>
                    💼 {lawyer.experienceYears} years experience
                  </p>
                  <p style={styles.lawyerInfo}>
                    ⚖️ {lawyer.specialization && lawyer.specialization.length > 0 
                      ? lawyer.specialization.join(", ") 
                      : "General practice"}
                  </p>
                  <p style={{ ...styles.lawyerInfo, fontSize: '16px', fontWeight: 'bold', color: colors.text.primary }}>
                    ${lawyer.hourlyRate}/hour
                  </p>
                </div>
                <Link to={`/lawyers/${lawyer.userId}`}>
                  <Button fullWidth style={{ marginTop: '16px' }}>
                    View Profile
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          {items.length === 0 && !loading && (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: colors.text.primary }}>
                No lawyers found
              </h3>
              <p>Try adjusting your search criteria</p>
            </div>
          )}

          {meta && meta.total > 0 && (
            <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '14px', color: colors.text.secondary }}>
              Showing {items.length} of {meta.total} lawyers
            </div>
          )}
        </>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
    </>
  );
}
