BEGIN;
DO $$
DECLARE sample public.trucking_moves%ROWTYPE; candidate public.trucking_moves%ROWTYPE;
        invalid_qty text; rejected boolean; final_id bigint;
BEGIN
 SELECT * INTO STRICT sample FROM public.trucking_moves WHERE ticket_no='LMS-00208';
 -- Unrelated edits to an existing incomplete historical ticket remain possible.
 UPDATE public.trucking_moves SET notes=notes WHERE id=sample.id;
 candidate:=sample; SELECT coalesce(max(id),0)+1000000 INTO candidate.id FROM public.trucking_moves; candidate.ticket_no:='GUARD-TEST-'||candidate.id;
 candidate.status:='Finalized'; candidate.debris_type:=NULL; candidate.cy_ton:='20 CY';
 rejected:=false;
 BEGIN INSERT INTO public.trucking_moves SELECT (candidate).*;
 EXCEPTION WHEN check_violation THEN
  IF SQLERRM NOT LIKE 'Type of Debris%' THEN RAISE; END IF; rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'Missing debris accepted'; END IF;
 candidate.debris_type:='Green Waste';
 FOREACH invalid_qty IN ARRAY ARRAY[NULL,'','20','0 CY','-1 Ton','NaN CY','20 CY Ton'] LOOP
   candidate.cy_ton:=invalid_qty; rejected:=false;
   BEGIN INSERT INTO public.trucking_moves SELECT (candidate).*;
   EXCEPTION WHEN check_violation THEN
    IF SQLERRM NOT LIKE 'Enter a positive%' AND SQLERRM NOT LIKE 'Ticket quantity%' THEN RAISE; END IF; rejected:=true;
   END;
   IF NOT rejected THEN RAISE EXCEPTION 'Invalid quantity accepted: %', invalid_qty; END IF;
 END LOOP;
 candidate.cy_ton:='20 CY';
 INSERT INTO public.trucking_moves SELECT (candidate).* RETURNING id INTO final_id;
 rejected:=false;
 BEGIN UPDATE public.trucking_moves SET cy_ton=NULL WHERE id=final_id;
 EXCEPTION WHEN check_violation THEN rejected:=true; END;
 IF NOT rejected THEN RAISE EXCEPTION 'Final quantity could be cleared'; END IF;
 SELECT coalesce(max(id),0)+1000000 INTO candidate.id FROM public.trucking_moves; candidate.ticket_no:='GUARD-TEST-'||candidate.id;
 candidate.status:='Draft'; candidate.finalized_at:=NULL; candidate.debris_type:=NULL; candidate.cy_ton:=NULL;
 INSERT INTO public.trucking_moves SELECT (candidate).*;
 rejected:=false;
 BEGIN UPDATE public.trucking_moves SET status='Finalized' WHERE id=candidate.id;
 EXCEPTION WHEN check_violation THEN rejected:=true; END;
 IF NOT rejected THEN RAISE EXCEPTION 'Incomplete draft finalized'; END IF;
END $$;
ROLLBACK;
SELECT count(*) AS permanent_test_rows FROM public.trucking_moves WHERE ticket_no LIKE 'GUARD-TEST-%';
