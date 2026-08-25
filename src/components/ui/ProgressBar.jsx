export function ProgressBar({ value, max = 100, className = "", color = "primary" }) {
  const percentage = Math.min(100, Math.max(0, value / max * 100));
  const barColors = {
    primary: "bg-dately-primary",
    success: "bg-dately-success"
  };
  return <div className={`w-full bg-slate-100 rounded-full h-2.5 overflow-hidden ${className}`}><div
    className={`h-full rounded-full transition-all duration-550 ease-out ${barColors[color]}`}
    style={{ width: `${percentage}%` }}
  /></div>;
}
export default ProgressBar;
