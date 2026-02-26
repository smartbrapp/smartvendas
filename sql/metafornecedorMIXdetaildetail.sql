select a.codcli, a.cliente, a.codprod, a.descricao, sum(a.qtcont) as QTCONT, round(sum(a.punitcont*a.qtcont),2) as TOTAL, a.embalagem, max(a.dtsaida) as DTSAIDA 
from tec_view_resumo_faturamento a 
where a.codprod=:CODPROD and a.codusur=:CODUSUR and a.dtsaida>trunc(sysdate)-90 AND a.dtsaida < TRUNC(SYSDATE, 'MM')
group by a.codcli, a.cliente, a.codprod, a.descricao, a.embalagem
order by round(sum(a.punitcont*a.qtcont),2) desc;