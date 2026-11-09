import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the actual fetch function without credentials, network, or writing generated pages.
const source = fs.readFileSync(new URL('../fetch_and_build.mjs', import.meta.url), 'utf8');
const fetchSource = source.slice(source.indexOf('async function fetchAllArticles()'), source.indexOf('async function fetchAllSpeakers()'));

test('CMS article content survives fetching, pagination and slug normalization', async () => {
  const originals = ['Starboard', 'price', 'another-article'].map((slug, i) => ({
    id: 'cms-' + i, slug, title: 'CMS updated title ' + i,
    body: '<p>New CMS article ' + i + '</p>', description: 'CMS description ' + i,
    revisedAt: '2026-11-09T01:00:00.000Z', updatedAt: '2026-11-09T02:00:00.000Z',
  }));
  const input = originals.map(x => ({ ...x }));
  input[2].slug = ' another-article ';
  const offsets = [];
  const client = { get: async ({ queries }) => {
    offsets.push(queries.offset);
    return { contents: input.slice(queries.offset, queries.offset + 2), totalCount: input.length };
  }};
  const actual = await vm.runInNewContext(`(async () => { ${fetchSource}; return fetchAllArticles(); })()`, {
    client, console: { log() {}, warn() {}, error() {} }, Date,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(actual)), originals);
  assert.deepEqual(offsets, [0, 2]);
  assert.equal(input[2].slug, ' another-article ');
});
