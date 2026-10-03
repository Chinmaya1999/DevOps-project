import { useEffect, useState } from 'react';

// Relative URL: the browser calls the same website address, and Nginx forwards /api to the API container.
const API = '/api/tasks';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error('Server returned ' + res.status);
      setTasks(await res.json());
      setError('');
    } catch (e) {
      setError('Could not load tasks: ' + e.message);
    }
  }

  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (res.ok) { setTitle(''); load(); } else { setError('Could not add the task'); }
  }

  async function toggle(id) { await fetch(`${API}/${id}`, { method: 'PATCH' }); load(); }
  async function remove(id) { await fetch(`${API}/${id}`, { method: 'DELETE' }); load(); }

  return (
    <div className="app">
      <h1>Tasks</h1>
      <p className="sub">React + Express + MongoDB, deployed with Docker</p>

      <form onSubmit={add}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs doing?" maxLength={200} />
        <button type="submit">Add</button>
      </form>

      {error && <p className="error">{error}</p>}

      <ul>
        {tasks.map((t) => (
          <li key={t._id} className={t.done ? 'done' : ''}>
            <span onClick={() => toggle(t._id)}>{t.title}</span>
            <button className="x" onClick={() => remove(t._id)} aria-label={`Delete ${t.title}`}>✕</button>
          </li>
        ))}
      </ul>
      {tasks.length === 0 && !error && <p className="sub">No tasks yet — add your first one!</p>}
    </div>
  );
}
