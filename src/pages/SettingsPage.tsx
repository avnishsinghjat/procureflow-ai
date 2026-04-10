import { useState } from 'react';
import { getSetting, setSetting } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings, Save, Key, Bot } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState(getSetting('openrouter_api_key'));
  const [model, setModel] = useState(getSetting('openrouter_model'));
  const [fallback, setFallback] = useState(getSetting('openrouter_fallback_model'));
  const [company, setCompany] = useState(getSetting('company_name'));

  const handleSave = () => {
    setSetting('openrouter_api_key', apiKey);
    setSetting('openrouter_model', model);
    setSetting('openrouter_fallback_model', fallback);
    setSetting('company_name', company);
    toast.success('Settings saved successfully');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-heading font-bold">Admin Settings</h1>

      <div className="bg-card rounded-xl border border-border p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="font-heading font-semibold">OpenRouter Configuration</h2>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">API Key</label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="password" className="pl-9" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-or-..." />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Get your key from openrouter.ai</p>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Default Model</label>
          <Input value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. meta-llama/llama-3.1-8b-instruct:free" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Fallback Model</label>
          <Input value={fallback} onChange={e => setFallback(e.target.value)} placeholder="e.g. google/gemma-2-9b-it:free" />
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
