select a.codusur, a.codfornec, a.codprod, a.descricao, round(sum(a.vlatend),2) as VALOR, count(distinct(a.codcli)) as POS,
max(a.dtsaida) as ULTVENDA, sum(a.pesobruto) as PESO
from view_vendas_resumo_faturamento a 
where a.codusur=:RCA
and a.codfornec=:CODFORNEC
and to_char(a.dtsaida,'MM/YYYY')=to_char(sysdate,'MM/YYYY')
group by a.codusur, a.codfornec, a.codprod, a.descricao
order by sum(a.vlatend) desc;