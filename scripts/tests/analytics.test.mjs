import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../../assets/analytics.js', import.meta.url), 'utf8');
function setup(pathname = '/', referrer = '') {
  const events = [], listeners = {};
  const window = { location: new URL(pathname, 'https://kokuban-base.com'),
    gtag: (...args) => events.push(args) };
  const document = { referrer, addEventListener: (name, fn) => { listeners[name] = fn; },
    querySelector: () => null };
  const context = vm.createContext({ window, document, URL });
  vm.runInContext(source, context);
  return { events, listeners, window, context };
}

test('contact arrival uses a query-free internal referrer; duplicate initialization is ignored', () => {
  const state = setup('/contact/?email=private#message', 'https://kokuban-base.com/check/?private=true');
  assert.equal(state.events.length, 1);
  assert.equal(state.events[0][1], 'contact_view');
  assert.equal(state.events[0][2].from_path, '/check/');
  assert.equal(state.events[0][2].page_path, '/contact/');
  vm.runInContext(source, state.context);
  assert.equal(state.events.length, 1);
});

test('internal contact navigation records only paths and location; external links and anchors are ignored', () => {
  const state = setup('/lineup/');
  const click = href => state.listeners.click({ defaultPrevented: false,
    target: { closest: () => ({ href, closest: selector => selector === 'header' }) } });
  click('https://kokuban-base.com/contact/?email=private#message');
  assert.deepEqual(state.events.map(e => e[1]), ['site_navigation', 'contact_click']);
  assert.equal(state.events[0][2].from_path, '/lineup/');
  assert.equal(state.events[0][2].to_path, '/contact/');
  assert.equal(state.events[0][2].link_area, 'header');
  assert.ok(!JSON.stringify(state.events).includes('private'));
  click('https://other.example/contact/');
  click('https://kokuban-base.com/lineup/#compare');
  assert.equal(state.events.length, 2);
});

test('diagnosis view is distinct from start and free-text fields cannot enter event parameters', () => {
  const state = setup('/check/');
  assert.deepEqual(state.events.map(e => e[1]), ['check_view']);
  assert.equal(state.events[0][2].from_path, '');
  state.window.kbTrack('check_complete', { brand: 'MIRAI TOUCH', result_size: '65',
    email: 'private@example.com', message: 'private inquiry', name: 'private name' });
  assert.equal(state.events[1][2].brand, 'MIRAI TOUCH');
  assert.equal(state.events[1][2].result_size, '65');
  assert.ok(!JSON.stringify(state.events).includes('private'));
  assert.ok(!state.events.some(e => e[1] === 'page_view'));
});
