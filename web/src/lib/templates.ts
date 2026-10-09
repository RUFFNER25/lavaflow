export function renderTemplate(
  template: string,
  vars: Record<string, string | number | null | undefined>
) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    const val = vars[key];
    return val === null || val === undefined ? "" : String(val);
  });
}

export function normalizePhonePe(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  // Perú: 9 dígitos móviles → 51XXXXXXXXX
  if (digits.length === 9 && digits.startsWith("9")) {
    return `51${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("51")) {
    return digits;
  }
  if (digits.length >= 10 && digits.length <= 15) {
    return digits;
  }
  return null;
}
