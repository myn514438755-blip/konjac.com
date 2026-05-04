alter table public.blast_jobs
  drop constraint if exists blast_program_database_match;

alter table public.blast_jobs
  add constraint blast_program_database_match check (
    (program = 'blastn' and database = 'konjac_cds') or
    (program = 'blastn' and database = 'konjac_genome') or
    (program = 'blastp' and database = 'konjac_pep')
  );
