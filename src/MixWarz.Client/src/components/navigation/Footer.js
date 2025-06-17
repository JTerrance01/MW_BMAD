import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaDiscord,
  FaEnvelope,
} from "react-icons/fa";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto py-5">
      <Container>
        <Row className="mb-4">
          <Col lg={4} md={6} className="mb-4 mb-md-0">
            <h5 className="text-uppercase mb-4 fw-bold">MixWarz</h5>
            <p className="mb-4 pe-lg-5">
              The ultimate platform for music producers to compete, showcase
              their skills, and discover premium sound resources.
            </p>
            <div className="d-flex gap-3 mb-4">
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="Discord"
              >
                <FaDiscord size={20} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="Instagram"
              >
                <FaInstagram size={20} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="Twitter"
              >
                <FaTwitter size={20} />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="YouTube"
              >
                <FaYoutube size={20} />
              </a>
            </div>
            <div className="newsletter">
              <h6 className="mb-3">Stay Updated</h6>
              <div className="d-flex">
                <input
                  type="email"
                  className="form-control me-2"
                  placeholder="Your email"
                  aria-label="Subscribe to newsletter"
                />
                <button className="btn btn-primary" aria-label="Subscribe">
                  <FaEnvelope />
                </button>
              </div>
            </div>
          </Col>
          <Col lg={2} md={6} className="mb-4 mb-md-0">
            <h6 className="text-uppercase mb-4 fw-bold">Kits and More</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/products" className="footer-link">
                  All Products
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/categories" className="footer-link">
                  Categories
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/producers" className="footer-link">
                  Top Producers
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/sell" className="footer-link">
                  Sell Your Sounds
                </Link>
              </li>
            </ul>
          </Col>
          <Col lg={2} md={6} className="mb-4 mb-md-0">
            <h6 className="text-uppercase mb-4 fw-bold">Compete</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/competitions" className="footer-link">
                  Active Competitions
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/winners" className="footer-link">
                  Past Winners
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/profile" className="footer-link">
                  My Submissions
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/rules" className="footer-link">
                  Competition Rules
                </Link>
              </li>
            </ul>
          </Col>
          {/* FUTURE: Community Section - Temporarily disabled
          <Col lg={2} md={6} className="mb-4 mb-md-0">
            <h6 className="text-uppercase mb-4 fw-bold">Community</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/blog" className="footer-link">
                  Blog
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/forum" className="footer-link">
                  Forum
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/events" className="footer-link">
                  Events
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/support" className="footer-link">
                  Support
                </Link>
              </li>
            </ul>
          </Col>
          */}
          <Col lg={2} md={6}>
            <h6 className="text-uppercase mb-4 fw-bold">Company</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/about" className="footer-link">
                  About Us
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/contact" className="footer-link">
                  Contact
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/careers" className="footer-link">
                  Careers
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/faq" className="footer-link">
                  FAQ
                </Link>
              </li>
            </ul>
          </Col>
        </Row>
        <hr className="my-4 border-secondary" />
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
          <p className="text-muted small mb-3 mb-md-0">
            © {currentYear} MixWarz. All rights reserved.
          </p>
          <div className="d-flex gap-4">
            <Link to="/privacy" className="footer-link small">
              Privacy Policy
            </Link>
            <Link to="/terms" className="footer-link small">
              Terms of Service
            </Link>
            <Link to="/cookies" className="footer-link small">
              Cookie Policy
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
