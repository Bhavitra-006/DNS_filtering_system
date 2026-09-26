import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Server,
  Shield,
  Radar,
  Bell,
  Palette,
  Save,
  RotateCcw,
  CheckCircle2,
  Key,
  Globe,
  Sliders,
  Lock,
} from 'lucide-react';

import PageHeader from '../components/common/PageHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

import { INITIAL_SETTINGS } from '../data/mockData';

export default function SettingsPage() {
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleToggle = (section, key) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: !prev[section][key],
      },
    }));
  };

  const handleChange = (section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast('Settings configuration saved successfully.');
    }, 700);
  };

  const handleReset = () => {
    setSettings(INITIAL_SETTINGS);
    showToast('Settings reset to default configuration.');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'dns', label: 'DNS Engine', icon: Server },
    { id: 'security', label: 'Security & Mitigation', icon: Shield },
    { id: 'threatIntel', label: 'Threat Intelligence', icon: Radar },
    { id: 'notifications', label: 'Alerts & Webhooks', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <PageHeader
        title="SOC Platform Configuration"
        subtitle="Custom policy parameters, resolver upstream, threat synchronization, and alerting"
        icon={SettingsIcon}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={RotateCcw}
              onClick={handleReset}
            >
              Reset Defaults
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Save}
              loading={isSaving}
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </div>
        }
      />

      {/* Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: General Settings */}
      {activeTab === 'general' && (
        <Card title="General Dashboard Settings" subtitle="Global SOC environment metadata and defaults" icon={SettingsIcon}>
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Dashboard Platform Name
                </label>
                <input
                  type="text"
                  value={settings.general.dashboardName}
                  onChange={(e) => handleChange('general', 'dashboardName', e.target.value)}
                  className="cyber-input"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Live Stream Refresh Rate
                </label>
                <select
                  value={settings.general.refreshInterval}
                  onChange={(e) => handleChange('general', 'refreshInterval', e.target.value)}
                  className="cyber-select w-full"
                >
                  <option value="5s">Every 5 seconds</option>
                  <option value="15s">Every 15 seconds (Recommended)</option>
                  <option value="30s">Every 30 seconds</option>
                  <option value="60s">Every 1 minute</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Display Timezone
                </label>
                <select
                  value={settings.general.timezone}
                  onChange={(e) => handleChange('general', 'timezone', e.target.value)}
                  className="cyber-select w-full"
                >
                  <option value="UTC">UTC (Universal Coordinated Time)</option>
                  <option value="EST">EST (Eastern Standard Time)</option>
                  <option value="PST">PST (Pacific Standard Time)</option>
                  <option value="IST">IST (Indian Standard Time)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Default Query Log Rows
                </label>
                <select
                  value={settings.general.rowsPerPage}
                  onChange={(e) => handleChange('general', 'rowsPerPage', e.target.value)}
                  className="cyber-select w-full"
                >
                  <option value="10">10 rows per page</option>
                  <option value="25">25 rows per page</option>
                  <option value="50">50 rows per page</option>
                  <option value="100">100 rows per page</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-slate-200 font-medium">Anonymous Threat Telemetry Sharing</div>
                <div className="text-slate-400 text-[11px]">
                  Contribute aggregated IOC detection counts to global threat research networks.
                </div>
              </div>
              <label className="switch-container">
                <input
                  type="checkbox"
                  checked={settings.general.telemetrySharing}
                  onChange={() => handleToggle('general', 'telemetrySharing')}
                  className="switch-input"
                />
                <span className="switch-slider" />
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 2: DNS Settings */}
      {activeTab === 'dns' && (
        <Card title="DNS Engine Configuration" subtitle="Upstream resolvers, DoH/DoT transport, and caching" icon={Server}>
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 font-mono">
                  Primary Upstream (IPv4)
                </label>
                <input
                  type="text"
                  value={settings.dns.upstreamPrimary}
                  onChange={(e) => handleChange('dns', 'upstreamPrimary', e.target.value)}
                  className="cyber-input font-mono"
                />
                <span className="text-[10px] text-slate-500 font-mono">e.g. 1.1.1.1 (Cloudflare)</span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 font-mono">
                  Secondary Upstream (IPv4)
                </label>
                <input
                  type="text"
                  value={settings.dns.upstreamSecondary}
                  onChange={(e) => handleChange('dns', 'upstreamSecondary', e.target.value)}
                  className="cyber-input font-mono"
                />
                <span className="text-[10px] text-slate-500 font-mono">e.g. 9.9.9.9 (Quad9)</span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 font-mono">
                  Fallback Upstream (IPv4)
                </label>
                <input
                  type="text"
                  value={settings.dns.upstreamFallback}
                  onChange={(e) => handleChange('dns', 'upstreamFallback', e.target.value)}
                  className="cyber-input font-mono"
                />
                <span className="text-[10px] text-slate-500 font-mono">e.g. 8.8.8.8 (Google)</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-200 font-medium">DNS-over-HTTPS (DoH) Encryption</div>
                  <div className="text-slate-400 text-[11px]">
                    Encrypt recursive lookups over HTTPS port 443 to avoid ISP snooping.
                  </div>
                </div>
                <label className="switch-container">
                  <input
                    type="checkbox"
                    checked={settings.dns.dnsOverHttps}
                    onChange={() => handleToggle('dns', 'dnsOverHttps')}
                    className="switch-input"
                  />
                  <span className="switch-slider" />
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-200 font-medium">DNSSEC Cryptographic Validation</div>
                  <div className="text-slate-400 text-[11px]">
                    Enforce cryptographic signature validation for all returned RRsets.
                  </div>
                </div>
                <label className="switch-container">
                  <input
                    type="checkbox"
                    checked={settings.dns.dnssecValidation}
                    onChange={() => handleToggle('dns', 'dnssecValidation')}
                    className="switch-input"
                  />
                  <span className="switch-slider" />
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-200 font-medium">EDNS Client Subnet (ECS) Masking</div>
                  <div className="text-slate-400 text-[11px]">
                    Strip client IP subnets from upstream queries to prevent geographic tracking.
                  </div>
                </div>
                <label className="switch-container">
                  <input
                    type="checkbox"
                    checked={!settings.dns.ednsClientSubnet}
                    onChange={() => handleToggle('dns', 'ednsClientSubnet')}
                    className="switch-input"
                  />
                  <span className="switch-slider" />
                </label>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 3: Security Settings */}
      {activeTab === 'security' && (
        <Card title="Security & Mitigation Policies" subtitle="Action rules, DGA confidence thresholds, and tunneling detection" icon={Shield}>
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Default Unclassified Threat Action
                </label>
                <select
                  value={settings.security.defaultAction}
                  onChange={(e) => handleChange('security', 'defaultAction', e.target.value)}
                  className="cyber-select w-full"
                >
                  <option value="BLOCK">BLOCK (Drop / Sinkhole)</option>
                  <option value="FLAG">FLAG (Allow with Enhanced Audit)</option>
                  <option value="ALLOW">ALLOW</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  DNS Tunneling Sensitivity
                </label>
                <select
                  value={settings.security.tunnelingSensitivity}
                  onChange={(e) => handleChange('security', 'tunnelingSensitivity', e.target.value)}
                  className="cyber-select w-full"
                >
                  <option value="Strict">Strict (Trigger on &gt;120 TXT q/min)</option>
                  <option value="Balanced">Balanced (Trigger on &gt;300 TXT q/min)</option>
                  <option value="Permissive">Permissive (Trigger on &gt;600 TXT q/min)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-300 font-semibold">
                  AI/ML DGA Entropy Detection Threshold:
                </label>
                <span className="font-mono text-sky-400 font-bold">
                  {settings.security.dgaThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="99"
                value={settings.security.dgaThreshold}
                onChange={(e) => handleChange('security', 'dgaThreshold', Number(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
              <span className="text-[11px] text-slate-500">
                Higher values reduce false-positives on content delivery network names.
              </span>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-200 font-medium">Automatic Sinkhole Redirection (0.0.0.0)</div>
                  <div className="text-slate-400 text-[11px]">
                    Respond with null address instead of NXDOMAIN to avoid C2 fallback loops.
                  </div>
                </div>
                <label className="switch-container">
                  <input
                    type="checkbox"
                    checked={settings.security.autoSinkhole}
                    onChange={() => handleToggle('security', 'autoSinkhole')}
                    className="switch-input"
                  />
                  <span className="switch-slider" />
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-200 font-medium">Block DNS Rebinding Attacks</div>
                  <div className="text-slate-400 text-[11px]">
                    Drop responses from public domains resolving to private RFC 1918 IP addresses.
                  </div>
                </div>
                <label className="switch-container">
                  <input
                    type="checkbox"
                    checked={settings.security.blockRebindAttacks}
                    onChange={() => handleToggle('security', 'blockRebindAttacks')}
                    className="switch-input"
                  />
                  <span className="switch-slider" />
                </label>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 4: Threat Intelligence Settings */}
      {activeTab === 'threatIntel' && (
        <Card title="Threat Intelligence Feed Ingestion" subtitle="API connections and automated feed synchronizations" icon={Radar}>
          <div className="space-y-5 text-xs">
            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 font-mono">
                  AbuseIPDB API Key
                </label>
                <input
                  type="text"
                  value={settings.threatIntel.abuseIpDbApiKey}
                  onChange={(e) => handleChange('threatIntel', 'abuseIpDbApiKey', e.target.value)}
                  className="cyber-input font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 font-mono">
                  URLHaus (abuse.ch) Auth Token
                </label>
                <input
                  type="text"
                  value={settings.threatIntel.urlHausApiKey}
                  onChange={(e) => handleChange('threatIntel', 'urlHausApiKey', e.target.value)}
                  className="cyber-input font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 font-mono">
                  AlienVault OTX Key
                </label>
                <input
                  type="text"
                  value={settings.threatIntel.alienVaultApiKey}
                  onChange={(e) => handleChange('threatIntel', 'alienVaultApiKey', e.target.value)}
                  className="cyber-input font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-slate-200 font-medium">Auto-Drop Stale Indicators (&gt;30 Days)</div>
                <div className="text-slate-400 text-[11px]">
                  Automatically age out dormant IOCs to maintain optimal cache memory size.
                </div>
              </div>
              <label className="switch-container">
                <input
                  type="checkbox"
                  checked={settings.threatIntel.autoDropStaleIndicators}
                  onChange={() => handleToggle('threatIntel', 'autoDropStaleIndicators')}
                  className="switch-input"
                />
                <span className="switch-slider" />
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 5: Notification Settings */}
      {activeTab === 'notifications' && (
        <Card title="Alerts & Notification Webhooks" subtitle="Immediate alerting on high-severity C2 and exfiltration events" icon={Bell}>
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 font-mono">
                  SOC Alert Email Distribution
                </label>
                <input
                  type="text"
                  value={settings.notifications.emailRecipients}
                  onChange={(e) => handleChange('notifications', 'emailRecipients', e.target.value)}
                  className="cyber-input font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 font-mono">
                  SIEM / Slack Webhook URL
                </label>
                <input
                  type="text"
                  value={settings.notifications.webhookUrl}
                  onChange={(e) => handleChange('notifications', 'webhookUrl', e.target.value)}
                  className="cyber-input font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-200 font-medium">Instant Alert on Critical Threat (Malware C2)</div>
                  <div className="text-slate-400 text-[11px]">
                    Send high-priority notification within 500ms of interception.
                  </div>
                </div>
                <label className="switch-container">
                  <input
                    type="checkbox"
                    checked={settings.notifications.notifyOnCritical}
                    onChange={() => handleToggle('notifications', 'notifyOnCritical')}
                    className="switch-input"
                  />
                  <span className="switch-slider" />
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-200 font-medium">Daily Executive Threat Digest</div>
                  <div className="text-slate-400 text-[11px]">
                    Receive 24-hour summary report of top blocked IOCs and internal hosts.
                  </div>
                </div>
                <label className="switch-container">
                  <input
                    type="checkbox"
                    checked={settings.notifications.dailyDigest}
                    onChange={() => handleToggle('notifications', 'dailyDigest')}
                    className="switch-input"
                  />
                  <span className="switch-slider" />
                </label>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 6: Appearance Settings */}
      {activeTab === 'appearance' && (
        <Card title="Interface & Display Preferences" subtitle="Theme styling, contrast, and layout density" icon={Palette}>
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Interface Theme Preset
                </label>
                <select
                  value={settings.appearance.theme}
                  onChange={(e) => handleChange('appearance', 'theme', e.target.value)}
                  className="cyber-select w-full"
                >
                  <option value="cyber-dark">Obsidian Dark (Cybersecurity Standard)</option>
                  <option value="midnight-blue">Midnight Blue (Navy SOC)</option>
                  <option value="stealth">Stealth Black (Monochrome)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Data Density
                </label>
                <select
                  value={settings.appearance.density}
                  onChange={(e) => handleChange('appearance', 'density', e.target.value)}
                  className="cyber-select w-full"
                >
                  <option value="compact">Compact (High Information Density)</option>
                  <option value="comfortable">Comfortable (Standard)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-slate-200 font-medium">Collapse Sidebar by Default</div>
                <div className="text-slate-400 text-[11px]">
                  Provide maximum horizontal screen area for forensic telemetry charts.
                </div>
              </div>
              <label className="switch-container">
                <input
                  type="checkbox"
                  checked={settings.appearance.sidebarCollapsedDefault}
                  onChange={() => handleToggle('appearance', 'sidebarCollapsedDefault')}
                  className="switch-input"
                />
                <span className="switch-slider" />
              </label>
            </div>
          </div>
        </Card>
      )}

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
