const API_URL = '/api/tasks';

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const filterInput = document.getElementById('filter-input');
const taskList = document.getElementById('task-list');
const emptyMessage = document.getElementById('empty-message');
const statusMessage = document.getElementById('status-message');

let allTasks = [];

function showStatus(msg) {
  statusMessage.textContent = msg;
  setTimeout(() => (statusMessage.textContent = ''), 3000);
}

async function fetchTasks() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Error al cargar tareas');
    allTasks = await res.json();
    renderTasks(allTasks);
  } catch (err) {
    showStatus('No se pudieron cargar las tareas.');
    console.error(err);
  }
}

function renderTasks(tasks) {
  taskList.innerHTML = '';
  emptyMessage.style.display = tasks.length === 0 ? 'block' : 'none';

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');
    li.dataset.id = task.id;
    li.innerHTML = `
      <input type="checkbox" ${task.completed ? 'checked' : ''} />
      <span class="task-title">${escapeHtml(task.title)}</span>
      <div class="task-actions">
        <button class="edit-btn" title="Editar">✏️</button>
        <button class="delete-btn" title="Eliminar">🗑️</button>
      </div>
    `;
    taskList.appendChild(li);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = taskInput.value.trim();
  if (!title) return;
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error();
    taskInput.value = '';
    await fetchTasks();
  } catch {
    showStatus('No se pudo agregar la tarea.');
  }
});

taskList.addEventListener('click', async (e) => {
  const li = e.target.closest('.task-item');
  if (!li) return;
  const id = li.dataset.id;

  if (e.target.classList.contains('delete-btn')) {
    if (!confirm('¿Eliminar esta tarea?')) return;
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      await fetchTasks();
    } catch {
      showStatus('No se pudo eliminar la tarea.');
    }
  }

  if (e.target.classList.contains('edit-btn') || e.target.classList.contains('task-title')) {
    const currentTitle = li.querySelector('.task-title').textContent;
    const newTitle = prompt('Editar tarea:', currentTitle);
    if (!newTitle || newTitle.trim() === '' || newTitle === currentTitle) return;
    try {
      await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      await fetchTasks();
    } catch {
      showStatus('No se pudo editar la tarea.');
    }
  }
});

taskList.addEventListener('change', async (e) => {
  if (e.target.type !== 'checkbox') return;
  const li = e.target.closest('.task-item');
  const id = li.dataset.id;
  try {
    await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: e.target.checked }),
    });
    await fetchTasks();
  } catch {
    showStatus('No se pudo actualizar el estado.');
  }
});

filterInput.addEventListener('input', () => {
  const term = filterInput.value.toLowerCase().trim();
  renderTasks(allTasks.filter(t => t.title.toLowerCase().includes(term)));
});

fetchTasks();
