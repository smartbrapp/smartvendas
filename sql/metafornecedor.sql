SELECT codusur, nome, codfornec, fantasia, 
       "MetaValor", "VlrVendido", 
       LEAST(CASE WHEN "MetaValor" <> 0 THEN ROUND(("VlrVendido" / "MetaValor") * 100, 2) ELSE 0 END, 100) AS "percVenda",
       LEAST(CASE WHEN "MetaValor" <> 0 THEN ROUND(("VlrVendido" / "MetaValor") * 100, 2) ELSE 0 END, 100)/100 AS "percVenda2",
       "PosMeta", "Positivacao", 
       LEAST(CASE WHEN "PosMeta" <> 0 THEN ROUND(("Positivacao" / "PosMeta") * 100, 2) ELSE 0 END, 100) AS "percPos",
       LEAST(CASE WHEN "PosMeta" <> 0 THEN ROUND(("Positivacao" / "PosMeta") * 100, 2) ELSE 0 END, 100)/100 AS "percPos2",
       "MixMeta", "MIX", 
       LEAST(CASE WHEN "MixMeta" <> 0 THEN ROUND(("MIX" / "MixMeta") * 100, 2) ELSE 0 END, 100) AS "percMix",
       LEAST(CASE WHEN "MixMeta" <> 0 THEN ROUND(("MIX" / "MixMeta") * 100, 2) ELSE 0 END, 100)/100 AS "percMix2",
       ROUND((LEAST(CASE WHEN "MetaValor" <> 0 THEN ROUND(("VlrVendido" / "MetaValor") * 100, 2) ELSE 0 END, 100) +
              LEAST(CASE WHEN "PosMeta" <> 0 THEN ROUND(("Positivacao" / "PosMeta") * 100,2) ELSE 0 END, 100) +
              LEAST(CASE WHEN "MixMeta" <> 0 THEN ROUND(("MIX" / "MixMeta") * 100,2) ELSE 0 END, 100)) / 3, 2) AS "percGeral",
              
              ROUND((LEAST(CASE WHEN "MetaValor" <> 0 THEN ROUND(("VlrVendido" / "MetaValor") * 100, 2) ELSE 0 END, 100) +
              LEAST(CASE WHEN "PosMeta" <> 0 THEN ROUND(("Positivacao" / "PosMeta") * 100,2) ELSE 0 END, 100) +
              LEAST(CASE WHEN "MixMeta" <> 0 THEN ROUND(("MIX" / "MixMeta") * 100,2) ELSE 0 END, 100)) / 3, 2)/100 AS "percGeral2"
FROM (
    SELECT a.codusur, r.nome, a.codfornec, f.fantasia, 
           -- R$ META 399
           NVL((SELECT SUM(b.vlvendaprev) FROM pcmeta b WHERE b.tipometa = 'F' AND a.codusur = b.codusur AND a.codfornec = b.codigo AND TO_CHAR(b.data, 'MM/YYYY') = to_char(sysdate,'MM/YYYY') GROUP BY b.codusur), 0) AS "MetaValor",
           -- R$ VENDIDO , %Ating.
           ROUND(SUM(a.vlatend), 2) AS "VlrVendido",
           -- META POS 399
           NVL((SELECT ROUND(SUM(b.cliposprev), 0) FROM pcmeta b WHERE b.tipometa = 'F' AND a.codusur = b.codusur AND a.codfornec = b.codigo AND TO_CHAR(b.data, 'MM/YYYY') = to_char(sysdate,'MM/YYYY') GROUP BY b.codusur), 0) AS "PosMeta",
           -- Positivação, %Ating.
           COUNT(DISTINCT(a.codcli)) AS "Positivacao",
           NVL((SELECT ROUND(SUM(b.mixprev), 0) FROM pcmeta b WHERE b.tipometa = 'F' AND a.codusur = b.codusur AND a.codfornec = b.codigo AND TO_CHAR(b.data, 'MM/YYYY') = to_char(sysdate,'MM/YYYY') GROUP BY b.codusur), 0) AS "MixMeta",
           -- Positivação, %Ating.
           COUNT(DISTINCT(a.codprod)) AS "MIX"
    FROM tec_view_resumo_faturamento a, pcusuari r, pcfornec f
    WHERE
        to_char(a.dtsaida,'MM/YYYY')=to_char(sysdate,'MM/YYYY')
        AND a.codusur = r.codusur
        AND a.codfornec = f.codfornec
        AND a.codusur IN (:RCA)
    GROUP BY a.codusur, r.nome, a.codfornec, f.fantasia
)
WHERE "MetaValor" > 0
;