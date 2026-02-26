select a.codfilial, b.fantasia, a.codprod, a.qtestger, a.qtbloqueada, a.qtindeniz, a.qtreserv, a.dtultent 
from pcest a, pcfilial b
where a.codprod=:CODPROD
and a.codfilial=b.codigo
and a.codfilial in (select codigo from pcfilial where dtexclusao is null)
and a.dtultent is not null