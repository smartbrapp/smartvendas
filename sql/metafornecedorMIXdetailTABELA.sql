select a.numregiao, b.regiao, a.codprod, a.pvenda, a.pvenda1, a.vlst, a.perdescmax 
from pctabpr a, pcregiao b 
where a.codprod=:CODPROD
and a.numregiao=b.numregiao 
and (a.pvenda1 is not null and a.pvenda1<>0)