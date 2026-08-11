alter table public.general_ledger
  add column if not exists bank_reference text;

update public.general_ledger gl
set bank_reference = payment.bank_reference
from public.customer_payments payment
where gl.source = 'Customer Payment'
  and gl.reference = payment.receipt_no
  and nullif(trim(payment.bank_reference), '') is not null
  and nullif(trim(gl.bank_reference), '') is null;

update public.general_ledger gl
set bank_reference = check_run.check_no
from public.check_runs check_run
where gl.source = 'Check Run'
  and gl.reference = check_run.check_run_no
  and nullif(trim(check_run.check_no), '') is not null
  and nullif(trim(gl.bank_reference), '') is null;

create index if not exists general_ledger_bank_reference_idx
  on public.general_ledger (bank_reference);
