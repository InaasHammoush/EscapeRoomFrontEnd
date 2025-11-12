export default function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="modal modal-open">
      <div className="modal-box rounded-2xl">
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <div className="py-2">{children}</div>
        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
