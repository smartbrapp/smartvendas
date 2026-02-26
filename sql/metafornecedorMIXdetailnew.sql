SELECT DISTINCT(a.codprod), a.descricao, a.codfornec, max(a.dtsaida) as ULTVENDA, 
(select sum(qtestger) from pcest where codprod=a.codprod and qtestger>0) as ESTOQUE,
round(SUM(A.VLATEND),2) AS VLATEND, COUNT(DISTINCT(A.codcli)) AS POS,
SUM(A.pesoliq*A.qtcont) AS PESO, SUM(A.qtcont) AS QTCONT
FROM view_vendas_resumo_faturamento a 
WHERE a.codfornec = :CODFORNEC 
AND a.codusur = :CODUSUR 
AND a.codprod NOT IN (
    SELECT b.codprod 
    FROM view_vendas_resumo_faturamento b 
    WHERE b.codfornec = :CODFORNEC
    AND to_char(b.dtsaida,'MM/YYYY') = to_char(SYSDATE,'MM/YYYY')
    AND b.codusur = :CODUSUR
) 
and a.dtsaida>trunc(sysdate)-90 AND a.dtsaida < TRUNC(SYSDATE, 'MM')
and a.codprod in (select codprod from pcest where codprod=a.codprod and qtestger>0)
and a.dtcancel is null
group by a.codprod, a.descricao, a.codfornec