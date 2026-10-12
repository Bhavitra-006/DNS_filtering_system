import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ShieldBan,
  Plus,
  Trash2,
  Upload,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Filter,
  Info,
  RotateCcw,
} from 'lucide-react';

import PageHeader from '../components/common/PageHeader';
import SearchBar from '../components/common/SearchBar';
import FilterBar from '../components/common/FilterBar';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';

import { getBlockedDomains, addBlockedDomain, deleteBlockedDomain } from '../api/api';
import { exportDataAsFile } from '../utils/formatters';

export default function BlockedDomainsPage() {
  const [blockedList, setBlockedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [threatFilter, setThreatFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Add Domain Form State
  const [newDomain, setNewDomain] = useState('');
  const [newThreatType, setNewThreatType] = useState('Phishing');
  const [newSource, setNewSource] = useState('Admin Rule');
  const [newAction, setNewAction] = useState('Block & Sinkhole');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Bulk Import state
  const [bulkInput, setBulkInput] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Delete loading
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Map backend record to UI record
  const mapRecord = (r) => ({
    id: r.id || `blk-${r.domain}`,
    domain: r.domain,
    source: r.source || 'Unknown',
    threatType: r.threat_type || 'Malicious Domain',
    addedDate: r.created_at
      ? r.created_at.replace('T', ' ').substring(0, 19)
      : '-',
    status: 'ACTIVE',
    hitsCount: 0,
    riskScore: 90,
    action: 'Block',
  });

  const loadDomains = useCallback(async () => {
    try {
      setLoading(true);
      setApiError('');
      const data = await getBlockedDomains();
      const details = Array.isArray(data?.details) ? data.details : [];
      setBlockedList(details.map(mapRecord));
    } catch (err) {
      console.error('Failed to load blocked domains:', err);
      setApiError('Unable to load blocked domains from backend.');
      setBlockedList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDomains();
  }, [loadDomains]);

  // Filtered domains
  const filteredDomains = useMemo(() => {
    return blockedList.filter((item) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !item.domain.toLowerCase().includes(term) &&
          !item.source.toLowerCase().includes(term) &&
          !item.threatType.toLowerCase().includes(term)
        ) {
          return false;
        }
      }

      if (threatFilter !== 'ALL' && item.threatType !== threatFilter) {
        return false;
      }

      if (sourceFilter !== 'ALL' && !item.source.includes(sourceFilter)) {
        return false;
      }

      return true;
    });
  }, [blockedList, searchTerm, threatFilter, sourceFilter]);

  const hasActiveFilters = searchTerm !== '' || threatFilter !== 'ALL' || sourceFilter !== 'ALL';

  const resetFilters = () => {
    setSearchTerm('');
    setThreatFilter('ALL');
    setSourceFilter('ALL');
  };

  // Handlers
  const handleAddDomain = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const domainClean = newDomain.trim().toLowerCase();

    if (!domainClean) {
      setAddError('Domain name cannot be empty.');
      return;
    }

    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domainClean)) {
      setAddError('Please enter a valid domain format (e.g. example.com).');
      return;
    }

    if (blockedList.some((d) => d.domain === domainClean)) {
      setAddError('This domain is already present in the active blocklist.');
      return;
    }

    try {
      setAddLoading(true);
      setAddError('');
      await addBlockedDomain({
        domain: domainClean,
        threat_type: newThreatType,
        source: newSource,
      });
      setNewDomain('');
      setIsAddModalOpen(false);
      showToast(`Domain "${domainClean}" added to active blocklist.`);
      await loadDomains(); // Refresh from backend
    } catch (err) {
      setAddError(err.message || 'Failed to add domain. Please try again.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!domainToDelete) return;
    try {
      setDeleteLoading(true);
      await deleteBlockedDomain(domainToDelete.domain);
      showToast(`Domain "${domainToDelete.domain}" unblocked and removed.`);
      setDomainToDelete(null);
      await loadDomains(); // Refresh from backend
    } catch (err) {
      showToast(`Error: ${err.message || 'Failed to remove domain.'}`);
      setDomainToDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkImport = async () => {
    const lines = bulkInput
      .split('\n')
      .map((l) => l.trim().toLowerCase())
      .filter((l) => l && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(l));

    if (lines.length === 0) {
      showToast('No valid domains found in import payload.');
      return;
    }

    const uniqueNew = lines.filter((d) => !blockedList.some((existing) => existing.domain === d));

    if (uniqueNew.length === 0) {
      showToast('All domains in the import are already blocked.');
      setIsImportModalOpen(false);
      setBulkInput('');
      return;
    }

    try {
      setBulkLoading(true);
      let successCount = 0;
      for (const domain of uniqueNew) {
        try {
          await addBlockedDomain({
            domain,
            threat_type: 'Malicious Domain',
            source: 'Bulk File Import',
          });
          successCount++;
        } catch {
          // Skip duplicates or errors for individual domains
        }
      }
      setIsImportModalOpen(false);
      setBulkInput('');
      showToast(`Successfully imported ${successCount} new domain(s) into blocklist.`);
      await loadDomains();
    } catch (err) {
      showToast(`Bulk import error: ${err.message}`);
    } finally {
      setBulkLoading(false);
    }
  };

  const columns = [
    {
      key: 'domain',
      header: 'Blocked Domain FQDN',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-rose-300 font-medium">
            {row.domain}
          </span>
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Intelligence Source',
      width: '180px',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60 font-mono">
          {row.source}
        </span>
      ),
    },
    {
      key: 'threatType',
      header: 'Threat Classification',
      width: '160px',
      sortable: true,
      render: (row) => <StatusBadge type="threat" value={row.threatType} />,
    },
    {
      key: 'addedDate',
      header: 'Added Date',
      width: '160px',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-slate-400">
          {row.addedDate}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Enforcement',
      width: '110px',
      align: 'center',
      sortable: true,
      render: (row) => (
        <span className="status-badge badge-block">
          <span className="dot" />
          {row.status}
        </span>
      ),
    },
    {
      key: 'hitsCount',
      header: 'Intercepts',
      width: '100px',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-slate-300 font-semibold">
          {new Intl.NumberFormat().format(row.hitsCount || 0)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      width: '90px',
      align: 'center',
      render: (row) => (
        <button
          type="button"
          onClick={() => setDomainToDelete(row)}
          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Unblock / Remove rule"
        >
          <Trash2 size={15} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Blocked Domains Repository"
        subtitle="Active DNS sinkhole registry and firewall blocklist rules"
        icon={ShieldBan}
        badge={
          <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-xs font-semibold">
            {blockedList.length} ACTIVE RULES
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={RotateCcw}
              onClick={loadDomains}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Upload}
              onClick={() => setIsImportModalOpen(true)}
            >
              Import List
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={() => setIsExportModalOpen(true)}
            >
              Export
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                setAddError('');
                setIsAddModalOpen(true);
              }}
            >
              Add Blocked Domain
            </Button>
          </div>
        }
      />

      {/* Error Banner */}
      {apiError && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle size={15} className="flex-shrink-0" />
          <span>{apiError} — Showing cached data or empty list.</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800/90 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search blocked domains by FQDN, threat type, or source..."
          className="flex-1"
        />

        <FilterBar
          hasActiveFilters={hasActiveFilters}
          onReset={resetFilters}
          filters={[
            {
              value: threatFilter,
              onChange: setThreatFilter,
              options: [
                { value: 'ALL', label: 'All Threat Types' },
                { value: 'Phishing', label: 'Phishing' },
                { value: 'Malware C2', label: 'Malware C2' },
                { value: 'DNS Tunneling', label: 'DNS Tunneling' },
                { value: 'DGA', label: 'DGA' },
                { value: 'Botnet', label: 'Botnet' },
                { value: 'Crypto Miner', label: 'Crypto Miner' },
                { value: 'Malicious Domain', label: 'Malicious Domain' },
              ],
            },
            {
              value: sourceFilter,
              onChange: setSourceFilter,
              options: [
                { value: 'ALL', label: 'All Sources' },
                { value: 'AbuseIPDB', label: 'AbuseIPDB' },
                { value: 'ThreatFox', label: 'ThreatFox' },
                { value: 'URLHaus', label: 'URLHaus' },
                { value: 'AI/ML', label: 'AI/ML Classifier' },
                { value: 'Behavioral', label: 'Behavioral Engine' },
                { value: 'Admin Rule', label: 'Admin Custom Rule' },
              ],
            },
          ]}
        />
      </div>

      {/* Domains Table */}
      {loading ? (
        <div className="p-8 rounded-xl bg-[#0f172a] border border-slate-800/90 text-center">
          <div className="text-sky-400 text-sm font-medium">Loading blocked domains...</div>
          <div className="text-slate-500 text-xs mt-1">Fetching blocklist from backend</div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredDomains}
          pageSize={10}
          pageSizeOptions={[10, 20, 50]}
          emptyTitle="No Blocked Domains Found"
          emptyDescription="No domains matched your criteria. You can manually add a domain to block using the button above."
        />
      )}

      {/* Add Domain Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Blocked Domain Rule"
        subtitle="Create an immediate DNS sinkhole enforcement rule"
        icon={Plus}
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              loading={addLoading}
              onClick={handleAddDomain}
            >
              Enforce Block Rule
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddDomain} className="space-y-4">
          {addError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle size={15} className="flex-shrink-0" />
              <span>{addError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5 font-mono">
              Domain Name / FQDN <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={newDomain}
              onChange={(e) => {
                setNewDomain(e.target.value);
                setAddError('');
              }}
              placeholder="e.g. malicious-c2-beacon.top"
              className="cyber-input font-mono"
              autoFocus
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Subdomains will automatically be inherited and sinkholed.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5 font-mono">
                Threat Category
              </label>
              <select
                value={newThreatType}
                onChange={(e) => setNewThreatType(e.target.value)}
                className="cyber-select w-full"
              >
                <option value="Phishing">Phishing</option>
                <option value="Malware C2">Malware C2</option>
                <option value="DNS Tunneling">DNS Tunneling</option>
                <option value="DGA">DGA</option>
                <option value="Botnet">Botnet</option>
                <option value="Crypto Miner">Crypto Miner</option>
                <option value="Malicious Domain">Malicious Domain</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5 font-mono">
                Source Type
              </label>
              <select
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                className="cyber-select w-full"
              >
                <option value="Admin Rule">Admin Custom Rule</option>
                <option value="Incident Response">Incident Response</option>
                <option value="SOC Escalation">SOC Escalation</option>
                <option value="Forensic Analysis">Forensic Analysis</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5 font-mono">
              Enforcement Action
            </label>
            <select
              value={newAction}
              onChange={(e) => setNewAction(e.target.value)}
              className="cyber-select w-full"
            >
              <option value="Block & Sinkhole">Block &amp; Sinkhole (0.0.0.0)</option>
              <option value="Block with NXDOMAIN">Block with NXDOMAIN</option>
              <option value="Block & Alert SOC">Block &amp; Alert SOC Team</option>
              <option value="Block & Quarantine Client">Block &amp; Quarantine Client</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={!!domainToDelete}
        onClose={() => setDomainToDelete(null)}
        title="Unblock Domain Rule"
        subtitle="Confirmation required"
        icon={AlertTriangle}
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDomainToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              loading={deleteLoading}
              onClick={handleConfirmDelete}
            >
              Confirm Unblock
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs leading-relaxed">
          <p className="text-slate-300">
            Are you sure you want to remove the block rule for:
          </p>
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-sm text-rose-300 font-semibold break-all">
            {domainToDelete?.domain}
          </div>
          <p className="text-slate-400">
            Client requests to this domain will immediately be allowed through to the upstream recursive resolver.
          </p>
        </div>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Bulk Import Blocklist"
        subtitle="Import domains from text, CSV or raw IOC list"
        icon={Upload}
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsImportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Upload}
              loading={bulkLoading}
              onClick={handleBulkImport}
            >
              Import Domains
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-400">
            Paste domain names separated by newlines. Invalid lines will automatically be skipped.
          </p>
          <textarea
            rows={8}
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            placeholder={`bad-domain-one.xyz\nphishing-portal-test.top\nstealer-node-c2.net`}
            className="cyber-input font-mono text-xs w-full resize-none p-3"
          />
        </div>
      </Modal>

      {/* Export Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export Active Blocklist"
        subtitle="Select file export format"
        icon={Download}
        footer={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsExportModalOpen(false)}
          >
            Close
          </Button>
        }
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300">
            Export all <span className="font-semibold text-rose-400">{blockedList.length}</span> active blocked domain records.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                exportDataAsFile(blockedList, 'dns_sentinel_blocklist.json', 'json');
                setIsExportModalOpen(false);
                showToast('Exported blocklist as JSON.');
              }}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500 text-left transition-colors"
            >
              <div className="font-semibold text-slate-100 mb-1">JSON Format</div>
              <div className="text-[11px] text-slate-400">Complete structured schema with IOC metadata.</div>
            </button>
            <button
              type="button"
              onClick={() => {
                exportDataAsFile(blockedList, 'dns_sentinel_blocklist.csv', 'csv');
                setIsExportModalOpen(false);
                showToast('Exported blocklist as CSV.');
              }}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500 text-left transition-colors"
            >
              <div className="font-semibold text-slate-100 mb-1">CSV Format</div>
              <div className="text-[11px] text-slate-400">Comma-separated tabular export for SIEM, firewall or spreadsheet.</div>
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {toastMessage && (
        <div className="soc-toast">
          <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-medium text-slate-100">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
