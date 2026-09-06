// Najbližšie upratovanie izby: pracovné dni (po–pia). Ak je dnes pracovný deň a je pred 14:00,
// je to dnes; inak najbližší nasledujúci pracovný deň. Skutočný plán príde z RE SERVICE (clean_plan) vo v1.1.
export function nextCleaningDate(now = new Date()) {
  const d = new Date(now);
  const isWorkday = (x) => x.getDay() >= 1 && x.getDay() <= 5;
  if (isWorkday(d) && d.getHours() < 14) return d;
  do { d.setDate(d.getDate() + 1); } while (!isWorkday(d));
  d.setHours(9, 0, 0, 0);
  return d;
}
