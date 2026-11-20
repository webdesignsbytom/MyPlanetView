-- Co-owners (19 Nov 2026, docs/API.md "Co-owners"): a map role between editor and owner.
-- On its own, before anything uses the value: Postgres can't use an enum value added in
-- the same transaction (the CHECK in 20261119120100_co_owner_invites names it).

-- AlterEnum
ALTER TYPE "ShareRole" ADD VALUE 'CO_OWNER';
