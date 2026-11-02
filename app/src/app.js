const express = require('express');
const os = require('os');
const path = require('path');
const { createStore, seed } = require('./store');

function createApp({ withSeed = true } = {}) {
  const app = express();
  const store = createStore();
  if (withSeed) seed(store);

  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // Info used by the frontend header/footer (shows which version & pod served the page)
  app.get('/api/info', (req, res) => {
    res.json({
      appName: 'DYPIU Student Hub',
      banner: process.env.BANNER_MESSAGE || 'Student Information System',
      version: process.env.APP_VERSION || 'dev',
      pod: os.hostname(),
      departments: store.DEPARTMENTS,
    });
  });

  // Feature 1: list / search / filter students
  app.get('/api/students', (req, res) => {
    res.json(store.list({ q: req.query.q || '', department: req.query.department || '' }));
  });

  app.get('/api/students/:id', (req, res) => {
    const s = store.get(req.params.id);
    return s ? res.json(s) : res.status(404).json({ error: 'student not found' });
  });

  // Feature 2: register a student
  app.post('/api/students', (req, res) => {
    const { student, errors } = store.add(req.body || {});
    return errors ? res.status(400).json({ errors }) : res.status(201).json(student);
  });

  // Feature 3: update (e.g. promote to next year) and delete
  app.put('/api/students/:id', (req, res) => {
    const { student, errors, notFound } = store.update(req.params.id, req.body || {});
    if (notFound) return res.status(404).json({ error: 'student not found' });
    return errors ? res.status(400).json({ errors }) : res.json(student);
  });

  app.delete('/api/students/:id', (req, res) => {
    return store.remove(req.params.id) ? res.status(204).end() : res.status(404).json({ error: 'student not found' });
  });

  // Feature 4: dashboard statistics
  app.get('/api/stats', (req, res) => res.json(store.stats()));

  // Kubernetes probes
  app.get('/health/live', (req, res) => res.json({ status: 'alive' }));
  app.get('/health/ready', (req, res) => res.json({ status: 'ready', version: process.env.APP_VERSION || 'dev' }));

  return app;
}

module.exports = { createApp };
