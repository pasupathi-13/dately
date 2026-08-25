import { useEffect, useState } from "react";
import {
  FileText,
  Calendar,
  Clock,
  ArrowRight,
  Plus
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useDately } from "@/context/DatelyContext";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
export default function DashboardPage() {
  const { documents, obligations, toggleObligationStatus, isLoaded, currentParams, navigateTo, t } = useDately();
  const searchQuery = currentParams?.search || "";
  const [filterQuery, setFilterQuery] = useState(searchQuery);
  useEffect(() => {
    setFilterQuery(searchQuery);
  }, [searchQuery]);
  if (!isLoaded) {
    return <DashboardLayout><div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-dately-primary" /></div></DashboardLayout>;
  }
  const totalDocs = documents.length;
  const expiringSoonDocs = documents.filter((d) => d.status === "Expiring Soon").length;
  const pendingObligations = obligations.filter((ob) => ob.status === "Pending").length;
  const completedObligations = obligations.filter((ob) => ob.status === "Completed").length + 20;
  const filteredObligations = (obligations || []).filter(
    (ob) => (ob?.name || "").toLowerCase().includes((filterQuery || "").toLowerCase()) || (ob?.category || "").toLowerCase().includes((filterQuery || "").toLowerCase())
  );
  const filteredDocs = (documents || []).filter(
    (d) => (d?.name || "").toLowerCase().includes((filterQuery || "").toLowerCase()) || (d?.category || "").toLowerCase().includes((filterQuery || "").toLowerCase()) || (d?.provider && d.provider.toLowerCase().includes((filterQuery || "").toLowerCase()))
  );
  const getDaysDiff = (dateStr) => {
    if (!dateStr) return 999;
    const today = new Date("2026-08-19");
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return 999;
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
    return diffDays;
  };
  const getObligationStyles = (ob) => {
    const days = getDaysDiff(ob?.dueDate);
    if (ob?.status === "Completed") {
      return {
        bg: "bg-green-50/50 hover:bg-green-50 border-l-4 border-l-dately-success",
        text: "text-dately-success",
        tag: "Paid",
        variant: "success",
        dueText: "Completed"
      };
    }
    if (days <= 0) {
      return {
        bg: "bg-red-50/50 hover:bg-red-50 border-l-4 border-l-dately-danger",
        text: "text-dately-danger",
        tag: "Due Today",
        variant: "danger",
        dueText: "Due Today"
      };
    } else if (days <= 3) {
      return {
        bg: "bg-amber-50/50 hover:bg-amber-50 border-l-4 border-l-dately-warning",
        text: "text-dately-warning",
        tag: `Due in ${days} days`,
        variant: "warning",
        dueText: `Due in ${days} days`
      };
    } else if (days <= 7) {
      return {
        bg: "bg-yellow-50/40 hover:bg-yellow-50 border-l-4 border-yellow-500",
        text: "text-yellow-700",
        tag: `Due in ${days} days`,
        variant: "neutral",
        dueText: `Due in ${days} days`
      };
    } else {
      return {
        bg: "bg-slate-50/50 hover:bg-slate-100 border-l-4 border-l-dately-slate",
        text: "text-dately-slate",
        tag: `Due in ${days} days`,
        variant: "info",
        dueText: `Due in ${days} days`
      };
    }
  };
  const upcomingObligations = [...(obligations || [])]
    .filter(ob => ob && ob.dueDate)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);
  const expiringDocs = [...(documents || [])]
    .filter((d) => d && d.expiryDate && (d.status === "Expiring Soon" || getDaysDiff(d.expiryDate) < 100))
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
    .slice(0, 3);
  return <DashboardLayout>{
    /* Search results banner */
  }{filterQuery && <div className="mb-6 bg-dately-primary/5 border border-dately-primary/20 rounded-xl p-4 flex items-center justify-between text-left"><span className="text-sm font-semibold text-dately-navy">
            Showing results for &quot;<span className="font-extrabold">{filterQuery}</span>&quot; ({filteredDocs.length} documents, {filteredObligations.length} obligations found)
          </span><button
    onClick={() => {
      setFilterQuery("");
      navigateTo("dashboard");
    }}
    className="text-xs text-dately-primary font-bold hover:underline bg-transparent border-0 cursor-pointer"
  >
            Clear Search
          </button></div>}{
  }{!filterQuery ? <div className="space-y-6 text-left">{
    /* Top banner / Greetings */
  }<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"><div><h1 className="text-2xl font-extrabold text-dately-navy">{t('db_welcome')}, Kutty 👋</h1><p className="text-sm text-dately-slate mt-1">{t('db_subtitle')}</p></div><div className="flex items-center space-x-3"><button
    onClick={() => navigateTo("document-upload")}
    className="inline-flex items-center px-4 py-2 text-sm font-semibold bg-white border border-dately-border text-dately-navy hover:bg-slate-50 transition-colors rounded-lg shadow-sm cursor-pointer"
  ><FileText className="w-4 h-4 mr-1.5 text-dately-slate" /><span>{t('db_upload_doc')}</span></button><button
    onClick={() => navigateTo("obligation-add")}
    className="inline-flex items-center px-4 py-2 text-sm font-semibold bg-dately-primary text-white hover:bg-dately-secondary transition-colors rounded-lg shadow-md cursor-pointer"
  ><Plus className="w-4 h-4 mr-1.5" /><span>{t('db_add_bill')}</span></button></div></div>{
    /* Statistics Grid */
  }<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[
    { label: t("nav_documents"), val: totalDocs, color: "border-l-dately-primary", desc: "Securely Vaulted" },
    { label: t("db_expiring_docs"), val: expiringSoonDocs, color: "border-l-dately-warning", desc: "Needs Renewal" },
    { label: t("db_pending_bills"), val: pendingObligations, color: "border-l-dately-secondary", desc: "Pending Actions" },
    { label: "Completed", val: completedObligations, color: "border-l-dately-success", desc: "Obligations Paid" }
  ].map((stat, idx) => <Card key={idx} className={`border-l-4 ${stat.color}`}><CardBody className="p-4 sm:p-5"><span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">{stat.label}</span><div className="flex items-baseline space-x-2 mt-1"><span className="text-2xl font-extrabold text-slate-900">{stat.val}</span></div><span className="text-xs text-slate-600 font-semibold mt-1 block">{stat.desc}</span></CardBody></Card>)}</div>{
    /* Obligations and Expiry Section */
  }<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">{
    /* Left Col - Obligations (Span 2) */
  }<div className="lg:col-span-2 space-y-6"><div className="bg-white border border-dately-border rounded-xl shadow-sm overflow-hidden"><div className="px-5 py-4 border-b border-dately-navy/25 flex items-center justify-between bg-slate-50/50"><h3 className="font-extrabold text-slate-900 text-sm flex items-center font-sans"><Calendar className="w-4 h-4 mr-2 text-dately-primary" /><span>{t('bills_commitments')}</span></h3><button
    onClick={() => navigateTo("bills-payments")}
    className="text-xs text-dately-primary font-bold hover:underline inline-flex items-center bg-transparent border-0 cursor-pointer"
  ><span>View All</span><ArrowRight className="w-3.5 h-3.5 ml-1" /></button></div><div className="divide-y divide-dately-border">{upcomingObligations.map((ob) => {
    const styles = getObligationStyles(ob);
    return <div
      key={ob.id}
      className={`p-4 flex items-center justify-between transition-colors ${styles.bg}`}
    ><div className="flex items-start space-x-3.5 min-w-0 text-left"><input
      type="checkbox"
      checked={ob.status === "Completed"}
      onChange={() => toggleObligationStatus(ob.id)}
      className="mt-1 rounded text-dately-primary focus:ring-dately-primary cursor-pointer w-4 h-4"
    /><div className="min-w-0"><span className="text-sm font-bold text-slate-900 block truncate">{ob.name}</span><div className="flex items-center space-x-2 mt-1"><Badge variant={styles.variant} className="text-xs">{styles.tag}</Badge><span className="text-xs text-slate-600 font-medium">
                                Category: {ob.category}</span></div></div></div><div className="text-right flex-shrink-0"><span className="text-sm font-bold text-slate-900 block">
                            ₹{ob.amount ? ob.amount.toLocaleString() : "N/A"}</span><span className="text-xs text-slate-600 mt-0.5 block font-semibold">
                            Due: {new Date(ob.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span></div></div>;
  })}</div></div></div>{
    /* Right Col - Expiring Soon Cards (Span 1) */
  }<div className="space-y-6 text-left"><div className="bg-white border border-dately-border rounded-xl shadow-sm p-5"><div className="flex items-center justify-between pb-3 border-b border-dately-navy/25 mb-4"><h3 className="font-extrabold text-slate-900 text-sm flex items-center font-sans"><Clock className="w-4 h-4 mr-2 text-dately-warning" /><span>{t('db_expiring_docs')}</span></h3><button
    onClick={() => navigateTo("documents")}
    className="text-xs text-dately-primary font-bold hover:underline bg-transparent border-0 cursor-pointer p-0"
  >
                    {t('nav_documents')}
                  </button></div><div className="space-y-3.5">{expiringDocs.map((doc) => {
    const daysLeft = getDaysDiff(doc.expiryDate);
    return <button
      onClick={() => navigateTo("document-details", doc.id)}
      key={doc.id}
      className="w-full block bg-transparent border-0 p-0 text-left cursor-pointer"
    ><div className="p-3.5 border border-dately-border rounded-xl hover:border-dately-primary/30 bg-slate-50/20 hover:bg-slate-50/50 transition-colors"><div className="flex justify-between items-start"><span className="text-sm font-bold text-slate-900 truncate max-w-[140px]">{doc.name}</span><Badge variant={daysLeft <= 7 ? "danger" : "warning"} className="text-xs">{daysLeft <= 0 ? "Expired" : `${daysLeft} days left`}</Badge></div><div className="flex justify-between items-center text-xs text-slate-600 font-medium mt-2"><span>Provider: {doc.provider || "N/A"}</span><span className="font-bold text-slate-900 font-sans">{new Date(doc.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></div></div></button>;
  })}</div></div>{
    /* Quick Actions Panel */
  }<div className="bg-white border border-dately-border rounded-xl shadow-sm p-5 space-y-4"><h3 className="font-extrabold text-slate-900 text-sm">{t('db_quick_actions')}</h3><div className="grid grid-cols-2 gap-3 text-center text-xs"><button
    onClick={() => navigateTo("document-upload")}
    className="p-3 border border-dately-border rounded-xl hover:bg-slate-50 transition-colors font-bold text-slate-900 block bg-transparent cursor-pointer"
  ><Plus className="w-4 h-4 mx-auto mb-1 text-dately-primary" /><span>{t('db_upload_doc')}</span></button><button
    onClick={() => navigateTo("obligation-add")}
    className="p-3 border border-dately-border rounded-xl hover:bg-slate-50 transition-colors font-bold text-slate-900 block bg-transparent cursor-pointer"
  ><Calendar className="w-4 h-4 mx-auto mb-1 text-dately-primary" /><span>{t('db_add_bill')}</span></button></div></div></div></div></div> : (
    /* Search results layout */
    <div className="space-y-6 text-left"><h2 className="text-lg sm:text-xl font-bold text-dately-navy">Search Results</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{
      /* Filtered Obligations */
    }<div className="bg-white border border-dately-border rounded-xl shadow-sm p-5"><h3 className="font-extrabold text-sm sm:text-base text-dately-navy pb-3 border-b border-dately-navy/25 mb-4 font-sans">
                Matching Obligations ({filteredObligations.length})
              </h3>{filteredObligations.length === 0 ? <p className="text-xs text-dately-slate py-4 text-center">No matching obligations.</p> : <div className="space-y-3">{filteredObligations.map((ob) => <div key={ob.id} className="p-3 border border-dately-border rounded-lg flex items-center justify-between"><div><span className="text-sm font-bold block">{ob.name}</span><span className="text-xs text-dately-slate mt-0.5 block">Category: {ob.category} • Due: {ob.dueDate}</span></div><span className="text-sm font-bold">₹{ob.amount || 0}</span></div>)}</div>}</div>{
      /* Filtered Documents */
    }<div className="bg-white border border-dately-border rounded-xl shadow-sm p-5"><h3 className="font-extrabold text-sm sm:text-base text-dately-navy pb-3 border-b border-dately-navy/25 mb-4 font-sans">
                Matching Documents ({filteredDocs.length})
              </h3>{filteredDocs.length === 0 ? <p className="text-xs text-dately-slate py-4 text-center">No matching documents.</p> : <div className="space-y-3">{filteredDocs.map((doc) => <button
      onClick={() => navigateTo("document-details", doc.id)}
      key={doc.id}
      className="w-full text-left bg-transparent border-0 p-0 cursor-pointer block"
    ><div className="p-3 border border-dately-border rounded-lg flex items-center justify-between hover:bg-slate-50 transition-colors"><div><span className="text-sm font-bold block">{doc.name}</span><span className="text-xs text-dately-slate mt-0.5 block">Expiry: {doc.expiryDate}</span></div><Badge variant={doc.status === "Expiring Soon" ? "warning" : "success"}>{doc.status}</Badge></div></button>)}</div>}</div></div></div>
  )}</DashboardLayout>;
}
