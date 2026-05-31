import React, { type CSSProperties } from "react";
import AdminSidebar from "../components/AdminSidebar";
import Topbar from "../components/Topbar";
import { colors } from "../styles/theme";

interface AdminLayoutProps {
  children: React.ReactNode;
}
const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    < div style={layoutContainer} >
      <AdminSidebar />
      <div style={mainContent}>
        <Topbar />
        <main style={contentArea}>
          {children}
        </main>
      </div>
    </div >
  );
};

const layoutContainer: CSSProperties = {
  display: "flex",
  minHeight: "100vh",
  background: colors.bgPrimary,
};

const mainContent: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  color: colors.textPrimary,
  minWidth: 0,
  marginLeft: "280px",
};

const contentArea: CSSProperties = {
  padding: "32px 108px",
  flex: 1,
  overflowY: "auto",
};

export default AdminLayout;
