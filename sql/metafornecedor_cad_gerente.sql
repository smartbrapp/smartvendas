select a.codgerente, a.nomegerente, a.codgerentesuperior, a.cod_cadrca 
from pcgerente a 
where a.cod_cadrca is not null
and (:COD_CADRCA IS NULL OR a.cod_cadrca = :COD_CADRCA)
and (:CODGERENTE IS NULL OR a.codgerente = :CODGERENTE)
order by a.nomegerente