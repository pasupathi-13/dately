import { useState } from "react";
import {
  ArrowLeft,
  FileText,
  Download,
  Eye,
  Edit2,
  Calendar,
  Trash2,
  FileSpreadsheet,
  FileCheck2,
  ChevronRight,
  ShieldCheck,
  Info
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useDately } from "@/context/DatelyContext";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export default function DocumentDetailsPage() {
  const { documents, updateDocument, deleteDocument, showToast, currentParams, navigateTo, t } = useDately();
  const docId = currentParams;
  const doc = (documents || []).find((d) => d?.id === docId || d?._id === docId);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const [editForm, setEditForm] = useState({
    name: doc?.name || "",
    expiryDate: doc?.expiryDate || ""
  });

  if (!doc) {
    return (
      <DashboardLayout>
        <div className="space-y-4 text-center max-w-md mx-auto py-12">
          <FileText className="w-12 h-12 text-dately-slate mx-auto" />
          <h2 className="text-lg font-bold text-dately-navy">Document Not Found</h2>
          <p className="text-sm text-dately-slate">The document you are looking for does not exist or has been deleted.</p>
          <Button size="sm" onClick={() => navigateTo("documents")}>Return to Vault</Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleDownload = () => {
    showToast(`Downloading "${doc.name}" file attachment...`, "success");
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateDocument({
      ...doc,
      name: editForm.name,
      expiryDate: editForm.expiryDate,
      status: new Date(editForm.expiryDate).getTime() < new Date().getTime() ? "Expiring Soon" : "Active"
    });
    setIsEditOpen(false);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to permanently delete this document?")) {
      deleteDocument(doc.id);
      navigateTo("documents");
    }
  };

  const getDaysDiff = (dateStr) => {
    const today = new Date("2026-08-19");
    const target = new Date(dateStr);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysDiff(doc.expiryDate);
  const isPdf = doc.filePath && doc.filePath.toLowerCase().endsWith('.pdf');

  return (
    <DashboardLayout>
      <div className="space-y-6 text-left">
        {/* Back navigation */}
        <button
          onClick={() => navigateTo("documents")}
          className="inline-flex items-center text-xs text-dately-slate hover:text-dately-navy font-bold transition-colors bg-transparent border-0 cursor-pointer p-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Back to Vault</span>
        </button>

        {/* Title / Details Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-dately-border shadow-sm">
          <div className="flex items-start space-x-4 min-w-0">
            <div className="w-12 h-12 bg-dately-primary/10 rounded-xl flex items-center justify-center text-dately-primary flex-shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-dately-navy truncate font-sans">{doc.name}</h1>
                <Badge variant={doc.status === "Expiring Soon" ? "warning" : "success"}>{doc.status}</Badge>
              </div>
              <p className="text-sm text-dately-slate mt-1">Category: {doc.category} • Uploaded on {doc.uploadedAt}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(true)}>
              <Eye className="w-4 h-4 mr-1.5" />
              <span>Preview</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-1.5" />
              <span>Download</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
              <Edit2 className="w-4 h-4 mr-1.5" />
              <span>Edit Details</span>
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-1.5" />
              <span>Delete</span>
            </Button>
          </div>
        </div>

        {/* Detailed Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Box */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-dately-border rounded-2xl shadow-sm p-6 sm:p-7">
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg pb-3 border-b border-slate-100 mb-4">
                Document Details
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 text-sm font-sans">
                <div>
                  <dt className="text-slate-500 font-bold uppercase tracking-wider text-xs">Document Category</dt>
                  <dd className="text-slate-900 font-extrabold mt-1 text-base">{doc.category || "Other"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-bold uppercase tracking-wider text-xs">File Attachment Details</dt>
                  <dd className="text-slate-900 font-extrabold mt-1 text-base">{doc.fileSize || "Unknown Size"}</dd>
                </div>
                {doc.expiryDate && (
                  <div>
                    <dt className="text-slate-500 font-bold uppercase tracking-wider text-xs">Expiry Date</dt>
                    <dd className="text-dately-danger font-extrabold mt-1 text-base">
                      {new Date(doc.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Document Preview Card Mock */}
            <div className="bg-white border border-dately-border rounded-2xl shadow-sm p-6 sm:p-7 space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">Document Preview Attachment</h3>
              <div
                onClick={() => setIsPreviewOpen(true)}
                className="border border-dashed border-dately-border hover:border-dately-primary/45 rounded-2xl p-8 bg-slate-50/50 hover:bg-slate-50 cursor-pointer flex flex-col items-center justify-center space-y-3 transition-colors"
              >
                <FileCheck2 className="w-10 h-10 text-dately-success" />
                <span className="text-sm font-bold text-slate-900">{doc.name}_verified.pdf</span>
                <span className="text-xs text-slate-600 font-medium">Click to view mock file preview panel</span>
              </div>
            </div>
          </div>

          {/* Renewal / Storage Side Panel */}
          <div className="space-y-6">
            {doc.expiryDate ? (
              <div className="bg-white border border-dately-border rounded-2xl shadow-sm p-6 space-y-4">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center font-sans">
                  <Calendar className="w-5 h-5 mr-2 text-dately-primary" />
                  <span>Renewal Information</span>
                </h3>
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-5 text-sm space-y-2">
                  <div className="font-bold text-amber-900 flex items-center space-x-1.5 text-base">
                    <Info className="w-4.5 h-4.5 text-amber-600" />
                    <span>{daysLeft <= 0 ? "Expired" : `Expires in ${daysLeft} days.`}</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed font-medium">
                    Your document expires on {new Date(doc.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}. Avoid any coverage lapse penalties by renewing your record.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-dately-border rounded-2xl shadow-sm p-6 space-y-4">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center font-sans">
                  <ShieldCheck className="w-5 h-5 mr-2 text-emerald-600" />
                  <span>Vault Security</span>
                </h3>
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5 text-sm space-y-2">
                  <div className="font-bold text-emerald-900 flex items-center space-x-1.5 text-base">
                    <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
                    <span>Permanent Storage</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed font-medium">
                    This document is saved securely in your permanent storage vault. No expiration tracking or renewal alerts are active.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODAL 1: Document File Preview */}
        <Modal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={`Document Preview: ${doc.name}`}
          size="lg"
        >
          {doc.filePath ? (
            <div className="flex flex-col items-center justify-center p-1 min-h-[50vh]">
              {isPdf ? (
                <iframe
                  src={`http://localhost:5000${doc.filePath}`}
                  className="w-full h-[65vh] rounded-xl border border-slate-200"
                  title={doc.name}
                />
              ) : (
                <img
                  src={`http://localhost:5000${doc.filePath}`}
                  alt={doc.name}
                  className="max-h-[65vh] max-w-full rounded-xl object-contain shadow-md"
                />
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-white min-h-[40vh] flex flex-col items-center justify-center space-y-4 text-center">
              <FileSpreadsheet className="w-16 h-16 text-dately-success animate-pulse" />
              <h4 className="font-extrabold text-base">No Preview File</h4>
              <p className="text-xs text-white/60 max-w-sm">
                No file attachment path was found for this document record.
              </p>
            </div>
          )}
        </Modal>

        {/* MODAL 2: Edit Details Form */}
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title={`Edit Details: ${doc.name}`}
          size="md"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                Document Name
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-4 py-2 border border-dately-border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary font-semibold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                Expiry Date
              </label>
              <input
                type="date"
                value={editForm.expiryDate}
                onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })}
                className="w-full px-4 py-2 border border-dately-border rounded-lg text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-dately-border">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
