CREATE OR REPLACE FUNCTION public.trucking_repriced_amount(old_amount numeric, old_rate numeric, new_rate numeric, old_type text, new_type text, hours numeric, quantity text, trip text)
RETURNS numeric LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
 SELECT round(coalesce(new_rate,0) * CASE
   WHEN old_rate > 0 AND lower(coalesce(old_type,''))=lower(coalesce(new_type,'')) THEN coalesce(old_amount,0)/old_rate
   WHEN new_type ~* 'hour' THEN greatest(2,coalesce(hours,0))
   WHEN new_type ~* '(/|per[[:space:]]+)[[:space:]]*(cy|tons?|cubic)' THEN
     coalesce((regexp_match(coalesce(quantity,''),'^([0-9]+([.][0-9]+)?|[.][0-9]+)'))[1]::numeric,0) * CASE WHEN trip='Round Trip' THEN 2 ELSE 1 END
   ELSE CASE WHEN trip='Round Trip' THEN 2 ELSE 1 END END,2)
$$;

CREATE OR REPLACE FUNCTION public.reprice_unbilled_trucking_rate(rate_key text)
RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE r public.trucking_rates%ROWTYPE; changed integer;
BEGIN
 SELECT * INTO r FROM public.trucking_rates WHERE service=rate_key;
 IF NOT FOUND OR coalesce(r.status,'') ~* 'inactive' THEN RETURN 0; END IF;
 WITH eligible AS (
 SELECT m.*, lower(coalesce(r.category,''))='tipping fee' AS tipping,
   greatest(0,least(100,coalesce(m.discount_percent,100*m.discount_amount/nullif(m.amount,0),0))) AS pct
 FROM public.trucking_moves m
 WHERE lower(coalesce(nullif(m.billing_status,''),'Unbilled'))='unbilled'
   AND m.billed_at IS NULL
   AND lower(coalesce(m.status,'')) NOT IN ('draft','cancelled','canceled','void','voided','billed')
   AND CASE WHEN lower(coalesce(r.category,''))='tipping fee' THEN
     coalesce(m.service,m.requested_equipment_label,'') ~* 'roll[[:space:]-]*off'
     AND (coalesce(m.service,'') || ' ' || coalesce(m.requested_equipment_label,'')) !~* 'flat[[:space:]-]*rack|chameleon'
     AND lower(trim(coalesce(m.debris_type,m.tipping_fee,'')))=lower(trim(r.service))
     AND lower(trim(r.service))<>'none'
     AND (m.tipping_rate IS DISTINCT FROM r.rate OR m.tipping_rate_type IS DISTINCT FROM r.rate_type)
   ELSE lower(trim(m.service))=lower(trim(r.service))
     AND (m.rate IS DISTINCT FROM r.rate OR m.rate_type IS DISTINCT FROM r.rate_type) END
 ), priced AS (
 SELECT e.*,
 CASE WHEN tipping THEN coalesce(amount,0) ELSE public.trucking_repriced_amount(amount,rate,r.rate,rate_type,r.rate_type,
   coalesce(actual_hours,CASE WHEN start_time IS NOT NULL AND end_time IS NOT NULL THEN mod(extract(epoch from (end_time-start_time))::numeric+86400,86400)/3600 END),cy_ton,trip_type) END AS new_amount,
 CASE WHEN NOT tipping THEN coalesce(tipping_charge,0) ELSE round(coalesce(r.rate,0)*CASE
 WHEN r.rate_type ~* '(/|per[[:space:]]+)[[:space:]]*(cy|tons?|cubic)' THEN
 coalesce((regexp_match(coalesce(cy_ton,''),'^([0-9]+([.][0-9]+)?|[.][0-9]+)'))[1]::numeric,0)
 ELSE 1 END,2) END AS new_tipping
 FROM eligible e
 ) UPDATE public.trucking_moves m SET
 rate=CASE WHEN p.tipping THEN m.rate ELSE r.rate END,
 rate_type=CASE WHEN p.tipping THEN m.rate_type ELSE r.rate_type END,
 amount=p.new_amount,
 tipping_rate=CASE WHEN p.tipping THEN r.rate ELSE m.tipping_rate END,
 tipping_rate_type=CASE WHEN p.tipping THEN r.rate_type ELSE m.tipping_rate_type END,
 tipping_charge=p.new_tipping,
 discount_percent=p.pct, discount_amount=round(p.new_amount*p.pct/100,2),
 amount_to_bill=greatest(0,p.new_amount-round(p.new_amount*p.pct/100,2)+p.new_tipping)
 FROM priced p WHERE m.id=p.id;
 GET DIAGNOSTICS changed=ROW_COUNT;
 RETURN changed;
END $$;

CREATE OR REPLACE FUNCTION public.sync_unbilled_trucking_rate()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
BEGIN
 PERFORM public.reprice_unbilled_trucking_rate(NEW.service);
 RETURN NEW;
END $$;
CREATE TRIGGER sync_unbilled_trucking_rate AFTER INSERT OR UPDATE OF rate,rate_type,status ON public.trucking_rates
FOR EACH ROW EXECUTE FUNCTION public.sync_unbilled_trucking_rate();
REVOKE ALL ON FUNCTION public.reprice_unbilled_trucking_rate(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.reprice_unbilled_trucking_rate(text) TO authenticated;

-- Preserve the recorded billable units, including round trips and hourly minimums.
DO $$ BEGIN
 IF public.trucking_repriced_amount(5000,5000,5500,'Flat Rate','Flat Rate',NULL,NULL,'One-Way')<>5500
 OR public.trucking_repriced_amount(10000,5000,5500,'Flat Rate','Flat Rate',NULL,NULL,'Round Trip')<>11000
 OR public.trucking_repriced_amount(255,85,100,'Hourly','Hourly',3,NULL,'One-Way')<>300
 OR public.trucking_repriced_amount(0,0,100,'Hourly','Hourly',1,NULL,'One-Way')<>200
 OR public.trucking_repriced_amount(150,15,20,'/CY','/CY',NULL,'10 CY','One-Way')<>200
 THEN RAISE EXCEPTION 'Unbilled rate calculation regression'; END IF;
END $$;

-- Bring already-unbilled tickets up to the rates saved before this fix.
DO $$ DECLARE key text; BEGIN
 FOR key IN SELECT service FROM public.trucking_rates WHERE coalesce(status,'') !~* 'inactive' LOOP
 PERFORM public.reprice_unbilled_trucking_rate(key);
 END LOOP;
END $$;
