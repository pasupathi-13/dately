import { useState } from "react";
import {
  FileText,
  Search,
  Plus,
  Trash2,
  Eye,
  FolderOpen
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useDately } from "@/context/DatelyContext";
import { Badge } from "@/components/ui/Badge";
export default function DocumentsPage() {
  const { documents, deleteDocument, isLoaded, navigateTo, t } = useDately();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  if (!isLoaded) {
    return <DashboardLayout><div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-dately-primary" /></div></DashboardLayout>;
  }
  const categories = ["All", "Identity", "Vehicle", "Insurance", "Education", "Health", "Other"];
  const filteredDocs = (documents || []).filter((doc) => {
    const matchesCategory = activeCategory === "All" || doc?.category === activeCategory;
    const matchesSearch = (doc?.name || "").toLowerCase().includes((searchQuery || "").toLowerCase()) || (doc?.provider && doc.provider.toLowerCase().includes((searchQuery || "").toLowerCase()));
    return matchesCategory && matchesSearch;
  });
  return <DashboardLayout><div className="space-y-6 text-left">{
    /* Header */
  }<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><h1 className="text-2xl font-extrabold text-dately-navy">{t('docs_title')}</h1><p className="text-sm text-dately-slate mt-1">
              {t('docs_subtitle')}
            </p></div><button
    onClick={() => navigateTo("document-upload")}
    className="inline-flex items-center px-4 py-2.5 text-sm font-semibold bg-dately-primary text-white hover:bg-dately-secondary transition-colors rounded-lg shadow-md cursor-pointer border-0"
  ><Plus className="w-4 h-4 mr-1.5" /><span>{t('docs_upload')}</span></button></div>{
    /* Search and Category Filters Row */
  }<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-dately-border shadow-sm">{
    /* Search Box */
  }<div className="relative w-full lg:max-w-xs"><Search className="w-4 h-4 text-dately-slate absolute left-3 top-3" /><input
    type="text"
    placeholder={t('docs_search_placeholder')}
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="pl-9 pr-4 py-2 border border-dately-border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary w-full transition-all"
  /></div>{
    /* Category Tabs */
  }  <div className="flex items-center space-x-1.5 overflow-x-auto pb-1.5 lg:pb-0 scrollbar-none">{categories.map((cat) => <button
    key={cat}
    onClick={() => setActiveCategory(cat)}
    className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap transition-colors border-0 cursor-pointer ${activeCategory === cat ? "bg-dately-primary text-white" : "bg-dately-background text-dately-slate hover:bg-slate-100 hover:text-dately-navy"}`}
  >{cat}</button>)}</div></div>{
    /* Documents Cards Grid */
  }{filteredDocs.length === 0 ? <div className="bg-white border border-dately-border rounded-xl p-12 text-center max-w-xl mx-auto space-y-4"><div className="w-12 h-12 bg-dately-primary/5 text-dately-slate rounded-full flex items-center justify-center mx-auto"><FolderOpen className="w-6 h-6" /></div><h3 className="font-extrabold text-dately-navy text-base">{t('docs_empty')}</h3><p className="text-sm text-dately-slate max-w-sm mx-auto">
              We couldn&apos;t find any documents matching your criteria. Click &quot;Add Document&quot; above to upload your first record.
            </p><button
    onClick={() => navigateTo("document-upload")}
    className="inline-flex items-center px-4 py-2 text-sm font-semibold bg-dately-primary text-white hover:bg-dately-secondary transition-colors rounded-lg shadow-sm cursor-pointer border-0 mt-2"
  >
              {t('docs_upload')}
            </button></div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{filteredDocs.map((doc) => {
    const isWarning = doc.status === "Expiring Soon";
    const isExpired = doc.status === "Expired";
    return <div
      key={doc.id}
      className="bg-white border border-dately-border rounded-2xl shadow-sm overflow-hidden flex flex-col hover:shadow-md hover:border-dately-primary/30 transition-all text-left"
    >{
      /* Card Header Category Badge */
    }<div className="px-5 py-4 border-b border-dately-navy/25 flex items-center justify-between bg-slate-50/20"><div className="flex items-center space-x-2"><div className="w-8 h-8 rounded-lg bg-dately-primary/10 flex items-center justify-center text-dately-primary"><FileText className="w-4.5 h-4.5" /></div><span className="text-sm font-bold text-dately-navy">{doc.category}</span></div><Badge variant={isExpired ? "danger" : isWarning ? "warning" : "success"}>{doc.status}</Badge></div>{
      /* Card Body */
    }<div className="p-5 flex-1 space-y-3.5"><div><h4 className="font-extrabold text-slate-900 text-base truncate">{doc.name}</h4>{doc.provider && <p className="text-xs text-slate-700 font-medium mt-0.5 truncate">Issuer: {doc.provider}</p>}</div><div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-dately-border/60 py-3 font-sans"><div><span className="text-slate-500 font-medium block">{t('docs_expiry')}</span><span className="font-bold text-slate-900 block mt-0.5">{new Date(doc.expiryDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    })}</span></div><div><span className="text-slate-500 font-medium block">Uploaded At</span><span className="font-bold text-slate-900 block mt-0.5">{new Date(doc.uploadedAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    })}</span></div></div></div>{
      /* Card Footer Actions */
    }<div className="px-5 py-3.5 border-t border-dately-border bg-slate-50/50 flex items-center justify-between"><button
      onClick={() => deleteDocument(doc.id)}
      className="text-xs sm:text-sm text-slate-600 hover:text-dately-danger font-semibold flex items-center transition-colors bg-transparent border-0 cursor-pointer p-0"
    ><Trash2 className="w-4 h-4 mr-1" /><span>Delete</span></button><button
      onClick={() => navigateTo("document-details", doc.id)}
      className="inline-flex items-center text-xs sm:text-sm text-dately-primary font-bold hover:underline bg-transparent border-0 cursor-pointer p-0"
    ><span>View Details</span><Eye className="w-4 h-4 ml-1" /></button></div></div>;
  })}</div>}</div></DashboardLayout>;
}
