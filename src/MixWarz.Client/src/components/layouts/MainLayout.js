import React from "react";
import { Outlet } from "react-router-dom";
import MainNavbar from "../navigation/MainNavbar";
import Footer from "../navigation/Footer";

const MainLayout = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <MainNavbar />
      <main className="flex-grow-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
