-- A traveller's last name, optional (27 Nov 2026, the user's wish: "Passport needs first name last
-- name"): the passport's Surname. Cleaned and cut to 80 in code, as the first name.
ALTER TABLE "traveller" ADD COLUMN     "lastName" TEXT;
