export function Badge({ children, variant = "neutral", className = "", ...props }) {
  const baseStyle = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold";
  const variants = {
    primary: "bg-dately-primary/10 text-dately-primary",
    secondary: "bg-dately-secondary/10 text-dately-secondary",
    success: "bg-dately-success/15 text-dately-success",
    warning: "bg-dately-warning/15 text-dately-warning",
    danger: "bg-dately-danger/15 text-dately-danger",
    info: "bg-blue-150 text-blue-800 bg-blue-50 border border-blue-200",
    neutral: "bg-slate-100 text-slate-800"
  };
  return <span className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>{children}</span>;
}
export default Badge;
