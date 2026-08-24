// Audit log page — read-only view of all audit_log entries, newest first.
// Paginated (25 per page).

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

interface AuditEntry {
  id: string
  actor_email: string
  action: string
  entity_type: string
  entity_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

const PAGE_SIZE = 25

function fmtLocal(iso: string): string {
  return new Date(iso).toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function AdminAuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    supabase
      .from('audit_logs')
      .select('id, actor_email, action, entity_type, entity_id, metadata, created_at')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
      .then(({ data, error: err }) => {
        if (err) { setError(err.message); setLoading(false); return }
        setEntries(data ?? [])
        setHasMore((data?.length ?? 0) > PAGE_SIZE)
        // Trim the extra row used for hasMore detection
        if ((data?.length ?? 0) > PAGE_SIZE) setEntries(data!.slice(0, PAGE_SIZE))
        setLoading(false)
      })
  }, [page])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Audit Log</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Newer</Button>
          <span className="text-sm text-text-muted">Page {page + 1}</span>
          <Button variant="ghost" size="sm" disabled={!hasMore} onClick={() => setPage(p => p + 1)}>Older →</Button>
        </div>
      </div>

      {loading && <div className="flex justify-center py-16"><LoadingSpinner /></div>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && entries.length === 0 && (
        <p className="text-sm text-text-muted">No audit log entries.</p>
      )}

      <div className="space-y-2">
        {entries.map(e => (
          <div key={e.id} className="rounded-xl border border-brand-border bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold text-text-primary">{e.action}</p>
                <p className="text-xs text-text-muted">
                  {e.actor_email} · {e.entity_type}{e.entity_id ? ` · ${e.entity_id.slice(0, 8)}…` : ''}
                </p>
                {e.metadata && (
                  <pre className="mt-1 overflow-x-auto rounded bg-brand-surface p-2 text-xs text-text-muted">
                    {JSON.stringify(e.metadata, null, 2)}
                  </pre>
                )}
              </div>
              <p className="shrink-0 text-xs text-text-muted">{fmtLocal(e.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
