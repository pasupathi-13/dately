export function Card({ children, className = "", ...props }) {
  return <div
    className={`bg-white dark:bg-slate-900 border border-dately-border dark:border-slate-800 rounded-xl shadow-sm overflow-hidden transition-colors duration-200 ${className}`}
    {...props}
  >{children}</div>;
}
export function CardHeader({ children, className = "", ...props }) {
  return <div className={`px-5 py-4 border-b border-dately-border dark:border-slate-800 ${className}`} {...props}>{children}</div>;
}
export function CardBody({ children, className = "", ...props }) {
  return <div className={`p-5 ${className}`} {...props}>{children}</div>;
}
export function CardFooter({ children, className = "", ...props }) {
  return <div className={`px-5 py-4 border-t border-dately-border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 ${className}`} {...props}>{children}</div>;
}
