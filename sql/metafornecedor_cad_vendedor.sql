select a.codusur, a.nome, a.tipovend, a.codsupervisor, a.codfilial, a.vlcorrente, a.email, a.telefone1 
from pcusuari a 
where a.dttermino is null
and (
    :COD_CADRCA IS NULL 
    OR a.codusur = :COD_CADRCA 
    OR a.codsupervisor IN (select s.codsupervisor from pcsuperv s where s.cod_cadrca = :COD_CADRCA)
)
and (:CODUSUR IS NULL OR a.codusur = :CODUSUR)
and (:CODSUPERVISOR IS NULL OR a.codsupervisor = :CODSUPERVISOR)
order by a.nome