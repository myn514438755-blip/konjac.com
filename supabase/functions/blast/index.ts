import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

type BlastProgram = 'blastn' | 'blastp';
type BlastDatabase = 'konjac_cds' | 'konjac_pep';

const MAX_QUERY_LENGTH = 20000;
const DEFAULT_MAX_TARGETS = 50;
const PROGRAM_DATABASE: Record<BlastProgram, BlastDatabase> = {
  blastn: 'konjac_cds',
  blastp: 'konjac_pep',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

function getBearerToken(req: Request) {
  const authHeader = req.headers.get('Authorization') || '';
  return authHeader.replace(/^Bearer\s+/i, '').trim();
}

async function requireUser(req: Request, supabase: ReturnType<typeof createClient>) {
  const token = getBearerToken(req);
  if (!token) throw new Error('Sign in before submitting BLAST.');

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error('Invalid or expired login session.');
  return data.user;
}

function normalizeSequence(raw: unknown, program: BlastProgram) {
  const input = String(raw || '').trim();
  if (!input) throw new Error('Enter FASTA or plain sequence.');

  const lines = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  let queryName = 'query';
  let sequenceLines = lines;
  if (lines[0]?.startsWith('>')) {
    queryName = lines[0].slice(1).trim().split(/\s+/)[0] || 'query';
    sequenceLines = lines.slice(1);
  }

  const sequence = sequenceLines.join('').replace(/\s+/g, '').toUpperCase();
  if (!sequence) throw new Error('Query sequence is empty.');
  if (sequence.length > MAX_QUERY_LENGTH) throw new Error(`Query sequence must be <= ${MAX_QUERY_LENGTH} bp/aa.`);

  const validNucleotide = /^[ACGTRYSWKMBDHVN.-]+$/i;
  const validProtein = /^[ABCDEFGHIKLMNPQRSTVWXYZ*.-]+$/i;
  if (program === 'blastn' && !validNucleotide.test(sequence)) {
    throw new Error('blastn accepts nucleotide characters only.');
  }
  if (program === 'blastp' && !validProtein.test(sequence)) {
    throw new Error('blastp accepts protein characters only.');
  }

  const wrapped = sequence.match(/.{1,80}/g)?.join('\n') || sequence;
  return {
    queryName,
    queryLength: sequence.length,
    queryFasta: `>${queryName}\n${wrapped}\n`,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Only POST is supported.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Supabase service role environment is not configured.' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const body = await req.json();
    const action = String(body.action || 'submit');

    if (action === 'status') {
      const jobId = String(body.job_id || '');
      const token = String(body.token || '');
      if (!jobId || !token) return json({ error: 'job_id and token are required.' }, 400);

      const { data: job, error: jobError } = await supabase
        .from('blast_jobs')
        .select('id, program, database, query_name, query_length, max_target_seqs, status, error_message, created_at, started_at, finished_at, updated_at')
        .eq('id', jobId)
        .eq('public_token', token)
        .single();

      if (jobError || !job) return json({ error: 'BLAST job not found.' }, 404);

      const { data: hits, error: hitsError } = await supabase
        .from('blast_hits')
        .select('rank, qseqid, sseqid, pident, alignment_length, mismatch, gapopen, qstart, qend, sstart, send, evalue, bitscore')
        .eq('job_id', jobId)
        .order('rank', { ascending: true });

      if (hitsError) return json({ error: hitsError.message }, 500);
      return json({ job, hits: hits || [] });
    }

    const user = await requireUser(req, supabase);
    const program = String(body.program || 'blastn') as BlastProgram;
    if (!['blastn', 'blastp'].includes(program)) return json({ error: 'program must be blastn or blastp.' }, 400);

    const database = PROGRAM_DATABASE[program];
    const maxTargetSeqs = Math.max(1, Math.min(DEFAULT_MAX_TARGETS, Number(body.max_target_seqs) || DEFAULT_MAX_TARGETS));
    const normalized = normalizeSequence(body.sequence, program);

    const { data, error } = await supabase
      .from('blast_jobs')
      .insert({
        program,
        database,
        user_id: user.id,
        query_name: normalized.queryName,
        query_fasta: normalized.queryFasta,
        query_length: normalized.queryLength,
        max_target_seqs: maxTargetSeqs,
        client_ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
        user_agent: req.headers.get('user-agent'),
      })
      .select('id, public_token, program, database, query_name, query_length, max_target_seqs, status, created_at')
      .single();

    if (error) return json({ error: error.message }, 500);
    return json({ job: data, token: data.public_token }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'BLAST request failed.';
    return json({ error: message }, 400);
  }
});
