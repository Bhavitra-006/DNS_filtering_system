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

import { DOMAIN_CHECKER_PRESETS, generateDomainAnalysis } from '../data/mockData';

export default function DomainCheckerPage() {
  const [domainInput, setDomainInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const samplePresets = [
    { label: 'Clean (Google)', domain: 'google.com' },
    { label: 'Phishing Brand Spoof', domain: 'paypal-security-login-auth.xyz' },
    { label: 'Malware C2 Beacon', domain: 'x7a9-cdn-beacon.top' },
    { label: 'DGA High-Entropy', domain: 'dga-81bca09fe.cc' },
    { label: 'DNS Tunneling Exfil', domain: 'tunnel-data-exfil.biz' },
    { label: 'Clean (Cloudflare)', domain: 'cloudflare.com' },
  ];

  const handleCheckDomain = (targetDomain) => {
    const domainToCheck = (targetDomain || domainInput).trim();
    if (!domainToCheck) {
      setError('Please provide a valid domain name to inspect.');
      return;
    }

    setError('');
    setIsAnalyzing(true);
    setResult(null);

    // Multi-stage scan animation
    setAnalysisStep('Querying Threat Feeds (AbuseIPDB, URLHaus, AlienVault)...');

    setTimeout(() => {
      setAnalysisStep('Running AI/ML DGA & Entropy Classifier...');
    }, 450);

    setTimeout(() => {
      setAnalysisStep('Evaluating Behavioral Patterns & Subdomain Length...');
    }, 850);

    setTimeout(() => {
      const data = generateDomainAnalysis(domainToCheck);
      setResult(data);
      setIsAnalyzing(false);
      setAnalysisStep('');
    }, 1200);
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Interactive Domain Security Checker"
        subtitle="Multi-engine forensic inspection of domain reputations, lexical entropy, and threat indicators"
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
              placeholder="e.g. secure-login-account-update.xyz or github.com"
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
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block">Enforcement Decision</span>
                  <StatusBadge type="decision" value={result.decision} className="text-sm px-3.5 py-1" />
                </div>
              </div>
            </div>

            {/* 4 Core Pillars Grid: Decision, Threat Intel, AI/ML Analysis, Behavioral Analysis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
              {/* Decision */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Decision
                </span>
                <div className="flex items-center gap-2">
                  {result.decision === 'ALLOW' && <ShieldCheck size={20} className="text-emerald-400" />}
                  {result.decision === 'BLOCK' && <ShieldX size={20} className="text-rose-400" />}
                  {result.decision === 'FLAG' && <ShieldAlert size={20} className="text-amber-400" />}
                  <span className="text-base font-bold font-mono text-slate-100">
                    {result.decision}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {result.decision === 'ALLOW' ? 'Whitelisted / Benign' :
                   result.decision === 'BLOCK' ? 'Sinkholed / Intercepted' :
                   'Flagged for Telemetry'}
                </span>
              </div>

              {/* Threat Intelligence */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Threat Intelligence
                </span>
                <div className="flex items-center gap-2">
                  <Radar size={18} className="text-sky-400" />
                  <span className={`text-base font-bold font-mono ${
                    result.threatIntel === 'Clean' ? 'text-emerald-400' :
                    result.threatIntel === 'Malicious' ? 'text-rose-400' : 'text-slate-300'
                  }`}>
                    {result.threatIntel}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Feed correlation: {result.threatCategory}
                </span>
              </div>

              {/* AI/ML Analysis */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  AI/ML Analysis
                </span>
                <div className="flex items-center gap-2">
                  <Cpu size={18} className="text-purple-400" />
                  <span className={`text-base font-bold font-mono ${
                    result.aiMlAnalysis === 'Benign' ? 'text-emerald-400' :
                    result.aiMlAnalysis === 'DGA' ? 'text-purple-400' : 'text-rose-400'
                  }`}>
                    {result.aiMlAnalysis}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Entropy & n-gram classifier
                </span>
              </div>

              {/* Behavioral Analysis */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Behavioral Analysis
                </span>
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-amber-400" />
                  <span className={`text-base font-bold font-mono ${
                    result.behavioralAnalysis === 'Normal' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {result.behavioralAnalysis}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Burst rate & query cadence
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
                    {result.riskScore}
                    <span className="text-base text-slate-500 font-normal">/100</span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${getRiskScoreBg(result.riskScore)}`}
                    style={{ width: `${result.riskScore}%` }}
                  />
                </div>

                <span className={`text-xs font-semibold font-mono mt-2 ${getRiskScoreColor(result.riskScore)}`}>
                  {result.riskLevel}
                </span>
              </div>

              {/* Human-readable Reason explanation */}
              <div className="md:col-span-2 flex flex-col justify-center">
                <span className="text-xs font-mono uppercase text-slate-400 mb-1 flex items-center gap-1.5">
                  <Info size={14} className="text-sky-400" />
                  Threat Engine Rationale
                </span>
                <p className="text-sm text-slate-200 leading-relaxed font-sans mt-1">
                  {result.reason}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-4 text-xs font-mono text-slate-400">
                  <div>
                    <span className="text-slate-500">Registrar: </span>
                    <span className="text-slate-300">{result.details.registrar}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Created: </span>
                    <span className="text-slate-300">{result.details.createdDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Entropy: </span>
                    <span className="text-slate-300">{result.details.entropy}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Simulated IP: </span>
                    <span className="text-slate-300">{result.details.ipAddress}</span>
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
