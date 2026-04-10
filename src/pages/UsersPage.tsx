import { getUsers, addUser, deleteUser } from '@/lib/store';
import { ROLE_LABELS, type Role } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function UsersPage() {
  const [users, setUsers] = useState(getUsers());
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'requester' as Role, department: '' });

  const handleAdd = () => {
    if (!form.name || !form.email) return;
    const u = { id: crypto.randomUUID(), ...form };
    addUser(u);
    setUsers(getUsers());
    setForm({ name: '', email: '', role: 'requester', department: '' });
    setShowAdd(false);
    toast.success('User added');
  };

  const handleDelete = (id: string) => {
    deleteUser(id);
    setUsers(getUsers());
    toast.success('User removed');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">User Management</h1>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}><Plus className="h-4 w-4 mr-1" /> Add User</Button>
      </div>

      {showAdd && (
        <div className="bg-card rounded-xl border border-border p-5 grid grid-cols-2 md:grid-cols-5 gap-3 animate-fade-in">
          <Input placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as Role }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Department" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
          <Button onClick={handleAdd}>Add</Button>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Department</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent text-accent-foreground">
                    {ROLE_LABELS[u.role]}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.department}</td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(u.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
