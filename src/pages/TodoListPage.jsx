import { useState } from "react";
import { ListTodo, Plus, Trash2, Calendar, Clock, CheckCircle2, Circle, AlertCircle, Sparkles } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useDately } from "@/context/DatelyContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function TodoListPage() {
  const { reminders, addReminder, deleteReminder, toggleReminderStatus, showToast, t } = useDately();
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("Pending");

  // New Reminder Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newReminder, setNewReminder] = useState({
    name: "",
    category: "Personal",
    dueDate: new Date().toISOString().split("T")[0],
    time: "",
    notes: ""
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewReminder((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newReminder.name.trim()) {
      showToast("Please enter a task name.", "danger");
      return;
    }
    if (!newReminder.dueDate) {
      showToast("Please select a due date.", "danger");
      return;
    }

    try {
      await addReminder(newReminder);
      // Reset form
      setNewReminder({
        name: "",
        category: "Personal",
        dueDate: new Date().toISOString().split("T")[0],
        time: "",
        notes: ""
      });
      setIsAdding(false);
    } catch (err) {
      // Toast displayed by context
    }
  };

  const filteredReminders = reminders.filter((rem) => {
    const matchesCategory = filterCategory === "All" || rem.category === filterCategory;
    const matchesStatus = filterStatus === "All" || rem.status === filterStatus;
    return matchesCategory && matchesStatus;
  });

  const getCategoryColor = (cat) => {
    switch (cat) {
      case "Meeting":
        return "bg-purple-50 text-purple-600 border-purple-200/50";
      case "Business":
        return "bg-blue-50 text-blue-600 border-blue-200/50";
      case "Personal":
        return "bg-green-50 text-green-600 border-green-200/50";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200/50";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 text-left">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-dately-navy flex items-center">
              <ListTodo className="w-6 h-6 mr-2 text-dately-primary" />
              <span>{t('todo_title')}</span>
            </h1>
            <p className="text-sm text-dately-slate mt-1">
              {t('todo_subtitle')}
            </p>
          </div>
          <Button
            onClick={() => setIsAdding(!isAdding)}
            variant={isAdding ? "outline" : "primary"}
            size="sm"
            className="flex items-center self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>{isAdding ? "Cancel" : t('todo_add')}</span>
          </Button>
        </div>

        {/* Add Reminder Card */}
        {isAdding && (
          <div className="bg-white border border-dately-border rounded-2xl shadow-md p-6 max-w-xl">
            <h2 className="text-sm font-extrabold text-dately-navy mb-4 flex items-center">
              <Sparkles className="w-4 h-4 mr-1.5 text-dately-primary" />
              <span>{t('todo_add')}</span>
            </h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  name="name"
                  value={newReminder.name}
                  onChange={handleFormChange}
                  placeholder="e.g. Dentists appointment, Client sync"
                  className="w-full px-3.5 py-2 border border-dately-border rounded-xl text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1">
                    {t('todo_category')}
                  </label>
                  <select
                    name="category"
                    value={newReminder.category}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2 border border-dately-border rounded-xl text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary transition-all"
                  >
                    <option value="Personal">Personal</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Business">Business</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1">
                    {t('todo_date')}
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={newReminder.dueDate}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2 border border-dately-border rounded-xl text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1">
                    {t('todo_time')}
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={newReminder.time}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2 border border-dately-border rounded-xl text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1">
                  {t('todo_notes')}
                </label>
                <textarea
                  name="notes"
                  value={newReminder.notes}
                  onChange={handleFormChange}
                  placeholder="Additional context or locations..."
                  rows={2}
                  className="w-full px-3.5 py-2 border border-dately-border rounded-xl text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary transition-all"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" variant="primary" className="px-6 cursor-pointer">
                  {t('todo_save')}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Toolbar Filters */}
        <div className="bg-white border border-dately-border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
          {/* Category Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {["All", "Personal", "Meeting", "Business", "Other"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors border-0 cursor-pointer ${
                  filterCategory === cat
                    ? "bg-dately-primary text-white"
                    : "bg-dately-background text-dately-slate hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center space-x-1.5">
            {["Pending", "Completed", "All"].map((stat) => (
              <button
                key={stat}
                onClick={() => setFilterStatus(stat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors border-0 cursor-pointer ${
                  filterStatus === stat
                    ? "bg-dately-navy text-white"
                    : "bg-dately-background text-dately-slate hover:bg-slate-100"
                }`}
              >
                {stat}
              </button>
            ))}
          </div>
        </div>

        {/* Task List Grid */}
        {filteredReminders.length === 0 ? (
          <div className="bg-white border border-dately-border rounded-2xl p-12 text-center max-w-md mx-auto space-y-4 shadow-md">
            <div className="w-12 h-12 bg-dately-primary/5 text-dately-primary rounded-full flex items-center justify-center mx-auto">
              <ListTodo className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-dately-navy text-sm">{t('todo_empty')}</h3>
          </div>
        ) : (
          <div className="bg-white border border-dately-border rounded-2xl shadow-md overflow-hidden divide-y divide-dately-border">
            {filteredReminders.map((rem) => {
              const isCompleted = rem.status === "Completed";
              return (
                <div
                  key={rem.id}
                  className={`p-4 flex items-center justify-between gap-4 transition-all hover:bg-slate-50/50 ${
                    isCompleted ? "opacity-75" : ""
                  }`}
                >
                  <div className="flex items-start space-x-4 min-w-0 flex-1">
                    {/* Status Checkbox */}
                    <button
                      onClick={() => toggleReminderStatus(rem.id)}
                      className="mt-0.5 p-0 bg-transparent border-0 cursor-pointer focus:outline-none transition-colors"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-dately-success fill-green-50" />
                      ) : (
                        <Circle className="w-5 h-5 text-dately-slate hover:text-dately-primary" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm sm:text-base break-words ${
                            isCompleted ? "line-through text-slate-400 font-medium" : "font-extrabold text-slate-900"
                          }`}
                        >
                          {rem.name}
                        </span>
                        <Badge
                          variant="neutral"
                          className={`text-xs px-2 py-0.5 border ${getCategoryColor(rem.category)}`}
                        >
                          {rem.category}
                        </Badge>
                      </div>

                      {rem.notes && (
                        <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1 italic break-words">{rem.notes}</p>
                      )}

                      <div className="flex items-center space-x-4 mt-2 text-xs text-slate-600 font-sans font-semibold">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1.5 text-dately-primary" />
                          <span>{rem.dueDate}</span>
                        </span>
                        {rem.time && (
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1.5 text-dately-secondary" />
                            <span>{rem.time}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => deleteReminder(rem.id)}
                    className="p-1.5 hover:bg-red-50 text-dately-slate hover:text-dately-danger rounded-lg transition-colors bg-transparent border-0 cursor-pointer"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
