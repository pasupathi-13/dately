import { useState } from "react";
import { Mail, ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDately } from "@/context/DatelyContext";
export default function ForgotPasswordPage() {
  const { navigateTo, showToast } = useDately();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email address is required");
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Invalid email address");
      return;
    }
    setError("");
    setSubmitted(true);
    showToast("Reset password link has been sent to your email.", "success");
  };
  return <div className="min-h-screen bg-dately-background flex flex-col items-center justify-center p-4">{
    /* Brand Header */
  }<div className="flex items-center space-x-2.5 mb-8"><div className="w-8 h-8 rounded-lg bg-dately-primary flex items-center justify-center font-bold text-white shadow-md">
          D
        </div><span className="font-extrabold text-lg tracking-wider text-dately-primary">DATELY</span></div><div className="w-full max-w-md bg-white border border-dately-border rounded-2xl shadow-lg p-6 md:p-8"><button
    onClick={() => navigateTo("login")}
    className="inline-flex items-center text-xs text-dately-slate hover:text-dately-navy font-bold mb-6 transition-colors bg-transparent border-0 cursor-pointer"
  ><ArrowLeft className="w-3.5 h-3.5 mr-1" /><span>Back to Login</span></button>{!submitted ? <><div className="text-center mb-6"><h2 className="text-2xl font-extrabold text-dately-navy">Reset Password</h2><p className="text-sm text-dately-slate mt-1.5 leading-relaxed">
                Enter your email address and we will send you a secure link to reset your account password.
              </p></div><form onSubmit={handleSubmit} className="space-y-4 text-left"><div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                  Email Address
                </label><div className="relative"><Mail className="w-4 h-4 text-dately-slate absolute left-3 top-3" /><input
    type="email"
    name="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="you@example.com"
    className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary ${error ? "border-dately-danger ring-1 ring-dately-danger" : "border-dately-border"}`}
  /></div>{error && <p className="text-xs text-dately-danger mt-1">{error}</p>}</div><Button type="submit" variant="primary" fullWidth className="py-2.5 shadow-md">
                Send Recovery Link
              </Button></form></> : <div className="text-center py-4 space-y-4"><div className="w-12 h-12 bg-dately-success/15 text-dately-success rounded-full flex items-center justify-center mx-auto"><Send className="w-6 h-6" /></div><h2 className="text-xl font-extrabold text-dately-navy">Recovery Link Sent</h2><p className="text-sm text-dately-slate leading-relaxed">
              We have dispatched password recovery instructions to <br /><span className="font-bold text-dately-navy">{email}</span>. <br />
              Please check your spam folder if it doesn&apos;t arrive in 5 minutes.
            </p><Button
    type="button"
    variant="outline"
    fullWidth
    onClick={() => navigateTo("login")}
    className="mt-4"
  >
              Return to Login
            </Button></div>}</div></div>;
}
