import React, { useState } from 'react';
import {
  SearchCheck,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Cpu,
  Activity,
  Globe,
  Server,
  Radar,
  Lock,
  ArrowRight,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';

import PageHeader from '../components/common/PageHeader';
import StatusBadge from '../components/common/StatusBadge';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

import { checkDomain } from '../api/api';
import { generateDomainAnalysis } from '../data/mockData';

export default function DomainCheckerPage() {
  const [domainInput, setDomainInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const samplePresets = [
    { label: 'Clean (Google)', domain: 'google.com' },
    { label: 'Blocked (Local Blocklist)', domain: 'malicious.test' },
    { label: 'Threat Intel Feed', domain: 'test-phishing.example' },
    { label: 'DGA / ML High Risk', domain: 'xj29ak91qz.com' },
    { label: 'DNS Tunneling Exfil', domain: 'abcdef0123456789abcdef0123456789.tunnel.example.com' },
    { label: 'Behavioral Anomaly', domain: 'login-verify-account.xyz' },
  ];

  const handleCheckDomain = async (targetDomain) => {
    const domainToCheck = (targetDomain || domainInput).trim();
    if (!domainToCheck) {
      setError('Please provide a valid domain name to inspect.');
      return;
    }

    setError('');
    setIsAnalyzing(true);
    setResult(null);

    setAnalysisStep('Normalizing domain and verifying cache...');

    try {
      // Execute live security analysis pipeline on the backend
      const data = await checkDomain(domainToCheck);
      setResult(data);
    } catch (err) {
      console.warn('Backend API unavailable, falling back to local heuristic analysis:', err);
      const fallback = generateDomainAnalysis(domainToCheck);
      setResult(fallback);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const getRiskScore = () => {
    if (!result) return 0;
    if (result.risk_score !== undefined) return result.risk_score;
    if (result.riskScore !== undefined) return result.riskScore;
    if (result.decision === 'BLOCK') return 95;
    if (result.decision === 'FLAG') return 55;
    return 5;
  };

  const getRiskLevel = () => {
    const score = getRiskScore();
    if (result?.risk_level) return result.risk_level;
    if (result?.riskLevel) return result.riskLevel;
    if (score >= 80) return 'Critical Risk';
    if (score >= 50) return 'High Risk';
    if (score >= 25) return 'Moderate Risk';
    return 'Low Risk';
  };

  const getRiskScoreColor = (score) => {
    if (score >= 80) return 'text-rose-400 stroke-rose-500';
    if (score >= 50) return 'text-amber-400 stroke-amber-500';
    if (score >= 25) return 'text-yellow-400 stroke-yellow-500';
    return 'text-emerald-400 stroke-emerald-500';
  };

  const getRiskScoreBg = (score) => {
    if (score >= 80) return 'bg-rose-500';
    if (score >= 50) return 'bg-amber-500';
    if (score >= 25) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const blocklistStatus =
    result?.security_analysis?.blocklist ||
    (result?.threat_type === 'blocked_domain' ? 'Blocked' : 'Clean');

  const threatIntelStatus =
    result?.security_analysis?.threat_intel ||
    result?.threatIntel ||
    (result?.threat_type && result.threat_type !== 'blocked_domain' && result.threat_type !== 'DGA_ML'
      ? 'Malicious'
      : 'Clean');

  const dgaMlStatus =
    result?.security_analysis?.dga_ml ||
    result?.aiMlAnalysis ||
    (result?.threat_type === 'DGA_ML' ? 'High Risk' : 'Low Risk');

  const behavioralStatus =
    result?.security_analysis?.behavioral ||
    result?.behavioralAnalysis ||
    (result?.threat_type === 'dns_tunneling'
      ? 'High Risk'
      : result?.decision === 'FLAG'
      ? 'Suspicious'
      : 'Normal');

  const currentScore = getRiskScore();
  const currentRiskLevel = getRiskLevel();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Interactive Domain Security Checker"
        subtitle="Multi-engine forensic inspection of domain reputations, lexical entropy, ML DGA detection, and behavioral telemetry"
        icon={SearchCheck}
      />

      {/* Domain Input Search Section */}
      <div className="p-6 rounded-2xl bg-gradient-to-b from-[#111a2e] to-[#0d1424] border border-slate-800 shadow-xl">
        <label className="block text-xs font-mono font-semibold uppercase text-slate-300 mb-2">
          Enter Domain Name or FQDN to Inspect:
        </label>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCheckDomain();
          }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <div className="relative flex-1">
            <Globe
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={domainInput}
              onChange={(e) => {
                setDomainInput(e.target.value);
                setError('');
              }}
              placeholder="e.g. example.com or xj29ak91qz.com"
              className="cyber-input font-mono text-sm pl-11 pr-4 py-3 bg-[#0a0f1d] border-slate-700/80 focus:border-sky-400 text-slate-100 rounded-lg shadow-inner"
              autoFocus
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={SearchCheck}
            loading={isAnalyzing}
            className="sm:w-auto px-6 py-3 font-semibold tracking-wide"
          >
            Check Domain
          </Button>
        </form>

        {error && (
          <div className="mt-3 text-xs text-rose-400 flex items-center gap-1.5 font-medium">
            <ShieldAlert size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Sample Presets */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="text-xs text-slate-400 font-mono mb-2 flex items-center gap-1.5">
            <Sparkles size={13} className="text-sky-400" />
            <span>Quick Test Samples:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {samplePresets.map((preset) => (
              <button
                key={preset.domain}
                type="button"
                onClick={() => {
                  setDomainInput(preset.domain);
                  handleCheckDomain(preset.domain);
                }}
                className="px-2.5 py-1 text-xs rounded-md bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-sky-300 hover:border-sky-500/50 font-mono transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading state indicator */}
      {isAnalyzing && (
        <div className="p-8 rounded-2xl bg-[#0f172a] border border-slate-800 text-center animate-fadeIn">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="w-16 h-16 rounded-full border-4 border-sky-500/20 border-t-sky-400 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-sky-400">
              <Radar size={22} className="animate-pulse" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-slate-100 font-mono">
            INSPECTING TARGET DOMAIN
          </h3>
          <p className="text-xs text-sky-400 font-mono mt-1 animate-pulse">
            {analysisStep}
          </p>
        </div>
      )}

      {/* Analysis Result Card */}
      {result && !isAnalyzing && (
        <div className="space-y-6 animate-fadeIn">
          {/* Main Inspection Banner */}
          <div className="p-6 rounded-2xl bg-[#111a2e] border border-slate-800 shadow-2xl relative overflow-hidden">
            {/* Ambient background glow based on decision */}
            <div
              className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none ${
                result.decision === 'BLOCK'
                  ? 'bg-rose-500'
                  : result.decision === 'FLAG'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
            />

            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                  Target Domain Analysis
                </span>
                <div className="text-xl sm:text-2xl font-bold font-mono text-slate-100 break-all flex items-center gap-2">
                  <Globe size={22} className="text-sky-400 flex-shrink-0" />
                  <span>{result.domain}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {result.threat_type && (
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 block">Threat Classification</span>
                    <StatusBadge type="threat" value={result.threat_type} className="text-xs font-mono" />
                  </div>
                )}
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block">Final Decision</span>
                  <StatusBadge type="decision" value={result.decision} className="text-sm px-3.5 py-1" />
                </div>
              </div>
            </div>

            {/* 4 Core Pillars Grid: Blocklist, Threat Intel, AI/ML Analysis, Behavioral Analysis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
              {/* 1. Blocklist */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Blocklist
                </span>
                <div className="flex items-center gap-2">
                  {blocklistStatus === 'Clean' ? (
                    <ShieldCheck size={20} className="text-emerald-400" />
                  ) : (
                    <ShieldX size={20} className="text-rose-400" />
                  )}
                  <span
                    className={`text-base font-bold font-mono ${
                      blocklistStatus === 'Clean' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {blocklistStatus}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {blocklistStatus === 'Clean' ? 'Local policy: Unrestricted' : 'Local blocked-domain rule'}
                </span>
              </div>

              {/* 2. Threat Intelligence */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Threat Intelligence
                </span>
                <div className="flex items-center gap-2">
                  <Radar size={18} className="text-sky-400" />
                  <span
                    className={`text-base font-bold font-mono ${
                      threatIntelStatus === 'Clean' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {threatIntelStatus}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {result.threat_type && result.threat_type !== 'blocked_domain' && result.threat_type !== 'DGA_ML'
                    ? `Feed match: ${result.threat_type}`
                    : 'AbuseIPDB & Threat Feeds'}
                </span>
              </div>

              {/* 3. AI/ML Analysis */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  DGA / ML Analysis
                </span>
                <div className="flex items-center gap-2">
                  <Cpu size={18} className="text-purple-400" />
                  <span
                    className={`text-base font-bold font-mono ${
                      dgaMlStatus === 'High Risk' ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {dgaMlStatus}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {result.ml_confidence
                    ? `Confidence: ${(result.ml_confidence * 100).toFixed(1)}%`
                    : 'Lexical Random Forest Model'}
                </span>
              </div>

              {/* 4. Behavioral Analysis */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Behavioral Analysis
                </span>
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-amber-400" />
                  <span
                    className={`text-base font-bold font-mono ${
                      behavioralStatus === 'Normal'
                        ? 'text-emerald-400'
                        : behavioralStatus === 'Suspicious'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {behavioralStatus}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Cadence & DNS Tunneling check
                </span>
              </div>
            </div>

            {/* Risk Score Gauge & Human Explanation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 rounded-xl bg-[#0b111e] border border-slate-800">
              {/* Risk Score */}
              <div className="flex flex-col items-center justify-center p-4 text-center border-b md:border-b-0 md:border-r border-slate-800">
                <span className="text-xs font-mono uppercase text-slate-400 mb-2">
                  Risk Score
                </span>
                <div className="relative flex items-center justify-center">
                  <div className="text-4xl font-bold font-mono tracking-tight text-slate-100">
                    {currentScore}
                    <span className="text-base text-slate-500 font-normal">/100</span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${getRiskScoreBg(currentScore)}`}
                    style={{ width: `${currentScore}%` }}
                  />
                </div>

                <span className={`text-xs font-semibold font-mono mt-2 ${getRiskScoreColor(currentScore)}`}>
                  {currentRiskLevel}
                </span>
              </div>

              {/* Human-readable Reason explanation */}
              <div className="md:col-span-2 flex flex-col justify-center">
                <span className="text-xs font-mono uppercase text-slate-400 mb-1 flex items-center gap-1.5">
                  <Info size={14} className="text-sky-400" />
                  Decision Reason
                </span>
                <p className="text-sm text-slate-200 leading-relaxed font-sans mt-1">
                  {result.reason || 'No significant threat detected.'}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-4 text-xs font-mono text-slate-400">
                  <div>
                    <span className="text-slate-500">Resolved IP: </span>
                    <span className="text-slate-300">{result.ip_address || result.details?.ipAddress || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Entropy: </span>
                    <span className="text-slate-300">{result.entropy ?? result.details?.entropy ?? 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">AbuseIPDB Score: </span>
                    <span className="text-slate-300">
                      {result.abuse_confidence_score !== null && result.abuse_confidence_score !== undefined
                        ? `${result.abuse_confidence_score}%`
                        : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Enforcement: </span>
                    <span className="text-slate-300">
                      {result.decision === 'BLOCK'
                        ? 'Sinkhole / NXDOMAIN'
                        : result.decision === 'FLAG'
                        ? 'Policy Warning'
                        : 'Forward to Upstream'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
