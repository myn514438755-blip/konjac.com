create extension if not exists pgcrypto;

create type public.blast_job_status as enum ('queued', 'running', 'succeeded', 'failed', 'cancelled');
create type public.blast_program as enum ('blastn', 'blastp');
create type public.blast_database as enum ('konjac_cds', 'konjac_pep');

create table public.blast_jobs (
  id uuid primary key default gen_random_uuid(),
  public_token text not null default encode(gen_random_bytes(16), 'hex'),
  program public.blast_program not null,
  database public.blast_database not null,
  user_id uuid references auth.users(id) on delete set null,
  query_name text,
  query_fasta text not null,
  query_length integer not null check (query_length > 0 and query_length <= 20000),
  max_target_seqs integer not null default 50 check (max_target_seqs between 1 and 50),
  status public.blast_job_status not null default 'queued',
  error_message text,
  worker_id text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  updated_at timestamptz not null default now(),
  client_ip inet,
  user_agent text,
  constraint blast_program_database_match check (
    (program = 'blastn' and database = 'konjac_cds') or
    (program = 'blastp' and database = 'konjac_pep')
  )
);

create table public.blast_hits (
  id bigint generated always as identity primary key,
  job_id uuid not null references public.blast_jobs(id) on delete cascade,
  rank integer not null check (rank > 0),
  qseqid text not null,
  sseqid text not null,
  pident numeric,
  alignment_length integer,
  mismatch integer,
  gapopen integer,
  qstart integer,
  qend integer,
  sstart integer,
  send integer,
  evalue double precision,
  bitscore numeric,
  created_at timestamptz not null default now(),
  unique (job_id, rank)
);

create index blast_jobs_status_created_idx on public.blast_jobs (status, created_at);
create index blast_jobs_user_created_idx on public.blast_jobs (user_id, created_at desc);
create index blast_jobs_public_lookup_idx on public.blast_jobs (id, public_token);
create index blast_hits_job_rank_idx on public.blast_hits (job_id, rank);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_blast_jobs_updated_at
before update on public.blast_jobs
for each row
execute function public.set_updated_at();

alter table public.blast_jobs enable row level security;
alter table public.blast_hits enable row level security;

comment on table public.blast_jobs is 'Konjac Gene Explorer online BLAST job queue. Compute is performed by an external worker.';
comment on table public.blast_hits is 'Parsed outfmt 6 BLAST hits for completed jobs.';
