// Uses Node's built-in test runner + fetch (Node 20+), no extra test libraries needed.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');

let server;
let base;

before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('readiness probe responds', async () => {
  const res = await fetch(`${base}/health/ready`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, 'ready');
});

test('homepage is served', async () => {
  const res = await fetch(base);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /CampusRoll/);
});

test('lists seeded students', async () => {
  const list = await (await fetch(`${base}/api/students`)).json();
  assert.equal(list.length, 4);
});

test('registers a new student', async () => {
  const res = await fetch(`${base}/api/students`, json('POST', {
    name: 'Neha Test', rollNo: 'bca23099', email: 'neha@campus.edu', department: 'BCA', year: 3,
  }));
  assert.equal(res.status, 201);
  assert.equal((await res.json()).rollNo, 'BCA23099');
});

test('rejects invalid and duplicate students', async () => {
  let res = await fetch(`${base}/api/students`, json('POST', { name: '', rollNo: 'x', email: 'bad', department: 'Arts', year: 9 }));
  assert.equal(res.status, 400);
  assert.equal((await res.json()).errors.length, 5);
  res = await fetch(`${base}/api/students`, json('POST', {
    name: 'Copy', rollNo: 'BCA23001', email: 'c@campus.edu', department: 'BCA', year: 1,
  }));
  assert.equal(res.status, 400);
});

test('filters by department and searches by name', async () => {
  const byDept = await (await fetch(`${base}/api/students?department=BBA`)).json();
  assert.deepEqual(byDept.map((s) => s.name), ['Isha Deshmukh']);
  const byName = await (await fetch(`${base}/api/students?q=rohan`)).json();
  assert.equal(byName[0].rollNo, 'CSE22045');
});

test('promotes and deletes a student', async () => {
  const [first] = await (await fetch(`${base}/api/students?q=sneha`)).json();
  const updated = await (await fetch(`${base}/api/students/${first.id}`, json('PUT', { year: 2 }))).json();
  assert.equal(updated.year, 2);
  assert.equal((await fetch(`${base}/api/students/${first.id}`, { method: 'DELETE' })).status, 204);
  assert.equal((await fetch(`${base}/api/students/${first.id}`)).status, 404);
});

test('stats endpoint counts per department', async () => {
  const stats = await (await fetch(`${base}/api/stats`)).json();
  assert.ok(stats.total >= 4);
  assert.equal(typeof stats.byDepartment.BCA, 'number');
});
