import { useState, useEffect, useRef } from "react";
import { Mail, ArrowLeft, RefreshCw, MessageSquare, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDately } from "@/context/DatelyContext";

export default function OtpPage() {
  const { navigateTo, tempSignupData, handleVerifyOtp, handleResendOtp, showToast } = useDately();
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split("");
      setOtp(digits);
      showToast("Verification code pasted!", "success");
      if (inputRefs.current[5]) {
        inputRefs.current[5].focus();
      }
    }
  };

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      showToast("Please enter the complete 6-digit verification code.", "danger");
      return;
    }
    await handleVerifyOtp(code);
  };

  const triggerResend = async (channel = 'both') => {
    if (!canResend || isResending) return;
    setIsResending(true);
    try {
      const res = await handleResendOtp(channel);
      if (res && res.success) {
        setOtp(new Array(6).fill(""));
        setCountdown(30);
        setCanResend(false);
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-dately-background flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="flex items-center space-x-2.5 mb-8">
        <div className="w-8 h-8 rounded-lg bg-dately-primary flex items-center justify-center font-bold text-white shadow-md">
          D
        </div>
        <span className="font-extrabold text-lg tracking-wider text-dately-primary">DATELY</span>
      </div>

      <div className="w-full max-w-md bg-white border border-dately-border rounded-2xl shadow-lg p-6 md:p-8">
        <button
          onClick={() => navigateTo("signup")}
          className="inline-flex items-center text-xs text-dately-slate hover:text-dately-navy font-bold mb-6 transition-colors bg-transparent border-0 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Back to Sign Up</span>
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-200/60 shadow-sm">
            <div className="flex items-center space-x-1">
              <Mail className="w-5 h-5 text-blue-600" />
              <MessageSquare className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <h2 className="text-xl font-extrabold text-dately-navy">Security Code Verification</h2>
          <p className="text-xs text-dately-slate mt-1.5 leading-relaxed">
            We have dispatched your 6-digit security code to:
          </p>

          <div className="mt-3 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-left">
            {tempSignupData?.email && (
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center font-bold text-slate-700">
                  <Mail className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Email:
                </span>
                <span className="font-bold text-dately-navy">{tempSignupData.email}</span>
              </div>
            )}
            {tempSignupData?.phone && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                <span className="flex items-center font-bold text-slate-700">
                  <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> WhatsApp:
                </span>
                <span className="font-bold text-emerald-800">{tempSignupData.phone}</span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          {/* OTP Code Inputs */}
          <div className="flex justify-between gap-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={digit}
                ref={(el) => {
                  if (el) inputRefs.current[index] = el;
                }}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-11 h-12 text-center text-lg font-bold border border-dately-border rounded-xl bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary focus:border-transparent transition-all"
              />
            ))}
          </div>

          <Button type="submit" variant="primary" fullWidth className="py-2.5 shadow-md font-bold">
            <ShieldCheck className="w-4 h-4 mr-1.5" />
            Verify & Create Account
          </Button>
        </form>

        <div className="text-center mt-6 space-y-3">
          <p className="text-xs text-dately-slate font-medium">
            {canResend ? (
              <span>Didn&apos;t receive the verification code?</span>
            ) : (
              <span>
                Resend code available in{" "}
                <span className="font-bold text-dately-navy">
                  00:{countdown < 10 ? `0${countdown}` : countdown}
                </span>
              </span>
            )}
          </p>

          {canResend && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => triggerResend('both')}
                disabled={isResending}
                className="inline-flex items-center text-xs text-dately-primary hover:underline font-extrabold bg-transparent border-0 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isResending ? 'animate-spin' : ''}`} />
                <span>Resend Code</span>
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => triggerResend('whatsapp')}
                disabled={isResending}
                className="inline-flex items-center text-xs text-emerald-700 hover:underline font-extrabold bg-transparent border-0 cursor-pointer disabled:opacity-50"
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>Resend via WhatsApp</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
