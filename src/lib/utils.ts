export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parsePhoneToE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("+") ? digits : `+${digits}`;
}

export function generateCallId(): string {
  return `call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
