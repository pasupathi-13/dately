import { useState } from "react";
import {
  User,
  Settings,
  Mail,
  Phone,
  Camera,
  Save
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useDately } from "@/context/DatelyContext";
import { Button } from "@/components/ui/Button";
export default function ProfilePage() {
  const { userProfile, updateUserProfile, showToast, navigateTo } = useDately();
  const [formData, setFormData] = useState({
    name: userProfile?.name || "",
    email: userProfile?.email || "",
    phone: userProfile?.phone || ""
  });
  const [errors, setErrors] = useState({});
  const handleSave = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Full Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Mobile number is required";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    updateUserProfile({
      name: formData.name,
      email: formData.email,
      phone: formData.phone
    });
    showToast("Profile information updated successfully!", "success");
  };
  const getInitials = (name) => {
    if (!name) return "PA";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
  };
  return <DashboardLayout><div className="space-y-6 max-w-4xl text-left">{
    /* Header */
  }<div className="flex items-center justify-between"><div><h1 className="text-2xl font-extrabold text-dately-navy">My Profile</h1><p className="text-sm text-dately-slate mt-1">Manage your identity and broadcast coordinates.</p></div><button
    onClick={() => navigateTo("settings")}
    className="inline-flex items-center px-3.5 py-2 text-xs font-bold bg-white border border-dately-border text-dately-navy hover:bg-slate-50 transition-colors rounded-lg shadow-sm cursor-pointer"
  ><Settings className="w-3.5 h-3.5 mr-1.5 text-dately-slate" /><span>Preferences</span></button></div>{
    /* Profile Card Form */
  }<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{
    /* Profile Picture Mock (Span 1) */
  }<div className="bg-white border border-dately-border rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-center"><div className="relative group cursor-pointer" onClick={() => showToast("Avatar updates are a placeholder.", "info")}><div className="w-24 h-24 rounded-full bg-dately-primary text-white flex items-center justify-center font-extrabold text-2xl shadow-lg border-4 border-white ring-2 ring-slate-100">{getInitials(formData.name)}</div><div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="w-6 h-6" /></div></div><h3 className="font-extrabold text-dately-navy mt-4">{formData.name}</h3><p className="text-xs text-dately-slate mt-1">Member since August 2026</p></div>{
    /* Details Form Input (Span 2) */
  }<div className="lg:col-span-2 bg-white border border-dately-border rounded-xl shadow-sm p-6"><h3 className="font-extrabold text-dately-navy text-sm pb-3 border-b border-dately-navy/25 mb-4">
              Profile Information
            </h3><form onSubmit={handleSave} className="space-y-4">{
    /* Full Name */
  }<div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                  Full Name
                </label><div className="relative"><User className="w-4 h-4 text-dately-slate absolute left-3 top-3" /><input
    type="text"
    value={formData.name}
    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
    className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary ${errors.name ? "border-dately-danger ring-1 ring-dately-danger" : "border-dately-border"}`}
  /></div>{errors.name && <p className="text-xs text-dately-danger mt-1">{errors.name}</p>}</div>{
    /* Email Address */
  }<div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                  Email Address
                </label><div className="relative"><Mail className="w-4 h-4 text-dately-slate absolute left-3 top-3" /><input
    type="email"
    value={formData.email}
    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
    className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary ${errors.email ? "border-dately-danger ring-1 ring-dately-danger" : "border-dately-border"}`}
  /></div>{errors.email && <p className="text-xs text-dately-danger mt-1">{errors.email}</p>}</div>{
    /* Phone Number */
  }<div><label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                  Mobile Number
                </label><div className="relative"><Phone className="w-4 h-4 text-dately-slate absolute left-3 top-3" /><input
    type="text"
    value={formData.phone}
    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
    className={`w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary ${errors.phone ? "border-dately-danger ring-1 ring-dately-danger" : "border-dately-border"}`}
  /></div>{errors.phone && <p className="text-xs text-dately-danger mt-1">{errors.phone}</p>}</div>{
    /* Actions */
  }<div className="flex justify-end pt-4 border-t border-dately-border"><Button type="submit" variant="primary" className="shadow-md"><Save className="w-4 h-4 mr-1.5" /><span>Save Changes</span></Button></div></form></div></div></div></DashboardLayout>;
}
