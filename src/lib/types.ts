export type Role =
  | 'admin'
  | 'requester'
  | 'procurement_officer'
  | 'tec_member'
  | 'commercial_reviewer'
  | 'cst_reviewer'
  | 'approver'
  | 'receipt_officer'
  | 'finance_officer';

export type Stage =
  | 'MPR'
  | 'Tender'
  | 'TEC'
  | 'Comm.'
  | 'CST'
  | 'Approval'
  | 'PO'
  | 'Receipt'
  | 'Payment';

export const STAGES: Stage[] = [
  'MPR', 'Tender', 'TEC', 'Comm.', 'CST', 'Approval', 'PO', 'Receipt', 'Payment',
];

export const STAGE_COLORS: Record<Stage, string> = {
  'MPR': 'bg-stage-mpr',
  'Tender': 'bg-stage-tender',
  'TEC': 'bg-stage-tec',
  'Comm.': 'bg-stage-comm',
  'CST': 'bg-stage-cst',
  'Approval': 'bg-stage-approval',
  'PO': 'bg-stage-po',
  'Receipt': 'bg-stage-receipt',
  'Payment': 'bg-stage-payment',
};

export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type CaseStatus = 'active' | 'completed' | 'on_hold' | 'rejected';
export type DocumentType =
  | 'MPR Form'
  | 'Tender Notice'
  | 'Technical Evaluation'
  | 'Commercial Comparison'
  | 'CST Document'
  | 'Approval Note'
  | 'Purchase Order'
  | 'Receipt Note'
  | 'Invoice'
  | 'Payment Voucher'
  | 'Other';
export type Decision = 'approved' | 'rejected' | 'sent_back';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  avatar?: string;
}

export interface ProcurementCase {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  department: string;
  requesterId: string;
  vendorName: string;
  estimatedValue: number;
  currency: string;
  currentStage: Stage;
  priority: Priority;
  status: CaseStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  caseId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  documentType: DocumentType;
  uploadedById: string;
  ocrText?: string;
  extractionJson?: Record<string, unknown>;
  extractionConfidence?: number;
  aiSummary?: string;
  version: number;
  createdAt: string;
}

export interface Approval {
  id: string;
  caseId: string;
  stage: Stage;
  approverId: string;
  decision: Decision;
  comments: string;
  decidedAt: string;
  version: number;
}

export interface WorkflowEvent {
  id: string;
  caseId: string;
  actorId: string;
  action: string;
  fromStage?: Stage;
  toStage?: Stage;
  notes: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  caseId: string;
  userId: string;
  message: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  caseId: string;
  stage: Stage;
  itemName: string;
  isRequired: boolean;
  isPresent: boolean;
  remarks?: string;
}

export interface AppSetting {
  key: string;
  value: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  requester: 'Requester',
  procurement_officer: 'Procurement Officer',
  tec_member: 'TEC Committee Member',
  commercial_reviewer: 'Commercial Reviewer',
  cst_reviewer: 'CST Reviewer',
  approver: 'Approver',
  receipt_officer: 'Store/Receipt Officer',
  finance_officer: 'Finance/Payment Officer',
};

export const STAGE_REQUIRED_DOCS: Record<Stage, string[]> = {
  'MPR': ['Request Form', 'Budget Note'],
  'Tender': ['Tender Document', 'Bidder List'],
  'TEC': ['Technical Evaluation Report'],
  'Comm.': ['Commercial Comparison'],
  'CST': ['CST Review Document'],
  'Approval': ['Approval Memo / Signoff'],
  'PO': ['Purchase Order'],
  'Receipt': ['Receipt / GRN'],
  'Payment': ['Invoice', 'Receipt Confirmation', 'Payment Voucher'],
};
