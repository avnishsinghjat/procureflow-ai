import type { User, ProcurementCase, Document, Approval, WorkflowEvent, Comment, ChecklistItem, AppSetting } from './types';
import { seedData } from './seed';

const KEYS = {
  users: 'pf_users',
  cases: 'pf_cases',
  documents: 'pf_documents',
  approvals: 'pf_approvals',
  events: 'pf_events',
  comments: 'pf_comments',
  checklist: 'pf_checklist',
  settings: 'pf_settings',
  currentUser: 'pf_current_user',
};

function get<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function set<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function initStore() {
  if (!localStorage.getItem(KEYS.users) || get<User>(KEYS.users).length === 0) {
    const seed = seedData();
    set(KEYS.users, seed.users);
    set(KEYS.cases, seed.cases);
    set(KEYS.documents, seed.documents);
    set(KEYS.approvals, seed.approvals);
    set(KEYS.events, seed.events);
    set(KEYS.comments, seed.comments);
    set(KEYS.checklist, seed.checklist);
    set(KEYS.settings, seed.settings);
  }
}

// Users
export const getUsers = () => get<User>(KEYS.users);
export const getUser = (id: string) => getUsers().find(u => u.id === id);
export const addUser = (u: User) => { const all = getUsers(); all.push(u); set(KEYS.users, all); };
export const updateUser = (u: User) => { set(KEYS.users, getUsers().map(x => x.id === u.id ? u : x)); };
export const deleteUser = (id: string) => { set(KEYS.users, getUsers().filter(x => x.id !== id)); };

// Current user (auth)
export const getCurrentUser = (): User | null => {
  const raw = localStorage.getItem(KEYS.currentUser);
  return raw ? JSON.parse(raw) : null;
};
export const setCurrentUser = (u: User | null) => {
  if (u) localStorage.setItem(KEYS.currentUser, JSON.stringify(u));
  else localStorage.removeItem(KEYS.currentUser);
};
export const login = (email: string, _password: string): User | null => {
  const user = getUsers().find(u => u.email === email);
  if (user) setCurrentUser(user);
  return user || null;
};
export const logout = () => setCurrentUser(null);

// Cases
export const getCases = () => get<ProcurementCase>(KEYS.cases);
export const getCase = (id: string) => getCases().find(c => c.id === id);
export const addCase = (c: ProcurementCase) => { const all = getCases(); all.push(c); set(KEYS.cases, all); };
export const updateCase = (c: ProcurementCase) => { set(KEYS.cases, getCases().map(x => x.id === c.id ? c : x)); };

// Documents
export const getDocuments = (caseId?: string) => {
  const all = get<Document>(KEYS.documents);
  return caseId ? all.filter(d => d.caseId === caseId) : all;
};
export const addDocument = (d: Document) => { const all = get<Document>(KEYS.documents); all.push(d); set(KEYS.documents, all); };

// Approvals
export const getApprovals = (caseId?: string) => {
  const all = get<Approval>(KEYS.approvals);
  return caseId ? all.filter(a => a.caseId === caseId) : all;
};
export const addApproval = (a: Approval) => { const all = get<Approval>(KEYS.approvals); all.push(a); set(KEYS.approvals, all); };

// Events
export const getEvents = (caseId?: string) => {
  const all = get<WorkflowEvent>(KEYS.events);
  return caseId ? all.filter(e => e.caseId === caseId) : all;
};
export const addEvent = (e: WorkflowEvent) => { const all = get<WorkflowEvent>(KEYS.events); all.push(e); set(KEYS.events, all); };

// Comments
export const getComments = (caseId?: string) => {
  const all = get<Comment>(KEYS.comments);
  return caseId ? all.filter(c => c.caseId === caseId) : all;
};
export const addComment = (c: Comment) => { const all = get<Comment>(KEYS.comments); all.push(c); set(KEYS.comments, all); };

// Checklist
export const getChecklist = (caseId?: string) => {
  const all = get<ChecklistItem>(KEYS.checklist);
  return caseId ? all.filter(c => c.caseId === caseId) : all;
};

// Settings
export const getSettings = () => get<AppSetting>(KEYS.settings);
export const getSetting = (key: string) => getSettings().find(s => s.key === key)?.value || '';
export const setSetting = (key: string, value: string) => {
  const all = getSettings().filter(s => s.key !== key);
  all.push({ key, value });
  set(KEYS.settings, all);
};
