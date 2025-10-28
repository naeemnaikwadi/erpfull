import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { useDispatch } from "react-redux";
import { clearUser } from "../redux/userSlice";
import { useAuth } from "../context/authContext";


// Logo will be referenced from public directory
import {
  Menu,
  Moon,
  Sun,
  ChevronDown,
  LayoutDashboard,
  Video,
  Upload,
  Users,
  BookOpen,
  BadgeCheck,
  Calendar,
  Target,
  TrendingUp,
  Plus,
  Activity,
  Home,
  X,
  LogOut,
  Download,
  MessageCircle,
  Bell,
  Award,
  Star,
  FileText,
  // ERP Icons
  UserPlus,
  DollarSign,
  Building,
  ClipboardList,
  GraduationCap,
  CreditCard,
  Home as HostelIcon,
  BookOpenCheck,
  BarChart3,
  Settings,
} from "lucide-react";
import LiveSessionCalendar from "./LiveSessionCalendar";
import NotificationPopup from "./NotificationPopup";
import logo from "../assets/logo192.png";

export default function DashboardLayout({ role, children }) {
  // const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("theme") === "dark"
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Get user data from multiple sources to ensure it's always available
  const currentUser =
    user ||
    (() => {
      try {
        return JSON.parse(localStorage.getItem("user") || "{}");
      } catch {
        return {};
      }
    })();

  const initial = (currentUser?.name || "U").charAt(0).toUpperCase();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    // Listen for user updates from profile changes
    const handleUserUpdate = (event) => {
      // Force re-render by updating a state
      setDropdownOpen(false);
    };

    window.addEventListener("userUpdated", handleUserUpdate);

    return () => {
      window.removeEventListener("userUpdated", handleUserUpdate);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDarkMode = () => {
    const newTheme = isDark ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    setIsDark(!isDark);
  };

  const { logout } = useAuth();

  const logoutHandler = () => {
    logout();
    dispatch(clearUser());
    navigate("/", { replace: true });
  };

  // Resolve role: prefer prop, then user.state, then localStorage
  const resolvedRole =
    role ||
    user?.role ||
    (() => {
      try {
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        return u.role || localStorage.getItem("userRole") || "student";
      } catch {
        return "student";
      }
    })();

  const roleHomePath = (() => {
    switch (resolvedRole) {
      case "admin":
        return "/admin";
      case "instructor":
        return "/instructor";
      case "student":
        return "/student";
      case "admission_officer":
        return "/admission-officer";
      case "fee_manager":
        return "/fee-manager";
      case "hostel_manager":
        return "/hostel-manager";
      case "exam_controller":
        return "/exam-controller";
      case "accountant":
        return "/accountant";
      case "registrar":
        return "/registrar";
      case "librarian":
        return "/librarian";
      default:
        return "/dashboard";
    }
  })();

  const sidebarLinks =
    resolvedRole === "admin"
      ? [
          {
            label: "Admin Dashboard",
            path: "/admin",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/bimokqfw.json"
              trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          {
            label: "User Management",
            path: "/admin/users",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/tebysptx.json"
              trigger="morph"
              stroke="bold"
              state="morph-alone"
              colors="primary:#121331,secondary:#000000"
                
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          {
            label: "Attendance",
            path: "/admin/attendance",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/uvofdfal.json"
              trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          {
            label: "Classrooms",
            path: "/admin/classrooms",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/emxxkbtx.json"
              trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          {
            label: "Courses",
            path: "/admin/courses",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/hjrbjhnq.json"
              trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          // { label: 'Live Sessions', path: '/admin/live-sessions', icon: <Video size={18} /> },
          // { label: 'Learning Paths', path: '/admin/learning-paths', icon: <TrendingUp size={18} /> },
          // { label: 'System Health', path: '/admin/system-health', icon: <Activity size={18} /> },
          // ERP Modules
          {
            label: "Admissions",
            path: "/erp/admissions",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/kdduutaw.json"
              trigger="hover"
              stroke="bold"
              state="hover-looking-around"
              colors="primary:#121331,secondary:#000000"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          {
            label: "Fee Management",
            path: "/erp/fees",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/bsdkzyjd.json"
              trigger="hover"
    stroke="bold"
    colors="primary:#121331,secondary:#000000"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          {
            label: "Hostel Management",
            path: "/erp/hostels",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/oeotfwsx.json"
              trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          {
            label: "Examinations",
            path: "/erp/examinations/enhanced",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/cfkiwvcc.json"
              trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          // { label: 'Import Students', path: '/erp/import/students', icon: <Users size={18} /> },
          {
            label: "ERP Reports",
            path: "/erp/reports",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/oqhqyeud.json"
              trigger="hover"
              stroke="bold"
              colors="primary:#121331,secondary:#000000"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          {
            label: "Profile",
            path: "/profile",
            icon: (
              <lord-icon
                src="https://cdn.lordicon.com/bushiqea.json"
                trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
        ]
      : resolvedRole === "instructor"
      ? [
          {
            label: "Dashboard",
            path: "/instructor",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/bimokqfw.json"
              trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          {
            label: "My Courses",
            path: "/instructor/courses",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/hjrbjhnq.json"
              trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          {
            label: "Classrooms",
            path: "/instructor/classrooms",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/emxxkbtx.json"
              trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          {
            label: "Assignments",
            path: "/assignments",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/wwcdwkaf.json"
              trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          { 
            label: "Quizzes", 
            path: "/quizzes", 
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/vttzorhw.json"
              trigger="hover"
              stroke="bold"
              colors="primary:#121331,secondary:#000000"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          {
            label: "Student Management",
            path: "/student-info",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/fqbvgezn.json"
              trigger="hover"
              colors="primary:#121331,secondary:#000000"
              stroke="bold"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          {
            label: "Learning Paths",
            path: "/learning-paths",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/excswhey.json"
              trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          {
            label: "Live Sessions",
            path: "/live-sessions",
            icon: (
              <lord-icon
                src="https://cdn.lordicon.com/zczzhvwa.json"
                trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          {
            label: "Reviews & Ratings",
            path: "/instructor/reviews",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/cvwrvyjv.json"
              trigger="hover"
              stroke="bold"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          // { label: 'Upload Materials', path: '/upload', icon: <Upload size={18} /> },
          {
            label: "Doubts",
            path: "/instructor/doubts",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/bpptgtfr.json"
              trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          {
            label: "Attendance",
            path: "/instructor/attendance",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/uvofdfal.json"
              trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          // ERP Access for Instructors
          // { label: 'ERP Dashboard', path: '/instructor/erp', icon: <BarChart3 size={18} /> },
          // Calendar button will open modal, not navigate
          {
            label: "Calendar",
            path: null,
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/uoljexdg.json"
              trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
            isCalendar: true,
          },
          // Replace Analytics with Learning Sessions overview
          // { label: 'Learning Sessions', path: '/learning-paths', icon: <Target size={18} /> },
          {
            label: "Profile",
            path: "/profile",
            icon: (
              <lord-icon
                src="https://cdn.lordicon.com/bushiqea.json"
                trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          
          
        ]
      : [
          "admission_officer",
          "fee_manager",
          "hostel_manager",
          "exam_controller",
          "accountant",
          "registrar",
          "librarian",
        ].includes(resolvedRole)
      ? [
          {
            label: "ERP Dashboard",
            path: roleHomePath,
            icon: (
              <lord-icon
                src="https://cdn.lordicon.com/ryqmtznf.json"
                trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          // Role-specific modules
          ...(resolvedRole === "admission_officer" ||
          resolvedRole === "registrar"
            ? [
                {
                  label: "Admissions",
                  path: "/erp/admissions",
                  icon: (
                    <lord-icon
                    src="https://cdn.lordicon.com/kdduutaw.json"
                    trigger="hover"
                    stroke="bold"
                    state="hover-looking-around"
                    colors="primary:#121331,secondary:#000000"       
                      style={{ 
                        width: "24px", 
                        height: "24px",
                        filter: isDark ? "invert(1) brightness(1.2)" : "none"
                      }}
                      className="transition-all duration-300"
                    ></lord-icon>
                  ),
                },
              ]
            : []),
          ...(resolvedRole === "fee_manager" ||
          resolvedRole === "accountant" ||
          resolvedRole === "registrar"
            ? [
                {
                  label: "Fee Management",
                  path: "/erp/fees",
                  icon: (
                    <lord-icon
                    src="https://cdn.lordicon.com/bsdkzyjd.json"
                    trigger="hover"
                    stroke="bold"
                    colors="primary:#121331,secondary:#000000"
                      style={{ 
                        width: "24px", 
                        height: "24px",
                        filter: isDark ? "invert(1) brightness(1.2)" : "none"
                      }}
                      className="transition-all duration-300"
                    ></lord-icon>
                  ),
                },
              ]
            : []),
          ...(resolvedRole === "hostel_manager" || resolvedRole === "registrar"
            ? [
                {
                  label: "Hostel Management",
                  path: "/erp/hostels",
                  icon: (
                    <lord-icon
                    src="https://cdn.lordicon.com/oeotfwsx.json"
                    trigger="hover"
                      style={{ 
                        width: "24px", 
                        height: "24px",
                        filter: isDark ? "invert(1) brightness(1.2)" : "none"
                      }}
                      className="transition-all duration-300"
                    ></lord-icon>
                  ),
                },
              ]
            : []),
          ...(resolvedRole === "exam_controller" || resolvedRole === "registrar"
            ? [
                {
                  label: "Examinations",
                  path: "/erp/examinations/enhanced",
                  icon: (
                    <lord-icon
                    src="https://cdn.lordicon.com/cfkiwvcc.json"
                    trigger="hover"
                      style={{ 
                        width: "24px", 
                        height: "24px",
                        filter: isDark ? "invert(1) brightness(1.2)" : "none"
                      }}
                      className="transition-all duration-300"
                    ></lord-icon>
                  ),
                },
              ]
            : []),
          ...(resolvedRole === "librarian"
            ? [
                {
                  label: "Library Management",
                  path: "/librarian",
                  icon: (
                    <lord-icon
                      src="https://cdn.lordicon.com/ryqmtznf.json"
                      trigger="hover"
                      style={{ 
                        width: "24px", 
                        height: "24px",
                        filter: isDark ? "invert(1) brightness(1.2)" : "none"
                      }}
                      className="transition-all duration-300"
                    ></lord-icon>
                  ),
                },
              ]
            : []),
          {
            label: "Reports",
            path: "/erp/reports",
            icon: (
              <lord-icon
                src="https://cdn.lordicon.com/ryqmtznf.json"
                trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          {
            label: "Profile",
            path: "/profile",
            icon: (
              <lord-icon
                src="https://cdn.lordicon.com/bushiqea.json"
                trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
        ]
      : [
          {
            label: "Dashboard",
            path: "/student",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/bimokqfw.json"
              trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          {
            label: "My Courses",
            path: "/student-courses",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/hjrbjhnq.json"
              trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          {
            label: "Classrooms",
            path: "/student/classrooms",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/emxxkbtx.json"
              trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          {
            label: "Assignments",
            path: "/assignments",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/wwcdwkaf.json"
              trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          { 
            label: "Quizzes", 
            path: "/quizzes", 
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/vttzorhw.json"
              trigger="hover"
              stroke="bold"
              colors="primary:#121331,secondary:#000000"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          {
            label: "Learning Paths",
            path: "/learning-paths",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/excswhey.json"
              trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          {
            label: "Live Sessions",
            path: "/student/live-sessions",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/zczzhvwa.json"
              trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          {
            label: "Doubts",
            path: "/student/doubts",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/bpptgtfr.json"
              trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          {
            label: "Attendance",
            path: "/student/attendance",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/uvofdfal.json"
              trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          {
            label: "Assessments",
            path: "/assessments",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/bpptgtfr.json"
                trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          // { label: 'Downloads', path: '/student/downloads', icon: <Download size={18} /> },
          // ERP Access for Students
          {
            label: "My Academic Info",
            path: "/student/erp",
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/bpptgtfr.json"
                trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
          // { label: 'My Results', path: '/student/results', icon: <Award size={18} /> },
          // Calendar button will open modal, not navigate
          {
            label: "Calendar",
            path: null,
            icon: (
              <lord-icon
              src="https://cdn.lordicon.com/uoljexdg.json"
              trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
            isCalendar: true,
          },
          // { label: 'Certificates', path: '/certificates', icon: <BadgeCheck size={18} /> },
          {
            label: "Profile",
            path: "/profile",
            icon: (
              <lord-icon
                src="https://cdn.lordicon.com/bushiqea.json"
                trigger="hover"
                style={{ 
                  width: "24px", 
                  height: "24px",
                  filter: isDark ? "invert(1) brightness(1.2)" : "none"
                }}
                className="transition-all duration-300"
              ></lord-icon>
            ),
          },
        ];

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen h-screen overflow-hidden flex dark:text-white transition-colors duration-300">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed and Static */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 md:translate-x-0`}
      >
        <div className="flex flex-col h-full m-4  justify-between overflow-y-auto">
          <div>
            {/* Sidebar Header with Close Button for Mobile */}
            {/* <div className="flex items-center justify-between mb-6"> */}
            <div className="w-25 h-14 ml-2 flex items-center justify-start border-b-2">
              <img
                src={logo}
                alt="logo"
                className="max-w-full max-h-full object-contain"
                onClick={() => navigate("/")}
              />
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white  ml-2  pb-4 hover:cursor-pointer"
                  onClick={()=> navigate("/")} >
                SkillSync
              </h2>
            </div>

            {/* <h2 className="text-xl md:text-2xl font-bold text-primary dark:text-white">
                {role === 'instructor' ? 'Instructor' : 'Student'}
              </h2> */}
            {/* <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button> */}
            {/* </div> */}

            {/* Sidebar Navigation */}
            <nav className="space-y-2 mt-4">
              {sidebarLinks.map((link) => (
                link.isCalendar ? (
                  <button
                    key={link.label}
                    onClick={() => {
                      setShowCalendarModal(true);
                      setSidebarOpen(false);
                    }}
                    className="flex items-center gap-3 w-full text-left px-3 md:px-4 py-2 md:py-3 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm
                      bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 dark:focus-visible:ring-blue-500/50"
                  >
                    {link.icon}
                    <span className="block">{link.label}</span>
                  </button>
                ) : (
                  <NavLink
                    key={link.label}
                    to={link.path}
                    onClick={() => setSidebarOpen(false)}
                    end={link.path === roleHomePath || /Dashboard/i.test(link.label)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 w-full text-left px-3 md:px-4 py-2 md:py-3 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm focus:outline-none focus-visible:ring-2
                      ${
                        isActive
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-600/40 dark:text-white focus-visible:ring-blue-400/70 dark:focus-visible:ring-blue-500/60"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus-visible:ring-blue-400/40 dark:focus-visible:ring-blue-500/40"
                      }`
                    }
                  >
                    {link.icon}
                    <span className="block">{link.label}</span>
                  </NavLink>
                )
              ))}
            </nav>

          </div>

          {/* Footer */}
          <div className="pt-4 border-t dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            <div className="hidden sm:block">
              © {new Date().getFullYear()} Smart Learning Dashboard
            </div>
            <div className="sm:hidden text-center">Smart Learning</div>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 md:ml-64 h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex justify-between items-center px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              >
                <Menu size={20} />
              </button>

              <h1 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                {resolvedRole === "admin"
                  ? "Admin Dashboard"
                  : resolvedRole === "instructor"
                  ? "Instructor Dashboard"
                  : resolvedRole === "admission_officer"
                  ? "Admissions Dashboard"
                  : resolvedRole === "fee_manager"
                  ? "Fee Management Dashboard"
                  : resolvedRole === "accountant"
                  ? "Accounting Dashboard"
                  : resolvedRole === "hostel_manager"
                  ? "Hostel Management Dashboard"
                  : resolvedRole === "exam_controller"
                  ? "Examination Dashboard"
                  : resolvedRole === "registrar"
                  ? "Registrar Dashboard"
                  : resolvedRole === "librarian"
                  ? "Library Management Dashboard"
                  : "Student Dashboard"}
              </h1>
            </div>

            {/* Profile Section - Right Side */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {isDark ? (
                  <Sun className="w-6 h-6" />
                ) : (
                  <Moon className="w-6 h-6" />
                )}
              </button>

              {/* Notification Popup */}
              <NotificationPopup role={resolvedRole} />

              {/* User Info - Hidden on small screens */}
              {/* <div className="hidden sm:block text-sm text-gray-600 dark:text-gray-300">
                Welcome, {user?.name || localStorage.getItem('userName') || (role === 'instructor' ? 'Instructor' : 'Student')}
              </div> */}

              <div className="relative">
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold cursor-pointer overflow-hidden"
                  onClick={() => setOpen(!open)}
                >
                  {currentUser?.avatarUrl ? (
                    <img
                      src={
                        currentUser?.avatarUrl?.startsWith("http")
                          ? currentUser.avatarUrl
                          : `http://localhost:4000${currentUser?.avatarUrl}`
                      }
                      alt={currentUser?.name || "User"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>

                {/* Dropdown */}
                {open && (
                  <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    <button
                      onClick={() => {
                        setOpen(false);
                        navigate("/profile");
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setOpen(false);
                        logoutHandler();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-gray-700"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Calendar Modal */}
        {showCalendarModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-4 md:p-6 w-full max-w-3xl relative max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-white text-xl"
                onClick={() => setShowCalendarModal(false)}
              >
                &times;
              </button>
              <h2 className="text-xl md:text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                Calendar
              </h2>
              <LiveSessionCalendar role={resolvedRole} />
            </div>
          </div>
        )}

        {/* Page Content - Scrollable area only */}
        <main className=" md:p-6 overflow-y-auto flex-1 min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
