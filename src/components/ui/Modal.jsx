import { useEffect } from "react";
import { X } from "lucide-react";
export function Modal({ isOpen, onClose, title, children, size = "md" }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl"
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4">{
    /* Backdrop */
  }<div
    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
    onClick={onClose}
  />{
    /* Content */
  }<div className={`relative bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-dately-border dark:border-slate-800 w-full ${sizeClasses[size]} overflow-hidden z-10 transform transition-all duration-300`}><div className="flex items-center justify-between px-5 py-4 border-b border-dately-border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"><h3 className="font-semibold text-dately-navy dark:text-slate-100 text-base">{title}</h3><button
    onClick={onClose}
    className="text-dately-slate dark:text-slate-400 hover:text-dately-navy dark:hover:text-white transition-colors rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
  ><X className="w-5 h-5" /></button></div><div className="p-5 overflow-y-auto max-h-[75vh] text-slate-800 dark:text-slate-200">{children}</div></div></div>;
}
export default Modal;
