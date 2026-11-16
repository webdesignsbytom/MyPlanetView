# My Planet View test logins

17 Nov 2026

## Database seed logins

Every seeded account's password is `12345678`. The same five accounts exist on the local and the live database after `npx prisma db seed` (`server/prisma/seed/users.js`).

| Email | Password | Name | Role | Plan |
| --- | --- | --- | --- | --- |
| `user@gmail.com` | `12345678` | Sam Carter | User (owns the demo couple's map) | Economy |
| `tom@gmail.com` | `12345678` | Alex Byrne | Admin (Sam's partner, editor on that map) | Economy |
| `dev@gmail.com` | `12345678` | Priya Nair | Developer | Economy |
| `business@gmail.com` | `12345678` | Bea Hughes | User | Business, monthly |
| `firstclass@gmail.com` | `12345678` | Fran Okafor | User | First Class, yearly |

The admin pages are at `/admin`; the developer account also sees `/admin/events`.

## Mock mode login

When the site runs without a server (`npm run dev`), only this account signs in (`client/src/dev/mock/seed.js`):

| Email | Password | Name |
| --- | --- | --- |
| `test@myplanetview.local` | `12345678` | Charlie Reid |

Add `?mockRole=ADMIN` to the address to be signed in as an admin.

## Before launch

The live database now holds these five accounts with the password in this repo, including an admin. Delete them, or change their passwords, before real people sign up.
