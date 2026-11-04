export type StoredTeacher = { id: string; email: string };

const STORAGE_KEY = "haraj_teacher";

export function saveStoredTeacher(teacher: StoredTeacher) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(teacher));
}

export function readStoredTeacher(): StoredTeacher | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed?.id === "string" && typeof parsed?.email === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export function clearStoredTeacher() {
  localStorage.removeItem(STORAGE_KEY);
}
