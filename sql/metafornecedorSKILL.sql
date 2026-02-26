SELECT
 SYSDATE as "DATAATUALIZACAO",
  codusur,
  nome,
  "MetaValor",
  "VlrVendido",
  LEAST(
    CASE
      WHEN "MetaValor" <> 0 THEN ROUND(("VlrVendido" / "MetaValor"), 2)
      ELSE 0
    END, 1
  ) as "percVenda",
  CONCAT(
    ROUND(
      LEAST(
        CASE
          WHEN "MetaValor" <> 0 THEN ROUND(("VlrVendido" / "MetaValor"), 2)
          ELSE 0
        END, 1
      ) * 100, 0
    ),
    '%'
  ) as "percVenda2",
  "PosMeta",
  "Positivacao",
  LEAST(
    CASE
      WHEN "PosMeta" <> 0 THEN ROUND(("Positivacao" / "PosMeta"), 2)
      ELSE 0
    END, 1
  ) as "percPos",
  CONCAT(
    ROUND(
      LEAST(
        CASE
          WHEN "PosMeta" <> 0 THEN ROUND(("Positivacao" / "PosMeta"), 2)
          ELSE 0
        END, 1
      ) * 100, 0
    ),
    '%'
  ) as "percPos2",
  "MixMeta",
  "MIX",
  LEAST(
    CASE
      WHEN "MixMeta" <> 0 THEN ROUND(("MIX" / "MixMeta"), 2)
      ELSE 0
    END, 1
  ) as "percMIX",
  CONCAT(
    ROUND(
      LEAST(
        CASE
          WHEN "MixMeta" <> 0 THEN ROUND(("MIX" / "MixMeta"), 2)
          ELSE 0
        END, 1
      ) * 100, 0
    ),
    '%'
  ) as "percMIX2"
FROM (
  SELECT
    a.codusur,
    r.nome,
    
    NVL(
      (SELECT SUM(b.vlvendaprev) FROM pcmeta b WHERE b.tipometa = 'F' AND a.codusur = b.codusur AND TO_CHAR(b.data, 'MM/YYYY') = to_char(sysdate,'MM/YYYY') GROUP BY b.codusur),
      0
    ) as "MetaValor",
    ROUND(sum(a.vlatend), 2) as "VlrVendido",
    
    NVL(
      (SELECT ROUND(SUM(b.cliposprev), 0) FROM pcmeta b WHERE b.tipometa = 'F' AND a.codusur = b.codusur AND TO_CHAR(b.data, 'MM/YYYY') = to_char(sysdate,'MM/YYYY') GROUP BY b.codusur),
      0
    ) as "PosMeta",
    ROUND(count(distinct(a.codcli)), 2) as "Positivacao",
    
    NVL(
      (SELECT SUM(b.mixprev) FROM pcmeta b WHERE b.tipometa = 'F' AND a.codusur = b.codusur AND TO_CHAR(b.data, 'MM/YYYY') =to_char(sysdate,'MM/YYYY') GROUP BY b.codusur),
      0
    ) as "MixMeta",
    ROUND(count(distinct(a.codprod)), 2) as "MIX"

  FROM tec_view_resumo_faturamento a, pcusuari r
  WHERE
    to_char(a.dtsaida,'MM/YYYY')=to_char(sysdate,'MM/YYYY')
    AND a.codusur = r.codusur
    AND a.codusur IN (:RCA)
  GROUP BY a.codusur, r.nome
)
WHERE "MetaValor" > 0
;