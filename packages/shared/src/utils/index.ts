export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function isValidLanguageCode(code: string): boolean {
  const validCodes = ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'kn', 'gu', 'ml', 'pa'];
  return validCodes.includes(code);
}

export function formatDate(date: string | Date, locale = 'en-IN'): string {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
