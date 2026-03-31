import { Navigate } from "react-router-dom";

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  try {
    const session = JSON.parse(sessionStorage.getItem("pgz_admin_session") || "{}");
    if (session.admin === true) return <>{children}</>;
  } catch {}
  return <Navigate to="/admin" replace />;
};

export default AdminProtectedRoute;
