-- Existing saved forms and their signatures are never changed.
-- Serialize inserts so stale clients and simultaneous saves can share a preview number.
CREATE OR REPLACE FUNCTION public.assign_customer_equipment_form_number()
RETURNS trigger
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  prefix text;
  next_number numeric;
  digits text;
BEGIN
  PERFORM pg_advisory_xact_lock(173205, 807);
  IF NEW.form_no IS NULL OR btrim(NEW.form_no) = ''
     OR EXISTS (SELECT 1 FROM public.customer_equipment_forms f WHERE f.form_no = NEW.form_no) THEN
    prefix := CASE WHEN NEW.form_type = 'Drop-Off' THEN 'CDF' ELSE 'CAR' END;
    SELECT coalesce(max(substring(f.form_no FROM length(prefix) + 2)::numeric), 0) + 1
      INTO next_number
      FROM public.customer_equipment_forms f
      WHERE f.form_no ~ ('^' || prefix || '-[0-9]+$');
    digits := next_number::text;
    NEW.form_no := prefix || '-' || lpad(digits, greatest(5, length(digits)), '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER customer_equipment_forms_assign_number
BEFORE INSERT ON public.customer_equipment_forms
FOR EACH ROW EXECUTE FUNCTION public.assign_customer_equipment_form_number();
