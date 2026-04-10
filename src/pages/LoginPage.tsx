import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PipelineRibbon } from '@/components/PipelineRibbon';
import { Brain, Shield, Zap, FileSearch, GitBranch, BarChart3 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@procureflow.ai');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = login(email, password);
    if (user) navigate('/');
    else setError('Invalid credentials. Try admin@procureflow.ai');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-5xl text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-heading font-bold text-xl">PF</div>
            <h1 className="text-4xl font-heading font-bold">ProcureFlow AI</h1>
          </div>
          <p className="text-xl font-heading font-semibold text-foreground mb-2">Procurement workflow becomes AI-native</p>
          <p className="text-muted-foreground">Paperless lifecycle from request to payment documentation</p>

          {/* Pipeline preview */}
          <div className="max-w-3xl mx-auto mt-8">
            <PipelineRibbon />
          </div>
        </div>

        {/* Feature cards */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          <div className="bg-card border border-border rounded-xl p-6 animate-fade-in">
            <Brain className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-heading font-semibold mb-2">AI Automation at Each Stage</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• OCR scanned files</li>
              <li>• Extract vendor/item/date/value fields</li>
              <li>• Auto-classify document type</li>
              <li>• Detect missing attachments</li>
              <li>• Generate draft stage-wise formats</li>
            </ul>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <GitBranch className="h-8 w-8 text-secondary mb-3" />
            <h3 className="font-heading font-semibold mb-2">Workflow Controls</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Digital concurrence</li>
              <li>• Role-based routing</li>
              <li>• Versioned approvals</li>
              <li>• Signature validation</li>
              <li>• Escalation and tracking</li>
            </ul>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <BarChart3 className="h-8 w-8 text-stage-approval mb-3" />
            <h3 className="font-heading font-semibold mb-2">Business Outcome</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Faster cycle time</li>
              <li>• Less manual handling</li>
              <li>• Better traceability</li>
              <li>• Controlled access</li>
              <li>• Searchable archive</li>
            </ul>
          </div>
        </div>

        {/* Login form */}
        <div className="w-full max-w-lg">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="font-heading font-semibold text-lg mb-4 text-center">Sign In</h2>
            <form onSubmit={handleLogin} className="space-y-3">
              <Input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              <Input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" className="w-full">Sign In</Button>
            </form>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-[10px] text-muted-foreground mb-2 text-center font-medium uppercase tracking-wide">Demo accounts (any password)</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { email: 'admin@procureflow.ai', role: 'Admin' },
                  { email: 'rajesh@procureflow.ai', role: 'Requester' },
                  { email: 'anita@procureflow.ai', role: 'Procurement Officer' },
                  { email: 'vikram@procureflow.ai', role: 'TEC Member' },
                  { email: 'meera@procureflow.ai', role: 'Commercial Reviewer' },
                  { email: 'arjun@procureflow.ai', role: 'CST Reviewer' },
                  { email: 'kavita@procureflow.ai', role: 'Approver' },
                  { email: 'suresh@procureflow.ai', role: 'Receipt Officer' },
                  { email: 'deepa@procureflow.ai', role: 'Finance Officer' },
                ].map(acc => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => setEmail(acc.email)}
                    className={`text-left text-[11px] px-2.5 py-1.5 rounded-md border transition-colors ${email === acc.email ? 'border-primary bg-accent text-accent-foreground' : 'border-border hover:bg-muted text-muted-foreground'}`}
                  >
                    <span className="font-medium block">{acc.role}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
