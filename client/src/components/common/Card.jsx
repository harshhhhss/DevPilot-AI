export default function Card({ children, className = '', as: As = 'div', ...rest }) {
  return (
    <As
      className={`rounded-xl border border-slate-200 bg-white shadow-card ${className}`}
      {...rest}
    >
      {children}
    </As>
  );
}
