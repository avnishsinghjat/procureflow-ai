import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCases, getDocuments } from '@/lib/store';
import { Search, FileText, FolderOpen, Building2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchResult {
  type: 'case' | 'document' | 'vendor';
  id: string;
  title: string;
  subtitle: string;
  link: string;
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const q = query.toLowerCase();
    const cases = getCases();
    const docs = getDocuments();

    const matched: SearchResult[] = [];

    // Cases
    cases.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.caseNumber.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    ).slice(0, 5).forEach(c => matched.push({
      type: 'case', id: c.id, title: c.caseNumber, subtitle: c.title, link: `/cases/${c.id}`,
    }));

    // Documents
    docs.filter(d =>
      d.fileName.toLowerCase().includes(q) ||
      d.documentType.toLowerCase().includes(q) ||
      (d.ocrText && d.ocrText.toLowerCase().includes(q))
    ).slice(0, 5).forEach(d => matched.push({
      type: 'document', id: d.id, title: d.fileName, subtitle: `${d.documentType} — ${d.caseId}`, link: `/cases/${d.caseId}`,
    }));

    // Vendors (unique)
    const vendorSet = new Set<string>();
    cases.filter(c => c.vendorName.toLowerCase().includes(q)).forEach(c => {
      if (!vendorSet.has(c.vendorName)) {
        vendorSet.add(c.vendorName);
        matched.push({
          type: 'vendor', id: c.vendorName, title: c.vendorName, subtitle: `${cases.filter(x => x.vendorName === c.vendorName).length} case(s)`, link: `/cases/${c.id}`,
        });
      }
    });

    setResults(matched.slice(0, 12));
  }, [query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const icons = { case: FolderOpen, document: FileText, vendor: Building2 };

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search cases, documents, vendors…"
          className="pl-9 pr-8 h-9 text-sm bg-muted/50 border-border focus-visible:bg-background"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => query && setOpen(true)}
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-popover border border-border rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto py-1.5 animate-fade-in">
          {results.map((r, i) => {
            const Icon = icons[r.type];
            return (
              <button
                key={`${r.type}-${r.id}-${i}`}
                onClick={() => { navigate(r.link); setOpen(false); setQuery(''); }}
                className="flex items-center gap-3 px-4 py-2.5 w-full text-left hover:bg-accent/50 transition-colors"
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{r.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{r.subtitle}</p>
                </div>
                <span className="text-[9px] uppercase tracking-wide text-muted-foreground/60 font-medium shrink-0">{r.type}</span>
              </button>
            );
          })}
        </div>
      )}

      {open && query.trim() && results.length === 0 && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-popover border border-border rounded-xl shadow-lg z-50 py-6 text-center animate-fade-in">
          <p className="text-sm text-muted-foreground">No results for "{query}"</p>
        </div>
      )}
    </div>
  );
}
