import { useState } from "react";
import { ChevronLeft, ChevronRight, FileText, CalendarDays, ExternalLink, Calendar, Plus, X, Pin } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useDately } from "@/context/DatelyContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function CalendarPage() {
  const { documents, obligations, reminders, addReminder, navigateTo, showToast, t } = useDately();
  const [currentDate, setCurrentDate] = useState(new Date("2026-08-19")); // Anchor date matching project context
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    category: "Personal",
    time: "",
    description: ""
  });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDayEvents(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDayEvents(null);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysGrid = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysGrid.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysGrid.push(i);
  }

  const getEventsForDate = (dayNum) => {
    if (!dayNum) return { docs: [], obs: [], rems: [] };
    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;

    const dayDocs = (documents || []).filter((d) => {
      if (!d?.expiryDate || typeof d.expiryDate !== 'string') return false;
      return d.expiryDate.split("T")[0] === dateString;
    });

    const dayObs = (obligations || []).filter((o) => {
      if (!o?.dueDate || typeof o.dueDate !== 'string') return false;
      return o.dueDate.split("T")[0] === dateString;
    });

    const dayRems = (reminders || []).filter((r) => {
      if (!r?.dueDate || typeof r.dueDate !== 'string') return false;
      return r.dueDate.split("T")[0] === dateString;
    });

    return { docs: dayDocs, obs: dayObs, rems: dayRems };
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleDayClick = (dayNum) => {
    const { docs, obs, rems } = getEventsForDate(dayNum);
    setSelectedDayEvents({ dayNum, docs, obs, rems });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveReminder = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Please enter a reminder title", "danger");
      return;
    }

    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDayEvents.dayNum).padStart(2, "0")}`;
    
    const reminderPayload = {
      name: formData.name,
      category: formData.category,
      dueDate: dateString,
      time: formData.time || "",
      notes: formData.description || ""
    };

    try {
      await addReminder(reminderPayload);
      
      // Reset form & close modal
      setFormData({
        name: "",
        category: "Personal",
        time: "",
        description: ""
      });
      setIsModalOpen(false);

      // Refresh the day view automatically to show the new event badge!
      setTimeout(() => {
        const updatedEvents = getEventsForDate(selectedDayEvents.dayNum);
        setSelectedDayEvents({
          dayNum: selectedDayEvents.dayNum,
          docs: updatedEvents.docs,
          obs: updatedEvents.obs,
          rems: updatedEvents.rems
        });
      }, 500);
    } catch (err) {
      showToast("Failed to save calendar reminder", "danger");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 text-left relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-dately-navy flex items-center">
              <Calendar className="w-6 h-6 mr-2 text-dately-primary" />
              <span>{t('cal_title')}</span>
            </h1>
            <p className="text-sm text-dately-slate mt-1">
              {t('cal_subtitle')}
            </p>
          </div>
          
          {/* Month Navigation Controls */}
          <div className="flex items-center space-x-3 bg-white border border-dately-border px-3 py-1.5 rounded-xl shadow-sm self-start sm:self-auto">
            <button 
              onClick={handlePrevMonth}
              className="p-1 hover:bg-slate-100 rounded-lg text-dately-navy transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-extrabold text-dately-navy min-w-[120px] text-center font-sans">
              {monthNames[month]} {year}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-1 hover:bg-slate-100 rounded-lg text-dately-navy transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Grid Calendar */}
          <div className="lg:col-span-2 bg-white border border-dately-border rounded-2xl shadow-md p-6">
            <div className="grid grid-cols-7 gap-2 mb-4 text-center">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <span key={day} className="text-xs font-bold text-dately-slate uppercase tracking-wider">
                  {day}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2.5">
              {daysGrid.map((dayNum, idx) => {
                if (dayNum === null) {
                  return (
                    <div 
                      key={`empty-${idx}`} 
                      className="min-h-[95px] bg-slate-50/20 rounded-xl border border-dashed border-dately-border/20" 
                    />
                  );
                }

                const { docs, obs, rems } = getEventsForDate(dayNum);
                const hasEvents = docs.length > 0 || obs.length > 0 || rems.length > 0;
                const isToday = year === 2026 && month === 7 && dayNum === 19; // Match mock timeline
                const isSelected = selectedDayEvents && selectedDayEvents.dayNum === dayNum;

                return (
                  <div 
                    key={`day-${dayNum}`}
                    onClick={() => handleDayClick(dayNum)}
                    className={`min-h-[95px] p-2 border rounded-xl flex flex-col text-left transition-all cursor-pointer hover:border-dately-primary hover:shadow-md ${
                      isSelected ? "border-dately-primary bg-dately-primary/5 shadow-sm" : hasEvents ? "bg-white border-dately-border" : "bg-slate-50/10 border-dately-border/60"
                    } ${isToday && !isSelected ? "ring-2 ring-dately-primary/30 border-dately-primary" : ""}`}
                  >
                    <span className={`text-[11px] font-bold font-sans flex items-center justify-center w-5 h-5 rounded-full ${
                      isToday ? "bg-dately-primary text-white" : "text-dately-navy"
                    }`}>
                      {dayNum}
                    </span>
                    
                    <div className="mt-1.5 space-y-1 flex-1 flex flex-col justify-end overflow-hidden">
                      {docs.slice(0, 1).map((doc) => (
                        <div 
                          key={doc.id}
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-50 text-dately-danger border border-red-200/50 truncate"
                          title={`Expiry: ${doc.name}`}
                        >
                          📄 {doc.name}
                        </div>
                      ))}
                      {obs.slice(0, 1).map((ob) => (
                        <div 
                          key={ob.id} 
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border truncate ${
                            ob.status === "Completed" 
                              ? "bg-green-50 text-dately-success border-green-200/50 line-through opacity-75" 
                              : "bg-blue-50 text-dately-secondary border-blue-200/50"
                          }`}
                          title={`Due: ${ob.name} (₹${ob.amount})`}
                        >
                          💸 {ob.name}
                        </div>
                      ))}
                      {rems.slice(0, 2).map((rem) => (
                        <div 
                          key={rem.id} 
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold border truncate ${
                            rem.status === "Completed" 
                              ? "bg-green-50 text-dately-success border-green-200/50 line-through opacity-75" 
                              : "bg-purple-50 text-purple-600 border-purple-200/50"
                          }`}
                          title={`Task: ${rem.name}`}
                        >
                          📌 {rem.name}
                        </div>
                      ))}
                      {(docs.length + obs.length + rems.length) > 4 && (
                        <div className="text-[8px] font-bold text-dately-slate pl-1">
                          +{(docs.length + obs.length + rems.length) - 4} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details Sidebar Panel */}
          <div className="bg-white border border-dately-border rounded-2xl shadow-md p-6 text-left h-fit flex flex-col justify-between min-h-[300px]">
            <div>
              <h2 className="text-sm font-extrabold text-dately-navy border-b border-dately-navy/10 pb-3 flex items-center">
                <CalendarDays className="w-4.5 h-4.5 mr-2 text-dately-primary" />
                <span>{t('cal_inspector')}</span>
              </h2>

              {!selectedDayEvents ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-dately-slate">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-dately-slate max-w-[200px] mx-auto leading-relaxed font-semibold">
                    {t('cal_empty_inspector')}
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-5">
                  <div className="bg-dately-background p-3 rounded-xl border border-dately-border flex justify-between items-center">
                    <span className="text-sm font-bold text-dately-navy">{t('cal_selected_date')}:</span>
                    <Badge variant="primary" className="text-xs font-sans px-2.5 py-1">
                      {monthNames[month]} {selectedDayEvents.dayNum}, {year}
                    </Badge>
                  </div>

                  {selectedDayEvents.docs.length === 0 && selectedDayEvents.obs.length === 0 && selectedDayEvents.rems.length === 0 && (
                    <p className="text-sm text-dately-slate py-4 text-center">
                      {t('cal_no_events')}
                    </p>
                  )}

                  {/* Documents Section */}
                  {selectedDayEvents.docs.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-extrabold text-slate-500 block uppercase tracking-wider">
                        📄 Expiring Documents ({selectedDayEvents.docs.length})
                      </span>
                      <div className="space-y-2">
                        {selectedDayEvents.docs.map((doc) => (
                          <div key={doc.id} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/40 text-xs">
                            <div className="flex justify-between items-start">
                              <div className="text-left">
                                <span className="font-bold text-sm text-slate-900 block">{doc.name}</span>
                                <span className="text-xs text-slate-600 font-medium block mt-0.5">Category: {doc.category}</span>
                              </div>
                              <Badge variant="danger" className="text-xs px-2 py-0.5">Expires</Badge>
                            </div>
                            <div className="mt-2.5 flex justify-end">
                              <button
                                onClick={() => navigateTo("document-details", doc.id)}
                                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-800 transition-all flex items-center cursor-pointer"
                              >
                                <span>View Details</span>
                                <ExternalLink className="w-3.5 h-3.5 ml-1" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Obligations Section */}
                  {selectedDayEvents.obs.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-extrabold text-slate-500 block uppercase tracking-wider">
                        💸 Scheduled Bills ({selectedDayEvents.obs.length})
                      </span>
                      <div className="space-y-2">
                        {selectedDayEvents.obs.map((ob) => (
                          <div key={ob.id} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/40 text-xs">
                            <div className="flex justify-between items-start">
                              <div className="text-left">
                                <span className="font-bold text-sm text-slate-900 block">{ob.name}</span>
                                <span className="text-xs text-slate-600 font-medium block mt-0.5">Amount: ₹{ob.amount}</span>
                              </div>
                              <Badge variant={ob.status === "Completed" ? "success" : "warning"} className="text-xs px-2 py-0.5">
                                {ob.status}
                              </Badge>
                            </div>
                            <div className="mt-2.5 flex justify-end">
                              <button
                                onClick={() => navigateTo("bills-payments")}
                                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-800 transition-all flex items-center cursor-pointer"
                              >
                                <span>Pay / Manage</span>
                                <ExternalLink className="w-3.5 h-3.5 ml-1" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reminders Section */}
                  {selectedDayEvents.rems.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-extrabold text-dately-slate block uppercase tracking-wider">
                        📌 Tasks & Reminders ({selectedDayEvents.rems.length})
                      </span>
                      <div className="space-y-2">
                        {selectedDayEvents.rems.map((rem) => (
                          <div key={rem.id} className="p-3.5 border border-dately-border rounded-xl bg-slate-50/20 text-xs">
                            <div className="flex justify-between items-start">
                              <div className="text-left">
                                <span className="font-bold text-sm text-dately-navy block">{rem.name}</span>
                                {rem.time && <span className="text-xs text-dately-slate block mt-0.5 font-medium">Time: {rem.time}</span>}
                                {rem.notes && <span className="text-xs text-dately-slate block mt-0.5 italic">{rem.notes}</span>}
                              </div>
                              <Badge variant={rem.status === "Completed" ? "success" : "neutral"} className="text-xs px-2 py-0.5">
                                {rem.status}
                              </Badge>
                            </div>
                            <div className="mt-2.5 flex justify-end">
                              <button
                                onClick={() => navigateTo("todo-list")}
                                className="px-3 py-1.5 bg-white border border-dately-border hover:bg-slate-50 rounded-lg text-xs font-semibold text-dately-navy transition-all flex items-center cursor-pointer"
                              >
                                <span>Manage Checklist</span>
                                <ExternalLink className="w-3.5 h-3.5 ml-1" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedDayEvents && (
              <div className="mt-6 pt-4 border-t border-dately-border">
                <Button 
                  onClick={() => setIsModalOpen(true)}
                  variant="primary" 
                  fullWidth 
                  className="flex items-center justify-center space-x-1 py-2 text-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('cal_quick_add')}</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Add Reminder Modal */}
        {isModalOpen && selectedDayEvents && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white border border-dately-border rounded-2xl shadow-xl p-6 relative">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-1 bg-slate-100 hover:bg-slate-200 text-dately-slate rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h2 className="text-lg font-extrabold text-dately-navy mb-1.5 flex items-center">
                <Calendar className="w-5 h-5 mr-1.5 text-dately-primary" />
                <span>Create Reminder Alert</span>
              </h2>
              <p className="text-xs text-dately-slate mb-4">
                Schedule a personal task alert for **{monthNames[month]} {selectedDayEvents.dayNum}, {year}**.
              </p>

              <form onSubmit={handleSaveReminder} className="space-y-4 text-left">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1">
                    Event Title
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g. Dinner with family, Team meeting"
                    className="w-full px-3 py-2 border border-dately-border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-dately-border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary transition-all"
                    >
                      <option value="Personal">Personal</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Business">Business</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Time */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1">
                      Time (Optional)
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-dately-border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary transition-all"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1">
                    Notes / Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Provide details about the meeting or reminder..."
                    rows={3}
                    className="w-full px-3 py-2 border border-dately-border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary transition-all"
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    fullWidth 
                    onClick={() => setIsModalOpen(false)}
                    className="py-2"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    fullWidth
                    className="py-2"
                  >
                    Save Reminder
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
