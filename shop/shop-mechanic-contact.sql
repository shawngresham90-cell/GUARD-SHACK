-- ============================================================================
-- Rosedale Shop Scheduler — ADD-ON: mechanic contact field
--
-- Applied to the LIVE "ShopScheduler" project (ref mmnvcbejjdweetnxncfi) as
-- migration `add_mechanic_contact`. Recorded here to keep the repo in sync.
--
-- Additive and idempotent — does NOT re-run or alter any existing migration,
-- column, policy, or data. Safe to re-run.
--
-- Adds a free-text contact (phone / email / radio channel, etc.) to a mechanic.
-- The mechanics table already has an `active` boolean; the app now surfaces an
-- active/inactive toggle for it and hides inactive mechanics from the
-- assignment pickers.
-- ============================================================================

alter table mechanics add column if not exists contact text;
