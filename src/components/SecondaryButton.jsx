export default function SecondaryButton({ children, onClick, type = "button" }) {
  return (
    <button type={type} onClick={onClick} className="btn btn-secondary rounded-2xl">
      {children}
    </button>
  );
}
