const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tasks';

app.use(express.json());

const Task = mongoose.model(
  'Task',
  new mongoose.Schema(
    {
      title: { type: String, required: true, trim: true, maxlength: 200 },
      done: { type: Boolean, default: false },
    },
    { timestamps: true }
  )
);

// Wrap async route handlers so errors become a clean 500 response instead of crashing the server
const wrap = (fn) => (req, res) => fn(req, res).catch((err) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'not connected' });
});

app.get('/api/tasks', wrap(async (req, res) => {
  res.json(await Task.find().sort({ createdAt: -1 }));
}));

app.post('/api/tasks', wrap(async (req, res) => {
  const title = String((req.body && req.body.title) || '').trim();
  if (!title) return res.status(400).json({ error: 'title is required' });
  res.status(201).json(await Task.create({ title }));
}));

app.patch('/api/tasks/:id', wrap(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'invalid id' });
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ error: 'not found' });
  task.done = !task.done;
  res.json(await task.save());
}));

app.delete('/api/tasks/:id', wrap(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'invalid id' });
  const result = await Task.findByIdAndDelete(req.params.id);
  if (!result) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
}));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Connect to MongoDB, retrying for a while: in Docker the database can take a few seconds to start.
async function start() {
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      // give up on each attempt after 3 seconds (the default is 30) so retries are quick
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
      console.log('Connected to MongoDB');
      break;
    } catch (err) {
      console.log(`MongoDB not ready yet (attempt ${attempt}/10): ${err.message}`);
      if (attempt === 10) throw err;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`API listening on port ${PORT}`));
}

start().catch((err) => {
  console.error('Could not start:', err.message);
  process.exit(1);
});
