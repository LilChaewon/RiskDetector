import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const rootDir = resolve(new URL('../..', import.meta.url).pathname);
const sourceDir = join(rootDir, 'backend_core/src/main/resources/legal-tips/easylaw-summary');
const outputPath = join(rootDir, 'supabase/seed.sql');

function between(raw, start, end) {
  const from = raw.indexOf(start);
  if (from < 0) return '';
  const bodyStart = from + start.length;
  const to = raw.indexOf(end, bodyStart);
  if (to < 0) return '';
  return raw.slice(bodyStart, to).trim();
}

function after(raw, start) {
  const from = raw.indexOf(start);
  if (from < 0) return '';
  return raw.slice(from + start.length).trim();
}

function sql(value) {
  return value == null ? 'null' : `'${String(value).replaceAll("'", "''")}'`;
}

const rows = readdirSync(sourceDir)
  .filter((name) => name.endsWith('.txt'))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map((name) => {
    const raw = readFileSync(join(sourceDir, name), 'utf8');
    return {
      sourceId: basename(name),
      question: between(raw, '질문:', '\n\n요약:'),
      summary: between(raw, '요약:', '\n\n카테고리:'),
      category: between(raw, '카테고리:', '\n\n원문URL:'),
      sourceUrl: after(raw, '원문URL:'),
    };
  })
  .filter((row) => row.question && row.summary && row.category);

const values = rows
  .map((row) => `  (${sql(row.sourceId)}, ${sql(row.category)}, ${sql(row.question)}, ${sql(row.summary)}, ${sql(row.summary)}, ${sql(row.sourceUrl)}, 0)`)
  .join(',\n');

const seed = `-- Generated from backend_core/src/main/resources/legal-tips/easylaw-summary/*.txt
-- Re-generate with: node scripts/supabase/generate_legal_tip_seed.mjs

insert into prod.legal_tips
  (source_id, category, question, summary, answer, source_url, view_count)
values
${values}
on conflict (source_id) do update set
  category = excluded.category,
  question = excluded.question,
  summary = excluded.summary,
  answer = excluded.answer,
  source_url = excluded.source_url,
  updated_at = now();
`;

mkdirSync(join(rootDir, 'supabase'), { recursive: true });
writeFileSync(outputPath, seed, 'utf8');
console.log(`Wrote ${rows.length} legal tips to ${outputPath}`);

