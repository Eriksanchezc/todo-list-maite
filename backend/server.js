const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { pool, initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// GET - Listar tareas
app.get('/api/tasks', async (req, res) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM tasks';
    let params = [];
    if (search) {
      query += ' WHERE title ILIKE $1';
      params.push(`%${search}%`);
    }
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener las tareas' });
  }
});

// POST - Crear tarea
app.post('/api/tasks', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'El título es obligatorio' });
    }
    const result = await pool.query(
      'INSERT INTO tasks (title, completed) VALUES ($1, false) RETURNING *',
      [title.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear la tarea' });
  }
});

// PUT - Actualizar tarea
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;
    const existing = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    const updatedTitle = title !== undefined ? title : existing.rows[0].title;
    const updatedCompleted = completed !== undefined ? completed : existing.rows[0].completed;
    const result = await pool.query(
      'UPDATE tasks SET title = $1, completed = $2 WHERE id = $3 RETURNING *',
      [updatedTitle, updatedCompleted, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar la tarea' });
  }
});

// DELETE - Eliminar tarea
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    res.json({ message: 'Tarea eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar la tarea' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, '127.0.0.1', async () => {
  console.log(`Servidor backend corriendo en http://127.0.0.1:${PORT}`);
  await initDB();
});
