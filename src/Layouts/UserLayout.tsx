import React, { type CSSProperties } from "react";
import UserSidebar from "../components/UserSidebar";
import Topbar from "../components/Topbar";
import { colors, spacing } from "../styles/theme";

interface UserLayoutProps {
  children: React.ReactNode;
}

const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  return (
    <div style={layoutContainer}>
      <UserSidebar />
      <div style={mainContent}>
        <Topbar />
        <main style={contentArea}>
          {children}
        </main>
      </div>
    </div>
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

export default UserLayout;