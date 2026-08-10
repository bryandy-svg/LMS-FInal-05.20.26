update public.trucking_moves
set amount_to_bill = greatest(
  0,
  coalesce(amount, 0) - coalesce(discount_amount, 0) + coalesce(tipping_charge, 0)
);
