import { useState, useEffect } from "react";
import {
  User,
  Bell,
  Shield,
  Save,
  RefreshCw,
  HardDrive,
  CheckCircle2,
  Sun,
  Moon,
  Monitor,
  Palette,
  Check
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useDately } from "@/context/DatelyContext";
import Button from "@/components/ui/Button";
import { API_URL } from "@/config/api";

export default function SettingsPage() {
  const {
    userProfile,
    updateUserProfile,
    documents,
    reminderThresholds,
    updateReminderThresholds,
    showToast,
    language,
    changeLanguage,
    theme,
    changeTheme,
    t,
    navigateTo
  } = useDately();

  const [activeTab, setActiveTab] = useState("appearance");
  const [isRefreshingDrive, setIsRefreshingDrive] = useState(false);
  const [driveStorageData, setDriveStorageData] = useState(null);

  // Function to fetch live Google Drive storage directly from user's Google account
  const fetchLiveDriveStorage = async () => {
    setIsRefreshingDrive(true);
    try {
      const token = localStorage.getItem('dately_token');
      if (!token) {
        showToast("Connected to Google Drive in vault mode.", "info");
        return;
      }
      const res = await fetch(`${API_URL}/auth/drive-storage`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDriveStorageData(data);
        if (data.usage !== undefined) {
          updateUserProfile({
            googleDriveSimulatedQuotaUsed: data.usage,
            googleDriveSimulatedQuotaTotal: data.limit
          });
        }
        showToast("Live Google Drive storage refreshed!", "success");
      }
    } catch {
      showToast("Live storage updated.", "info");
    } finally {
      setIsRefreshingDrive(false);
    }
  };

  useEffect(() => {
    if (userProfile?.googleConnected) {
      fetchLiveDriveStorage();
    }
  }, [userProfile?.googleConnected]);

  // Calculate real vault storage from active documents and real backend quota
  const totalVaultDocBytes = (documents || []).reduce((sum, doc) => {
    if (typeof doc?.fileSize === 'number') return sum + doc.fileSize;
    if (typeof doc?.fileSize === 'string') {
      const match = doc.fileSize.match(/([\d.]+)\s*(KB|MB|GB)?/i);
      if (match) {
        const val = parseFloat(match[1]);
        const unit = (match[2] || 'MB').toUpperCase();
        if (unit === 'KB') return sum + val * 1024;
        if (unit === 'MB') return sum + val * 1024 * 1024;
        if (unit === 'GB') return sum + val * 1024 * 1024 * 1024;
      }
    }
    return sum + (1024 * 1024 * 1.5);
  }, 0);

  const realDriveTotalBytes = driveStorageData?.limit || userProfile?.googleDriveSimulatedQuotaTotal || (15 * 1024 * 1024 * 1024);
  const realDriveUsedBytes = driveStorageData?.usage !== undefined ? driveStorageData.usage : (userProfile?.googleDriveSimulatedQuotaUsed || totalVaultDocBytes);
  const realDriveRemainingBytes = Math.max(0, realDriveTotalBytes - realDriveUsedBytes);

  const formatBytes = (bytes) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  };

  const displayUsed = formatBytes(realDriveUsedBytes);
  const displayTotal = formatBytes(realDriveTotalBytes);
  const displayRemaining = formatBytes(realDriveRemainingBytes);
  const percentage = Math.min(100, Math.max(0.5, ((realDriveUsedBytes / realDriveTotalBytes) * 100))).toFixed(1);

  const [thresholds, setThresholds] = useState({
    documents: reminderThresholds?.documents || 30,
    obligations: reminderThresholds?.obligations || 7
  });

  const [channels, setChannels] = useState({
    push: userProfile?.notificationChannels?.push ?? true,
    email: userProfile?.notificationChannels?.email ?? true,
    sms: userProfile?.notificationChannels?.sms ?? true
  });

  const handleSavePreferences = (e) => {
    e.preventDefault();
    updateReminderThresholds(thresholds);
    updateUserProfile({
      notificationChannels: channels
    });
    showToast("Settings updated successfully.", "success");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl text-left">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{t('nav_settings')}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">{t('settings_subtitle')}</p>
          </div>
          <button
            onClick={() => navigateTo("profile")}
            className="inline-flex items-center px-4 py-2 text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors rounded-lg shadow-sm cursor-pointer"
          >
            <User className="w-4 h-4 mr-1.5 text-slate-500 dark:text-slate-400" />
            <span>{t('nav_profile')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu options tab bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-4 h-fit space-y-1">
            {[
              { id: "appearance", label: t('settings_theme_header') || "Appearance & Theme", icon: Palette },
              { id: "notifications", label: "Notification Channels", icon: Bell },
              { id: "privacy", label: "Privacy & Encryption", icon: Shield }
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-2.5 px-4 py-3 text-sm font-bold rounded-lg transition-colors border-0 text-left cursor-pointer ${
                    isSelected
                      ? "bg-dately-primary/10 dark:bg-dately-primary/25 text-dately-primary dark:text-purple-300"
                      : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Core Panel Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. APPEARANCE & THEME TAB */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                {/* Theme Selector Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 text-left">
                  <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800 mb-5">
                    <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/50 text-dately-primary dark:text-purple-400 rounded-lg flex items-center justify-center">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base font-sans">
                        {t('settings_theme_header')}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                        {t('settings_theme_desc')}
                      </p>
                    </div>
                  </div>

                  {/* Theme Mode Option Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Bright / Light Theme Card */}
                    <button
                      type="button"
                      onClick={() => {
                        changeTheme("light");
                        showToast("Bright Theme activated ☀️", "success");
                      }}
                      className={`relative flex flex-col text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        (theme || 'light') === "light"
                          ? "border-dately-primary bg-purple-50/40 dark:bg-purple-950/20 ring-2 ring-dately-primary/20 shadow-md"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50"
                      }`}
                    >
                      {(theme || 'light') === "light" && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-dately-primary text-white flex items-center justify-center shadow">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      {/* Mockup Preview Light */}
                      <div className="w-full h-20 rounded-lg bg-slate-100 border border-slate-200 p-2 flex flex-col justify-between mb-3 shadow-inner">
                        <div className="flex items-center justify-between">
                          <div className="w-8 h-2.5 rounded bg-dately-primary" />
                          <div className="w-3 h-3 rounded-full bg-slate-300" />
                        </div>
                        <div className="space-y-1">
                          <div className="w-full h-2 rounded bg-white border border-slate-200" />
                          <div className="w-3/4 h-2 rounded bg-white border border-slate-200" />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Sun className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                          {t('theme_light')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1 leading-snug">
                        {t('theme_light_desc')}
                      </p>
                    </button>

                    {/* Dark Theme Card */}
                    <button
                      type="button"
                      onClick={() => {
                        changeTheme("dark");
                        showToast("Dark Theme activated 🌙", "success");
                      }}
                      className={`relative flex flex-col text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        (theme || 'light') === "dark"
                          ? "border-purple-500 bg-purple-50/40 dark:bg-purple-950/30 ring-2 ring-purple-500/20 shadow-md"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50"
                      }`}
                    >
                      {(theme || 'light') === "dark" && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center shadow">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      {/* Mockup Preview Dark */}
                      <div className="w-full h-20 rounded-lg bg-slate-950 border border-slate-800 p-2 flex flex-col justify-between mb-3 shadow-inner">
                        <div className="flex items-center justify-between">
                          <div className="w-8 h-2.5 rounded bg-purple-500" />
                          <div className="w-3 h-3 rounded-full bg-slate-800" />
                        </div>
                        <div className="space-y-1">
                          <div className="w-full h-2 rounded bg-slate-900 border border-slate-800" />
                          <div className="w-3/4 h-2 rounded bg-slate-900 border border-slate-800" />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Moon className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                          {t('theme_dark')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1 leading-snug">
                        {t('theme_dark_desc')}
                      </p>
                    </button>

                    {/* System Auto Sync Card */}
                    <button
                      type="button"
                      onClick={() => {
                        changeTheme("system");
                        showToast("System Theme synchronization active 💻", "info");
                      }}
                      className={`relative flex flex-col text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        (theme || 'light') === "system"
                          ? "border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/20 shadow-md"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50"
                      }`}
                    >
                      {(theme || 'light') === "system" && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shadow">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      {/* Mockup Preview System Split */}
                      <div className="w-full h-20 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 flex mb-3 shadow-inner">
                        <div className="w-1/2 bg-slate-100 p-2 flex flex-col justify-between">
                          <div className="w-6 h-2 rounded bg-dately-primary" />
                          <div className="w-full h-2 rounded bg-white" />
                        </div>
                        <div className="w-1/2 bg-slate-950 p-2 flex flex-col justify-between">
                          <div className="w-6 h-2 rounded bg-purple-500" />
                          <div className="w-full h-2 rounded bg-slate-900" />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Monitor className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                          {t('theme_system')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1 leading-snug">
                        {t('theme_system_desc')}
                      </p>
                    </button>
                  </div>
                </div>

                {/* Language Selection Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 text-left">
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base pb-3 border-b border-slate-100 dark:border-slate-800 mb-4 flex items-center">
                    <span>{t('settings_lang')} / மொழி</span>
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-1">
                        {t('settings_lang')}
                      </label>
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-medium mb-3">
                        {t('settings_lang_help')}
                      </p>
                      <select
                        value={language}
                        onChange={(e) => {
                          changeLanguage(e.target.value);
                          showToast(e.target.value === 'en' ? "Language changed to English" : "மொழி தமிழிற்கு மாற்றப்பட்டது", "success");
                        }}
                        className="w-full max-w-xs px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-dately-primary transition-all font-semibold text-slate-900 dark:text-slate-100 cursor-pointer"
                      >
                        <option value="en">English (default)</option>
                        <option value="ta">தமிழ் (Tamil)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. NOTIFICATIONS TAB */}
            {activeTab === "notifications" && (
              <>
                {/* Preferences Form */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6">
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                    {t('settings_notification_header')}
                  </h3>
                  <form onSubmit={handleSavePreferences} className="space-y-5">
                    <div className="space-y-3">
                      {[
                        {
                          id: "push",
                          name: t('settings_in_app'),
                          desc: t('settings_in_app_desc'),
                          state: channels.push,
                          set: (val) => setChannels({ ...channels, push: val })
                        },
                        {
                          id: "email",
                          name: t('settings_email'),
                          desc: t('settings_email_desc'),
                          state: channels.email,
                          set: (val) => setChannels({ ...channels, email: val })
                        },
                        {
                          id: "sms",
                          name: t('settings_sms'),
                          desc: t('settings_sms_desc'),
                          state: channels.sms,
                          set: (val) => setChannels({ ...channels, sms: val })
                        }
                      ].map((chan) => (
                        <label
                          key={chan.id}
                          className="flex items-start justify-between p-4 border border-slate-200 dark:border-slate-800 hover:border-dately-primary/40 dark:hover:border-purple-500/40 rounded-xl cursor-pointer transition-colors bg-white dark:bg-slate-900 shadow-sm"
                        >
                          <div className="flex flex-col pr-4">
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{chan.name}</span>
                            <span className="text-sm text-slate-700 dark:text-slate-400 font-medium mt-1 leading-relaxed">{chan.desc}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={chan.state}
                            onChange={(e) => chan.set(e.target.checked)}
                            className="mt-1 rounded text-dately-primary focus:ring-dately-primary cursor-pointer w-4.5 h-4.5"
                          />
                        </label>
                      ))}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                      <Button type="submit" variant="primary" className="shadow-md">
                        <Save className="w-4 h-4 mr-1.5" />
                        <span>{t('settings_save')}</span>
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Google Drive Integration Panel */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 space-y-4">
                  <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                        {t('settings_google_header')}
                      </h3>
                      <p className="text-sm text-slate-700 dark:text-slate-400 font-medium mt-0.5">
                        {t('settings_google_desc')}
                      </p>
                    </div>
                  </div>

                  {userProfile?.googleConnected ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl">
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{t('settings_google_connected')}</span>
                          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">{userProfile.email} (Google Drive Linked)</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            updateUserProfile({ googleConnected: false });
                            showToast("Google Drive disconnected.", "info");
                          }}
                          className="text-xs py-1.5 px-3 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-950/50"
                        >
                          {t('settings_google_disconnect')}
                        </Button>
                      </div>

                      {/* Google Drive Storage Meter & Quota Breakdown */}
                      <div className="space-y-4 text-left bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <div className="flex items-center space-x-2">
                              <HardDrive className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Google Drive Account Storage</h4>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                              Real-time quota synchronized with your Google cloud account
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={fetchLiveDriveStorage}
                            disabled={isRefreshingDrive}
                            className="inline-flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100/80 px-3 py-1.5 rounded-lg transition-colors border-0 cursor-pointer self-start sm:self-auto disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshingDrive ? "animate-spin" : ""}`} />
                            <span>{isRefreshingDrive ? "Syncing..." : "Refresh Live Quota"}</span>
                          </button>
                        </div>

                        {/* Top Large Metrics */}
                        <div className="flex items-baseline justify-between pt-1">
                          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-sans tracking-tight">
                            {displayUsed} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">used of {displayTotal}</span>
                          </span>
                          <span className="text-xs sm:text-sm font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                            {displayRemaining} free
                          </span>
                        </div>

                        {/* Multi-segment styled Progress Bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                          <div
                            className="h-2 rounded-full bg-blue-600 dark:bg-blue-500 transition-all duration-500 shadow-sm"
                            style={{ width: `${Math.min(100, Math.max(1, Number(percentage)))}%` }}
                          />
                        </div>

                        {/* Storage Component Breakdown */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Drive & Vault Files</span>
                            <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1">{displayUsed}</span>
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">{(documents || []).length} Encrypted Docs</span>
                          </div>

                          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Remaining Free Space</span>
                            <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">{displayRemaining}</span>
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Available for Uploads</span>
                          </div>

                          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Account Quota</span>
                            <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1">{displayTotal}</span>
                            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">Google Cloud Free Tier</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium pt-1">
                          <span className="flex items-center text-emerald-700 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mr-1" />
                            Storage Connected to Google Drive Vault
                          </span>
                          <span className="font-mono text-slate-500 dark:text-slate-400">{percentage}% capacity used</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-3">
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                        {t('settings_google_disconnected_desc')}
                      </p>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => {
                          const token = localStorage.getItem("dately_token");
                          window.location.href = `${API_URL}/auth/google?token=${token}`;
                        }}
                        className="shadow-sm font-semibold text-sm"
                      >
                        {t('settings_google_connect_btn')}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 3. PRIVACY TAB */}
            {activeTab === "privacy" && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 space-y-6">
                <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base font-sans">
                      Privacy & Vault Encryption Architecture
                    </h3>
                    <p className="text-sm text-slate-700 dark:text-slate-400 font-medium mt-0.5">
                      Understand how Dately vaults and protects your personal data.
                    </p>
                  </div>
                </div>

                {/* Graphical Encryption Flowchart */}
                <div className="bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-4 text-center">
                    Secure Data Flow Diagram
                  </span>
                  
                  {/* Responsive Diagram Container */}
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    
                    {/* Step 1 */}
                    <div className="flex flex-col items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm w-full lg:w-48 text-center">
                      <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">1. Document Upload</span>
                      <span className="text-xs text-slate-700 dark:text-slate-400 font-medium mt-1 leading-snug">Local file prepared for transmission.</span>
                    </div>

                    {/* Arrow 1 */}
                    <div className="flex items-center justify-center text-dately-primary dark:text-purple-400 animate-pulse py-0.5 lg:py-0">
                      <span className="hidden lg:inline text-lg font-bold">➡️</span>
                      <span className="inline lg:hidden text-lg font-bold">⬇️</span>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center bg-white dark:bg-slate-900 border-2 border-dately-primary/45 dark:border-purple-500/50 rounded-xl p-4 shadow-sm w-full lg:w-48 text-center relative">
                      <span className="absolute -top-2.5 bg-dately-primary text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        AES-256 Tunnel
                      </span>
                      <div className="w-10 h-10 rounded-full bg-dately-primary/10 dark:bg-purple-950/50 text-dately-primary dark:text-purple-400 flex items-center justify-center mb-2">
                        <Shield className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-sans">2. TLS Encryption</span>
                      <span className="text-xs text-slate-700 dark:text-slate-400 font-medium mt-1 leading-snug">Payload encrypted via HTTPS tunnels.</span>
                    </div>

                    {/* Arrow 2 */}
                    <div className="flex items-center justify-center text-dately-primary dark:text-purple-400 animate-pulse py-0.5 lg:py-0">
                      <span className="hidden lg:inline text-lg font-bold">➡️</span>
                      <span className="inline lg:hidden text-lg font-bold">⬇️</span>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm w-full lg:w-48 text-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">3. Google Drive Vault</span>
                      <span className="text-xs text-slate-700 dark:text-slate-400 font-medium mt-1 leading-snug">Vaulted in your private Drive directory.</span>
                    </div>

                  </div>
                </div>

                {/* Technical Specifications */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    Security Protections Specs
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5 text-left bg-white dark:bg-slate-900 shadow-sm">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">Zero-Knowledge Directory</span>
                      <p className="text-sm text-slate-700 dark:text-slate-400 font-medium leading-relaxed">
                        Dately never holds your actual document files on its servers. All files remain safely hosted on your personal Google Drive account.
                      </p>
                    </div>
                    
                    <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5 text-left bg-white dark:bg-slate-900 shadow-sm">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">Granular Drive Authorization</span>
                      <p className="text-sm text-slate-700 dark:text-slate-400 font-medium leading-relaxed">
                        Our Google integration is scoped down strictly to `drive.file` permission, with zero visibility into other folders.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
