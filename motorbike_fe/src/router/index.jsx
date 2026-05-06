import { createBrowserRouter } from "react-router-dom";

// Layouts
import AdminLayout from "../components/layout/AdminLayout";
import PublicLayout from "../components/layout/PublicLayout";

// Public Pages
import Blog from "../pages/public/Blog";
import BlogDetail from "../pages/public/BlogDetail";
import Booking from "../pages/public/Booking";
import BookingHistory from "../pages/public/BookingHistory";
import CustomerPortal from "../pages/public/CustomerPortal";
import Home from "../pages/public/Home";
import Services from "../pages/public/Services";

// Admin Pages
import AddService from "../pages/admin/AddService";
import AddEmployeePage from "../pages/admin/AddStaff";
import AdminAppointments from "../pages/admin/Appointments";
import AdminBanners from "../pages/admin/Banners";
import AdminBlog from "../pages/admin/Blog";
import AdminCombos from "../pages/admin/Combos";
import AdminConfig from "../pages/admin/Config";
import Dashboard from "../pages/admin/Dashboard";
import AdminInventory from "../pages/admin/Inventory";
import AdminLogin from "../pages/admin/LoginAdmin";
import ManageAppointment from "../pages/admin/ManageAppointment";
import ManageBlog from "../pages/admin/ManageBlog";
import ManageCombo from "../pages/admin/ManageCombo";
import ManageSpareParts from "../pages/admin/ManageSpareParts";
import ManageStock from "../pages/admin/ManageStock";
import ManageVoucher from "../pages/admin/ManageVoucher";
import AdminReports from "../pages/admin/Reports";
import AdminReviews from "../pages/admin/Reviews";
import AdminServices from "../pages/admin/Services";
import AdminSpareParts from "../pages/admin/SpareParts";
import AdminStaff from "../pages/admin/Staff";
import AdminStock from "../pages/admin/Stock";
import AdminVouchers from "../pages/admin/Vouchers";
import Combo from "../pages/public/Combo";
import ComboDetail from "../pages/public/ComboDetail";
import History from "../pages/public/History";
import LoginPage from "../pages/public/Login";
import ManageVehicle from "../pages/public/ManageVehicle";
import ServicesPrice from "../pages/public/Services-Price";

const router = createBrowserRouter([
  // ── PUBLIC ROUTES ──────────────────────────────────────────
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "services", element: <Services /> },
      { path: "services-price/:id", element: <ServicesPrice /> },
      { path: "combo/:id", element: <ComboDetail /> },
      { path: "blog", element: <Blog /> },
      { path: "history", element: <History /> },
      { path: "combo", element: <Combo /> },
      { path: "blog/:slug", element: <BlogDetail /> },
      { path: "booking", element: <Booking /> },
      { path: "booking-history", element: <BookingHistory /> },
      { path: "login", element: <LoginPage /> },
      { path: "portal", element: <CustomerPortal /> },
      { path: "portal/create", element: <ManageVehicle /> },
      { path: "portal/edit/:id", element: <ManageVehicle /> },
    ],
  },
  {
    path: "/admin/login",
    element: <AdminLogin />,
  },

  // ── ADMIN ROUTES ───────────────────────────────────────────
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "appointments", element: <AdminAppointments /> },
      { path: "appointments/create", element: <ManageAppointment /> },
      { path: "appointments/:id/edit", element: <ManageAppointment /> },
      { path: "services", element: <AdminServices /> },
      { path: "combos", element: <AdminCombos /> },
      { path: "inventory", element: <AdminInventory /> },
      { path: "vouchers", element: <AdminVouchers /> },
      { path: "staff", element: <AdminStaff /> },
      { path: "blog", element: <AdminBlog /> },
      { path: "blog/create", element: <ManageBlog /> },
      { path: "blog/:id/edit", element: <ManageBlog /> },
      { path: "banners", element: <AdminBanners /> },
      { path: "reviews", element: <AdminReviews /> },
      { path: "reports", element: <AdminReports /> },
      { path: "config", element: <AdminConfig /> },
      { path: "spare-parts", element: <AdminSpareParts /> },
      { path: "stock", element: <AdminStock /> },
      { path: "staff/create", element: <AddEmployeePage /> },
      { path: "services/create", element: <AddService /> },
      { path: "combos/create", element: <ManageCombo /> },
      { path: "spare-parts/create", element: <ManageSpareParts /> },
      { path: "vouchers/create", element: <ManageVoucher /> },
      { path: "stock/create", element: <ManageStock /> },
      { path: "stock/view/:id", element: <ManageStock /> },
      { path: "spare-parts/edit/:id", element: <ManageSpareParts /> },
      { path: "vouchers/edit/:id", element: <ManageVoucher /> },
      { path: "services/edit/:id", element: <AddService /> },
      { path: "combos/edit/:id", element: <ManageCombo /> },
    ],
  },
]);

export default router;
