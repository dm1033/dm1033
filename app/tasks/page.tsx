"use client";

import { useEffect, useState } from "react";

type Task = { id: string; title: string; completed: boolean };

const STORAGE_KEY = "task-manager:tasks";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setTasks(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, loaded]);

  function addTask(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    setTasks((prev) => [...prev, { id: crypto.randomUUID(), title: t, completed: false }]);
    setTitle("");
  }

  const toggle = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  const remove = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const done = tasks.filter((t) => t.completed).length;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-2xl font-bold text-brand-700">Task Manager</h1>
      <form onSubmit={addTask} className="mb-6 flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a new task…"
          aria-label="New task"
          className="flex-1 rounded border border-slate-300 px-3 py-2"
        />
        <button type="submit" className="rounded bg-brand-700 px-4 py-2 text-white hover:bg-brand-600">
          Add
        </button>
      </form>
      {loaded && tasks.length === 0 && <p className="text-slate-500">No tasks yet.</p>}
      <ul className="space-y-2">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-3 rounded border border-slate-200 bg-white px-3 py-2">
            <input
              type="checkbox"
              checked={t.completed}
              onChange={() => toggle(t.id)}
              aria-label={`Mark "${t.title}" completed`}
            />
            <span className={`flex-1 break-words ${t.completed ? "text-slate-400 line-through" : ""}`}>
              {t.title}
            </span>
            <button
              onClick={() => remove(t.id)}
              aria-label={`Delete "${t.title}"`}
              className="text-sm text-red-600 hover:underline"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      {tasks.length > 0 && (
        <p className="mt-4 text-sm text-slate-500">
          {done} of {tasks.length} completed
        </p>
      )}
    </div>
  );
}
