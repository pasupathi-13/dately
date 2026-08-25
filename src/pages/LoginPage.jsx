import { useState, useEffect } from "react";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDately } from "@/context/DatelyContext";
export default function LoginPage() {
  const { navigateTo, handleLogin, showToast } = useDately();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("google") === "error") {
      showToast("Google Authentication failed. Please try again.", "danger");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState({});
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    await handleLogin(formData.email, formData.password);
  };
  return <div className="min-h-screen bg-dately-background flex flex-col items-center justify-center p-4">{
    /* Brand Header */
  }<div className="flex items-center space-x-2.5 mb-8"><div className="w-8 h-8 rounded-lg bg-dately-primary flex items-center justify-center font-bold text-white shadow-md">
          D
        </div><span className="font-extrabold text-lg tracking-wider text-dately-primary">DATELY</span></div><div className="w-full max-w-md bg-white border border-dately-border rounded-2xl shadow-lg p-6 md:p-8"><div className="text-center mb-6 border-b border-dately-navy/25 pb-4"><h2 className="text-2xl font-extrabold text-dately-navy font-sans">Sign In</h2><p className="text-sm text-dately-slate mt-1">Access your personal assistant panel</p></div><form onSubmit={handleSubmit} className="space-y-4">{
    /* Email */
  }<div className="text-left"><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
              Email Address
            </label><div className="relative"><Mail className="w-4 h-4 text-dately-slate absolute left-3 top-3" /><input
    type="email"
    name="email"
    value={formData.email}
    onChange={handleChange}
    placeholder="you@example.com"
    className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary ${errors.email ? "border-dately-danger ring-1 ring-dately-danger" : "border-dately-border"}`}
  /></div>{errors.email && <p className="text-xs text-dately-danger mt-1">{errors.email}</p>}</div>{
    /* Password */
  }<div className="text-left"><div className="flex justify-between items-center mb-1.5"><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy">
                Password
              </label><button
    type="button"
    onClick={() => navigateTo("forgot-password")}
    className="text-xs text-dately-primary hover:underline font-semibold bg-transparent border-0 cursor-pointer p-0"
  >
                Forgot Password?
              </button></div><div className="relative"><Lock className="w-4 h-4 text-dately-slate absolute left-3 top-3" /><input
    type="password"
    name="password"
    value={formData.password}
    onChange={handleChange}
    placeholder="••••••••"
    className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary ${errors.password ? "border-dately-danger ring-1 ring-dately-danger" : "border-dately-border"}`}
  /></div>{errors.password && <p className="text-xs text-dately-danger mt-1">{errors.password}</p>}</div><Button type="submit" variant="primary" fullWidth className="py-2.5 shadow-md">
            Sign In
          </Button></form><div className="relative my-6 text-center"><span className="absolute inset-x-0 top-1/2 border-t border-dately-border" /><span className="relative bg-white px-3 text-xs text-dately-slate uppercase tracking-wider font-semibold">
            Or
          </span></div>{
    /* Google sign in */
  }<Button
    type="button"
    variant="outline"
    fullWidth
    onClick={() => {
      window.location.href = "http://localhost:5000/api/auth/google-login";
    }}
    className="flex items-center justify-center space-x-2 py-2"
  ><svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.478 0-6.3-2.822-6.3-6.3s2.822-6.3 6.3-6.3c1.706 0 3.24.69 4.35 1.806l3.11-3.11C19.23 2.63 15.96 1 12.24 1 5.48 1 0 6.48 0 13.24s5.48 12.24 12.24 12.24c6.82 0 12.24-5.42 12.24-12.24 0-.785-.095-1.539-.272-2.285H12.24z" /></svg><span>Continue with Google</span></Button><div className="text-center mt-6"><p className="text-xs text-dately-slate font-semibold">
            Don&apos;t have an account?{" "}<button
    onClick={() => navigateTo("signup")}
    className="text-dately-primary hover:underline font-extrabold bg-transparent border-0 cursor-pointer p-0"
  >
              Sign Up
            </button></p></div></div></div>;
}
