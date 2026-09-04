import React from "react";
import { useDately } from "./context/DatelyContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import OtpPage from "./pages/OtpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import DocumentsPage from "./pages/DocumentsPage";
import DocumentDetailsPage from "./pages/DocumentDetailsPage";
import UploadDocumentPage from "./pages/UploadDocumentPage";
import AddObligationPage from "./pages/AddObligationPage";
import BillsPaymentsPage from "./pages/BillsPaymentsPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import CalendarPage from "./pages/CalendarPage";
import TodoListPage from "./pages/TodoListPage";
import HelpSupportPage from "./pages/HelpSupportPage";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Temporary Display Refresh Needed</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
            We noticed stale browser cache data. Click below to clear cache and reload cleanly.
          </p>
          <button
            onClick={this.handleReset}
            className="px-6 py-2.5 bg-dately-primary text-white font-semibold text-sm rounded-xl shadow-md hover:bg-dately-secondary transition-colors cursor-pointer border-0"
          >
            Clear Cache & Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function MainApp() {
  const { currentPage, isLoaded, token } = useDately();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dately-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dately-primary" />
      </div>
    );
  }

  const isAuthenticated = Boolean(token && typeof token === 'string' && token.split('.').length === 3);
  const publicPages = ['landing', 'login', 'signup', 'otp', 'forgot-password'];

  // Route Guard: If not logged in and attempting to view any protected page, show LandingPage
  if (!isAuthenticated && !publicPages.includes(currentPage)) {
    return <LandingPage />;
  }

  switch (currentPage) {
    case "landing":
      return <LandingPage />;
    case "login":
      return <LoginPage />;
    case "signup":
      return <SignUpPage />;
    case "otp":
      return <OtpPage />;
    case "forgot-password":
      return <ForgotPasswordPage />;
    case "onboarding":
      return <OnboardingPage />;
    case "dashboard":
      return <DashboardPage />;
    case "todo-list":
      return <TodoListPage />;
    case "calendar":
      return <CalendarPage />;
    case "documents":
      return <DocumentsPage />;
    case "document-details":
      return <DocumentDetailsPage />;
    case "document-upload":
      return <UploadDocumentPage />;
    case "obligation-add":
      return <AddObligationPage />;
    case "bills-payments":
      return <BillsPaymentsPage />;
    case "notifications":
      return <NotificationsPage />;
    case "profile":
      return <ProfilePage />;
    case "settings":
      return <SettingsPage />;
    case "help-support":
      return <HelpSupportPage />;
    default:
      return <LandingPage />;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
