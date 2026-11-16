import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
// Utils
import { promoCodeInSearch, rememberPromoCode } from '@/utils/plans/promoCodes';

/**
 * A creator's link (`/?code=SAMTRAVELS`, `/pricing?code=…`) can land on any page: the code
 * is kept for the visit (sessionStorage), so the sign-up form still has it when the person
 * gets there. In an effect only, so a pre-rendered page's first render is untouched.
 */
export default function useRememberPromoCode() {
  const { search } = useLocation();
  useEffect(() => {
    const code = promoCodeInSearch(search);
    if (code) rememberPromoCode(code);
  }, [search]);
}
