export const PASSWORD_RULES = [
  {
    key: "minLength",
    label: "Mindestens 8 Zeichen",
    message: "Passwort muss mindestens 8 Zeichen lang sein",
    test: (value) => value.length >= 8,
  },
  {
    key: "maxLength",
    label: "Maximal 100 Zeichen",
    message: "Passwort darf maximal 100 Zeichen lang sein",
    test: (value) => value.length <= 100,
  },
  {
    key: "uppercase",
    label: "Mindestens 1 Grossbuchstabe",
    message: "Passwort muss mindestens einen Grossbuchstaben enthalten",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    key: "lowercase",
    label: "Mindestens 1 Kleinbuchstabe",
    message: "Passwort muss mindestens einen Kleinbuchstaben enthalten",
    test: (value) => /[a-z]/.test(value),
  },
  {
    key: "number",
    label: "Mindestens 1 Zahl",
    message: "Passwort muss mindestens eine Ziffer enthalten",
    test: (value) => /[0-9]/.test(value),
  },
  {
    key: "special",
    label: "Mindestens 1 Sonderzeichen",
    message: "Passwort muss mindestens ein Sonderzeichen enthalten",
    test: (value) => /[^A-Za-z0-9]/.test(value),
  },
];

export const PASSWORD_RULE_MESSAGES = new Set(
  PASSWORD_RULES.map((rule) => rule.message)
);

export function filterPasswordRuleMessages(messages = []) {
  if (!Array.isArray(messages)) return [];
  return messages.filter((message) => !PASSWORD_RULE_MESSAGES.has(message));
}
