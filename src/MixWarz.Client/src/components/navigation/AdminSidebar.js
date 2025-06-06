import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Nav } from "react-bootstrap";
import {
  FaHome,
  FaUsers,
  FaBoxOpen,
  FaTrophy,
  FaShoppingCart,
} from "react-icons/fa";

const AdminSidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path) => {
    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  return (
    <div className="admin-sidebar p-3 text-white">
      <h5 className="pb-3 mb-3 border-bottom border-secondary">
        Admin Dashboard
      </h5>
      <Nav className="flex-column">
        <Nav.Link
          as={Link}
          to="/admin"
          className={`text-white ${
            isActive("/admin") && currentPath === "/admin" ? "bg-primary" : ""
          }`}
        >
          <FaHome className="me-2" /> Overview
        </Nav.Link>
        <Nav.Link
          as={Link}
          to="/admin/users"
          className={`text-white ${
            isActive("/admin/users") ? "bg-primary" : ""
          }`}
        >
          <FaUsers className="me-2" /> Users
        </Nav.Link>
        <Nav.Link
          as={Link}
          to="/admin/products"
          className={`text-white ${
            isActive("/admin/products") ? "bg-primary" : ""
          }`}
        >
          <FaBoxOpen className="me-2" /> Products
        </Nav.Link>
        <Nav.Link
          as={Link}
          to="/admin/competitions"
          className={`text-white ${
            isActive("/admin/competitions") ? "bg-primary" : ""
          }`}
        >
          <FaTrophy className="me-2" /> Competitions
        </Nav.Link>
        <Nav.Link
          as={Link}
          to="/admin/orders"
          className={`text-white ${
            isActive("/admin/orders") ? "bg-primary" : ""
          }`}
        >
          <FaShoppingCart className="me-2" /> Orders
        </Nav.Link>
      </Nav>
    </div>
  );
};

export default AdminSidebar;
