import type { Role, Stage } from './types';

/** Which routes each role can access */
const ROUTE_ACCESS: Record<string, Role[]> = {
  '/':            ['admin', 'requester', 'procurement_officer', 'tec_member', 'commercial_reviewer', 'cst_reviewer', 'approver', 'receipt_officer', 'finance_officer'],
  '/cases':       ['admin', 'requester', 'procurement_officer', 'tec_member', 'commercial_reviewer', 'cst_reviewer', 'approver', 'receipt_officer', 'finance_officer'],
  '/cases/new':   ['admin', 'requester'],
  '/cases/:id':   ['admin', 'requester', 'procurement_officer', 'tec_member', 'commercial_reviewer', 'cst_reviewer', 'approver', 'receipt_officer', 'finance_officer'],
  '/pipeline':    ['admin', 'procurement_officer', 'approver'],
  '/upload':      ['admin', 'requester', 'procurement_officer', 'receipt_officer', 'finance_officer'],
  '/ai-review':   ['admin', 'procurement_officer', 'tec_member', 'commercial_reviewer', 'cst_reviewer', 'approver'],
  '/approvals':   ['admin', 'procurement_officer', 'tec_member', 'commercial_reviewer', 'cst_reviewer', 'approver'],
  '/audit':       ['admin', 'procurement_officer', 'approver'],
  '/documents':   ['admin', 'requester', 'procurement_officer', 'tec_member', 'commercial_reviewer', 'cst_reviewer', 'approver', 'receipt_officer', 'finance_officer'],
  '/archive':     ['admin', 'requester', 'procurement_officer', 'tec_member', 'commercial_reviewer', 'cst_reviewer', 'approver', 'receipt_officer', 'finance_officer'],
  '/settings':    ['admin'],
  '/users':       ['admin'],
  '/checklists':  ['admin', 'procurement_officer'],
};

/** Check if a role has access to a given route path */
export function canAccessRoute(role: Role, path: string): boolean {
  // Exact match first
  if (ROUTE_ACCESS[path]) return ROUTE_ACCESS[path].includes(role);
  // Pattern match for /cases/:id
  if (path.startsWith('/cases/') && path !== '/cases/new') {
    return ROUTE_ACCESS['/cases/:id']?.includes(role) ?? false;
  }
  return false;
}

/** Which roles can perform stage transitions */
const STAGE_TRANSITION_ROLES: Record<Stage, Role[]> = {
  'MPR':      ['admin', 'approver', 'procurement_officer'],
  'Tender':   ['admin', 'procurement_officer'],
  'TEC':      ['admin', 'tec_member'],
  'Comm.':    ['admin', 'commercial_reviewer'],
  'CST':      ['admin', 'cst_reviewer'],
  'Approval': ['admin', 'approver'],
  'PO':       ['admin', 'procurement_officer'],
  'Receipt':  ['admin', 'receipt_officer'],
  'Payment':  ['admin', 'finance_officer'],
};

/** Check if a role can advance/approve at a given stage */
export function canTransitionStage(role: Role, stage: Stage): boolean {
  return STAGE_TRANSITION_ROLES[stage]?.includes(role) ?? false;
}

/** Check if a role can send back at a given stage */
export function canSendBack(role: Role, stage: Stage): boolean {
  return canTransitionStage(role, stage);
}

/** Check if a role can create new MPR cases */
export function canCreateCase(role: Role): boolean {
  return ['admin', 'requester'].includes(role);
}

/** Check if a role can upload documents */
export function canUploadDocuments(role: Role): boolean {
  return ['admin', 'requester', 'procurement_officer', 'receipt_officer', 'finance_officer'].includes(role);
}

/** Check if a role can manage users */
export function canManageUsers(role: Role): boolean {
  return role === 'admin';
}

/** Check if a role can modify settings */
export function canManageSettings(role: Role): boolean {
  return role === 'admin';
}

/** Get accessible nav items for a role */
export function getAccessibleNavPaths(role: Role): string[] {
  return Object.entries(ROUTE_ACCESS)
    .filter(([, roles]) => roles.includes(role))
    .map(([path]) => path);
}
