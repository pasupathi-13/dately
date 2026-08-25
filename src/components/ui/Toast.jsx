import { useEffect } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
export function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4e3);
    return () => clearTimeout(timer);
  }, [onClose]);
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-dately-success flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-dately-warning flex-shrink-0" />,
    danger: <AlertCircle className="w-5 h-5 text-dately-danger flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
  };
  const borderColors = {
    success: "border-l-4 border-l-dately-success bg-white",
    warning: "border-l-4 border-l-dately-warning bg-white",
    danger: "border-l-4 border-l-dately-danger bg-white",
    info: "border-l-4 border-l-blue-500 bg-white"
  };
  return <div className={`fixed bottom-5 right-5 z-[999] flex items-start justify-between p-4 rounded-xl shadow-xl border border-dately-border max-w-sm w-full transform transition-all duration-300 translate-y-0 opacity-100 ${borderColors[type]}`}><div className="flex items-center space-x-3">{icons[type]}<span className="text-sm font-semibold text-dately-navy">{message}</span></div><button
    onClick={onClose}
    className="text-dately-slate hover:text-dately-navy transition-colors ml-4 p-0.5 hover:bg-slate-100 rounded-md flex-shrink-0"
  ><X className="w-4 h-4" /></button></div>;
}
export default Toast;
