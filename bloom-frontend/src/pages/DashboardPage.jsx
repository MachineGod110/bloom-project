import React from "react";
import Dashboard from "../components/Dashboard.jsx";

export default function DashboardPage({ user, refreshKey, onOpenAuth, onCheckinComplete, showToast }) {
  return (
    <div style={{ paddingTop: 80, minHeight: "90vh" }}>
      <Dashboard
        user={user}
        refreshKey={refreshKey}
        onOpenAuth={onOpenAuth}
        onCheckinComplete={onCheckinComplete}
        showToast={showToast}
      />
    </div>
  );
}
