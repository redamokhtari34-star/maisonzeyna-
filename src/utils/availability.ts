import { Rental } from '../types';

/**
 * Checks if two date ranges overlap.
 * Date format should be "YYYY-MM-DD" or any valid date string.
 * The comparison is inclusive.
 */
export function areDatesOverlapping(start1: string, end1: string, start2: string, end2: string): boolean {
  if (!start1 || !end1 || !start2 || !end2) return false;
  
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();
  
  if (isNaN(s1) || isNaN(e1) || isNaN(s2) || isNaN(e2)) return false;
  
  return s1 <= e2 && s2 <= e1;
}

/**
 * Checks if an article (dress or jewelry) is booked during a specific date range,
 * excluding a particular rental (useful when editing a rental).
 */
export function isArticleBookedOnDates(
  articleId: string, 
  outDate: string, 
  returnDate: string, 
  rentals: Rental[], 
  excludeRentalId?: string
): boolean {
  if (!articleId || !outDate || !returnDate) return false;
  
  return rentals.some(r => {
    // Skip if it is the rental we are currently editing
    if (excludeRentalId && r.id === excludeRentalId) return false;
    
    // If the rental has already been returned, the article is available again
    if (r.is_returned) return false;
    
    const dressIds = r.dress_ids || (r.dress_id ? [r.dress_id] : []);
    const jewelryIds = r.jewelry_ids || (r.jewelry_id ? [r.jewelry_id] : []);
    
    const isAssociated = dressIds.includes(articleId) || jewelryIds.includes(articleId);
    if (!isAssociated) return false;
    
    return areDatesOverlapping(outDate, returnDate, r.out_date, r.return_date);
  });
}

/**
 * Checks if an article is currently rented (i.e. today is within the rental dates
 * and the rental is not returned yet).
 */
export function isArticleCurrentlyRented(articleId: string, rentals: Rental[]): boolean {
  if (!articleId || !rentals) return false;
  
  const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  
  return rentals.some(r => {
    if (r.is_returned) return false;
    
    const dressIds = r.dress_ids || (r.dress_id ? [r.dress_id] : []);
    const jewelryIds = r.jewelry_ids || (r.jewelry_id ? [r.jewelry_id] : []);
    
    const isAssociated = dressIds.includes(articleId) || jewelryIds.includes(articleId);
    if (!isAssociated) return false;
    
    return areDatesOverlapping(todayStr, todayStr, r.out_date, r.return_date);
  });
}
