CREATE OR REPLACE FUNCTION public.validate_final_trucking_material()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  is_final boolean;
  needs_quantity boolean;
  parsed text[];
BEGIN
  is_final := lower(coalesce(NEW.status,'')) IN ('finalized','accepted','completed','billed')
              OR NEW.finalized_at IS NOT NULL;
  IF NOT is_final OR lower(coalesce(NEW.status,'')) IN ('cancelled','canceled','void') THEN RETURN NEW; END IF;

  -- Grandfather only unchanged historical material details. Re-finalizing a draft,
  -- new inserts, or editing material details always runs the validation below.
  IF TG_OP = 'UPDATE' THEN
    IF (lower(coalesce(OLD.status,'')) IN ('finalized','accepted','completed','billed') OR OLD.finalized_at IS NOT NULL)
       AND NEW.status IS NOT DISTINCT FROM OLD.status
       AND NEW.finalized_at IS NOT DISTINCT FROM OLD.finalized_at
       AND ROW(NEW.service,NEW.equipment_label,NEW.debris_type,NEW.cy_ton,NEW.rate_type,NEW.tipping_rate_type)
           IS NOT DISTINCT FROM ROW(OLD.service,OLD.equipment_label,OLD.debris_type,OLD.cy_ton,OLD.rate_type,OLD.tipping_rate_type)
    THEN RETURN NEW; END IF;
  END IF;

  IF nullif(btrim(NEW.debris_type),'') IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='Type of Debris is required before finalizing this ticket.';
  END IF;
  needs_quantity := coalesce(NEW.service,'') ~* '(roll[ -]*off|dump[ -]*truck|end[ -]*dump)'
    AND coalesce(NEW.service,'') !~* 'flat[ -]*rack';
  needs_quantity := needs_quantity
    OR coalesce(NEW.rate_type,'') ~* '(/|per[[:space:]]+)[[:space:]]*(cy|tons?|cubic[[:space:]]+yards?)'
    OR coalesce(NEW.tipping_rate_type,'') ~* '(/|per[[:space:]]+)[[:space:]]*(cy|tons?|cubic[[:space:]]+yards?)'
    OR EXISTS (SELECT 1 FROM public.trucking_rates r
      WHERE coalesce(r.status,'') !~* 'inactive'
        AND lower(btrim(r.category))='tipping fee'
        AND lower(btrim(r.service))=lower(btrim(NEW.debris_type))
        AND coalesce(r.rate_type,'') ~* '(/|per[[:space:]]+)[[:space:]]*(cy|tons?|cubic[[:space:]]+yards?)');
  IF needs_quantity OR nullif(btrim(NEW.cy_ton),'') IS NOT NULL THEN
    parsed := regexp_match(btrim(coalesce(NEW.cy_ton,'')), '^([0-9]+([.][0-9]+)?|[.][0-9]+)[[:space:]]*(CY|Tons?)$', 'i');
    IF parsed IS NULL THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='Enter a positive quantity and select CY or Ton before finalizing this ticket.';
    END IF;
    IF parsed[1]::numeric <= 0 THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='Ticket quantity must be greater than zero.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_final_trucking_material
BEFORE INSERT OR UPDATE ON public.trucking_moves
FOR EACH ROW EXECUTE FUNCTION public.validate_final_trucking_material();
