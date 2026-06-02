import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient, type SupabaseClient, type User as AuthUser } from 'npm:@supabase/supabase-js@2';
import { InvokeCommand, LambdaClient } from 'npm:@aws-sdk/client-lambda@3';
import { PutObjectCommand, S3Client } from 'npm:@aws-sdk/client-s3@3';

type JsonObject = Record<string, unknown>;
type DbClient = SupabaseClient<any, any, any, any, any>;
type Scope = {
  user: DbUser | null;
  guestSessionId: string | null;
};

type DbUser = {
  id: number;
  auth_user_id: string | null;
  email: string;
  name: string | null;
  picture: string | null;
  provider: string | null;
};

type ContractRow = {
  id: string;
  user_id: number | null;
  title: string | null;
  contract_type: string | null;
  guest_session_id: string | null;
  s3_key_prefix: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type OcrContentRow = {
  id: string;
  contract_id: string;
  content: string | null;
  category: string | null;
  tag_idx: number | null;
  created_at?: string | null;
};

type AnalysisRow = {
  id: string;
  contract_id: string;
  summary: string | null;
  status: string | null;
  process_status: string | null;
  riskdetector_overall_comment: string | null;
  riskdetector_warning_comment: string | null;
  riskdetector_advice: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ToxicClauseRow = {
  id: string;
  analysis_id: string;
  title: string | null;
  clause: string | null;
  reason: string | null;
  reason_reference: string | null;
  suggestion: string | null;
  source_contract_tag_idx: number | null;
  warn_level: number | null;
  created_at?: string | null;
};

type LegalTipRow = {
  id: number;
  source_id?: string;
  category: string;
  question: string;
  summary: string | null;
  answer: string;
  source_url: string | null;
  view_count: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const FUNCTION_NAME = 'rd-api';
const DEFAULT_CORS_ORIGINS = [
  'https://riskdetectorpeuronteuendeu.onrender.com',
  'http://localhost:3000',
  'http://localhost:3001',
];
const OCR_PAGE_DELAY_MS = 1500;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function env(name: string, fallback = '') {
  return Deno.env.get(name)?.trim() || fallback;
}

function parseKeyBag(name: string) {
  const raw = env(name);
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return '';
    for (const key of ['service_role', 'secret', 'anon', 'publishable']) {
      const value = (parsed as Record<string, unknown>)[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    const first = Object.values(parsed).find((value) => typeof value === 'string' && value.trim());
    return typeof first === 'string' ? first.trim() : '';
  } catch {
    return '';
  }
}

function supabaseUrl() {
  const url = env('SUPABASE_URL');
  if (!url) throw new HttpError(500, 'Missing SUPABASE_URL.');
  return url;
}

function serviceKey() {
  const key =
    env('RD_SERVICE_ROLE_KEY') ||
    env('SUPABASE_SERVICE_ROLE_KEY') ||
    env('SUPABASE_SECRET_KEY') ||
    parseKeyBag('SUPABASE_SECRET_KEYS') ||
    env('SUPABASE_ANON_KEY') ||
    parseKeyBag('SUPABASE_PUBLISHABLE_KEYS');
  if (!key) throw new HttpError(500, 'Missing Supabase service key for rd-api.');
  return key;
}

function dbClient(): DbClient {
  return createClient(supabaseUrl(), serviceKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'prod',
    },
  });
}

function awsCredentials() {
  const accessKeyId = env('AWS_ACCESS_KEY_ID');
  const secretAccessKey = env('AWS_SECRET_ACCESS_KEY');
  const sessionToken = env('AWS_SESSION_TOKEN');
  if (!accessKeyId || !secretAccessKey) return undefined;
  return {
    accessKeyId,
    secretAccessKey,
    ...(sessionToken ? { sessionToken } : {}),
  };
}

function awsRegion() {
  return env('AWS_REGION', 'ap-northeast-2');
}

function s3Client() {
  return new S3Client({
    region: awsRegion(),
    credentials: awsCredentials(),
  });
}

function lambdaClient() {
  return new LambdaClient({
    region: awsRegion(),
    credentials: awsCredentials(),
  });
}

function allowedOrigin(origin: string | null) {
  if (!origin) return '';
  const configured = env('CORS_ALLOWED_ORIGINS')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const origins = configured.length ? configured : DEFAULT_CORS_ORIGINS;
  if (origins.includes(origin)) return origin;
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return origin;
  return '';
}

function corsHeaders(req: Request) {
  const origin = allowedOrigin(req.headers.get('origin'));
  return {
    ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Requested-With, X-Guest-Id',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Max-Age': '3600',
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function errorResponse(req: Request, error: unknown) {
  const status = error instanceof HttpError ? error.status : 500;
  const message = error instanceof Error ? error.message : 'Unknown error';
  return json(req, { message, code: status }, status);
}

function normalizePath(url: URL) {
  const segments = url.pathname.split('/').filter(Boolean);
  const functionIndex = segments.lastIndexOf(FUNCTION_NAME);
  if (functionIndex >= 0) {
    return `/${segments.slice(functionIndex + 1).join('/')}`.replace(/\/$/, '') || '/';
  }
  return url.pathname.replace(/\/$/, '') || '/';
}

function bearerToken(req: Request) {
  const header = req.headers.get('Authorization') || req.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function sanitizeHtml(value: string) {
  return value
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*\/?\s*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, '');
}

function extractCategory(html: string) {
  const lower = html.toLowerCase();
  if (lower.includes('<h1')) return 'heading';
  if (lower.includes('<p')) return 'paragraph';
  if (lower.includes('<table')) return 'table';
  return 'unknown';
}

function iso(value: string | null | undefined) {
  return value ? new Date(value).toISOString() : new Date().toISOString();
}

function nullToBlank(value: string | null | undefined) {
  return value?.trim() || '';
}

function analysisStatus(processStatus: string | null | undefined) {
  if (processStatus === 'IN_PROGRESS') return 'in_progress';
  if (processStatus === 'COMPLETED') return 'completed';
  if (!processStatus) return 'not_started';
  return 'failed';
}

function warnLevel(toxic: ToxicClauseRow) {
  return toxic.warn_level ?? 1;
}

function pageNumber(url: URL) {
  const raw = Number(url.searchParams.get('page') ?? '0');
  return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 0;
}

function pageSize(url: URL) {
  const raw = Number(url.searchParams.get('size') ?? '20');
  if (!Number.isFinite(raw)) return 20;
  return Math.max(1, Math.min(Math.floor(raw), 100));
}

function toPage<T>(content: T[], page: number, size: number, total: number) {
  return {
    content,
    number: page,
    size,
    totalElements: total,
    totalPages: Math.ceil(total / size),
  };
}

function throwDb(error: { message?: string } | null | undefined) {
  if (error) throw new HttpError(500, error.message || 'Database error');
}

async function resolveScope(req: Request, db: DbClient): Promise<Scope> {
  const token = bearerToken(req);
  if (token && token.includes('.')) {
    const { data, error } = await db.auth.getUser(token);
    if (error) throw new HttpError(401, 'Invalid Supabase access token.');
    if (data.user) {
      return { user: await upsertUser(db, data.user), guestSessionId: null };
    }
  }

  const guestSessionId = req.headers.get('X-Guest-Id')?.trim() || null;
  return { user: null, guestSessionId };
}

async function upsertUser(db: DbClient, authUser: AuthUser): Promise<DbUser> {
  const email = authUser.email?.trim();
  if (!email) throw new HttpError(401, 'Authenticated user has no email.');

  const metadata = authUser.user_metadata || {};
  const appMetadata = authUser.app_metadata || {};
  const name =
    String(metadata.full_name || metadata.name || metadata.preferred_username || email.split('@')[0] || '').trim();
  const picture = String(metadata.avatar_url || metadata.picture || '').trim();
  const provider = String(appMetadata.provider || 'supabase').trim();

  const { data, error } = await db
    .from('users')
    .upsert(
      {
        auth_user_id: authUser.id,
        email,
        name,
        picture,
        provider,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'auth_user_id' },
    )
    .select('*')
    .single();
  throwDb(error);
  return data as DbUser;
}

function scopeFilter(scope: Scope) {
  if (scope.user) return { column: 'user_id', value: scope.user.id };
  if (scope.guestSessionId) return { column: 'guest_session_id', value: scope.guestSessionId };
  return null;
}

async function accessibleContracts(db: DbClient, scope: Scope, page?: number, size?: number) {
  const filter = scopeFilter(scope);
  if (!filter) return { rows: [] as ContractRow[], count: 0 };

  let query = db
    .from('contracts')
    .select('*', { count: 'exact' })
    .eq(filter.column, filter.value)
    .order('created_at', { ascending: false });

  if (page !== undefined && size !== undefined) {
    query = query.range(page * size, page * size + size - 1);
  }

  const { data, error, count } = await query;
  throwDb(error);
  return { rows: (data || []) as ContractRow[], count: count || 0 };
}

async function loadAccessibleContract(db: DbClient, scope: Scope, contractId: string) {
  const { data, error } = await db.from('contracts').select('*').eq('id', contractId).maybeSingle();
  throwDb(error);
  const contract = data as ContractRow | null;
  if (!contract) throw new HttpError(404, `Contract not found: ${contractId}`);

  if (contract.user_id !== null && contract.user_id !== undefined) {
    if (scope.user?.id === contract.user_id) return contract;
    throw new HttpError(404, `Contract not found: ${contractId}`);
  }

  if (hasText(contract.guest_session_id)) {
    if (scope.guestSessionId === contract.guest_session_id) return contract;
    throw new HttpError(404, `Contract not found: ${contractId}`);
  }

  return contract;
}

async function latestAnalysis(db: DbClient, contractId: string) {
  const { data, error } = await db
    .from('contract_analyses')
    .select('*')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  throwDb(error);
  return data as AnalysisRow | null;
}

async function toxicClauses(db: DbClient, analysisId: string) {
  const { data, error } = await db
    .from('toxic_clauses')
    .select('*')
    .eq('analysis_id', analysisId)
    .order('created_at', { ascending: true });
  throwDb(error);
  return (data || []) as ToxicClauseRow[];
}

async function ocrContents(db: DbClient, contractId: string) {
  const { data, error } = await db
    .from('ocr_content')
    .select('*')
    .eq('contract_id', contractId)
    .order('tag_idx', { ascending: true });
  throwDb(error);
  return (data || []) as OcrContentRow[];
}

async function contractSummary(db: DbClient, contract: ContractRow) {
  const analysis = await latestAnalysis(db, contract.id);
  if (!analysis) {
    return {
      contractId: contract.id,
      analysisId: null,
      title: nullToBlank(contract.title),
      contractType: nullToBlank(contract.contract_type),
      createdAt: iso(contract.created_at),
      analysisStatus: 'not_started',
      toxicCount: 0,
      highRiskCount: 0,
      mediumRiskCount: 0,
      lowRiskCount: 0,
      maxWarnLevel: 0,
    };
  }

  const toxics = await toxicClauses(db, analysis.id);
  const high = toxics.filter((toxic) => warnLevel(toxic) >= 3).length;
  const medium = toxics.filter((toxic) => warnLevel(toxic) === 2).length;
  const low = toxics.filter((toxic) => warnLevel(toxic) <= 1).length;
  const maxWarnLevel = toxics.reduce((max, toxic) => Math.max(max, warnLevel(toxic)), 0);

  return {
    contractId: contract.id,
    analysisId: analysis.id,
    title: nullToBlank(contract.title),
    contractType: nullToBlank(contract.contract_type),
    createdAt: iso(contract.created_at),
    analysisStatus: analysisStatus(analysis.process_status),
    toxicCount: toxics.length,
    highRiskCount: high,
    mediumRiskCount: medium,
    lowRiskCount: low,
    maxWarnLevel,
  };
}

async function bookmarkTipIds(db: DbClient, scope: Scope, tipIds: number[]) {
  if (tipIds.length === 0) return new Set<number>();

  let query = db.from('legal_tip_bookmarks').select('tip_id').in('tip_id', tipIds);
  if (scope.user) {
    query = query.eq('user_id', scope.user.id);
  } else if (scope.guestSessionId) {
    query = query.eq('guest_session_id', scope.guestSessionId);
  } else {
    return new Set<number>();
  }

  const { data, error } = await query;
  throwDb(error);
  return new Set((data || []).map((row: { tip_id: number }) => row.tip_id));
}

function tipResponse(tip: LegalTipRow, bookmarked: boolean) {
  return {
    id: tip.id,
    category: tip.category,
    question: tip.question,
    summary: nullToBlank(tip.summary),
    answer: tip.answer,
    sourceUrl: nullToBlank(tip.source_url),
    viewCount: tip.view_count ?? 0,
    bookmarked,
  };
}

async function countBookmarks(db: DbClient, scope: Scope) {
  if (!scope.user && !scope.guestSessionId) return 0;
  let query = db.from('legal_tip_bookmarks').select('id', { count: 'exact', head: true });
  if (scope.user) query = query.eq('user_id', scope.user.id);
  if (scope.guestSessionId) query = query.eq('guest_session_id', scope.guestSessionId);
  const { error, count } = await query;
  throwDb(error);
  return count || 0;
}

async function uploadToS3(key: string, file: File) {
  const bucket = env('AWS_S3_BUCKET');
  if (!bucket) throw new HttpError(500, 'Missing AWS_S3_BUCKET.');
  const body = new Uint8Array(await file.arrayBuffer());
  await s3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: file.type || 'application/octet-stream',
    }),
  );
  return bucket;
}

async function invokeLambda(functionName: string, payload: JsonObject, invocationType: 'RequestResponse' | 'Event') {
  if (!functionName) throw new HttpError(500, 'Missing Lambda function name.');
  const response = await lambdaClient().send(
    new InvokeCommand({
      FunctionName: functionName,
      InvocationType: invocationType,
      Payload: textEncoder.encode(JSON.stringify(payload)),
    }),
  );

  if (response.FunctionError) {
    const details = response.Payload ? textDecoder.decode(response.Payload) : response.FunctionError;
    throw new HttpError(502, `Lambda function error: ${details}`);
  }

  if (invocationType === 'Event') {
    return { statusCode: response.StatusCode };
  }

  const raw = response.Payload ? textDecoder.decode(response.Payload) : '';
  return raw ? JSON.parse(raw) : {};
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function lambdaData(response: unknown): JsonObject {
  if (!response || typeof response !== 'object') return {};
  const object = response as JsonObject;
  if (object.body && typeof object.body === 'string') {
    try {
      return JSON.parse(object.body) as JsonObject;
    } catch {
      return object;
    }
  }
  return object;
}

async function handleOcrUpload(req: Request, db: DbClient, scope: Scope) {
  if (!scope.user && !scope.guestSessionId) throw new HttpError(401, 'Missing user or guest session.');

  const form = await req.formData();
  const title = String(form.get('title') || '업로드된 계약서').trim() || '업로드된 계약서';
  const contractType = String(form.get('contractType') || 'UNKNOWN').trim() || 'UNKNOWN';
  const files = [...form.getAll('files'), ...form.getAll('images')].filter((value): value is File => value instanceof File);
  if (files.length === 0) throw new HttpError(400, 'No files provided.');

  const contractId = crypto.randomUUID();
  const s3KeyPrefix = `contracts/${contractId}/ocr/`;
  const { data: contract, error } = await db
    .from('contracts')
    .insert({
      id: contractId,
      user_id: scope.user?.id ?? null,
      guest_session_id: scope.user ? null : scope.guestSessionId,
      title,
      contract_type: contractType,
      s3_key_prefix: s3KeyPrefix,
    })
    .select('*')
    .single();
  throwDb(error);

  const savedContents: OcrContentRow[] = [];
  let successfulPages = 0;
  for (let pageIdx = 0; pageIdx < files.length; pageIdx++) {
    const file = files[pageIdx];
    const safeName = (file.name || `page_${pageIdx}`).replace(/[^\w.\-가-힣]/g, '_');
    const s3Key = `${s3KeyPrefix}${pageIdx}_${safeName}`;
    const bucket = await uploadToS3(s3Key, file);
    const ocrResponse = lambdaData(
      await invokeLambda(
        env('AWS_LAMBDA_OCR_FUNCTION', 'detector_ocr_lambda'),
        { bucket, s3Bucket: bucket, s3Key, pageIdx },
        'RequestResponse',
      ),
    );

    const success = ocrResponse.success !== false;
    const data = (ocrResponse.data || {}) as JsonObject;
    const htmlArray = Array.isArray(data.html_array)
      ? data.html_array
      : Array.isArray(data.htmlArray)
        ? data.htmlArray
        : [];

    if (success && htmlArray.length > 0) {
      successfulPages += 1;
      const rows = htmlArray.map((html, elIdx) => {
        const content = sanitizeHtml(String(html || ''));
        return {
          id: crypto.randomUUID(),
          contract_id: (contract as ContractRow).id,
          content,
          category: extractCategory(content),
          tag_idx: pageIdx * 100 + elIdx,
        };
      });
      const { data: inserted, error: insertError } = await db.from('ocr_content').insert(rows).select('*');
      throwDb(insertError);
      savedContents.push(...((inserted || []) as OcrContentRow[]));
    }

    if (pageIdx + 1 < files.length) await delay(OCR_PAGE_DELAY_MS);
  }

  return {
    contractId,
    title,
    ocrStatus: savedContents.length === 0 ? 'fail' : successfulPages < files.length ? 'partial_success' : 'success',
    contents: savedContents.map((content) => ({
      id: content.id,
      category: nullToBlank(content.category),
      content: nullToBlank(content.content),
      tagIdx: content.tag_idx ?? 0,
    })),
  };
}

async function handleOcrGet(db: DbClient, scope: Scope, contractId: string) {
  const contract = await loadAccessibleContract(db, scope, contractId);
  const contents = await ocrContents(db, contractId);
  return {
    contractId,
    title: nullToBlank(contract.title),
    htmlEntire: contents.map((content) => nullToBlank(content.content)).join('\n'),
    htmlArray: contents.map((content) => ({
      id: content.id,
      category: nullToBlank(content.category),
      content: nullToBlank(content.content),
      tagIdx: content.tag_idx ?? 0,
    })),
  };
}

async function handleOcrPatch(req: Request, db: DbClient, scope: Scope, contractId: string) {
  await loadAccessibleContract(db, scope, contractId);
  const body = (await req.json()) as { id?: string; content?: string };
  if (!body.id) throw new HttpError(400, 'Missing OCR block id.');

  const { data: block, error } = await db.from('ocr_content').select('*').eq('id', body.id).maybeSingle();
  throwDb(error);
  const row = block as OcrContentRow | null;
  if (!row || row.contract_id !== contractId) throw new HttpError(404, `OCR block not found: ${body.id}`);

  const { error: updateError } = await db
    .from('ocr_content')
    .update({ content: sanitizeHtml(String(body.content || '')) })
    .eq('id', body.id);
  throwDb(updateError);
  return handleOcrGet(db, scope, contractId);
}

async function handleAnalysisStart(req: Request, db: DbClient, scope: Scope) {
  const body = (await req.json()) as { contractId?: string };
  const contractId = body.contractId?.trim();
  if (!contractId) throw new HttpError(400, 'Missing contractId.');

  await loadAccessibleContract(db, scope, contractId);

  const { data: existing, error: existingError } = await db
    .from('contract_analyses')
    .select('*')
    .eq('contract_id', contractId)
    .eq('process_status', 'IN_PROGRESS')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  throwDb(existingError);
  if (existing) return { analysisId: (existing as AnalysisRow).id };

  const analysisId = crypto.randomUUID();
  const { error: insertError } = await db.from('contract_analyses').insert({
    id: analysisId,
    contract_id: contractId,
    status: 'success',
    process_status: 'IN_PROGRESS',
  });
  throwDb(insertError);

  const contents = await ocrContents(db, contractId);
  const byPage = new Map<number, string[]>();
  for (const content of contents) {
    const page = Math.floor((content.tag_idx ?? 0) / 100);
    byPage.set(page, [...(byPage.get(page) || []), nullToBlank(content.content)]);
  }
  const contractTexts = [...byPage.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, pageContents]) => pageContents.join('\n'));

  try {
    await invokeLambda(
      env('AWS_LAMBDA_ANALYSIS_FUNCTION', 'detector_bedrock_lambda'),
      { contractId, analysisId, contractTexts },
      'Event',
    );
  } catch (error) {
    await db
      .from('contract_analyses')
      .update({ status: 'error', process_status: 'FAILED', updated_at: new Date().toISOString() })
      .eq('id', analysisId);
    throw error;
  }

  return { analysisId };
}

async function handleAnalysisGet(db: DbClient, scope: Scope, analysisId: string) {
  const { data, error } = await db.from('contract_analyses').select('*').eq('id', analysisId).maybeSingle();
  throwDb(error);
  const analysis = data as AnalysisRow | null;
  if (!analysis) throw new HttpError(404, `Analysis not found: ${analysisId}`);

  const contract = await loadAccessibleContract(db, scope, analysis.contract_id);
  const [toxics, contents] = await Promise.all([toxicClauses(db, analysisId), ocrContents(db, contract.id)]);
  return {
    originContent: contents.map((content) => nullToBlank(content.content)).join('\n'),
    contractId: contract.id,
    analysisId: analysis.id,
    title: nullToBlank(contract.title),
    contractType: nullToBlank(contract.contract_type),
    createdAt: iso(contract.created_at),
    summary: analysis.summary,
    analysisStatus: analysisStatus(analysis.process_status),
    toxicCount: toxics.length,
    ocrBlocks: contents.map((content) => ({
      id: content.id,
      category: nullToBlank(content.category),
      content: nullToBlank(content.content),
      tagIdx: content.tag_idx ?? 0,
    })),
    toxics: toxics.map((toxic) => ({
      title: nullToBlank(toxic.title),
      clause: nullToBlank(toxic.clause),
      reason: nullToBlank(toxic.reason),
      reasonReference: nullToBlank(toxic.reason_reference),
      suggestion: nullToBlank(toxic.suggestion),
      sourceContractTagIdx: toxic.source_contract_tag_idx ?? undefined,
      warnLevel: toxic.warn_level ?? 1,
    })),
    riskdetectorCommentary: {
      overallComment: nullToBlank(analysis.riskdetector_overall_comment),
      warningComment: nullToBlank(analysis.riskdetector_warning_comment),
      advice: nullToBlank(analysis.riskdetector_advice),
    },
  };
}

async function handleContractsList(db: DbClient, scope: Scope, url: URL) {
  const page = pageNumber(url);
  const size = pageSize(url);
  const { rows, count } = await accessibleContracts(db, scope, page, size);
  const content = await Promise.all(rows.map((contract) => contractSummary(db, contract)));
  return toPage(content, page, size, count);
}

async function handleContractGet(db: DbClient, scope: Scope, contractId: string) {
  const contract = await loadAccessibleContract(db, scope, contractId);
  return contractSummary(db, contract);
}

async function handleDashboard(db: DbClient, scope: Scope) {
  const { rows, count } = await accessibleContracts(db, scope);
  const summaries = await Promise.all(rows.map((contract) => contractSummary(db, contract)));
  const recentContracts = summaries.slice(0, 5);

  const { data: featuredData, error: featuredError } = await db
    .from('legal_tips')
    .select('*')
    .order('view_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(5);
  throwDb(featuredError);
  const featuredTips = (featuredData || []) as LegalTipRow[];
  const bookmarked = await bookmarkTipIds(db, scope, featuredTips.map((tip) => tip.id));

  return {
    user: scope.user
      ? {
          name: scope.user.name || scope.user.email,
          email: scope.user.email,
          picture: scope.user.picture || null,
          guest: false,
        }
      : { name: '게스트', email: null, picture: null, guest: true },
    stats: {
      totalContracts: count,
      completedAnalyses: summaries.filter((summary) => summary.analysisStatus === 'completed').length,
      bookmarkCount: await countBookmarks(db, scope),
      highRiskContracts: summaries.filter((summary) => summary.maxWarnLevel >= 3).length,
    },
    recentContracts,
    featuredTips: featuredTips.map((tip) => tipResponse(tip, bookmarked.has(tip.id))),
  };
}

async function handleTipCategories(db: DbClient) {
  const { data, error } = await db.from('legal_tips').select('category').order('category', { ascending: true });
  throwDb(error);
  return [...new Set((data || []).map((row: { category: string }) => row.category).filter(Boolean))];
}

function cleanPostgrestSearch(value: string) {
  return value.trim().replace(/[,%]/g, ' ');
}

async function handleTipsList(db: DbClient, scope: Scope, url: URL) {
  const page = pageNumber(url);
  const size = pageSize(url);
  const category = cleanPostgrestSearch(url.searchParams.get('category') || '');
  const q = cleanPostgrestSearch(url.searchParams.get('q') || '');

  let query = db.from('legal_tips').select('*', { count: 'exact' });
  if (category) query = query.ilike('category', `%${category}%`);
  if (q) query = query.or(`question.ilike.%${q}%,answer.ilike.%${q}%`);

  const { data, error, count } = await query
    .order('view_count', { ascending: false })
    .order('created_at', { ascending: false })
    .range(page * size, page * size + size - 1);
  throwDb(error);

  const tips = (data || []) as LegalTipRow[];
  const bookmarked = await bookmarkTipIds(db, scope, tips.map((tip) => tip.id));
  return toPage(
    tips.map((tip) => tipResponse(tip, bookmarked.has(tip.id))),
    page,
    size,
    count || 0,
  );
}

async function handleTipGet(db: DbClient, scope: Scope, tipId: number) {
  const { data, error } = await db.from('legal_tips').select('*').eq('id', tipId).maybeSingle();
  throwDb(error);
  const tip = data as LegalTipRow | null;
  if (!tip) throw new HttpError(404, `Legal tip not found: ${tipId}`);

  const nextViewCount = (tip.view_count ?? 0) + 1;
  await db.from('legal_tips').update({ view_count: nextViewCount, updated_at: new Date().toISOString() }).eq('id', tipId);
  const bookmarked = await bookmarkTipIds(db, scope, [tipId]);
  return tipResponse({ ...tip, view_count: nextViewCount }, bookmarked.has(tipId));
}

async function bookmarkExists(db: DbClient, scope: Scope, tipId: number) {
  let query = db.from('legal_tip_bookmarks').select('id').eq('tip_id', tipId).limit(1);
  if (scope.user) query = query.eq('user_id', scope.user.id);
  else if (scope.guestSessionId) query = query.eq('guest_session_id', scope.guestSessionId);
  else return false;
  const { data, error } = await query.maybeSingle();
  throwDb(error);
  return Boolean(data);
}

async function handleBookmark(req: Request, db: DbClient, scope: Scope, tipId: number) {
  if (!scope.user && !scope.guestSessionId) throw new HttpError(401, 'Missing user or guest session.');

  const { data: tipData, error: tipError } = await db.from('legal_tips').select('*').eq('id', tipId).maybeSingle();
  throwDb(tipError);
  if (!tipData) throw new HttpError(404, `Legal tip not found: ${tipId}`);

  if (req.method === 'POST') {
    if (!(await bookmarkExists(db, scope, tipId))) {
      const { error } = await db.from('legal_tip_bookmarks').insert({
        tip_id: tipId,
        user_id: scope.user?.id ?? null,
        guest_session_id: scope.user ? null : scope.guestSessionId,
      });
      throwDb(error);
    }
  } else if (req.method === 'DELETE') {
    let query = db.from('legal_tip_bookmarks').delete().eq('tip_id', tipId);
    if (scope.user) query = query.eq('user_id', scope.user.id);
    else query = query.eq('guest_session_id', scope.guestSessionId);
    const { error } = await query;
    throwDb(error);
  }

  return tipResponse(tipData as LegalTipRow, req.method === 'POST');
}

async function handleAuthMe(scope: Scope) {
  if (!scope.user) {
    return { email: '', name: '게스트', picture: '', guest: true };
  }
  return {
    email: scope.user.email,
    name: scope.user.name || scope.user.email,
    picture: scope.user.picture || '',
    guest: false,
  };
}

async function handleChatbotRetrieve(req: Request) {
  const body = (await req.json()) as { query?: string; contractType?: string; topK?: number };
  const query = body.query?.trim();
  if (!query) return { success: false, error: 'Missing query.', results: [] };

  const topK = body.topK == null ? undefined : Math.max(1, Math.min(Number(body.topK), 10));
  const response = await invokeLambda(
    env('AWS_LAMBDA_ANALYSIS_FUNCTION', 'detector_bedrock_lambda'),
    {
      mode: 'retrieve',
      retrievalQuery: query,
      contractType: body.contractType?.trim() || undefined,
      topK,
    },
    'RequestResponse',
  );
  return lambdaData(response);
}

async function route(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  const db = dbClient();
  const url = new URL(req.url);
  const path = normalizePath(url);
  const scope = await resolveScope(req, db);

  if (req.method === 'GET' && path === '/auth/me') return handleAuthMe(scope);
  if (req.method === 'POST' && path === '/auth/logout') return {};

  if (req.method === 'POST' && path === '/ocr/upload') return handleOcrUpload(req, db, scope);
  const ocrMatch = path.match(/^\/ocr\/([^/]+)$/);
  if (ocrMatch && req.method === 'GET') return handleOcrGet(db, scope, decodeURIComponent(ocrMatch[1]));
  if (ocrMatch && req.method === 'PATCH') return handleOcrPatch(req, db, scope, decodeURIComponent(ocrMatch[1]));

  if (req.method === 'POST' && path === '/analysis') return handleAnalysisStart(req, db, scope);
  const analysisMatch = path.match(/^\/analysis\/([^/]+)$/);
  if (analysisMatch && req.method === 'GET') return handleAnalysisGet(db, scope, decodeURIComponent(analysisMatch[1]));

  if (req.method === 'GET' && path === '/contracts') return handleContractsList(db, scope, url);
  const contractMatch = path.match(/^\/contracts\/([^/]+)$/);
  if (contractMatch && req.method === 'GET') return handleContractGet(db, scope, decodeURIComponent(contractMatch[1]));

  if (req.method === 'GET' && path === '/dashboard') return handleDashboard(db, scope);

  if (req.method === 'GET' && path === '/tips/categories') return handleTipCategories(db);
  if (req.method === 'GET' && path === '/tips') return handleTipsList(db, scope, url);
  const bookmarkMatch = path.match(/^\/tips\/(\d+)\/bookmark$/);
  if (bookmarkMatch && (req.method === 'POST' || req.method === 'DELETE')) {
    return handleBookmark(req, db, scope, Number(bookmarkMatch[1]));
  }
  const tipMatch = path.match(/^\/tips\/(\d+)$/);
  if (tipMatch && req.method === 'GET') return handleTipGet(db, scope, Number(tipMatch[1]));

  if (req.method === 'POST' && path === '/chatbot/retrieve') return handleChatbotRetrieve(req);

  throw new HttpError(404, `Route not found: ${req.method} ${path}`);
}

Deno.serve(async (req) => {
  try {
    return json(req, await route(req));
  } catch (error) {
    console.error(error);
    return errorResponse(req, error);
  }
});
