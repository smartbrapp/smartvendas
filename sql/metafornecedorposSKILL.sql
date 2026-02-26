select a.codusur, a.codfornec, sum(a.vlatend) as VALOR, count(distinct(a.codcli)) as POSITIVACAO, count(distinct(a.codprod)) as MIX,
(select count(codprod) from pcprodut where codfornec=:CODFORNEC and dtexclusao is null and obs2<>'FL')PRODCAD
from view_vendas_resumo_faturamento a 
where a.codusur=:RCA
and a.codfornec=:CODFORNEC
and to_char(a.dtsaida,'MM/YYYY')=to_char(sysdate,'MM/YYYY')
group by a.codusur, a.codfornec