import { useState, useEffect } from "react";
import { Mail, Lock, Phone, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDately } from "@/context/DatelyContext";
import { API_URL } from "@/config/api";
export default function SignUpPage() {
  const { navigateTo, handleSignUp, handleDirectRegister, showToast } = useDately();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("google") === "error") {
      showToast("Google Authentication failed. Please try again.", "danger");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agree: false
  });
  const [errors, setErrors] = useState({});
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Full Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Mobile number is required";
    } else if (!/^\+?[\d\s-]{10,15}$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone number format";
    }
    if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.agree) {
      newErrors.agree = "You must agree to the Terms and Privacy Policy";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await handleDirectRegister(formData.name, formData.email, formData.phone, formData.password);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpFlow = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      await handleSignUp(formData.name, formData.email, formData.phone, formData.password);
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="min-h-screen bg-dately-background flex flex-col items-center justify-center p-4">{
    /* Brand Header */
  }<div className="flex items-center space-x-2.5 mb-8"><div className="w-8 h-8 rounded-lg bg-dately-primary flex items-center justify-center font-bold text-white shadow-md">
          D
        </div><span className="font-extrabold text-lg tracking-wider text-dately-primary">DATELY</span></div><div className="w-full max-w-md bg-white border border-dately-border rounded-2xl shadow-lg p-6 md:p-8"><div className="text-center mb-6 border-b border-dately-navy/25 pb-4"><h2 className="text-2xl font-extrabold text-dately-navy font-sans">Create Account</h2><p className="text-sm text-dately-slate mt-1">Get started with your renewal assistant</p></div><form onSubmit={handleSubmit} className="space-y-4 text-left">{
    /* Full Name */
  }<div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
              Full Name
            </label><div className="relative"><User className="w-4 h-4 text-dately-slate absolute left-3 top-3" /><input
    type="text"
    name="name"
    value={formData.name}
    onChange={handleChange}
    placeholder="Enter your name"
    className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary ${errors.name ? "border-dately-danger ring-1 ring-dately-danger" : "border-dately-border"}`}
  /></div>{errors.name && <p className="text-xs text-dately-danger mt-1">{errors.name}</p>}</div>{
    /* Email */
  }<div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
              Email Address
            </label><div className="relative"><Mail className="w-4 h-4 text-dately-slate absolute left-3 top-3" /><input
    type="email"
    name="email"
    value={formData.email}
    onChange={handleChange}
    placeholder="you@example.com"
    className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary ${errors.email ? "border-dately-danger ring-1 ring-dately-danger" : "border-dately-border"}`}
  /></div>{errors.email && <p className="text-xs text-dately-danger mt-1">{errors.email}</p>}</div>{
    /* Mobile Number */
  }<div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
              Mobile Number
            </label><div className="relative"><Phone className="w-4 h-4 text-dately-slate absolute left-3 top-3" /><input
    type="text"
    name="phone"
    value={formData.phone}
    onChange={handleChange}
    placeholder="+91 98765 43210"
    className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary ${errors.phone ? "border-dately-danger ring-1 ring-dately-danger" : "border-dately-border"}`}
  /></div>{errors.phone && <p className="text-xs text-dately-danger mt-1">{errors.phone}</p>}</div>{
    /* Password */
  }<div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
              Password
            </label><div className="relative"><Lock className="w-4 h-4 text-dately-slate absolute left-3 top-3" /><input
    type="password"
    name="password"
    value={formData.password}
    onChange={handleChange}
    placeholder="••••••••"
    className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary ${errors.password ? "border-dately-danger ring-1 ring-dately-danger" : "border-dately-border"}`}
  /></div>{errors.password && <p className="text-xs text-dately-danger mt-1">{errors.password}</p>}</div>{
    /* Confirm Password */
  }<div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
              Confirm Password
            </label><div className="relative"><Lock className="w-4 h-4 text-dately-slate absolute left-3 top-3" /><input
    type="password"
    name="confirmPassword"
    value={formData.confirmPassword}
    onChange={handleChange}
    placeholder="••••••••"
    className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary ${errors.confirmPassword ? "border-dately-danger ring-1 ring-dately-danger" : "border-dately-border"}`}
  /></div>{errors.confirmPassword && <p className="text-xs text-dately-danger mt-1">{errors.confirmPassword}</p>}</div>{
    /* Checkbox */
  }<div className="flex items-start space-x-2.5 pt-1.5"><input
    type="checkbox"
    name="agree"
    id="agree"
    checked={formData.agree}
    onChange={handleChange}
    className="mt-0.5 rounded text-dately-primary focus:ring-dately-primary"
  /><label htmlFor="agree" className="text-xs text-dately-slate leading-relaxed">
              I agree to the{" "}<a href="#" onClick={(e) => e.preventDefault()} className="text-dately-primary font-semibold hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}<a href="#" onClick={(e) => e.preventDefault()} className="text-dately-primary font-semibold hover:underline">
                Privacy Policy
              </a>
              .
            </label>
          </div>
          {errors.agree && <p className="text-xs text-dately-danger mt-0.5">{errors.agree}</p>}

          <div className="space-y-2 pt-2">
            <Button type="submit" variant="primary" fullWidth disabled={isSubmitting} className="py-2.5 shadow-md font-bold">
              {isSubmitting ? "Creating Account..." : "Create Account & Sign In"}
            </Button>
            <Button
              type="button"
              variant="outline"
              fullWidth
              disabled={isSubmitting}
              onClick={handleOtpFlow}
              className="py-2 text-xs font-semibold text-dately-slate hover:text-dately-navy"
            >
              Verify via WhatsApp OTP
            </Button>
          </div>
        </form><div className="relative my-6 text-center"><span className="absolute inset-x-0 top-1/2 border-t border-dately-border" /><span className="relative bg-white px-3 text-xs text-dately-slate uppercase tracking-wider font-semibold">
            Or
          </span></div>{
    /* Google sign up */
  }<Button
    type="button"
    variant="outline"
    fullWidth
    onClick={() => {
      window.location.href = `${API_URL}/auth/google-login`;
    }}
    className="flex items-center justify-center space-x-2 py-2"
  ><svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.478 0-6.3-2.822-6.3-6.3s2.822-6.3 6.3-6.3c1.706 0 3.24.69 4.35 1.806l3.11-3.11C19.23 2.63 15.96 1 12.24 1 5.48 1 0 6.48 0 13.24s5.48 12.24 12.24 12.24c6.82 0 12.24-5.42 12.24-12.24 0-.785-.095-1.539-.272-2.285H12.24z" /></svg><span>Continue with Google</span></Button><div className="text-center mt-6"><p className="text-xs text-dately-slate font-semibold">
            Already have an account?{" "}<button
    onClick={() => navigateTo("login")}
    className="text-dately-primary hover:underline font-extrabold bg-transparent border-0 cursor-pointer p-0"
  >
              Sign In
            </button></p></div></div></div>;
}
