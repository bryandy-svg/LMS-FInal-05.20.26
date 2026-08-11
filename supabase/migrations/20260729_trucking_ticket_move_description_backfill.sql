update public.trucking_moves m
set move_description = coalesce(r.move_description, r.notes)
from public.trucking_requests r
where m.request_no = r.request_no
  and nullif(trim(coalesce(m.move_description, '')), '') is null
  and nullif(trim(coalesce(r.move_description, r.notes, '')), '') is not null;
