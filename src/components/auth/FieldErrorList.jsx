export default function FieldErrorList({ messages = [] }) {
  if (!Array.isArray(messages) || messages.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      {messages.map((message) => (
        <p key={message} className="text-error text-sm whitespace-pre-wrap">
          {message}
        </p>
      ))}
    </div>
  );
}
