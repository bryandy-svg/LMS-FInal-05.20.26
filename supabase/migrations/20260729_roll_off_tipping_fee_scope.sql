update public.trucking_rates
set parent_service = 'Roll Off Service'
where lower(trim(coalesce(category, ''))) = 'tipping fee';

update public.trucking_requests
set tipping_fee = null
where lower(trim(coalesce(service_needed, ''))) <> 'roll off service'
  and tipping_fee is not null;
