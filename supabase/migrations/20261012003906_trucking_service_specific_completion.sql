CREATE OR REPLACE FUNCTION public.validate_final_trucking_material()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  is_final boolean;
  needs_quantity boolean;
  service_name text;
  container_move boolean;
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
       AND ROW(NEW.service,NEW.requested_equipment_label,NEW.container_no,NEW.equipment_label,NEW.debris_type,NEW.cy_ton,NEW.rate_type,NEW.tipping_rate_type)
           IS NOT DISTINCT FROM ROW(OLD.service,OLD.requested_equipment_label,OLD.container_no,OLD.equipment_label,OLD.debris_type,OLD.cy_ton,OLD.rate_type,OLD.tipping_rate_type)
    THEN RETURN NEW; END IF;
  END IF;

  service_name := coalesce(nullif(NEW.service,''),nullif(NEW.requested_equipment_label,''),NEW.equipment_label,'');
  needs_quantity := service_name ~* 'roll[[:space:]-]*off'
    AND (service_name || ' ' || coalesce(NEW.requested_equipment_label,'')) !~* 'flat[[:space:]-]*rack|chameleon';
  container_move := NOT needs_quantity AND service_name ~* 'container|sidelift|trailer[[:space:]/-]*move';
  IF container_move THEN
    IF nullif(btrim(NEW.container_no),'') IS NULL THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='Container / Trailer # is required for a container move.';
    END IF;
    RETURN NEW;
  END IF;
  IF (needs_quantity OR service_name ~* 'dump') AND nullif(btrim(NEW.debris_type),'') IS NULL THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='Type of Debris is required for this service.';
  END IF;
  IF NOT needs_quantity OR lower(btrim(coalesce(NEW.debris_type,'')))='none' THEN RETURN NEW; END IF;
  IF needs_quantity THEN
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


-- Exercise the production validator without inserting any customer tickets.
CREATE TEMP TABLE trucking_completion_check ON COMMIT DROP AS SELECT * FROM public.trucking_moves WITH NO DATA;
CREATE TRIGGER completion_check BEFORE INSERT ON trucking_completion_check
FOR EACH ROW EXECUTE FUNCTION public.validate_final_trucking_material();
INSERT INTO trucking_completion_check(status,service,container_no,debris_type,cy_ton) VALUES
('Finalized','Container/Trailer Move','TEST123',NULL,NULL),
('Finalized','Pump Service',NULL,NULL,NULL),
('Finalized','Dump Truck',NULL,'Coral',NULL),
('Finalized','End Dump',NULL,'Coral',NULL),
('Finalized','Roll Off Bin',NULL,'None',NULL),
('Finalized','Roll Off Bin',NULL,'Green Waste','12 CY'),
('Finalized','Roll Off Bin',NULL,'Green Waste','3 Ton');
DO $$ BEGIN
  BEGIN
    INSERT INTO trucking_completion_check(status,service) VALUES ('Finalized','Container/Trailer Move');
    RAISE EXCEPTION 'Container move incorrectly accepted without a container number';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    INSERT INTO trucking_completion_check(status,service,debris_type) VALUES ('Finalized','Roll Off Bin','Green Waste');
    RAISE EXCEPTION 'Roll-off incorrectly accepted without a quantity';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
DROP TABLE trucking_completion_check;
