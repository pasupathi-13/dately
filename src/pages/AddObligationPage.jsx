import { useState } from "react";
import { ArrowLeft, Save, Info } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useDately } from "@/context/DatelyContext";
import { Button } from "@/components/ui/Button";
export default function AddObligationPage() {
  const { addObligation, navigateTo } = useDately();
  const [formData, setFormData] = useState({
    name: "",
    category: "Bill",
    amount: "",
    dueDate: "",
    priority: "Medium",
    repeat: "Monthly",
    reminderPreference: "3 days before",
    channels: {
      inApp: true,
      email: true,
      sms: false,
      voice: false
    }
  });
  const [errors, setErrors] = useState({});
  const handleChannelChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [name]: checked
      }
    }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Obligation name is required";
    if (!formData.dueDate) newErrors.dueDate = "Due date is required";
    if (formData.amount && Number(formData.amount) < 0) {
      newErrors.amount = "Amount cannot be negative";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    const notificationChannels = [];
    if (formData.channels.inApp) notificationChannels.push("In-App");
    if (formData.channels.email) notificationChannels.push("Email");
    if (formData.channels.sms) notificationChannels.push("SMS");
    if (formData.channels.voice) notificationChannels.push("Voice Call");
    addObligation({
      name: formData.name,
      category: formData.category,
      amount: formData.amount ? Number(formData.amount) : void 0,
      dueDate: formData.dueDate,
      priority: formData.priority,
      repeat: formData.repeat,
      reminderPreference: formData.reminderPreference,
      notificationChannels
    });
    navigateTo("obligations");
  };
  return <DashboardLayout><div className="space-y-6 max-w-2xl mx-auto text-left">{
    /* Back Link */
  }<button
    onClick={() => navigateTo("obligations")}
    className="inline-flex items-center text-xs text-dately-slate hover:text-dately-navy font-bold transition-colors bg-transparent border-0 cursor-pointer p-0"
  ><ArrowLeft className="w-3.5 h-3.5 mr-1" /><span>Back to Checklist</span></button>{
    /* Header */
  }<div><h1 className="text-2xl font-extrabold text-dately-navy">Add Obligation</h1><p className="text-sm text-dately-slate mt-1">
            Create a recurring payment or renew deadline.
          </p></div>{
    /* Form Card */
  }<div className="bg-white border border-dately-border rounded-2xl p-6 md:p-8 shadow-sm"><form onSubmit={handleSubmit} className="space-y-5">{
    /* Obligation Name */
  }<div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                Obligation Name
              </label><input
    type="text"
    value={formData.name}
    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
    placeholder="e.g. Electricity Bill, Car EMI, Rent"
    className={`w-full px-4 py-2 border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary ${errors.name ? "border-dately-danger ring-1 ring-dately-danger" : "border-dately-border"}`}
  />{errors.name && <p className="text-xs text-dately-danger mt-1">{errors.name}</p>}</div>{
    /* Category & Amount */
  }<div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                  Category
                </label><select
    value={formData.category}
    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
    className="w-full px-3 py-2 border border-dately-border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary"
  ><option value="Bill">Bill</option><option value="EMI">EMI</option><option value="Rent">Rent</option><option value="Subscription">Subscription</option><option value="Renewal">Renewal</option><option value="Document">Document</option><option value="Other">Other</option></select></div><div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                  Amount (Optional, ₹)
                </label><input
    type="number"
    value={formData.amount}
    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
    placeholder="e.g. 1500"
    className={`w-full px-4 py-2 border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary ${errors.amount ? "border-dately-danger ring-1 ring-dately-danger" : "border-dately-border"}`}
  />{errors.amount && <p className="text-xs text-dately-danger mt-1">{errors.amount}</p>}</div></div>{
    /* Due Date & Priority */
  }<div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                  Due Date
                </label><input
    type="date"
    value={formData.dueDate}
    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
    className={`w-full px-4 py-2 border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary ${errors.dueDate ? "border-dately-danger ring-1 ring-dately-danger" : "border-dately-border"}`}
  />{errors.dueDate && <p className="text-xs text-dately-danger mt-1">{errors.dueDate}</p>}</div><div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                  Priority
                </label><select
    value={formData.priority}
    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
    className="w-full px-3 py-2 border border-dately-border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary"
  ><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option></select></div></div>{
    /* Repeat & Reminder */
  }<div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                  Repeat Interval
                </label><select
    value={formData.repeat}
    onChange={(e) => setFormData({ ...formData, repeat: e.target.value })}
    className="w-full px-3 py-2 border border-dately-border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary"
  ><option value="Does not repeat">Does not repeat</option><option value="Daily">Daily</option><option value="Weekly">Weekly</option><option value="Monthly">Monthly</option><option value="Yearly">Yearly</option></select></div><div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                  Reminder Window
                </label><select
    value={formData.reminderPreference}
    onChange={(e) => setFormData({ ...formData, reminderPreference: e.target.value })}
    className="w-full px-3 py-2 border border-dately-border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary"
  ><option value="1 day before">1 day before</option><option value="3 days before">3 days before</option><option value="7 days before">7 days before</option><option value="30 days before">30 days before</option></select></div></div>{
    /* Channels Preference */
  }<div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-2">
                Notification Broadcast Channels
              </label><div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[
    { name: "inApp", label: "In-App Hub" },
    { name: "email", label: "Email Box" },
    { name: "sms", label: "SMS Texts" },
    { name: "voice", label: "Voice Calls" }
  ].map((item) => <label
    key={item.name}
    className="flex items-center space-x-2 p-2.5 border border-dately-border hover:border-dately-primary/30 rounded-lg cursor-pointer transition-colors bg-slate-50/20 hover:bg-slate-50"
  ><input
    type="checkbox"
    name={item.name}
    checked={formData.channels[item.name]}
    onChange={handleChannelChange}
    className="rounded text-dately-primary focus:ring-dately-primary"
  /><span className="text-xs text-dately-navy font-semibold">{item.label}</span></label>)}</div></div>{
    /* Info bar */
  }<div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-start space-x-2 text-[10px] text-dately-slate font-sans"><Info className="w-4 h-4 text-dately-primary mt-0.5 flex-shrink-0" /><p className="leading-relaxed">
                Saving this obligation schedules notifications. If a repeating option is selected, the due date will roll over automatically upon toggle payment completions.
              </p></div>{
    /* Actions */
  }<div className="flex justify-end gap-3 pt-4 border-t border-dately-border"><Button
    type="button"
    variant="outline"
    onClick={() => navigateTo("obligations")}
  >
                Cancel
              </Button><Button type="submit" variant="primary" className="shadow-md"><Save className="w-4 h-4 mr-1.5" /><span>Save Obligation</span></Button></div></form></div></div></DashboardLayout>;
}
