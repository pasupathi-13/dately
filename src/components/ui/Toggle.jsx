export function Toggle({ checked, onChange, label, description, disabled = false }) {
  return <label className={`flex items-start justify-between cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>{label && <div className="flex flex-col pr-4"><span className="text-sm font-semibold text-dately-navy">{label}</span>{description && <span className="text-xs text-dately-slate mt-0.5">{description}</span>}</div>}<div className="relative flex items-center mt-1"><input
    type="checkbox"
    className="sr-only peer"
    checked={checked}
    onChange={(e) => !disabled && onChange(e.target.checked)}
    disabled={disabled}
  /><div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-dately-primary" /></div></label>;
}
export default Toggle;
