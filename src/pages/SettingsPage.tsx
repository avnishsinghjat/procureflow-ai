import { useState } from 'react';
import { getSetting, setSetting } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings, Save, Bot, Server } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [baseUrl, setBaseUrl] = useState(getSetting('lmstudio_base_url'));
  const [model, setModel] = useState(getSetting('lmstudio_model'));
  const [company, setCompany] = useState(getSetting('company_name'));

  const handleSave = () => {
    setSetting('lmstudio_base_url', baseUrl);
    setSetting('lmstudio_model', model);
    setSetting('company_name', company);
    toast.success('Settings saved successfully');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-heading font-bold">Admin Settings</h1>

      <div className="bg-card rounded-xl border border-border p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="font-heading font-semibold">LM Studio Configuration</h2>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Server URL</label>
          <div className="relative">
            <Server className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="http://localhost:1234" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Base URL of your running LM Studio server</p>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Model</label>
          <Input value={model} onChange={e => setModel(e.target.value)} placeholder="default (uses whatever model is loaded)" />
          <p className="text-xs text-muted-foreground mt-1">Leave as "default" to use the currently loaded model in LM Studio</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-5 w-5 text-primary" />
          <h2 className="font-heading font-semibold">General</h2>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Company Name</label>
          <Input value={company} onChange={e => setCompany(e.target.value)} />
        </div>
      </div>

      <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" /> Save Settings</Button>
    </div>
  );
}
