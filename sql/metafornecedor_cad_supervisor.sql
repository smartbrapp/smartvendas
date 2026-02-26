select a.codsupervisor, a.nome, a.regional, a.cod_cadrca, a.codgerente, a.tiposupervisor, a.email 
from pcsuperv a 
where a.posicao<>'I'
and (
    :COD_CADRCA IS NULL 
    OR a.cod_cadrca = :COD_CADRCA 
    OR a.codgerente IN (select g.codgerente from pcgerente g where g.cod_cadrca = :COD_CADRCA)
)
and (:CODSUPERVISOR IS NULL OR a.codsupervisor = :CODSUPERVISOR)
and (:CODGERENTE IS NULL OR a.codgerente = :CODGERENTE)
order by a.nome