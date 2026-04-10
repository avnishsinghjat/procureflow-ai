import type { User, ProcurementCase, Document, Approval, WorkflowEvent, Comment, ChecklistItem, AppSetting, Stage } from './types';

function id() { return crypto.randomUUID(); }
function date(daysAgo: number) { const d = new Date(); d.setDate(d.getDate() - daysAgo); return d.toISOString(); }

export function seedData() {
  const users: User[] = [
    { id: 'u1', name: 'Priya Sharma', email: 'admin@procureflow.ai', role: 'admin', department: 'IT' },
    { id: 'u2', name: 'Rajesh Kumar', email: 'rajesh@procureflow.ai', role: 'requester', department: 'Operations' },
    { id: 'u3', name: 'Anita Patel', email: 'anita@procureflow.ai', role: 'procurement_officer', department: 'Procurement' },
    { id: 'u4', name: 'Vikram Singh', email: 'vikram@procureflow.ai', role: 'tec_member', department: 'Engineering' },
    { id: 'u5', name: 'Meera Joshi', email: 'meera@procureflow.ai', role: 'commercial_reviewer', department: 'Finance' },
    { id: 'u6', name: 'Arjun Reddy', email: 'arjun@procureflow.ai', role: 'cst_reviewer', department: 'Compliance' },
    { id: 'u7', name: 'Kavita Nair', email: 'kavita@procureflow.ai', role: 'approver', department: 'Management' },
    { id: 'u8', name: 'Suresh Iyer', email: 'suresh@procureflow.ai', role: 'receipt_officer', department: 'Stores' },
    { id: 'u9', name: 'Deepa Gupta', email: 'deepa@procureflow.ai', role: 'finance_officer', department: 'Finance' },
  ];

  const cases: ProcurementCase[] = [
    { id: 'c1', caseNumber: 'MPR-2025-001', title: 'Server Infrastructure Upgrade', description: 'Procurement of 10 rack servers for data center expansion', department: 'IT', requesterId: 'u2', vendorName: 'Dell Technologies', estimatedValue: 4500000, currency: 'INR', currentStage: 'TEC', priority: 'high', status: 'active', dueDate: date(-10), createdAt: date(45), updatedAt: date(2) },
    { id: 'c2', caseNumber: 'MPR-2025-002', title: 'Office Furniture Procurement', description: 'Ergonomic chairs and desks for new wing', department: 'Admin', requesterId: 'u2', vendorName: 'Godrej Interio', estimatedValue: 1200000, currency: 'INR', currentStage: 'Approval', priority: 'medium', status: 'active', dueDate: date(-5), createdAt: date(30), updatedAt: date(1) },
    { id: 'c3', caseNumber: 'MPR-2025-003', title: 'Lab Equipment – Spectrophotometer', description: 'UV-Vis spectrophotometer for quality control lab', department: 'R&D', requesterId: 'u2', vendorName: 'Shimadzu Corp', estimatedValue: 3200000, currency: 'INR', currentStage: 'MPR', priority: 'critical', status: 'active', dueDate: date(-20), createdAt: date(5), updatedAt: date(1) },
    { id: 'c4', caseNumber: 'MPR-2025-004', title: 'Annual Stationery Supply', description: 'Bulk office stationery for FY 2025-26', department: 'Admin', requesterId: 'u2', vendorName: 'Navneet Education', estimatedValue: 350000, currency: 'INR', currentStage: 'PO', priority: 'low', status: 'active', dueDate: date(-15), createdAt: date(60), updatedAt: date(3) },
    { id: 'c5', caseNumber: 'MPR-2025-005', title: 'HVAC System Maintenance Contract', description: '3-year AMC for central HVAC systems', department: 'Facilities', requesterId: 'u2', vendorName: 'Blue Star Ltd', estimatedValue: 8500000, currency: 'INR', currentStage: 'Comm.', priority: 'high', status: 'active', dueDate: date(-8), createdAt: date(40), updatedAt: date(2) },
    { id: 'c6', caseNumber: 'MPR-2024-089', title: 'Security Camera Installation', description: 'IP cameras for campus perimeter security', department: 'Security', requesterId: 'u2', vendorName: 'Hikvision', estimatedValue: 1800000, currency: 'INR', currentStage: 'Payment', priority: 'medium', status: 'active', dueDate: date(-30), createdAt: date(90), updatedAt: date(5) },
    { id: 'c7', caseNumber: 'MPR-2024-092', title: 'Employee Uniform Supply', description: 'Annual uniform procurement for factory staff', department: 'HR', requesterId: 'u2', vendorName: 'Raymond Ltd', estimatedValue: 600000, currency: 'INR', currentStage: 'Receipt', priority: 'low', status: 'active', dueDate: date(-12), createdAt: date(75), updatedAt: date(4) },
    { id: 'c8', caseNumber: 'MPR-2024-088', title: 'ERP Software License Renewal', description: 'Annual renewal of SAP licenses', department: 'IT', requesterId: 'u2', vendorName: 'SAP India', estimatedValue: 12000000, currency: 'INR', currentStage: 'Payment', priority: 'critical', status: 'completed', dueDate: date(-60), createdAt: date(120), updatedAt: date(10) },
  ];

  const documents: Document[] = [
    { id: 'd1', caseId: 'c1', fileName: 'MPR_Server_Infra.pdf', fileSize: 245000, mimeType: 'application/pdf', documentType: 'MPR Form', uploadedById: 'u2', ocrText: 'Material Purchase Request\nDate: 15-Jan-2025\nDepartment: IT\nItem: Rack Servers x10\nVendor: Dell Technologies\nEstimated Value: INR 45,00,000', extractionJson: { vendorName: 'Dell Technologies', itemName: 'Rack Servers', amount: 4500000, currency: 'INR' }, extractionConfidence: 0.92, aiSummary: 'MPR for 10 rack servers from Dell Technologies for data center expansion. Total estimated value INR 45 lakh.', version: 1, createdAt: date(44) },
    { id: 'd2', caseId: 'c1', fileName: 'Budget_Approval_IT.pdf', fileSize: 128000, mimeType: 'application/pdf', documentType: 'Other', uploadedById: 'u2', version: 1, createdAt: date(44) },
    { id: 'd3', caseId: 'c1', fileName: 'Tender_Notice_Servers.pdf', fileSize: 340000, mimeType: 'application/pdf', documentType: 'Tender Notice', uploadedById: 'u3', ocrText: 'Tender Notice No: TN-2025-0042\nLast Date: 20-Feb-2025\nItem: Enterprise Rack Servers\nEMD: INR 2,00,000', extractionConfidence: 0.88, version: 1, createdAt: date(35) },
    { id: 'd4', caseId: 'c2', fileName: 'MPR_Furniture.pdf', fileSize: 190000, mimeType: 'application/pdf', documentType: 'MPR Form', uploadedById: 'u2', extractionConfidence: 0.95, version: 1, createdAt: date(29) },
    { id: 'd5', caseId: 'c2', fileName: 'Commercial_Comparison_Furniture.xlsx', fileSize: 85000, mimeType: 'application/vnd.ms-excel', documentType: 'Commercial Comparison', uploadedById: 'u5', version: 1, createdAt: date(15) },
    { id: 'd6', caseId: 'c3', fileName: 'MPR_Spectrophotometer.pdf', fileSize: 310000, mimeType: 'application/pdf', documentType: 'MPR Form', uploadedById: 'u2', version: 1, createdAt: date(4) },
    { id: 'd7', caseId: 'c6', fileName: 'Invoice_Hikvision.pdf', fileSize: 156000, mimeType: 'application/pdf', documentType: 'Invoice', uploadedById: 'u9', extractionConfidence: 0.91, version: 1, createdAt: date(8) },
  ];

  const stageList: Stage[] = ['MPR', 'Tender', 'TEC'];
  const approvals: Approval[] = [
    { id: 'a1', caseId: 'c1', stage: 'MPR', approverId: 'u7', decision: 'approved', comments: 'Budget allocation confirmed. Proceed with tender.', decidedAt: date(40), version: 1 },
    { id: 'a2', caseId: 'c1', stage: 'Tender', approverId: 'u3', decision: 'approved', comments: 'Tender evaluation complete. 3 bids received.', decidedAt: date(25), version: 1 },
    { id: 'a3', caseId: 'c2', stage: 'MPR', approverId: 'u7', decision: 'approved', comments: 'Approved for new wing setup.', decidedAt: date(25), version: 1 },
    { id: 'a4', caseId: 'c2', stage: 'Tender', approverId: 'u3', decision: 'approved', comments: 'Godrej Interio selected.', decidedAt: date(18), version: 1 },
    { id: 'a5', caseId: 'c2', stage: 'TEC', approverId: 'u4', decision: 'approved', comments: 'Technical specs meet requirements.', decidedAt: date(14), version: 1 },
    { id: 'a6', caseId: 'c2', stage: 'Comm.', approverId: 'u5', decision: 'approved', comments: 'Best L1 price. Within budget.', decidedAt: date(10), version: 1 },
    { id: 'a7', caseId: 'c2', stage: 'CST', approverId: 'u6', decision: 'approved', comments: 'Compliance requirements met.', decidedAt: date(7), version: 1 },
  ];

  const events: WorkflowEvent[] = [
    { id: 'e1', caseId: 'c1', actorId: 'u2', action: 'Created case', fromStage: undefined, toStage: 'MPR', notes: 'New procurement request submitted', createdAt: date(45) },
    { id: 'e2', caseId: 'c1', actorId: 'u7', action: 'Stage approved', fromStage: 'MPR', toStage: 'Tender', notes: 'Budget confirmed', createdAt: date(40) },
    { id: 'e3', caseId: 'c1', actorId: 'u3', action: 'Stage approved', fromStage: 'Tender', toStage: 'TEC', notes: 'Tender closed, moving to TEC', createdAt: date(25) },
    { id: 'e4', caseId: 'c2', actorId: 'u2', action: 'Created case', fromStage: undefined, toStage: 'MPR', notes: 'Furniture procurement initiated', createdAt: date(30) },
    { id: 'e5', caseId: 'c3', actorId: 'u2', action: 'Created case', fromStage: undefined, toStage: 'MPR', notes: 'Lab equipment request', createdAt: date(5) },
    { id: 'e6', caseId: 'c6', actorId: 'u9', action: 'Document uploaded', notes: 'Invoice uploaded for payment processing', createdAt: date(8) },
  ];

  const comments: Comment[] = [
    { id: 'cm1', caseId: 'c1', userId: 'u3', message: 'Please ensure all 3 vendor quotes are attached before TEC review.', createdAt: date(26) },
    { id: 'cm2', caseId: 'c1', userId: 'u4', message: 'Dell quote looks competitive. Scheduling TEC meeting for next week.', createdAt: date(20) },
    { id: 'cm3', caseId: 'c2', userId: 'u5', message: 'Godrej quote is L1. Recommending approval.', createdAt: date(11) },
  ];

  const checklist: ChecklistItem[] = [
    { id: 'cl1', caseId: 'c1', stage: 'MPR', itemName: 'Request Form', isRequired: true, isPresent: true },
    { id: 'cl2', caseId: 'c1', stage: 'MPR', itemName: 'Budget Note', isRequired: true, isPresent: true },
    { id: 'cl3', caseId: 'c1', stage: 'Tender', itemName: 'Tender Document', isRequired: true, isPresent: true },
    { id: 'cl4', caseId: 'c1', stage: 'Tender', itemName: 'Bidder List', isRequired: true, isPresent: false },
    { id: 'cl5', caseId: 'c1', stage: 'TEC', itemName: 'Technical Evaluation Report', isRequired: true, isPresent: false },
    { id: 'cl6', caseId: 'c3', stage: 'MPR', itemName: 'Request Form', isRequired: true, isPresent: true },
    { id: 'cl7', caseId: 'c3', stage: 'MPR', itemName: 'Budget Note', isRequired: true, isPresent: false },
  ];

  const settings: AppSetting[] = [
    { key: 'openrouter_api_key', value: '' },
    { key: 'openrouter_model', value: 'meta-llama/llama-3.1-8b-instruct:free' },
    { key: 'openrouter_fallback_model', value: 'google/gemma-2-9b-it:free' },
    { key: 'company_name', value: 'ProcureFlow AI' },
  ];

  return { users, cases, documents, approvals, events, comments, checklist, settings };
}
