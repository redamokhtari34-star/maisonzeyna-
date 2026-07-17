/**
 * Formats a number to Dinar Algérien currency (DA).
 * Example: 45000 -> "45 000 DA"
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '0 DA';
  return new Intl.NumberFormat('fr-DZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' DA';
}

/**
 * Formats a date string (YYYY-MM-DD) to Algerian format (JJ/MM/AAAA).
 */
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '';
  
  // If it's a date object
  if (dateString instanceof Date) {
    if (isNaN(dateString.getTime())) return '';
    const day = String(dateString.getDate()).padStart(2, '0');
    const month = String(dateString.getMonth() + 1).padStart(2, '0');
    const year = dateString.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // If it is YYYY-MM-DD
  const match = String(dateString).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString);
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Validates phone number formats.
 * Accepts any number with at least 4 digits to allow full flexibility.
 */
export function isValidAlgerianPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[^0-9]/g, '');
  return cleaned.length >= 4;
}

/**
 * Algerian cities for drop-down selection or auto-suggestions.
 */
export const ALGERIAN_CITIES = [
  'Alger',
  'Oran',
  'Constantine',
  'Annaba',
  'Blida',
  'Batna',
  'Sétif',
  'Chlef',
  'Sidi Bel Abbès',
  'Biskra',
  'Béjaïa',
  'Tlemcen',
  'Ouargla',
  'Tizi Ouzou',
  'Béchar',
  'Skikda',
  'M\'Sila',
  'Ghardaïa',
  'Mostaganem',
  'El Oued',
  'Mascara',
  'Djelfa'
];
