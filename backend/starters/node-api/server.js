const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Home page
app.get('/', (req, res) => {
  res.send('Hello from my Node.js app, deployed with DevOps! 🚀');
});

// Health check — used by load balancers, Docker and you (curl) to see if the app is alive
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
});

// Example API routes
app.get('/api/hello', (req, res) => {
  const name = String(req.query.name || 'world').slice(0, 50);
  res.json({ message: `Hello, ${name}!` });
});

app.get('/api/time', (req, res) => {
  res.json({ now: new Date().toISOString() });
});

// Anything else
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
