import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Navbar,
  Container,
  Nav,
  NavDropdown,
  Badge,
  Image,
} from "react-bootstrap";
import { FaShoppingCart, FaUserCircle, FaCog } from "react-icons/fa";
import { logout } from "../../store/authSlice";
import Logo from "../common/Logo";
import "./NavbarStyles.css";

const MainNavbar = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cartItemsCount = items.reduce(
    (total, item) => total + item.quantity,
    0
  );
  const isAdmin = user?.roles?.includes("Admin");

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <Navbar expand="lg" sticky="top" className="py-3" variant="dark">
      <Container>
        <Navbar.Brand as="div" className="p-0">
          <Logo width={150} />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <Nav className="mx-auto">
            {isAuthenticated ? (
              <Nav.Link as={Link} to="/competitions" className="mx-2 px-3">
                Competitions
              </Nav.Link>
            ) : (
              <Nav.Link 
                as={Link} 
                to="/login" 
                className="mx-2 px-3"
                title="Login required to view competitions"
              >
                Competitions <small className="text-muted">(Login Required)</small>
              </Nav.Link>
            )}
            <Nav.Link as={Link} to="/products" className="mx-2 px-3">
              Marketplace
            </Nav.Link>
            {/* FUTURE: Community Page - Temporarily disabled
            <Nav.Link as={Link} to="/community" className="mx-2 px-3">
              Community
            </Nav.Link>
            */}
            <Nav.Link as={Link} to="/blog" className="mx-2 px-3">
              Blog
            </Nav.Link>
          </Nav>

          <Nav className="d-flex align-items-center">
            <Nav.Link
              as={Link}
              to="/cart"
              className="position-relative me-3"
              aria-label="Shopping cart"
            >
              <FaShoppingCart size={20} />
              {cartItemsCount > 0 && (
                <Badge
                  bg="danger"
                  pill
                  className="position-absolute top-0 start-100 translate-middle"
                >
                  {cartItemsCount}
                </Badge>
              )}
            </Nav.Link>

            {isAuthenticated ? (
              <NavDropdown
                title={
                  <div className="d-inline-block">
                    {user?.profilePictureUrl ? (
                      <Image
                        src={user.profilePictureUrl}
                        alt={user.username}
                        roundedCircle
                        className="navbar-profile-image"
                        width="30"
                        height="30"
                      />
                    ) : (
                      <FaUserCircle size={22} className="user-icon" />
                    )}
                  </div>
                }
                id="user-dropdown"
                align="end"
                className="no-caret custom-dropdown"
                menuVariant="dark"
                style={{
                  "--bs-dropdown-bg": "var(--bg-secondary)",
                  "--bs-dropdown-link-color": "var(--text-primary)",
                  "--bs-dropdown-link-hover-color": "var(--accent-primary)",
                  "--bs-dropdown-link-hover-bg": "var(--bg-tertiary)",
                  "--bs-dropdown-link-active-color": "var(--accent-primary)",
                  "--bs-dropdown-link-active-bg": "var(--bg-tertiary)",
                  "--bs-dropdown-divider-bg": "rgba(255,255,255,0.1)",
                }}
              >
                <div
                  className="px-3 py-2 small"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Signed in as{" "}
                  <strong style={{ color: "var(--text-primary)" }}>
                    {user?.username}
                  </strong>
                </div>
                <NavDropdown.Divider />
                <NavDropdown.Item
                  as={Link}
                  to="/profile"
                  className="dropdown-item"
                >
                  My Profile
                </NavDropdown.Item>
                <NavDropdown.Item
                  as={Link}
                  to="/profile/settings"
                  className="dropdown-item"
                >
                  <FaCog
                    className="me-2"
                    style={{ color: "var(--accent-primary)" }}
                  />
                  Profile Settings
                </NavDropdown.Item>
                <NavDropdown.Item
                  as={Link}
                  to="/submissions"
                  className="dropdown-item"
                >
                  My Submissions
                </NavDropdown.Item>
                <NavDropdown.Item
                  as={Link}
                  to="/purchases"
                  className="dropdown-item"
                >
                  My Purchases
                </NavDropdown.Item>
                {isAdmin && (
                  <>
                    <NavDropdown.Divider />
                    <NavDropdown.Item
                      as={Link}
                      to="/admin"
                      className="dropdown-item"
                    >
                      Admin Dashboard
                    </NavDropdown.Item>
                  </>
                )}
                <NavDropdown.Divider />
                <NavDropdown.Item
                  onClick={handleLogout}
                  className="dropdown-item logout-item"
                >
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Nav.Link
                as={Link}
                to="/login"
                className="btn btn-sm btn-primary ms-2 px-3"
              >
                Login / Sign Up
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default MainNavbar;
