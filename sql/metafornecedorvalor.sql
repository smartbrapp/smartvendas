select a.codusur, a.codfornec, a.codprod, a.descricao, sum(a.vlatend) as VALOR, count(distinct(a.codcli)) as POS
from view_vendas_resumo_faturamento a 
where a.codusur=:RCA
and a.codfornec=:CODFORNEC
and to_char(a.dtsaida,'MM/YYYY')=to_char(sysdate,'MM/YYYY')
group by a.codusur, a.codfornec, a.codprod, a.descricao