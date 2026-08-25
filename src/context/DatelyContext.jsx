import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialNotifications } from '@/data/mockData';
import { Toast } from '@/components/ui/Toast';
import { translations } from '@/data/translations';

const DatelyContext = createContext(undefined);

import { API_URL } from '@/config/api';

const defaultUserProfile = {
  name: "Pasupathi A T",
  email: "atpasupathi77@gmail.com",
  phone: "+91 98765 43210",
  avatar: "",
  onboarded: true,
  googleConnected: true,
  notificationPreferences: {
    email: true,
    sms: true,
    push: true,
    voiceCalls: false,
    voiceCallsCriticalOnly: true
  },
  notificationChannels: {
    push: true,
    email: true,
    sms: true
  }
};

export function DatelyProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('dately_token') || '';
    } catch {
      return '';
    }
  });
  const [userProfile, setUserProfile] = useState(defaultUserProfile);
  const [documents, setDocuments] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [toast, setToast] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('dately_lang') || 'en';
    } catch {
      return 'en';
    }
  });
  const [tempSignupData, setTempSignupData] = useState(() => {
    try {
      const saved = localStorage.getItem('dately_temp_signup');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // SPA Router State
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const savedPage = localStorage.getItem('dately_page');
      const savedToken = localStorage.getItem('dately_token');
      if (savedToken) {
        return savedPage && !['landing', 'login', 'signup', 'forgot-password'].includes(savedPage) ? savedPage : 'dashboard';
      }
    } catch {}
    return 'landing';
  });
  const [currentParams, setCurrentParams] = useState(null);

  const navigateTo = (page, params = null) => {
    setCurrentPage(page);
    setCurrentParams(params);
    try {
      localStorage.setItem('dately_page', page);
    } catch {}
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0); // Scroll page to top on page switches
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const getAuthHeaders = () => {
    return {
      'Authorization': `Bearer ${token}`
    };
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('dately_token');
    } catch {}
    setToken('');
    setUserProfile(defaultUserProfile);
    setDocuments([]);
    setObligations([]);
    setReminders([]);
    navigateTo('landing');
  };

  // Intercept Google OAuth redirection token on startup
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) {
        localStorage.setItem('dately_token', urlToken);
        setToken(urlToken);
        // Clean up search parameters from browser URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {}
  }, []);

  // Load from database if token exists with timeout guard
  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      if (!token) {
        setIsLoaded(true);
        return;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        // 1. Fetch User Profile
        const userRes = await fetch(`${API_URL}/auth/profile`, {
          headers: getAuthHeaders(),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!userRes.ok) {
          if (!isCancelled) {
            try {
              localStorage.removeItem('dately_token');
            } catch {}
            setToken('');
            setUserProfile(defaultUserProfile);
          }
          setIsLoaded(true);
          return;
        }
        
        const userData = await userRes.json();
        if (!isCancelled) {
          setUserProfile(userData || defaultUserProfile);
        }

        // 2. Fetch Documents, Obligations, Reminders safely
        const [docsRes, obsRes, remindersRes] = await Promise.allSettled([
          fetch(`${API_URL}/documents`, { headers: getAuthHeaders() }),
          fetch(`${API_URL}/obligations`, { headers: getAuthHeaders() }),
          fetch(`${API_URL}/reminders`, { headers: getAuthHeaders() })
        ]);

        if (docsRes.status === 'fulfilled' && docsRes.value.ok) {
          const docsData = await docsRes.value.json();
          if (!isCancelled && Array.isArray(docsData)) {
            setDocuments(docsData.map(doc => ({ ...doc, id: doc._id || doc.id })));
          }
        }

        if (obsRes.status === 'fulfilled' && obsRes.value.ok) {
          const obsData = await obsRes.value.json();
          if (!isCancelled && Array.isArray(obsData)) {
            setObligations(obsData.map(ob => ({ ...ob, id: ob._id || ob.id })));
          }
        }

        if (remindersRes.status === 'fulfilled' && remindersRes.value.ok) {
          const remindersData = await remindersRes.value.json();
          if (!isCancelled && Array.isArray(remindersData)) {
            setReminders(remindersData.map(rem => ({ ...rem, id: rem._id || rem.id })));
          }
        }
      } catch (err) {
        console.warn('Backend unavailable or request timed out, using local mock data:', err);
      } finally {
        if (!isCancelled) {
          setIsLoaded(true);
        }
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [token]);

  const handleLogin = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }

      localStorage.setItem('dately_token', data.token);
      setToken(data.token);
      setUserProfile(data);
      showToast('Signed in successfully!', 'success');
      navigateTo('dashboard');
      return { success: true };
    } catch (err) {
      showToast(err.message, 'danger');
      return { success: false, error: err.message };
    }
  };

  const handleSignUp = async (name, email, phone, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to send verification code');
      }

      localStorage.setItem('dately_temp_signup', JSON.stringify({ name, email, phone, password }));
      setTempSignupData({ name, email, phone, password });
      showToast('Verification code sent to your WhatsApp number!', 'success');
      navigateTo('otp'); // Redirect to verification screen
      return { success: true };
    } catch (err) {
      showToast(err.message, 'danger');
      return { success: false, error: err.message };
    }
  };

  const handleVerifyOtp = async (otp) => {
    try {
      if (!tempSignupData) {
        throw new Error('No pending registration data found. Please sign up again.');
      }

      const verifyRes = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: tempSignupData.phone, otp }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        throw new Error(verifyData.message || 'Incorrect OTP code');
      }

      const registerRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempSignupData),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        throw new Error(registerData.message || 'Account registration failed');
      }

      localStorage.setItem('dately_token', registerData.token);
      setToken(registerData.token);
      setUserProfile(registerData);
      localStorage.removeItem('dately_temp_signup');
      setTempSignupData(null);
      showToast('Phone verified and account created successfully!', 'success');
      navigateTo('onboarding');
      return { success: true };
    } catch (err) {
      showToast(err.message, 'danger');
      return { success: false, error: err.message };
    }
  };

  const handleResendOtp = async () => {
    try {
      if (!tempSignupData) {
        throw new Error('No pending registration details found. Please go back and sign up again.');
      }

      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: tempSignupData.phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to resend verification code');
      }

      showToast('A new 6-digit verification code has been sent!', 'success');
      return { success: true };
    } catch (err) {
      showToast(err.message, 'danger');
      return { success: false, error: err.message };
    }
  };



  const updateUserProfile = async (profile) => {
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profile),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      setUserProfile(data);
      showToast('Profile settings saved!', 'success');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const addDocument = async (doc) => {
    try {
      let body;
      let headers = {};

      if (doc instanceof FormData) {
        body = doc;
        headers = {
          'Authorization': `Bearer ${token}`,
        };
      } else {
        body = JSON.stringify(doc);
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        };
      }

      const res = await fetch(`${API_URL}/documents`, {
        method: 'POST',
        headers,
        body,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to save document');
      }

      const normalized = { ...data, id: data._id };
      setDocuments((prev) => [normalized, ...prev]);
      const docName = doc instanceof FormData ? doc.get('name') : doc.name;
      showToast(`Document "${docName}" saved to MongoDB!`, 'success');
    } catch (err) {
      showToast(err.message, 'danger');
      throw err;
    }
  };

  const updateDocument = async (updatedDoc) => {
    const id = updatedDoc.id || updatedDoc._id;
    try {
      const res = await fetch(`${API_URL}/documents/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedDoc),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update document');
      }

      const normalized = { ...data, id: data._id };
      setDocuments((prev) =>
        prev.map((d) => ((d.id || d._id) === id ? normalized : d))
      );
      showToast(`Document "${updatedDoc.name}" updated!`, 'success');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const deleteDocument = async (id) => {
    try {
      const res = await fetch(`${API_URL}/documents/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete');
      }

      setDocuments((prev) => prev.filter((d) => (d.id || d._id) !== id));
      showToast('Document deleted.', 'info');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const addObligation = async (ob) => {
    try {
      const res = await fetch(`${API_URL}/obligations`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(ob),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to save obligation');
      }

      const normalized = { ...data, id: data._id };
      setObligations((prev) => [normalized, ...prev]);
      showToast(`Obligation "${ob.name}" created!`, 'success');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const updateObligation = async (updatedOb) => {
    const id = updatedOb.id || updatedOb._id;
    try {
      const res = await fetch(`${API_URL}/obligations/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedOb),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update');
      }

      const normalized = { ...data, id: data._id };
      setObligations((prev) =>
        prev.map((o) => ((o.id || o._id) === id ? normalized : o))
      );
      showToast(`Obligation "${updatedOb.name}" updated!`, 'success');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const deleteObligation = async (id) => {
    try {
      const res = await fetch(`${API_URL}/obligations/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete');
      }

      setObligations((prev) => prev.filter((o) => (o.id || o._id) !== id));
      showToast('Obligation deleted.', 'info');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const toggleObligationStatus = async (id) => {
    const ob = obligations.find((o) => (o.id || o._id) === id);
    if (!ob) return;

    const nextStatus = ob.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      const res = await fetch(`${API_URL}/obligations/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update');
      }

      const normalized = { ...data, id: data._id };
      setObligations((prev) => prev.map((o) => ((o.id || o._id) === id ? normalized : o)));

      if (nextStatus === 'Completed') {
        const newNotif = {
          id: `notif-${Date.now()}`,
          title: `${ob.name} marked as paid`,
          message: `You have successfully completed your obligation for "${ob.name}" of ₹${ob.amount || 0}.`,
          type: 'success',
          category: 'System',
          read: false,
          createdAt: new Date().toISOString(),
        };
        setNotifications((n) => [newNotif, ...n]);
        showToast(`"${ob.name}" marked as Paid!`, 'success');
      } else {
        showToast(`"${ob.name}" marked as Pending.`, 'info');
      }
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const addReminder = async (reminderData) => {
    try {
      const res = await fetch(`${API_URL}/reminders`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reminderData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create reminder');
      }

      const normalized = { ...data, id: data._id };
      setReminders((prev) => [...prev, normalized]);
      showToast('Reminder added successfully.', 'success');
      return normalized;
    } catch (err) {
      showToast(err.message, 'danger');
      throw err;
    }
  };

  const deleteReminder = async (id) => {
    try {
      const res = await fetch(`${API_URL}/reminders/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete');
      }

      setReminders((prev) => prev.filter((r) => (r.id || r._id) !== id));
      showToast('Reminder deleted.', 'info');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const toggleReminderStatus = async (id) => {
    const rem = reminders.find((r) => (r.id || r._id) === id);
    if (!rem) return;

    const nextStatus = rem.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      const res = await fetch(`${API_URL}/reminders/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update');
      }

      const normalized = { ...data, id: data._id };
      setReminders((prev) => prev.map((r) => ((r.id || r._id) === id ? normalized : r)));

      if (nextStatus === 'Completed') {
        const newNotif = {
          id: `notif-${Date.now()}`,
          title: `Task "${rem.name}" completed`,
          message: `You marked your task "${rem.name}" as completed.`,
          type: 'success',
          category: 'System',
          read: false,
          createdAt: new Date().toISOString(),
        };
        setNotifications((n) => [newNotif, ...n]);
        showToast(`Task marked as Completed!`, 'success');
      } else {
        showToast(`Task marked as Pending.`, 'info');
      }
    } catch (err) {
      showToast(err.message, 'danger');
    }
  };

  const markNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All notifications marked as read.', 'success');
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const resetAllData = () => {
    showToast('Cleared local variables. Please manage using dashboard lists.', 'info');
  };

  const [reminderThresholds, setReminderThresholds] = useState(() => {
    try {
      const saved = localStorage.getItem('dately_thresholds');
      return saved ? JSON.parse(saved) : { documents: 30, obligations: 7 };
    } catch {
      return { documents: 30, obligations: 7 };
    }
  });

  const updateReminderThresholds = (newThresholds) => {
    setReminderThresholds((prev) => {
      const updated = { ...prev, ...newThresholds };
      try {
        localStorage.setItem('dately_thresholds', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
    try {
      localStorage.setItem('dately_lang', lang);
    } catch {}
  };

  const t = (key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <DatelyContext.Provider
      value={{
        token,
        userProfile,
        updateUserProfile,
        reminderThresholds,
        updateReminderThresholds,
        documents,
        addDocument,
        updateDocument,
        deleteDocument,
        obligations,
        addObligation,
        updateObligation,
        deleteObligation,
        toggleObligationStatus,
        reminders,
        addReminder,
        deleteReminder,
        toggleReminderStatus,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        resetAllData,
        showToast,
        isLoaded,
        currentPage,
        currentParams,
        navigateTo,
        handleLogin,
        handleSignUp,
        handleVerifyOtp,
        handleResendOtp,
        tempSignupData,
        handleLogout,
        language,
        changeLanguage,
        t,
      }}
    >
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </DatelyContext.Provider>
  );
}

export function useDately() {
  const context = useContext(DatelyContext);
  if (context === undefined) {
    throw new Error('useDately must be used within a DatelyProvider');
  }
  return context;
}
