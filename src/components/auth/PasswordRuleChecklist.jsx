import { PASSWORD_RULES } from "./passwordRules";

export default function PasswordRuleChecklist({ password = "" }) {
  const hasValue = password.length > 0;

  return (
    <div className="mt-3 rounded-xl border border-base-300/30 bg-base-100/5 px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
        Passwortregeln
      </p>
      <div className="mt-2 space-y-1.5">
        {PASSWORD_RULES.map((rule) => {
          const fulfilled = rule.test(password);
          const tone = !hasValue
            ? "text-base-content/60"
            : fulfilled
            ? "text-success"
            : "text-error";
          const marker = !hasValue ? "[ ]" : fulfilled ? "[OK]" : "[X]";

          return (
            <p key={rule.key} className={`text-sm ${tone}`}>
              {marker} {rule.label}
            </p>
          );
        })}
      </div>
    </div>
  );
}
