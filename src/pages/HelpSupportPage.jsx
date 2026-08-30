import { HelpCircle, CheckCircle2, ShieldAlert, Sparkles, Key, FileText, ListTodo, CreditCard, Calendar, Mail } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useDately } from "@/context/DatelyContext";

export default function HelpSupportPage() {
  const { t } = useDately();

  const setupSteps = [
    {
      title: "1. Account Registration & Google Login",
      desc: "Get started by registering with your name, email, and phone number, or select 'Continue with Google' to automatically register and log in using your Google account identity safely without manual password friction.",
      icon: Key,
      color: "text-blue-600 bg-blue-50"
    },
    {
      title: "2. Google Drive Cloud Vault Syncing",
      desc: "For maximum security, Dately uses a zero-knowledge architecture. Go to Settings -> Google Drive Integration and click 'Connect' to link your Drive folder. Dately will only access the files it creates, leaving all other private directories completely isolated.",
      icon: FileText,
      color: "text-green-600 bg-green-50"
    },
    {
      title: "3. Email Notification & Expiry Alerts",
      desc: "Dately monitors your expirations and bill deadlines 24/7. To receive active alerts, ensure your email address is verified in Settings. You can click 'Send Test Email' to verify your connection.",
      icon: Mail,
      color: "text-purple-600 bg-purple-50"
    }
  ];

  const features = [
    {
      title: "OCR Smart Document Scanner",
      desc: "Upload images or PDFs of driving licences, insurance coverages, or passports. Our AI text parser automatically detects expiry terms (e.g. 'Validity', 'Valid Upto'). If found, it populates renewal alarms; if not, it stores the file as a permanent secure vault record.",
      icon: Sparkles,
      color: "text-amber-600 bg-amber-50"
    },
    {
      title: "To-Do List & Tasks",
      desc: "Organize meetings, appointments, and general reminders. Accessible right from the 2nd sidebar option. Check off tasks as completed, set custom categories, and synchronize your schedule.",
      icon: ListTodo,
      color: "text-indigo-600 bg-indigo-50"
    },
    {
      title: "Bills & Obligations Tracker",
      desc: "Keep utility payments, EMI schedules, and rent commitments listed. When you tick off a recurring obligation, Dately automatically rolls over the due date to the next cycle and logs a completion notification.",
      icon: CreditCard,
      color: "text-rose-600 bg-rose-50"
    },
    {
      title: "Calendar Schedule Visualizer",
      desc: "A centralized monthly calendar mapping due bills and expiry count milestones, letting you inspect all upcoming commitments and renewal deadlines at a single glance.",
      icon: Calendar,
      color: "text-cyan-600 bg-cyan-50"
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl text-left font-sans pb-10">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center">
            <HelpCircle className="w-7 h-7 mr-2.5 text-dately-primary flex-shrink-0" />
            <span>Help & Support Center</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
            Learn how to set up your Dately profile and utilize our smart automation systems.
          </p>
        </div>

        {/* Setup Steps Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base pb-3 border-b border-slate-100 flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600 flex-shrink-0" />
            <span>Step-by-Step Account Onboarding & Setup</span>
          </h3>
          <div className="space-y-3.5">
            {setupSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="flex items-start space-x-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${step.color} shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{step.title}</h4>
                    <p className="text-sm text-slate-800 font-medium leading-relaxed mt-1">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Core Features Guide */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base pb-3 border-b border-slate-100 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-dately-primary flex-shrink-0" />
            <span>Core Features Guide</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="p-5 border border-slate-200 hover:border-dately-primary/40 rounded-xl transition-all space-y-2.5 bg-white shadow-sm">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${feat.color} shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">{feat.title}</h4>
                  <p className="text-sm text-slate-800 font-medium leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security Warning Box */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 flex items-start space-x-3.5 text-left">
          <ShieldAlert className="w-6 h-6 text-blue-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900">AES-256 Zero-Knowledge Vault Storage</h4>
            <p className="text-sm text-slate-800 font-medium leading-relaxed">
              Dately utilizes secure TLS communication tunnels. None of your documents are stored permanently on Dately’s backend web servers. When synced, your files reside inside your own personal Google Drive under private token access.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
