-- Resume the new-system work-order sequence at W00003.
-- Legacy/transferred work-order numbers remain in work_orders and do not control this counter.
insert into public.app_sequences (key, prefix, next_number)
values ('wo_new', 'W', 3)
on conflict (key) do update
set prefix = excluded.prefix,
    next_number = excluded.next_number;

select key, prefix, next_number,
       prefix || lpad(next_number::text, 5, '0') as next_work_order_no
from public.app_sequences
where key = 'wo_new';
