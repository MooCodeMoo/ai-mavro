export function validContact(value: string) {
  const contact = value.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) && contact.length <= 254)
    return true;
  const digits = contact.replace(/\D/g, "");
  return (
    /^[+\d\s().-]+$/.test(contact) && digits.length >= 7 && digits.length <= 15
  );
}
