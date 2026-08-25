"use client";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  Calendar,
  ListTodo,
  CreditCard,
  RefreshCw,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Search,
  User,
  ChevronDown
} from "lucide-react";
import { useDately } from "@/context/DatelyContext";
function ClockWidget() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden md:flex flex-col items-center justify-center text-center px-4 mx-auto select-none">
      <span className="text-base sm:text-lg font-black text-slate-900 font-mono tracking-wide leading-none">
        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
      <span className="text-[11px] sm:text-xs text-slate-500 font-extrabold uppercase tracking-wider mt-0.5 leading-none">
        {currentTime.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
      </span>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  const {
    userProfile,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    currentPage,
    navigateTo,
    t
  } = useDately();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const unreadNotifications = notifications.filter((n) => !n.read);
  const navLinks = [
    { name: t("nav_dashboard"), page: "dashboard", icon: LayoutDashboard },
    { name: t("nav_todo"), page: "todo-list", icon: ListTodo },
    { name: t("nav_documents"), page: "documents", icon: FileText },
    { name: t("nav_bills"), page: "bills-payments", icon: CreditCard },
    { name: t("nav_calendar"), page: "calendar", icon: Calendar },
    { name: t("nav_notifications"), page: "notifications", icon: Bell, badgeCount: unreadNotifications.length },
    { name: t("nav_settings"), page: "settings", icon: Settings }
  ];
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigateTo("dashboard", { search: searchQuery });
    }
  };
  const handleLogout = () => {
    navigateTo("landing");
  };
  const userName = userProfile?.name || "Pasupathi A T";
  const userEmail = userProfile?.email || "atpasupathi77@gmail.com";
  const getInitials = (name) => {
    if (!name) return "PA";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
  };
  const SidebarContent = () => <div className="flex flex-col h-full bg-dately-primary text-white">{
    /* Brand logo */
  }<div className="flex items-center space-x-3 px-6 py-5 border-b border-white/10"><div className="w-8 h-8 rounded-lg bg-dately-success flex items-center justify-center font-bold text-white shadow-md">
          D
        </div><span className="font-extrabold text-lg tracking-wider text-white">DATELY</span></div>{
    /* Main Nav */
  }<nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">{navLinks.map((link) => {
    const Icon = link.icon;
    const isDocRelated = link.page === "documents" && (currentPage === "document-details" || currentPage === "document-upload");
    const isObligationRelated = link.page === "obligations" && currentPage === "obligation-add";
    const isActive = currentPage === link.page || isDocRelated || isObligationRelated;
    return <button
      key={link.name}
      onClick={() => {
        navigateTo(link.page);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition-all group ${isActive ? "bg-dately-secondary text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
    ><div className="flex items-center space-x-3"><Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-white/60 group-hover:text-white"}`} /><span>{link.name}</span></div>{link.badgeCount && link.badgeCount > 0 ? <span className="bg-dately-danger text-white text-xs font-bold px-2 py-0.5 rounded-full">{link.badgeCount}</span> : null}</button>;
  })}</nav>{
    /* Bottom Nav / User card */
  }<div className="p-4 border-t border-white/10 bg-black/10"><button
    onClick={() => {
      navigateTo("help-support");
      setIsMobileMenuOpen(false);
    }}
    className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-white/70 hover:bg-white/5 hover:text-white transition-colors text-left"
  ><HelpCircle className="w-5 h-5 text-white/60" /><span>Help & Support</span></button><div className="mt-4 flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5"><div className="flex items-center space-x-3 overflow-hidden"><button onClick={() => navigateTo("profile")} className="flex-shrink-0"><div className="w-9 h-9 rounded-full bg-dately-success flex items-center justify-center font-bold text-white text-sm">{getInitials(userName)}</div></button><div className="overflow-hidden text-left"><button onClick={() => navigateTo("profile")} className="block text-sm font-bold truncate hover:underline text-white bg-transparent border-0 p-0 text-left">{userName}</button><span className="block text-xs text-white/50 truncate">{userEmail}</span></div></div><button
    onClick={handleLogout}
    className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-dately-danger transition-colors"
    title="Log Out"
  ><LogOut className="w-4 h-4" /></button></div></div></div>;
  return <div className="min-h-screen flex bg-dately-background text-dately-navy">{
    /* Desktop Sidebar (Fixed) */
  }<aside className="hidden lg:block w-64 flex-shrink-0 sticky top-0 h-screen border-r border-dately-border"><SidebarContent /></aside>{
    /* Main Container */
  }<div className="flex-1 flex flex-col min-w-0">{
    /* Top Header */
  }<header className="sticky top-0 bg-white border-b-2 border-dately-navy h-16 flex items-center justify-between px-4 lg:px-8 z-40"><div className="flex items-center space-x-4 flex-1">{
    /* Mobile Hamburger menu */
  }<button
    onClick={() => setIsMobileMenuOpen(true)}
    className="lg:hidden p-2 -ml-2 text-dately-navy hover:bg-slate-100 rounded-lg"
  ><Menu className="w-6 h-6" /></button>{
    /* Global Search Bar */
  }<form onSubmit={handleSearchSubmit} className="hidden md:flex items-center max-w-md w-full relative"><Search className="w-4 h-4 text-dately-slate absolute left-3 pointer-events-none" /><input
    type="text"
    placeholder="Search documents, obligations, bills..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="pl-10 pr-4 py-2 border border-dately-border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary w-full transition-all"
  /></form></div>{
    /* Running Clock Widget in Center Space */
  }<ClockWidget />{
    /* Right Header items */
  }<div className="flex items-center space-x-4">{
    /* Notification Bell Dropdown */
  }<div className="relative"><button
    onClick={() => {
      setIsNotifDropdownOpen(!isNotifDropdownOpen);
      setIsProfileDropdownOpen(false);
    }}
    className={`p-2 rounded-lg text-dately-slate hover:text-dately-navy hover:bg-slate-100 relative ${isNotifDropdownOpen ? "bg-slate-100 text-dately-navy" : ""}`}
  ><Bell className="w-5 h-5" />{unreadNotifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-dately-danger rounded-full ring-2 ring-white" />}</button>{
    /* Dropdown menu */
  }{isNotifDropdownOpen && <div className="absolute right-0 mt-2 w-80 bg-white border border-dately-border rounded-xl shadow-xl z-50 py-2"><div className="flex items-center justify-between px-4 py-2 border-b border-dately-navy/25"><span className="font-bold text-sm text-dately-navy">Notifications</span>{unreadNotifications.length > 0 && <button
    onClick={markAllNotificationsRead}
    className="text-xs text-dately-secondary hover:underline font-semibold"
  >
                        Mark all as read
                      </button>}</div><div className="max-h-64 overflow-y-auto divide-y divide-dately-border">{notifications.length === 0 ? <div className="p-4 text-center text-xs text-dately-slate">No notifications.</div> : notifications.slice(0, 5).map((notif) => <div
    key={notif.id}
    onClick={() => {
      markNotificationRead(notif.id);
      navigateTo("notifications");
      setIsNotifDropdownOpen(false);
    }}
    className={`p-3 text-left hover:bg-slate-50 cursor-pointer transition-colors ${!notif.read ? "bg-dately-background/50 font-medium" : ""}`}
  ><div className="flex items-start space-x-2"><span
    className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${notif.type === "danger" ? "bg-dately-danger" : notif.type === "warning" ? "bg-dately-warning" : notif.type === "success" ? "bg-dately-success" : "bg-blue-500"}`}
  /><div className="min-w-0"><p className="text-xs font-bold text-dately-navy truncate">{notif.title}</p><p className="text-[10px] text-dately-slate line-clamp-2 mt-0.5">{notif.message}</p></div></div></div>)}</div><div className="border-t border-dately-border pt-2 px-4 text-center"><button
    onClick={() => {
      navigateTo("notifications");
      setIsNotifDropdownOpen(false);
    }}
    className="w-full text-xs font-bold text-dately-primary hover:underline block py-1 text-center bg-transparent border-0"
  >
                      View all notifications
                    </button></div></div>}</div>{
    /* Profile Dropdown */
  }<div className="relative"><button
    onClick={() => {
      setIsProfileDropdownOpen(!isProfileDropdownOpen);
      setIsNotifDropdownOpen(false);
    }}
    className="flex items-center space-x-2 p-1.5 hover:bg-slate-100 rounded-lg"
  ><div className="w-8 h-8 rounded-full bg-dately-primary text-white flex items-center justify-center font-bold text-xs">{getInitials(userName)}</div><ChevronDown className="w-4 h-4 text-dately-slate hidden sm:block" /></button>{isProfileDropdownOpen && <div className="absolute right-0 mt-2 w-48 bg-white border border-dately-border rounded-xl shadow-xl z-50 py-2"><div className="px-4 py-2 border-b border-dately-border text-left"><p className="text-sm font-bold text-dately-navy">{userName}</p><p className="text-xs text-dately-slate truncate">{userEmail}</p></div><button
    onClick={() => {
      navigateTo("profile");
      setIsProfileDropdownOpen(false);
    }}
    className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-dately-navy hover:bg-slate-50 transition-colors text-left"
  ><User className="w-4 h-4 text-dately-slate" /><span>My Profile</span></button><button
    onClick={() => {
      navigateTo("settings");
      setIsProfileDropdownOpen(false);
    }}
    className="w-full flex items-center space-x-2 px-4 py-2.5 text-sm text-dately-navy hover:bg-slate-50 transition-colors text-left"
  ><Settings className="w-4 h-4 text-dately-slate" /><span>Settings</span></button><hr className="my-1 border-dately-border" /><button
    onClick={() => {
      setIsProfileDropdownOpen(false);
      handleLogout();
    }}
    className="flex items-center space-x-2 px-4 py-2.5 text-sm text-dately-danger hover:bg-red-50 w-full text-left transition-colors"
  ><LogOut className="w-4 h-4" /><span>Sign Out</span></button></div>}</div></div></header>{
    /* Page Content */
  }<main className="flex-1 overflow-y-auto px-4 py-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main></div>{
    /* Mobile Drawer Overlay */
  }{isMobileMenuOpen && <div className="fixed inset-0 z-50 flex lg:hidden">{
    /* Backdrop */
  }<div
    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
    onClick={() => setIsMobileMenuOpen(false)}
  />{
    /* Drawer Content */
  }<div className="relative flex flex-col w-72 max-w-xs bg-dately-primary text-white h-full transform transition-all duration-300"><div className="absolute top-4 right-4 z-10"><button
    onClick={() => setIsMobileMenuOpen(false)}
    className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg"
  ><X className="w-5 h-5" /></button></div>{
    /* Sidebar content */
  }<div className="h-full flex flex-col overflow-y-auto" onClick={() => setIsMobileMenuOpen(false)}><SidebarContent /></div></div></div>}</div>;
}
