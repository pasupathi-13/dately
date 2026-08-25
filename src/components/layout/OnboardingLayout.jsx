"use client";
import { Check } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";
export default function OnboardingLayout({ children, currentStep }) {
  const steps = [
    { number: 1, title: "Welcome / Setup" },
    { number: 2, title: "Personal Details" },
    { number: 3, title: "Contact Preferences" },
    { number: 4, title: "Notification Preferences" },
    { number: 5, title: "Add First Document" },
    { number: 6, title: "Add First Obligation" },
    { number: 7, title: "Complete Setup" }
  ];
  const progressPercentage = Math.round(currentStep / steps.length * 100);
  return <div className="min-h-screen flex flex-col md:flex-row bg-dately-background text-dately-navy">{
    /* Sidebar - Desktop (Fixed 300px) */
  }<aside className="w-full md:w-80 flex-shrink-0 bg-dately-primary text-white flex flex-col md:sticky md:top-0 md:h-screen border-b md:border-b-0 md:border-r border-white/10">{
    /* Brand */
  }<div className="flex items-center space-x-3 px-6 py-6 border-b border-white/10"><div className="w-8 h-8 rounded-lg bg-dately-success flex items-center justify-center font-bold text-white shadow-md">
            D
          </div><span className="font-extrabold text-lg tracking-wider text-white">DATELY</span></div>{
    /* Steps List (Hidden on Mobile) */
  }<div className="hidden md:flex flex-col flex-1 px-6 py-8 space-y-6 overflow-y-auto"><div><span className="text-xs font-bold uppercase tracking-wider text-white/40 block mb-1">Onboarding Wizard</span><h2 className="text-sm font-semibold text-white/90">Set up your workspace</h2></div><div className="space-y-4">{steps.map((step) => {
    const isCompleted = step.number < currentStep;
    const isActive = step.number === currentStep;
    return <div key={step.number} className="flex items-center space-x-4">{
      /* Step status circle */
    }<div className="flex-shrink-0">{isCompleted ? <div className="w-7 h-7 rounded-full bg-dately-success flex items-center justify-center text-white"><Check className="w-4 h-4" /></div> : isActive ? <div className="w-7 h-7 rounded-full border-2 border-white bg-dately-secondary flex items-center justify-center font-bold text-white text-xs ring-4 ring-dately-secondary/35">{step.number}</div> : <div className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center font-semibold text-white/40 text-xs">{step.number}</div>}</div>{
      /* Step title */
    }<span
      className={`text-sm font-semibold transition-colors duration-150 ${isActive ? "text-white font-bold" : isCompleted ? "text-white/80" : "text-white/40"}`}
    >{step.title}</span></div>;
  })}</div></div>{
    /* Desktop Sidebar Footer */
  }<div className="hidden md:block p-6 border-t border-white/10 bg-black/10"><div className="flex justify-between items-center mb-2"><span className="text-xs text-white/60">Setup Progress</span><span className="text-xs font-bold text-dately-success">{progressPercentage}%</span></div><ProgressBar value={progressPercentage} color="success" /></div>{
    /* Mobile Steps Banner (Visible on Mobile only) */
  }<div className="md:hidden p-4 bg-dately-primary flex flex-col space-y-2"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wider text-white/60">
              Step {currentStep} of {steps.length}</span><span className="text-sm font-bold text-white">{steps[currentStep - 1].title}</span></div><ProgressBar value={progressPercentage} color="success" /></div></aside>{
    /* Main Content Area */
  }<main className="flex-1 flex flex-col items-center justify-center p-4 md:p-12 lg:p-20 overflow-y-auto"><div className="max-w-xl w-full bg-white rounded-2xl border border-dately-border shadow-md p-6 md:p-10">{children}</div></main></div>;
}
