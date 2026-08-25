export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  ...props
}) {
  const baseStyle = "inline-flex items-center justify-center font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-dately-primary text-white hover:bg-dately-secondary focus:ring-dately-primary",
    secondary: "bg-dately-success text-white hover:bg-opacity-90 focus:ring-dately-success",
    danger: "bg-dately-danger text-white hover:bg-opacity-90 focus:ring-dately-danger",
    outline: "border border-dately-border text-dately-navy bg-white hover:bg-dately-background focus:ring-dately-primary",
    ghost: "text-dately-slate hover:bg-dately-background hover:text-dately-navy focus:ring-dately-primary"
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };
  return <button
    className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
    {...props}
  >{children}</button>;
}
export default Button;
