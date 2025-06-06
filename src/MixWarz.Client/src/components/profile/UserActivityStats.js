import React, { useState, useEffect } from "react";
import { Card, Row, Col, Badge, Table, Spinner, Alert } from "react-bootstrap";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { getUserStatistics } from "../../services/userActivityService";
import "./UserActivityStyles.css";
import "./ActivityDashboardFix.css";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const UserActivityStats = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getUserStatistics();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching user statistics:", err);
        setError("Failed to load activity statistics. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!stats) {
    return <Alert variant="info">No activity data available.</Alert>;
  }

  // Prepare data for charts
  const distributionData = {
    labels: Object.keys(stats.activityTypeDistribution || {}),
    datasets: [
      {
        data: Object.values(stats.activityTypeDistribution || {}),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
          "#8AC249",
          "#EA5545",
          "#F46A9B",
          "#EF9B20",
        ],
        hoverBackgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
          "#8AC249",
          "#EA5545",
          "#F46A9B",
          "#EF9B20",
        ],
      },
    ],
  };

  // Prepare weekly data
  const weeklyData = stats.weeklyStats || [];
  const labels = weeklyData.map((item) => item.dayName);
  const counts = weeklyData.map((item) => item.count);

  const frequencyData = {
    labels,
    datasets: [
      {
        label: "Activities",
        data: counts,
        backgroundColor: "rgba(0, 200, 255, 0.6)",
        borderColor: "#00c8ff",
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "white",
          font: {
            family: "var(--font-family-sans)",
            size: 12,
            weight: "var(--font-weight-medium)",
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || "";
            const value = context.raw || 0;
            return `${label}: ${value} (${(
              (value / stats.totalActivities) *
              100
            ).toFixed(1)}%)`;
          },
        },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
          font: {
            family: "var(--font-family-sans)",
            weight: "var(--font-weight-medium)",
          },
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
      x: {
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
          font: {
            family: "var(--font-family-sans)",
            weight: "var(--font-weight-medium)",
          },
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "white",
          font: {
            family: "var(--font-family-sans)",
            weight: "var(--font-weight-medium)",
          },
        },
      },
    },
  };

  return (
    <div className="user-activity-stats">
      <h3
        className="mb-4 fw-semibold"
        style={{
          color: "#ffffff",
          fontFamily: "'Inter', sans-serif",
          fontWeight: 600,
          fontSize: "1.75rem",
          letterSpacing: "0.01em",
        }}
      >
        Activity Dashboard
      </h3>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center h-100 border-0 shadow-sm activity-stat-card">
            <Card.Body>
              <h2
                className="stats-number"
                style={{
                  color: "#00c8ff",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: "2.2rem",
                }}
              >
                {stats.totalActivities || 0}
              </h2>
              <Card.Text
                className="stats-label"
                style={{
                  color: "rgba(255, 255, 255, 0.9)",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                }}
              >
                Total Activities
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center h-100 border-0 shadow-sm activity-stat-card">
            <Card.Body>
              <h2
                className="stats-number"
                style={{
                  color: "#00c8ff",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: "2.2rem",
                }}
              >
                {stats.mostFrequentActivityType || "None"}
              </h2>
              <Card.Text
                className="stats-label"
                style={{
                  color: "rgba(255, 255, 255, 0.9)",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                }}
              >
                Most Frequent Activity
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center h-100 border-0 shadow-sm activity-stat-card">
            <Card.Body>
              <h2
                className="stats-number"
                style={{
                  color: "#00c8ff",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: "2.2rem",
                }}
              >
                {stats.activitiesPerDay
                  ? stats.activitiesPerDay.toFixed(1)
                  : "0.0"}
              </h2>
              <Card.Text
                className="stats-label"
                style={{
                  color: "rgba(255, 255, 255, 0.9)",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                }}
              >
                Daily Average
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className="text-center h-100 border-0 shadow-sm activity-stat-card">
            <Card.Body>
              <h2
                className="stats-number"
                style={{
                  color: "#00c8ff",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                  fontSize: "2.2rem",
                }}
              >
                {stats.engagementScore ? stats.engagementScore.toFixed(0) : "0"}
              </h2>
              <Card.Text
                className="stats-label"
                style={{
                  color: "rgba(255, 255, 255, 0.9)",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                }}
              >
                Engagement Score
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row className="mb-4">
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Header
              className="bg-tertiary border-0 fw-medium"
              style={{
                color: "#00c8ff",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
              }}
            >
              Activity Distribution
            </Card.Header>
            <Card.Body>
              <div style={{ height: "300px" }}>
                <Pie data={distributionData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Header
              className="bg-tertiary border-0 fw-medium"
              style={{
                color: "#00c8ff",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
              }}
            >
              Activity Frequency (Last 30 Days)
            </Card.Header>
            <Card.Body>
              <div style={{ height: "300px" }}>
                <Bar data={frequencyData} options={barChartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Activity Breakdown */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header
          className="bg-tertiary border-0 fw-medium"
          style={{
            color: "#00c8ff",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
          }}
        >
          Activity Breakdown
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4} className="mb-3">
              <h5
                className="text-secondary fw-medium"
                style={{
                  color: "rgba(255, 255, 255, 0.9) !important",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                }}
              >
                Logins
              </h5>
              <h3
                className="text-accent-primary fw-semibold"
                style={{
                  color: "#00c8ff",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                }}
              >
                {stats.loginCount}
              </h3>
            </Col>
            <Col md={4} className="mb-3">
              <h5
                className="text-secondary fw-medium"
                style={{
                  color: "rgba(255, 255, 255, 0.9) !important",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                }}
              >
                Submissions
              </h5>
              <h3
                className="text-accent-primary fw-semibold"
                style={{
                  color: "#00c8ff",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                }}
              >
                {stats.submissionCount}
              </h3>
            </Col>
            <Col md={4} className="mb-3">
              <h5
                className="text-secondary fw-medium"
                style={{
                  color: "rgba(255, 255, 255, 0.9) !important",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                }}
              >
                Purchases
              </h5>
              <h3
                className="text-accent-primary fw-semibold"
                style={{
                  color: "#00c8ff",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                }}
              >
                {stats.purchaseCount}
              </h3>
            </Col>
            <Col md={4} className="mb-3">
              <h5
                className="text-secondary fw-medium"
                style={{
                  color: "rgba(255, 255, 255, 0.9) !important",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                }}
              >
                Blog Interactions
              </h5>
              <h3
                className="text-accent-primary fw-semibold"
                style={{
                  color: "#00c8ff",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                }}
              >
                {stats.blogInteractionCount}
              </h3>
            </Col>
            <Col md={4} className="mb-3">
              <h5
                className="text-secondary fw-medium"
                style={{
                  color: "rgba(255, 255, 255, 0.9) !important",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                }}
              >
                Profile Updates
              </h5>
              <h3
                className="text-accent-primary fw-semibold"
                style={{
                  color: "#00c8ff",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                }}
              >
                {stats.profileUpdateCount}
              </h3>
            </Col>
            <Col md={4} className="mb-3">
              <h5
                className="text-secondary fw-medium"
                style={{
                  color: "rgba(255, 255, 255, 0.9) !important",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                }}
              >
                First Activity
              </h5>
              <h3
                className="text-accent-primary fw-semibold"
                style={{
                  color: "#00c8ff",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 600,
                }}
              >
                {new Date(stats.firstActivityDate).toLocaleDateString()}
              </h3>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Recent Activities */}
      <Card className="border-0 shadow-sm">
        <Card.Header
          className="bg-tertiary border-0 fw-medium"
          style={{
            color: "#00c8ff",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
          }}
        >
          Recent Activities
        </Card.Header>
        <Card.Body>
          <Table
            responsive
            hover
            variant="dark"
            style={{
              color: "rgba(255, 255, 255, 0.9)",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <thead>
              <tr>
                <th style={{ color: "#00c8ff", fontWeight: 600 }}>Type</th>
                <th style={{ color: "#00c8ff", fontWeight: 600 }}>
                  Description
                </th>
                <th style={{ color: "#00c8ff", fontWeight: 600 }}>
                  Related Entity
                </th>
                <th style={{ color: "#00c8ff", fontWeight: 600 }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentActivities?.map((activity) => (
                <tr key={activity.id}>
                  <td>
                    <Badge bg="primary" style={{ fontWeight: 500 }}>
                      {activity.activityTypeDisplay}
                    </Badge>
                  </td>
                  <td>{activity.description || "-"}</td>
                  <td>
                    {activity.relatedEntityType && activity.relatedEntityId
                      ? `${activity.relatedEntityType} #${activity.relatedEntityId}`
                      : "-"}
                  </td>
                  <td>{activity.timeAgo}</td>
                </tr>
              ))}
              {(!stats.recentActivities ||
                stats.recentActivities.length === 0) && (
                <tr>
                  <td colSpan="4" className="text-center">
                    No recent activities
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default UserActivityStats;
