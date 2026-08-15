-- Stores the overtime portion of completed labor separately from total hours.
-- Total hours continue to come from clock_in/clock_out. Overtime is billed at
-- the stored multiplier (150% by default), without double-counting those hours.
alter table public.work_order_labor
  add column if not exists overtime_hours numeric not null default 0,
  add column if not exists overtime_multiplier numeric not null default 1.5;

alter table public.work_order_labor
  drop constraint if exists work_order_labor_overtime_hours_nonnegative,
  add constraint work_order_labor_overtime_hours_nonnegative
    check (overtime_hours >= 0),
  drop constraint if exists work_order_labor_overtime_multiplier_valid,
  add constraint work_order_labor_overtime_multiplier_valid
    check (overtime_multiplier >= 1);

notify pgrst, 'reload schema';

