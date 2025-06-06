import React from "react";
import { Outlet } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import MainNavbar from "../navigation/MainNavbar";
import AdminSidebar from "../navigation/AdminSidebar";
import "../admin/AdminStyles.css";

const AdminLayout = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <MainNavbar />
      <Container fluid className="flex-grow-1 px-0">
        <Row className="m-0">
          <Col md={3} lg={2} className="px-0">
            <AdminSidebar />
          </Col>
          <Col md={9} lg={10} className="admin-content">
            <Outlet />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminLayout;
