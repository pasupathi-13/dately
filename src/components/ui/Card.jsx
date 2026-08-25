export function Card({ children, className = "", ...props }) {
  return <div
    className={`bg-white border border-dately-border rounded-xl shadow-sm overflow-hidden ${className}`}
    {...props}
  >{children}</div>;
}
export function CardHeader({ children, className = "", ...props }) {
  return <div className={`px-5 py-4 border-b border-dately-border ${className}`} {...props}>{children}</div>;
}
export function CardBody({ children, className = "", ...props }) {
  return <div className={`p-5 ${className}`} {...props}>{children}</div>;
}
export function CardFooter({ children, className = "", ...props }) {
  return <div className={`px-5 py-4 border-t border-dately-border bg-slate-50/50 ${className}`} {...props}>{children}</div>;
}
