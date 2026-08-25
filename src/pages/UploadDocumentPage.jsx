import { useState } from "react";
import {
  Upload,
  ArrowLeft,
  Loader2,
  FileCheck,
  ShieldCheck,
  ChevronRight,
  Info,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useDately } from "@/context/DatelyContext";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { API_URL } from "@/config/api";

export default function UploadDocumentPage() {
  const { addDocument, showToast, navigateTo, t, userProfile } = useDately();
  const [uploadState, setUploadState] = useState("idle");
  const [isStorageFullModalOpen, setIsStorageFullModalOpen] = useState(false);
  const [storageErrorMessage, setStorageErrorMessage] = useState("");

  if (!userProfile?.googleConnected) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-md mx-auto text-center py-12">
          <div className="w-16 h-16 bg-blue-50 text-dately-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-dately-navy">Google Drive Connection Required</h2>
          <p className="text-sm text-dately-slate max-w-sm mx-auto leading-relaxed font-sans">
            To keep your documents secure and backed up, you must connect your Google Drive account before uploading files to your vault.
          </p>
          <div className="pt-4 flex flex-col gap-3">
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                const token = localStorage.getItem("dately_token");
                window.location.href = `${API_URL}/auth/google?token=${token}`;
              }}
              className="w-full flex items-center justify-center font-bold"
            >
              Connect Google Drive
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigateTo("documents")}
              className="w-full font-bold"
            >
              Back to Vault
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  const [fileName, setFileName] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    provider: "",
    policyNumber: "",
    vehicleNumber: "",
    expiryDate: "",
    category: "Other",
    filePath: "",
    fileSize: "1.0 MB"
  });
  const [selectedFile, setSelectedFile] = useState(null);
  
  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFileName(file.name);
      
      const cleanName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[_]/g, " ")
        .replace(/[-]/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());
      
      const sizeInMB = file.size / (1024 * 1024);
      const formattedSize = sizeInMB >= 0.1 ? `${sizeInMB.toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`;

      // Trigger Processing Loader State
      setUploadState("processing");

      try {
        const token = localStorage.getItem("dately_token");
        const scanData = new FormData();
        scanData.append("file", file);

        const res = await fetch(`${API_URL}/documents/analyze`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: scanData
        });

        if (!res.ok) {
          throw new Error("OCR Scanning analysis failed.");
        }

        const data = await res.json();
        
        setFormData({
          name: data.name || cleanName,
          provider: data.provider || "",
          policyNumber: data.policyNumber || "",
          vehicleNumber: data.vehicleNumber || "",
          expiryDate: data.expiryDate || "",
          category: data.category || "Other",
          filePath: data.tempFilePath || "",
          fileSize: data.fileSize || formattedSize
        });
        showToast("Auto-scanner analysis complete! Form fields filled.", "success");
      } catch (err) {
        console.error("Auto-scanner error:", err);
        // Fallback to manual entry
        setFormData({
          name: cleanName,
          provider: "",
          policyNumber: "",
          vehicleNumber: "",
          expiryDate: "",
          category: "Other",
          filePath: "",
          fileSize: formattedSize
        });
        showToast("Auto-scanning failed. Please fill details manually.", "warning");
      } finally {
        setUploadState("detected");
      }
    }
  };

  const handleConfirmSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Document name is required.", "warning");
      return;
    }

    setUploadState("uploading");
    
    try {
      if (formData.filePath) {
        // Save using already uploaded temp file reference
        await addDocument(formData);
      } else {
        // Upload raw FormData as fallback
        const data = new FormData();
        data.append("file", selectedFile);
        data.append("name", formData.name);
        data.append("provider", formData.provider);
        data.append("policyNumber", formData.policyNumber);
        data.append("vehicleNumber", formData.vehicleNumber);
        data.append("expiryDate", formData.expiryDate);
        data.append("category", formData.category);
        data.append("fileSize", formData.fileSize);
        await addDocument(data);
      }
      navigateTo("documents");
    } catch (err) {
      const errMsg = err?.message || "Failed to save document";
      const isQuotaFull = /storage|full|space|limit|quota|drive/i.test(errMsg);
      if (isQuotaFull) {
        setStorageErrorMessage(errMsg);
        setIsStorageFullModalOpen(true);
      } else {
        showToast(errMsg, "danger");
      }
      setUploadState("detected");
    }
  };

  const isActionable = !!formData.expiryDate;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto text-left">
        {/* Back Link */}
        <button
          onClick={() => navigateTo("documents")}
          className="inline-flex items-center text-xs text-dately-slate hover:text-dately-navy font-bold transition-colors bg-transparent border-0 cursor-pointer p-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          <span>Back to Vault</span>
        </button>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-extrabold text-dately-navy">{t('docs_upload')}</h1>
          <p className="text-sm text-dately-slate mt-1">
            {t('docs_subtitle')}
          </p>
        </div>

        {/* Dynamic States */}
        {uploadState === "idle" && (
          <div className="space-y-6">
            {/* Drag & Drop Box */}
            <div className="bg-white border-2 border-dashed border-dately-border rounded-2xl p-10 text-center hover:border-dately-primary/45 transition-colors relative">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-12 h-12 bg-dately-primary/5 rounded-full flex items-center justify-center mx-auto mb-4 text-dately-primary">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-dately-navy text-base">Upload your document</h3>
              <p className="text-sm text-dately-slate mt-1">
                Drag and drop your PDF, JPG or PNG here
              </p>
              <div className="relative my-4 text-center">
                <span className="absolute inset-x-0 top-1/2 border-t border-slate-100" />
                <span className="relative bg-white px-2.5 text-xs text-dately-slate uppercase tracking-wider font-semibold">
                  Or
                </span>
              </div>
              <button className="px-5 py-2.5 bg-dately-background border border-dately-border text-dately-navy font-semibold text-sm rounded-xl hover:bg-slate-100 transition-colors">
                Browse Files
              </button>
              <p className="text-xs text-dately-slate mt-3">
                Max size: 10MB (PDF, PNG, JPG, JPEG)
              </p>
            </div>

            {/* DigiLocker Link Widget */}
            <div className="bg-slate-50 border border-dately-border rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-amber-50 text-dately-warning rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-dately-navy">DigiLocker Integration</h4>
                  <p className="text-xs text-dately-slate mt-0.5">Link your government verified locker profile directly</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => showToast("DigiLocker integration is a placeholder for this demo.", "info")}
                className="inline-flex items-center text-xs sm:text-sm text-dately-primary font-bold hover:underline bg-transparent border-0 cursor-pointer"
              >
                <span>Connect</span>
                <ChevronRight className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
        )}

        {/* Processing State */}
        {uploadState === "processing" && (
          <div className="bg-white border border-dately-border rounded-2xl p-10 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-dately-success animate-spin mx-auto" />
            <h3 className="font-extrabold text-dately-navy text-lg">Processing & Parsing...</h3>
            <p className="text-sm text-dately-slate max-w-sm mx-auto">
              Reading document structure, running OCR scanners, and extracting metadata details...
            </p>
          </div>
        )}

        {/* Uploading State */}
        {uploadState === "uploading" && (
          <div className="bg-white border border-dately-border rounded-2xl p-10 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-dately-primary animate-spin mx-auto" />
            <h3 className="font-extrabold text-dately-navy text-lg">Uploading File...</h3>
            <p className="text-sm text-dately-slate max-w-sm mx-auto">
              Uploading &quot;<span className="font-semibold text-dately-navy">{fileName}</span>&quot; to secure cloud vault...
            </p>
          </div>
        )}

        {/* Detected Form State */}
        {uploadState === "detected" && (
          <div className="bg-white border border-dately-border rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-dately-navy/25">
              <div className="w-11 h-11 bg-dately-success/15 text-dately-success rounded-xl flex items-center justify-center">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-dately-navy">Data Detected!</h3>
                <p className="text-xs text-dately-slate mt-0.5">Review and verify the extracted database details below.</p>
              </div>
            </div>

            <form onSubmit={handleConfirmSave} className="space-y-4">
              {/* Doc Name */}
              <div>
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                  {t('docs_name')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-dately-border rounded-xl text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary font-semibold"
                />
              </div>

              {/* Category & Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                    {t('docs_category')}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-dately-border rounded-xl text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary font-semibold cursor-pointer"
                  >
                    <option value="Identity">Identity</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Education">Education</option>
                    <option value="Health">Health</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-dately-navy mb-1.5">
                    {t('docs_expiry')} {isActionable ? "" : "(Optional)"}
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-sm bg-dately-background focus:bg-white focus:outline-none focus:ring-2 focus:ring-dately-primary font-semibold ${
                      isActionable && !formData.expiryDate ? "border-dately-danger ring-1 ring-dately-danger/30" : "border-dately-border"
                    }`}
                  />
                </div>
              </div>

              {/* Security info */}
              {isActionable ? (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex items-start space-x-3 text-sm text-emerald-900 font-sans">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p className="leading-relaxed font-medium">
                    Saving this document automatically triggers expiry check scheduler alerts. Alerts will be broadcast 30 days, 7 days, and 1 day before Expiry Date.
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-start space-x-3 text-sm text-blue-900 font-sans">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="leading-relaxed font-medium">
                    This document will be saved in your secure storage vault. No expiration reminders are scheduled for this type.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-dately-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUploadState("idle")}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="shadow-md">
                  Confirm & Save Document
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Storage Full Alert Modal */}
      <Modal
        isOpen={isStorageFullModalOpen}
        onClose={() => setIsStorageFullModalOpen(false)}
        title="Google Drive Storage Full"
        size="md"
      >
        <div className="space-y-4 text-left">
          <div className="flex items-start space-x-3.5 bg-red-50 p-4 rounded-xl border border-red-200">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-900">
                Google Drive Storage is Full
              </h4>
              <p className="text-xs text-red-700 font-medium mt-1 leading-relaxed">
                {storageErrorMessage || "Your Google Drive has no remaining storage space. Please clean up files or empty your Drive trash to store new documents or images."}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700 font-medium">
            <p className="font-bold text-slate-900">Quick Ways to Clean Up Space:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>Open Google Drive storage manager and remove large unneeded files.</li>
              <li>Permanently empty the items in your Google Drive Trash / Bin.</li>
              <li>Delete large email attachments or old photo backups.</li>
            </ul>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5">
            <a
              href="https://drive.google.com/drive/quota"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm text-center cursor-pointer no-underline"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              <span>Clean Space on Google Drive</span>
            </a>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsStorageFullModalOpen(false)}
              className="w-full sm:w-auto text-xs"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
