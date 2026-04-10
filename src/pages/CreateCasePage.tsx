import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { addCase, addEvent } from '@/lib/store';
import type { ProcurementCase, Priority } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CreateCasePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    department: user?.department || '',
    vendorName: '',
    estimatedValue: '',
    priority: 'medium' as Priority,
    dueDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const id = crypto.randomUUID();
    const caseNumber = `MPR-2025-${String(Math.floor(Math.random() * 900) + 100)}`;
    const now = new Date().toISOString();
    const newCase: ProcurementCase = {
      id,
      caseNumber,
      title: form.title,
      description: form.description,
      department: form.department,
      requesterId: user.id,
      vendorName: form.vendorName,
      estimatedValue: Number(form.estimatedValue),
      currency: 'INR',
      currentStage: 'MPR',
      priority: form.priority,
      status: 'active',
      dueDate: form.dueDate || now,
      createdAt: now,
      updatedAt: now,
    };
    addCase(newCase);
    addEvent({ id: crypto.randomUUID(), caseId: id, actorId: user.id, action: 'Created case', toStage: 'MPR', notes: 'New procurement request', createdAt: now });
    navigate(`/cases/${id}`);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-heading font-bold mb-6">Create New MPR</h1>
      <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Title</label>
          <Input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Server Infrastructure Upgrade" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Description</label>
          <Textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the procurement requirement..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Department</label>
            <Input required value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Vendor</label>
            <Input value={form.vendorName} onChange={e => setForm(f => ({ ...f, vendorName: e.target.value }))} placeholder="If known" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Estimated Value (₹)</label>
            <Input type="number" required value={form.estimatedValue} onChange={e => setForm(f => ({ ...f, estimatedValue: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Priority</label>
            <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as Priority }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Due Date</label>
            <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit">Create MPR</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/cases')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
