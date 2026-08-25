import { useState } from "react";
import {
  PartyPopper,
  Smile,
  Shield,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import OnboardingLayout from "@/components/layout/OnboardingLayout";
import { useDately } from "@/context/DatelyContext";
export default function OnboardingPage() {
  const { navigateTo, userProfile, updateUserProfile, addDocument, addObligation, showToast } = useDately();
  const [step, setStep] = useState(1);
  const [detailsForm, setDetailsForm] = useState({
    name: userProfile.name || "Kutty",
    email: userProfile.email || "kutty@example.com",
    phone: userProfile.phone || "+91 98765 43210"
  });
  const [channels, setChannels] = useState({
    email: userProfile.notificationPreferences.email,
    sms: userProfile.notificationPreferences.sms,
    push: userProfile.notificationPreferences.push,
    voice: userProfile.notificationPreferences.voiceCalls
  });
  const [notifPrefs, setNotifPrefs] = useState({
    voiceCallsCriticalOnly: userProfile.notificationPreferences.voiceCallsCriticalOnly,
    digestFrequency: "immediate",
    quietHours: true
  });
  const [docForm, setDocForm] = useState({
    name: "Driving Licence",
    provider: "Regional Transport Office",
    expiryDate: "2028-11-18",
    category: "Identity"
  });
  const [docAdded, setDocAdded] = useState(false);
  const [obForm, setObForm] = useState({
    name: "Rent Payment",
    category: "Rent",
    amount: 12e3,
    dueDate: "2026-08-31",
    priority: "High",
    repeat: "Monthly",
    reminderPreference: "3 days before",
    notificationChannels: ["In-App", "Email"]
  });
  const [obAdded, setObAdded] = useState(false);
  const nextStep = () => setStep((prev) => Math.min(prev + 1, 7));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));
  const handleSaveDetails = (e) => {
    e.preventDefault();
    if (!detailsForm.name.trim() || !detailsForm.email.trim() || !detailsForm.phone.trim()) {
      showToast("All contact fields are required.", "warning");
      return;
    }
    updateUserProfile({
      name: detailsForm.name,
      email: detailsForm.email,
      phone: detailsForm.phone
    });
    nextStep();
  };
  const handleSaveChannels = () => {
    updateUserProfile({
      notificationPreferences: {
        ...userProfile.notificationPreferences,
        email: channels.email,
        sms: channels.sms,
        push: channels.push,
        voiceCalls: channels.voice
      }
    });
    nextStep();
  };
  const handleSaveNotifPrefs = () => {
    updateUserProfile({
      notificationPreferences: {
        ...userProfile.notificationPreferences,
        voiceCallsCriticalOnly: notifPrefs.voiceCallsCriticalOnly
      }
    });
    nextStep();
  };
  const handleAddFirstDoc = () => {
    if (!docForm.name.trim() || !docForm.expiryDate) {
      showToast("Please enter document name and expiry date.", "warning");
      return;
    }
    addDocument({
      name: docForm.name,
      provider: docForm.provider,
      expiryDate: docForm.expiryDate,
      category: docForm.category,
      status: "Active"
    });
    setDocAdded(true);
    showToast("Your first document has been added to Dately.", "success");
    nextStep();
  };
  const handleAddFirstOb = () => {
    if (!obForm.name.trim() || !obForm.dueDate) {
      showToast("Please enter obligation name and due date.", "warning");
      return;
    }
    addObligation({
      name: obForm.name,
      category: obForm.category,
      amount: Number(obForm.amount),
      dueDate: obForm.dueDate,
      priority: obForm.priority,
      repeat: obForm.repeat,
      reminderPreference: obForm.reminderPreference,
      notificationChannels: obForm.notificationChannels
    });
    setObAdded(true);
    showToast("Your first obligation has been configured.", "success");
    nextStep();
  };
  const handleCompleteSetup = () => {
    updateUserProfile({ onboarded: true });
    showToast("Welcome to Dately! Setup completed.", "success");
    navigateTo("dashboard");
  };
  return <OnboardingLayout currentStep={step}>{
    /* STEP 1: Welcome Screen */
  }{step === 1 && <div className="space-y-6 text-left"><div className="text-center space-y-3"><div className="w-14 h-14 bg-dately-primary/10 rounded-full flex items-center justify-center text-dately-primary mx-auto"><Smile className="w-7 h-7" /></div><h2 className="text-2xl font-extrabold text-dately-navy">Welcome to Dately</h2><p className="text-sm text-dately-slate">
              Hello, {detailsForm.name}! We will guide you through configuring your new personal obligation and renewal vault in just a few minutes.
            </p></div><div className="bg-dately-background/50 rounded-xl border border-dately-border p-4 space-y-4"><h3 className="text-xs font-bold uppercase tracking-wider text-dately-primary flex items-center"><Shield className="w-4 h-4 mr-1.5 text-dately-success" /><span>Dately Security Promise</span></h3><p className="text-xs text-dately-slate leading-relaxed">
              We encrypt your document metadata client-side. Your digital papers are safe, private, and fully under your ownership.
            </p></div><Button onClick={nextStep} variant="primary" fullWidth className="py-2.5">
            Let&apos;s Get Started
            <ArrowRight className="w-4 h-4 ml-1.5" /></Button></div>}{
    /* STEP 2: Personal Details Form */
  }{step === 2 && <div className="space-y-6 text-left"><div className="text-center space-y-1.5"><h2 className="text-xl font-extrabold text-dately-navy">Personal Details</h2><p className="text-xs text-dately-slate">Verify your profile information for secure access</p></div><form onSubmit={handleSaveDetails} className="space-y-4"><div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                Full Name
              </label><input
    type="text"
    value={detailsForm.name}
    onChange={(e) => setDetailsForm({ ...detailsForm, name: e.target.value })}
    className="w-full px-4 py-2 border border-dately-border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary"
  /></div><div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                Email Address
              </label><input
    type="email"
    value={detailsForm.email}
    onChange={(e) => setDetailsForm({ ...detailsForm, email: e.target.value })}
    className="w-full px-4 py-2 border border-dately-border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary"
  /></div><div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                Mobile Number
              </label><input
    type="text"
    value={detailsForm.phone}
    onChange={(e) => setDetailsForm({ ...detailsForm, phone: e.target.value })}
    className="w-full px-4 py-2 border border-dately-border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary"
  /></div><div className="flex gap-3 pt-4"><Button type="button" variant="outline" onClick={prevStep} className="w-1/3">
                Back
              </Button><Button type="submit" variant="primary" className="flex-1">
                Save & Continue
              </Button></div></form></div>}{
    /* STEP 3: Contact Preferences */
  }{step === 3 && <div className="space-y-6 text-left"><div className="text-center space-y-1.5"><h2 className="text-xl font-extrabold text-dately-navy">Contact Preferences</h2><p className="text-xs text-dately-slate">How should Dately reach you for reminders?</p></div><div className="space-y-3.5">{[
    { id: "push", name: "In-App & Push Notifications", desc: "Real-time updates directly on your dashboard", state: channels.push, set: (val) => setChannels({ ...channels, push: val }) },
    { id: "email", name: "Email Messages", desc: "Detailed PDF alerts sent to your inbox", state: channels.email, set: (val) => setChannels({ ...channels, email: val }) },
    { id: "sms", name: "SMS Texts", desc: "Brief mobile reminder text alerts", state: channels.sms, set: (val) => setChannels({ ...channels, sms: val }) },
    { id: "voice", name: "Voice Calls", desc: "Automated verbal notifications for critical expiries", state: channels.voice, set: (val) => setChannels({ ...channels, voice: val }) }
  ].map((chan) => <label
    key={chan.id}
    className="flex items-start space-x-3.5 p-3 border border-dately-border hover:border-dately-primary/40 rounded-xl cursor-pointer transition-colors hover:bg-slate-50/50"
  ><input
    type="checkbox"
    checked={chan.state}
    onChange={(e) => chan.set(e.target.checked)}
    className="mt-1 rounded text-dately-primary focus:ring-dately-primary"
  /><div><span className="text-sm font-bold text-dately-navy block">{chan.name}</span><span className="text-xs text-dately-slate mt-0.5 block">{chan.desc}</span></div></label>)}</div><div className="flex gap-3 pt-2"><Button type="button" variant="outline" onClick={prevStep} className="w-1/3">
              Back
            </Button><Button type="button" variant="primary" onClick={handleSaveChannels} className="flex-1">
              Save & Continue
            </Button></div></div>}{
    /* STEP 4: Notification Preferences */
  }{step === 4 && <div className="space-y-6 text-left"><div className="text-center space-y-1.5"><h2 className="text-xl font-extrabold text-dately-navy">Notification Tuning</h2><p className="text-xs text-dately-slate">Fine-tune reminder delivery parameters</p></div><div className="space-y-4">{
    /* Digest Settings */
  }<div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                Digest Frequency
              </label><select
    value={notifPrefs.digestFrequency}
    onChange={(e) => setNotifPrefs({ ...notifPrefs, digestFrequency: e.target.value })}
    className="w-full px-4 py-2 border border-dately-border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary"
  ><option value="immediate">Immediate (On Event)</option><option value="daily">Daily Summary Digest</option><option value="weekly">Weekly Checklist Digest</option></select></div>{
    /* Critical Calls Toggle */
  }<label className="flex items-start justify-between cursor-pointer p-3 border border-dately-border rounded-xl"><div className="flex flex-col pr-4"><span className="text-sm font-semibold text-dately-navy">Critical Voice Calls Only</span><span className="text-xs text-dately-slate mt-0.5">Use voice calls only for final-day warnings</span></div><input
    type="checkbox"
    checked={notifPrefs.voiceCallsCriticalOnly}
    onChange={(e) => setNotifPrefs({ ...notifPrefs, voiceCallsCriticalOnly: e.target.checked })}
    className="mt-1 rounded text-dately-primary focus:ring-dately-primary"
  /></label>{
    /* Quiet Hours */
  }<label className="flex items-start justify-between cursor-pointer p-3 border border-dately-border rounded-xl"><div className="flex flex-col pr-4"><span className="text-sm font-semibold text-dately-navy">Enable Quiet Hours</span><span className="text-xs text-dately-slate mt-0.5">Pause SMS and calls between 10:00 PM and 7:00 AM</span></div><input
    type="checkbox"
    checked={notifPrefs.quietHours}
    onChange={(e) => setNotifPrefs({ ...notifPrefs, quietHours: e.target.checked })}
    className="mt-1 rounded text-dately-primary focus:ring-dately-primary"
  /></label></div><div className="flex gap-3 pt-2"><Button type="button" variant="outline" onClick={prevStep} className="w-1/3">
              Back
            </Button><Button type="button" variant="primary" onClick={handleSaveNotifPrefs} className="flex-1">
              Save & Continue
            </Button></div></div>}{
    /* STEP 5: Add First Document */
  }{step === 5 && <div className="space-y-6 text-left"><div className="text-center space-y-1.5"><h2 className="text-xl font-extrabold text-dately-navy">Add First Document</h2><p className="text-xs text-dately-slate">Start tracking expiries by registering a file details</p></div><div className="space-y-4"><div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                Document Name
              </label><input
    type="text"
    value={docForm.name}
    onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
    className="w-full px-4 py-2 border border-dately-border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary"
  /></div><div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                  Category
                </label><select
    value={docForm.category}
    onChange={(e) => setDocForm({ ...docForm, category: e.target.value })}
    className="w-full px-3 py-2 border border-dately-border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary"
  ><option value="Identity">Identity</option><option value="Vehicle">Vehicle</option><option value="Insurance">Insurance</option><option value="Education">Education</option><option value="Health">Health</option><option value="Other">Other</option></select></div><div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                  Expiry Date
                </label><input
    type="date"
    value={docForm.expiryDate}
    onChange={(e) => setDocForm({ ...docForm, expiryDate: e.target.value })}
    className="w-full px-3 py-2 border border-dately-border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary"
  /></div></div><div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                Issuer / Provider
              </label><input
    type="text"
    value={docForm.provider}
    onChange={(e) => setDocForm({ ...docForm, provider: e.target.value })}
    className="w-full px-4 py-2 border border-dately-border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary"
  /></div></div><div className="flex gap-3 pt-2"><Button type="button" variant="outline" onClick={nextStep} className="w-1/3">
              Skip
            </Button><Button type="button" variant="primary" onClick={handleAddFirstDoc} className="flex-1">
              Add Document
            </Button></div></div>}{
    /* STEP 6: Add First Obligation */
  }{step === 6 && <div className="space-y-6 text-left"><div className="text-center space-y-1.5"><h2 className="text-xl font-extrabold text-dately-navy">Add First Obligation</h2><p className="text-xs text-dately-slate">Set up reminders for your upcoming bill obligations</p></div><div className="space-y-4"><div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                Obligation Name
              </label><input
    type="text"
    value={obForm.name}
    onChange={(e) => setObForm({ ...obForm, name: e.target.value })}
    className="w-full px-4 py-2 border border-dately-border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary"
  /></div><div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                  Amount (₹)
                </label><input
    type="number"
    value={obForm.amount}
    onChange={(e) => setObForm({ ...obForm, amount: Number(e.target.value) })}
    className="w-full px-3 py-2 border border-dately-border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary"
  /></div><div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                  Due Date
                </label><input
    type="date"
    value={obForm.dueDate}
    onChange={(e) => setObForm({ ...obForm, dueDate: e.target.value })}
    className="w-full px-3 py-2 border border-dately-border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary"
  /></div></div><div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                  Category
                </label><select
    value={obForm.category}
    onChange={(e) => setObForm({ ...obForm, category: e.target.value })}
    className="w-full px-3 py-2 border border-dately-border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary"
  ><option value="Bill">Bill</option><option value="EMI">EMI</option><option value="Rent">Rent</option><option value="Subscription">Subscription</option><option value="Renewal">Renewal</option><option value="Other">Other</option></select></div><div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                  Remind Me
                </label><select
    value={obForm.reminderPreference}
    onChange={(e) => setObForm({ ...obForm, reminderPreference: e.target.value })}
    className="w-full px-3 py-2 border border-dately-border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary"
  ><option value="1 day before">1 day before</option><option value="3 days before">3 days before</option><option value="7 days before">7 days before</option><option value="30 days before">30 days before</option></select></div></div></div><div className="flex gap-3 pt-2"><Button type="button" variant="outline" onClick={nextStep} className="w-1/3">
              Skip
            </Button><Button type="button" variant="primary" onClick={handleAddFirstOb} className="flex-1">
              Add Obligation
            </Button></div></div>}{
    /* STEP 7: Completed Onboarding */
  }{step === 7 && <div className="text-center space-y-6"><div className="w-16 h-16 bg-dately-success/15 text-dately-success rounded-full flex items-center justify-center mx-auto"><PartyPopper className="w-8 h-8 animate-bounce" /></div><div className="space-y-2 text-left text-center"><h2 className="text-2xl font-extrabold text-dately-navy">Configuration Complete!</h2><p className="text-sm text-dately-slate leading-relaxed">
              Congratulations! Your Dately profile has been initialized. We have synchronized your active notifications, document profiles, and configured reminders.
            </p></div><div className="border border-dately-border rounded-xl p-4 bg-dately-background/40 text-left space-y-2.5"><div className="flex items-center space-x-2 text-xs font-bold text-dately-navy"><CheckCircle className="w-4 h-4 text-dately-success" /><span>Workspace Initialized</span></div><p className="text-xs text-dately-slate pl-6 leading-relaxed">
              Profile: {detailsForm.name} <br />
              Initial setups: {docAdded ? "1 Document, " : "No Docs, "}{obAdded ? "1 Obligation" : "No Obligations"}.
            </p></div><Button onClick={handleCompleteSetup} variant="primary" fullWidth className="py-2.5 shadow-md">
            Enter My Dashboard
            <ArrowRight className="w-4 h-4 ml-1.5" /></Button></div>}</OnboardingLayout>;
}
