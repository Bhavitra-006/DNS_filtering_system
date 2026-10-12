import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  Download,
  RotateCcw,
  ShieldAlert,
  Info,
  Layers,
  Filter,
  Eye,
  Server,
  Terminal,
} from 'lucide-react';

import PageHeader from '../components/common/PageHeader';
import SearchBar from '../components/common/SearchBar';
import FilterBar from '../components/common/FilterBar';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';

import { RECENT_DNS_QUERIES } from '../data/mockData';
import { getQueries } from '../api/api';
import { exportDataAsFile } from '../utils/formatters';

export default function DnsQueriesPage() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('ALL');
  const [queryTypeFilter, setQueryTypeFilter] = useState('ALL');
  const [threatTypeFilter, setThreatTypeFilter] = useState('ALL');
  const [selectedQuery, setSelectedQuery] = useState(null);
    useEffect(() => {
    loadQueries();
  }, []);

  const loadQueries = async () => {
    try {
      setLoading(true);
      setApiError('');

      const data = await getQueries();

      console.log('DNS queries from backend:', data);

      const backendQueries = Array.isArray(data?.queries)
        ? data.queries
        : [];

      const mappedQueries = backendQueries.map((q, index) => ({
        id: `query-${index}-${q.queried_at}`,
        timestamp: q.queried_at
          ? q.queried_at.replace('T', ' ')
          : '-',
        domain: q.domain || '-',
        queryType: q.query_type || '-',
        decision: q.decision || 'UNKNOWN',
        threatType: q.threat_type || 'Clean',
        responseCode: q.response_code || '-',
        responseTime: q.response_time_ms
          ? `${Number(q.response_time_ms).toFixed(2)} ms`
          : '-',

        // Backend currently does not provide these fields
        sourceIp: '-',
        sourceHost: '-',
      }));

      setQueries(mappedQueries);
    } catch (error) {
      console.error('Failed to load DNS queries:', error);
      setApiError('Unable to load DNS queries from backend.');
      setQueries([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtered queries
  const filteredQueries = useMemo(() => {
    return queries.filter((q) => {
      // Search term matches domain, source IP, or host
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchDomain = String(q.domain || '').toLowerCase().includes(term);
        const matchIp = String(q.sourceIp || '').toLowerCase().includes(term);
        const matchHost = String(q.sourceHost || '').toLowerCase().includes(term);
        const matchThreat = String(q.threatType || '').toLowerCase().includes(term);
        if (!matchDomain && !matchIp && !matchHost && !matchThreat) {
          return false;
        }
      }

      // Decision filter
      if (decisionFilter !== 'ALL' && q.decision !== decisionFilter) {
        return false;
      }

      // Query type filter
      if (queryTypeFilter !== 'ALL' && q.queryType !== queryTypeFilter) {
        return false;
      }

      // Threat type filter
      if (threatTypeFilter !== 'ALL' && q.threatType !== threatTypeFilter) {
        return false;
      }

      return true;
    });
  }, [queries, searchTerm, decisionFilter, queryTypeFilter, threatTypeFilter]);

  const hasActiveFilters =
    searchTerm !== '' ||
    decisionFilter !== 'ALL' ||
    queryTypeFilter !== 'ALL' ||
    threatTypeFilter !== 'ALL';

  const resetFilters = () => {
    setSearchTerm('');
    setDecisionFilter('ALL');
    setQueryTypeFilter('ALL');
    setThreatTypeFilter('ALL');
  };

  const handleExport = (format = 'json') => {
    exportDataAsFile(
      filteredQueries,
      `dns_queries_${new Date().toISOString().slice(0, 10)}.${format}`,
      format
    );
  };

  const columns = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      width: '160px',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-slate-300">
          {row.timestamp}
        </span>
      ),
    },
    {
      key: 'domain',
      header: 'Domain',
      sortable: true,
      render: (row) => (
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => setSelectedQuery(row)}
        >
          <span className="font-mono text-xs text-slate-200 group-hover:text-sky-400 group-hover:underline transition-colors font-medium">
            {row.domain}
          </span>
          <Eye size={13} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ),
    },
    {
      key: 'queryType',
      header: 'Type',
      width: '75px',
      align: 'center',
      sortable: true,
      render: (row) => <StatusBadge type="queryType" value={row.queryType} />,
    },
    {
      key: 'decision',
      header: 'Decision',
      width: '100px',
      sortable: true,
      render: (row) => <StatusBadge type="decision" value={row.decision} />,
    },
    {
      key: 'threatType',
      header: 'Threat Classification',
      width: '150px',
      sortable: true,
      render: (row) => <StatusBadge type="threat" value={row.threatType} />,
    },
    {
      key: 'responseCode',
      header: 'RCode',
      width: '95px',
      align: 'center',
      sortable: true,
      render: (row) => (
        <span
          className={`font-mono text-xs px-2 py-0.5 rounded border ${
            row.responseCode === 'BLOCKED'
              ? 'text-rose-400 border-rose-500/30 bg-rose-500/10'
              : row.responseCode === 'SERVFAIL'
              ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
              : 'text-slate-300 border-slate-700 bg-slate-800/60'
          }`}
        >
          {row.responseCode}
        </span>
      ),
    },
    {
      key: 'responseTime',
      header: 'Response',
      width: '100px',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-slate-300 font-medium">
          {row.responseTime}
        </span>
      ),
    },
    {
      key: 'source',
      header: 'Client Source',
      width: '180px',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs text-slate-200">{row.sourceIp}</span>
          <span className="text-[11px] text-slate-400 font-mono">{row.sourceHost}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="DNS Queries Stream"
        subtitle="Real-time packet inspection of recursive and authoritative DNS requests"
        icon={Activity}
        badge={
          <span className="px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 font-mono text-xs font-semibold">
            {filteredQueries.length} QUERIES LOGGED
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={RotateCcw}
              onClick={loadQueries}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={() => handleExport('csv')}
            >
              Export CSV
            </Button>

            <Button
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={() => handleExport('json')}
            >
              Export JSON
            </Button>
          </div>
        }
      />

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800/90 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Filter by domain name, IP, endpoint host, or threat..."
          className="flex-1"
        />

        <FilterBar
          hasActiveFilters={hasActiveFilters}
          onReset={resetFilters}
          filters={[
            {
              value: decisionFilter,
              onChange: setDecisionFilter,
              options: [
                { value: 'ALL', label: 'All Decisions' },
                { value: 'ALLOW', label: 'ALLOW Only' },
                { value: 'BLOCK', label: 'BLOCK Only' },
                { value: 'FLAG', label: 'FLAG Only' },
              ],
            },
            {
              value: queryTypeFilter,
              onChange: setQueryTypeFilter,
              options: [
                { value: 'ALL', label: 'All RR Types' },
                { value: 'A', label: 'A (IPv4)' },
                { value: 'AAAA', label: 'AAAA (IPv6)' },
                { value: 'CNAME', label: 'CNAME (Alias)' },
                { value: 'TXT', label: 'TXT (Text/SPF)' },
                { value: 'MX', label: 'MX (Mail)' },
                { value: 'PTR', label: 'PTR (Reverse)' },
              ],
            },
            {
              value: threatTypeFilter,
              onChange: setThreatTypeFilter,
              options: [
                { value: 'ALL', label: 'All Threats' },
                { value: 'Clean', label: 'Clean' },
                { value: 'Phishing', label: 'Phishing' },
                { value: 'Malware C2', label: 'Malware C2' },
                { value: 'DGA', label: 'DGA' },
                { value: 'DNS Tunneling', label: 'DNS Tunneling' },
                { value: 'Suspicious IP', label: 'Suspicious IP' },
                { value: 'Botnet', label: 'Botnet' },
              ],
            },
          ]}
        />
      </div>

      {/* Main Table */}
            {/* Main Table */}
      {loading ? (
        <div className="p-8 rounded-xl bg-[#0f172a] border border-slate-800/90 text-center">
          <div className="text-sky-400 text-sm font-medium">
            Loading DNS queries...
          </div>
          <div className="text-slate-500 text-xs mt-1">
            Fetching query records from the DNS filtering backend
          </div>
        </div>
      ) : apiError ? (
        <div className="p-8 rounded-xl bg-[#0f172a] border border-rose-500/20 text-center">
          <div className="text-rose-400 text-sm font-medium">
            {apiError}
          </div>
          <button
            type="button"
            onClick={loadQueries}
            className="mt-3 text-xs text-sky-400 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredQueries}
          pageSize={12}
          pageSizeOptions={[10, 12, 25, 50]}
          emptyTitle="No DNS Queries Found"
          emptyDescription="No queries matched your search parameters. Try adjusting your search term or clearing active filters."
        />
      )}

      {/* Query Detail Modal */}
      {selectedQuery && (
        <Modal
          isOpen={!!selectedQuery}
          onClose={() => setSelectedQuery(null)}
          title="DNS Query Inspection"
          subtitle={`Packet ID: ${selectedQuery.id}`}
          icon={Terminal}
          footer={
            <Button variant="secondary" size="sm" onClick={() => setSelectedQuery(null)}>
              Close Inspector
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-slate-400 font-mono text-[11px] uppercase block mb-1">
                Requested FQDN
              </span>
              <div className="text-sm font-mono font-semibold text-slate-100 break-all">
                {selectedQuery.domain}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
              <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px]">Decision</div>
                <div className="mt-1">
                  <StatusBadge type="decision" value={selectedQuery.decision} />
                </div>
              </div>

              <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px]">Record Type</div>
                <div className="mt-1 font-semibold text-sky-400">
                  {selectedQuery.queryType} (IN Class)
                </div>
              </div>

              <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px]">Threat Type</div>
                <div className="mt-1">
                  <StatusBadge type="threat" value={selectedQuery.threatType} />
                </div>
              </div>

              <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px]">Response Code</div>
                <div className="mt-1 font-semibold text-slate-200">
                  {selectedQuery.responseCode}
                </div>
              </div>

              <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px]">Latency</div>
                <div className="mt-1 font-semibold text-emerald-400">
                  {selectedQuery.responseTime}
                </div>
              </div>

              <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800">
                <div className="text-slate-400 text-[10px]">Timestamp</div>
                <div className="mt-1 text-slate-300">
                  {selectedQuery.timestamp.split(' ')[1]}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <span className="text-slate-400 font-mono text-[11px] uppercase block mb-1.5">
                Client Origin & Socket
              </span>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <div>
                  <span className="text-slate-400">Client IPv4: </span>
                  <span className="text-slate-200">{selectedQuery.sourceIp}</span>
                </div>
                <div>
                  <span className="text-slate-400">Host Identifier: </span>
                  <span className="text-slate-200">{selectedQuery.sourceHost}</span>
                </div>
                <div>
                  <span className="text-slate-400">Port / Protocol: </span>
                  <span className="text-slate-200">UDP / 5353</span>
                </div>
                <div>
                  <span className="text-slate-400">EDNS Subnet: </span>
                  <span className="text-slate-200">Disabled (Privacy)</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
