CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE consultas
  ADD CONSTRAINT consultas_sem_sobreposicao
  EXCLUDE USING gist (
    profissional_id WITH =,
    tstzrange(inicio, fim, '[)') WITH &&
  )
  WHERE (status = 'agendada');