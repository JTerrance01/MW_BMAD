import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Badge,
  Spinner,
  Tabs,
  Tab,
} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  FaUsers,
  FaBoxOpen,
  FaTrophy,
  FaShoppingCart,
  FaDollarSign,
  FaChartLine,
  FaUserPlus,
  FaCalendarAlt,
  FaChartBar,
  FaStar,
} from "react-icons/fa";
import { Line, Bar, Pie } from "react-chartjs-2";
import { fetchAdminStats } from "../../store/adminSlice";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register the chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboardPage = () => {
  const dispatch = useDispatch();
  const { stats, loading, error } = useSelector((state) => state.admin);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    dispatch(fetchAdminStats());
  }, [dispatch]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Default stats for initial display
  const displayStats = {
    usersCount: stats?.usersCount || 0,
    productsCount: stats?.productsCount || 0,
    competitionsCount: stats?.competitionsCount || 0,
    ordersCount: stats?.ordersCount || 0,
    totalRevenue: stats?.totalRevenue || 0,
    salesThisMonth: stats?.salesThisMonth || 0,
    revenueThisMonth: stats?.revenueThisMonth || 0,
    averageOrderValue: stats?.averageOrderValue || 0,
    newUsersThisMonth: stats?.newUsersThisMonth || 0,
    activeCompetitions: stats?.activeCompetitions || 0,
    totalSubmissions: stats?.totalSubmissions || 0,
    submissionsThisMonth: stats?.submissionsThisMonth || 0,
    blogArticlesCount: stats?.blogArticlesCount || 0,
    userRegistrationsByMonth: stats?.userRegistrationsByMonth || {},
    ordersByMonth: stats?.ordersByMonth || {},
    revenueByMonth: stats?.revenueByMonth || {},
    recentOrders: stats?.recentOrders || [],
    topProducts: stats?.topProducts || [],
    topUsers: stats?.topUsers || [],
    topCategories: stats?.topCategories || [],
  };

  // Chart configurations
  const getMonthlyRevenueChartData = () => {
    const labels = Object.keys(displayStats.revenueByMonth);
    const data = {
      labels,
      datasets: [
        {
          label: "Monthly Revenue",
          data: Object.values(displayStats.revenueByMonth),
          fill: false,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          tension: 0.4,
        },
      ],
    };
    return data;
  };

  const getMonthlyOrdersChartData = () => {
    const labels = Object.keys(displayStats.ordersByMonth);
    const data = {
      labels,
      datasets: [
        {
          label: "Monthly Orders",
          data: Object.values(displayStats.ordersByMonth),
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderWidth: 1,
        },
      ],
    };
    return data;
  };

  const getUserRegistrationsChartData = () => {
    const labels = Object.keys(displayStats.userRegistrationsByMonth);
    const data = {
      labels,
      datasets: [
        {
          label: "New Users",
          data: Object.values(displayStats.userRegistrationsByMonth),
          backgroundColor: "rgba(153, 102, 255, 0.5)",
          borderWidth: 1,
        },
      ],
    };
    return data;
  };

  const getTopCategoriesChartData = () => {
    const labels = displayStats.topCategories.map((cat) => cat.name);
    const data = {
      labels,
      datasets: [
        {
          label: "Revenue by Category",
          data: displayStats.topCategories.map((cat) => cat.totalRevenue),
          backgroundColor: [
            "rgba(255, 99, 132, 0.6)",
            "rgba(54, 162, 235, 0.6)",
            "rgba(255, 206, 86, 0.6)",
            "rgba(75, 192, 192, 0.6)",
            "rgba(153, 102, 255, 0.6)",
          ],
          borderWidth: 1,
        },
      ],
    };
    return data;
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            if (context.dataset.label === "Monthly Revenue") {
              return `Revenue: ${formatCurrency(context.raw)}`;
            }
            return `${context.dataset.label}: ${context.raw}`;
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading statistics...</span>
        </Spinner>
        <p className="mt-3">Loading dashboard statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="mb-4">Admin Dashboard</h1>
        <Card bg="danger" text="white" className="mb-4">
          <Card.Body>
            <Card.Title>Error Loading Statistics</Card.Title>
            <Card.Text>{error}</Card.Text>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="mb-4">Admin Dashboard</h1>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="overview" title="Overview">
          <div>
            <Row className="mb-4">
              <Col md={3} className="mb-3 mb-md-0">
                <Card bg="primary" text="white" className="h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <Card.Title>Users</Card.Title>
                        <h3>{displayStats.usersCount}</h3>
                        <small>
                          +{displayStats.newUsersThisMonth} this month
                        </small>
                      </div>
                      <FaUsers size={32} />
                    </div>
                  </Card.Body>
                  <Card.Footer>
                    <Link
                      to="/admin/users"
                      className="text-white text-decoration-none"
                    >
                      View Users <span>&rarr;</span>
                    </Link>
                  </Card.Footer>
                </Card>
              </Col>

              <Col md={3} className="mb-3 mb-md-0">
                <Card bg="success" text="white" className="h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <Card.Title>Products</Card.Title>
                        <h3>{displayStats.productsCount}</h3>
                        <small>
                          In {displayStats.topCategories.length} categories
                        </small>
                      </div>
                      <FaBoxOpen size={32} />
                    </div>
                  </Card.Body>
                  <Card.Footer>
                    <Link
                      to="/admin/products"
                      className="text-white text-decoration-none"
                    >
                      View Products <span>&rarr;</span>
                    </Link>
                  </Card.Footer>
                </Card>
              </Col>

              <Col md={3} className="mb-3 mb-md-0">
                <Card bg="warning" text="dark" className="h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <Card.Title>Competitions</Card.Title>
                        <h3>{displayStats.competitionsCount}</h3>
                        <small>
                          {displayStats.activeCompetitions} active now
                        </small>
                      </div>
                      <FaTrophy size={32} />
                    </div>
                  </Card.Body>
                  <Card.Footer>
                    <Link
                      to="/admin/competitions"
                      className="text-dark text-decoration-none"
                    >
                      View Competitions <span>&rarr;</span>
                    </Link>
                  </Card.Footer>
                </Card>
              </Col>

              <Col md={3}>
                <Card bg="info" text="white" className="h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <Card.Title>Orders</Card.Title>
                        <h3>{displayStats.ordersCount}</h3>
                        <small>{displayStats.salesThisMonth} this month</small>
                      </div>
                      <FaShoppingCart size={32} />
                    </div>
                  </Card.Body>
                  <Card.Footer>
                    <Link
                      to="/admin/orders"
                      className="text-white text-decoration-none"
                    >
                      View Orders <span>&rarr;</span>
                    </Link>
                  </Card.Footer>
                </Card>
              </Col>
            </Row>

            <Row className="mb-4">
              <Col md={3} className="mb-3 mb-md-0">
                <Card bg="dark" text="white" className="h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <Card.Title>Total Revenue</Card.Title>
                        <h3>{formatCurrency(displayStats.totalRevenue)}</h3>
                        <small>
                          Avg. order:{" "}
                          {formatCurrency(displayStats.averageOrderValue)}
                        </small>
                      </div>
                      <FaDollarSign size={32} />
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3} className="mb-3 mb-md-0">
                <Card bg="secondary" text="white" className="h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <Card.Title>Monthly Sales</Card.Title>
                        <h3>{formatCurrency(displayStats.revenueThisMonth)}</h3>
                        <small>From {displayStats.salesThisMonth} orders</small>
                      </div>
                      <FaChartLine size={32} />
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3} className="mb-3 mb-md-0">
                <Card bg="light" text="dark" className="h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <Card.Title>Submissions</Card.Title>
                        <h3>{displayStats.totalSubmissions}</h3>
                        <small>
                          {displayStats.submissionsThisMonth} this month
                        </small>
                      </div>
                      <FaUserPlus size={32} />
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col md={3}>
                <Card bg="danger" text="white" className="h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <Card.Title>Blog Articles</Card.Title>
                        <h3>{displayStats.blogArticlesCount}</h3>
                        <small>Engaging content</small>
                      </div>
                      <FaCalendarAlt size={32} />
                    </div>
                  </Card.Body>
                  <Card.Footer>
                    <Link
                      to="/admin/blog"
                      className="text-white text-decoration-none"
                    >
                      Manage Blog <span>&rarr;</span>
                    </Link>
                  </Card.Footer>
                </Card>
              </Col>
            </Row>

            <Row>
              <Col lg={8} className="mb-4">
                <Card bg="dark" text="light">
                  <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
                    <span>Revenue Trends</span>
                    <FaChartLine />
                  </Card.Header>
                  <Card.Body>
                    <div style={{ height: "300px" }}>
                      <Line
                        data={getMonthlyRevenueChartData()}
                        options={chartOptions}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={4} className="mb-4">
                <Card bg="dark" text="light">
                  <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
                    <span>Revenue by Category</span>
                    <FaChartBar />
                  </Card.Header>
                  <Card.Body>
                    <div style={{ height: "300px" }}>
                      <Pie
                        data={getTopCategoriesChartData()}
                        options={chartOptions}
                      />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row>
              <Col md={6} className="mb-4">
                <Card bg="dark" text="light">
                  <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
                    <span>Recent Orders</span>
                    <FaShoppingCart />
                  </Card.Header>
                  <Card.Body>
                    {displayStats.recentOrders.length > 0 ? (
                      <Table className="table-hover" responsive variant="dark">
                        <thead>
                          <tr>
                            <th>Order ID</th>
                            <th>User</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayStats.recentOrders.map((order) => (
                            <tr key={order.id}>
                              <td>#{order.id}</td>
                              <td>{order.userName}</td>
                              <td>
                                {new Date(order.orderDate).toLocaleDateString()}
                              </td>
                              <td>{formatCurrency(order.total)}</td>
                              <td>
                                <Badge
                                  bg={
                                    order.status === "Completed"
                                      ? "success"
                                      : order.status === "Processing"
                                      ? "warning"
                                      : "primary"
                                  }
                                >
                                  {order.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <p className="text-center">No recent orders found.</p>
                    )}
                  </Card.Body>
                  <Card.Footer>
                    <Link to="/admin/orders" className="text-decoration-none">
                      View All Orders
                    </Link>
                  </Card.Footer>
                </Card>
              </Col>

              <Col md={6} className="mb-4">
                <Card bg="dark" text="light">
                  <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
                    <span>Top Products</span>
                    <FaStar />
                  </Card.Header>
                  <Card.Body>
                    {displayStats.topProducts.length > 0 ? (
                      <Table className="table-hover" responsive variant="dark">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Sales</th>
                            <th>Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayStats.topProducts.map((product) => (
                            <tr key={product.id}>
                              <td>{product.name}</td>
                              <td>{product.category}</td>
                              <td>{formatCurrency(product.price)}</td>
                              <td>{product.salesCount}</td>
                              <td>{formatCurrency(product.totalRevenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <p className="text-center">No top products found.</p>
                    )}
                  </Card.Body>
                  <Card.Footer>
                    <Link to="/admin/products" className="text-decoration-none">
                      View All Products
                    </Link>
                  </Card.Footer>
                </Card>
              </Col>
            </Row>
          </div>
        </Tab>

        <Tab eventKey="sales" title="Sales Analytics">
          <Row>
            <Col lg={6} className="mb-4">
              <Card bg="dark" text="light">
                <Card.Header className="bg-dark text-white">
                  Monthly Revenue
                </Card.Header>
                <Card.Body>
                  <div style={{ height: "400px" }}>
                    <Line
                      data={getMonthlyRevenueChartData()}
                      options={chartOptions}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6} className="mb-4">
              <Card bg="dark" text="light">
                <Card.Header className="bg-dark text-white">
                  Monthly Orders
                </Card.Header>
                <Card.Body>
                  <div style={{ height: "400px" }}>
                    <Bar
                      data={getMonthlyOrdersChartData()}
                      options={chartOptions}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6} className="mb-4">
              <Card bg="dark" text="light">
                <Card.Header className="bg-dark text-white">
                  Category Revenue Distribution
                </Card.Header>
                <Card.Body>
                  <div style={{ height: "400px" }}>
                    <Pie
                      data={getTopCategoriesChartData()}
                      options={chartOptions}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6} className="mb-4">
              <Card bg="dark" text="light">
                <Card.Header className="bg-dark text-white">
                  Top-Spending Users
                </Card.Header>
                <Card.Body>
                  {displayStats.topUsers.length > 0 ? (
                    <Table className="table-hover" responsive variant="dark">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Orders</th>
                          <th>Total Spent</th>
                          <th>Last Order</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayStats.topUsers.map((user) => (
                          <tr key={user.id}>
                            <td>{user.userName}</td>
                            <td>{user.ordersCount}</td>
                            <td>{formatCurrency(user.totalSpent)}</td>
                            <td>
                              {new Date(
                                user.lastOrderDate
                              ).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  ) : (
                    <p className="text-center">No top users found.</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="users" title="User Activity">
          <Row>
            <Col lg={6} className="mb-4">
              <Card bg="dark" text="light">
                <Card.Header className="bg-dark text-white">
                  New User Registrations
                </Card.Header>
                <Card.Body>
                  <div style={{ height: "400px" }}>
                    <Bar
                      data={getUserRegistrationsChartData()}
                      options={chartOptions}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6} className="mb-4">
              <Card bg="dark" text="light">
                <Card.Header className="bg-dark text-white">
                  User Activity Summary
                </Card.Header>
                <Card.Body>
                  <div className="mb-4">
                    <h5>Total Users: {displayStats.usersCount}</h5>
                    <div className="progress mb-2">
                      <div
                        className="progress-bar bg-primary"
                        style={{
                          width: `${
                            (displayStats.newUsersThisMonth /
                              displayStats.usersCount) *
                            100
                          }%`,
                        }}
                      >
                        {displayStats.newUsersThisMonth} new this month
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h5>Total Submissions: {displayStats.totalSubmissions}</h5>
                    <div className="progress mb-2">
                      <div
                        className="progress-bar bg-success"
                        style={{
                          width: `${
                            (displayStats.submissionsThisMonth /
                              displayStats.totalSubmissions) *
                            100
                          }%`,
                        }}
                      >
                        {displayStats.submissionsThisMonth} new this month
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h5>Competitions: {displayStats.competitionsCount}</h5>
                    <div className="progress mb-2">
                      <div
                        className="progress-bar bg-warning"
                        style={{
                          width: `${
                            (displayStats.activeCompetitions /
                              displayStats.competitionsCount) *
                            100
                          }%`,
                        }}
                      >
                        {displayStats.activeCompetitions} active
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </div>
  );
};

export default AdminDashboardPage;
