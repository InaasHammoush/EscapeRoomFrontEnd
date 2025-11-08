export default function PrimaryButton({ children, onClick, type = "button" }) {
  return (
    <button type={type} onClick={onClick} className="btn btn-primary rounded-2xl">
      {children}
    </button>
  );
}
