create or replace function public.part_number_one_edit(a text, b text)
returns boolean language plpgsql immutable strict security invoker
set search_path = public, pg_temp as $$
declare i integer:=1; j integer:=1; differences integer:=0; la integer:=length(a); lb integer:=length(b);
begin
  if abs(la-lb)>1 then return false; end if;
  while i<=la and j<=lb loop
    if substr(a,i,1)=substr(b,j,1) then i:=i+1; j:=j+1;
    else
      differences:=differences+1;
      if differences>1 then return false; end if;
      if la>=lb then i:=i+1; end if;
      if lb>=la then j:=j+1; end if;
    end if;
  end loop;
  return differences + (la-i+1) + (lb-j+1) <= 1;
end $$;

create or replace function public.product_creation_matches(p_sku text, p_exclude_id uuid default null)
returns table(id uuid, sku text, name text, source_vendor text)
language sql stable security invoker set search_path = public, pg_temp as $$
  with input as (
    select trim(p_sku) raw, regexp_replace(upper(trim(p_sku)), '[^A-Z0-9]', '', 'g') compact
  ), candidates as (
    select p.id,p.sku,p.name,p.source_vendor,
      regexp_replace(upper(p.sku), '[^A-Z0-9]', '', 'g') compact
    from public.products p where p_exclude_id is null or p.id<>p_exclude_id
  )
  select c.id,c.sku,c.name,c.source_vendor from candidates c cross join input i
  where i.raw<>'' and (
    lower(trim(c.sku))=lower(i.raw)
    or (i.compact<>'' and c.compact=i.compact)
    or (length(replace(i.compact,'0',''))>=3 and replace(c.compact,'0','')=replace(i.compact,'0',''))
    or (least(length(i.compact),length(c.compact))>=4 and public.part_number_one_edit(i.compact,c.compact))
  )
  order by (lower(trim(c.sku))=lower(i.raw)) desc, c.sku,c.id limit 8
$$;
revoke all on function public.part_number_one_edit(text,text) from public, anon;
revoke all on function public.product_creation_matches(text,uuid) from public, anon;
grant execute on function public.part_number_one_edit(text,text) to authenticated;
grant execute on function public.product_creation_matches(text,uuid) to authenticated;
