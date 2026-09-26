# DNS Sentinel — Threat Intelligence & DNS Filtering SOC Dashboard

A commercial-grade, standalone React frontend for enterprise DNS filtering, threat intelligence ingestion, and deep packet inspection analytics. Designed specifically with a dark cybersecurity / SOC (Security Operations Center) visual aesthetic.

---

## 🛡️ Key Features

- **Cybersecurity SOC Dark Interface**: Purpose-built dark theme utilizing high-contrast typography, forensic monospace indicators, subtle glowing states, and responsive cards.
- **8 Dedicated Navigation Modules**:
  1. **Dashboard**: High-level SOC telemetry, queries over time, decision ratios, threat distribution, top domains, recent packet stream, and microservice status.
  2. **DNS Queries**: Real-time packet inspection table with live multi-field search, filters (Decision, Query Type, Threat Category), pagination, and an interactive packet inspection modal.
  3. **Blocked Domains**: Sinkhole repository management with search, category filtering, Add Domain modal, Delete/Unblock confirmation, bulk file import, and CSV/JSON export.
  4. **Domain Checker**: Interactive forensic domain scanner with multi-stage verification (Threat Feeds, AI/ML Lexical Entropy, Behavioral Burst Detector) with visual 0–100 risk score and human explanation.
  5. **Threat Intelligence**: Telemetry ingestion status across AbuseIPDB, URLHaus, AlienVault OTX, PhishTank, Spamhaus, and ThreatFox, with manual sync controls and severity metrics.
  6. **Analytics**: Recharts-powered graphs for hourly/daily volume, latency percentiles (p50, p75, p90, p95, p99), RR type distribution, and ranked endpoints.
  7. **System Status**: Real-time health monitors for 8 microservices (DNS Server, API Server, MySQL Database, DNS Cache, Threat Intel, AI/ML Detection, Behavioral Analysis, Logging) with test ping actions.
  8. **Settings**: UI controls for General, Upstream DNS resolvers, Security policies, API keys, Notification webhooks, and Appearance.

---

## 📁 Project Architecture

```
d:/DNS_Filtering_Frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   └── common/
│   │       ├── Button.jsx            # Reusable cyber button variants (primary, secondary, danger, etc.)
│   │       ├── Card.jsx              # Elevated SOC card container
│   │       ├── ChartCard.jsx         # Container tailored for Recharts
│   │       ├── DataTable.jsx         # Sortable, paginated table with empty state
│   │       ├── EmptyState.jsx        # Fallback view for empty filter queries
│   │       ├── ErrorState.jsx        # Error and retry handler
│   │       ├── FilterBar.jsx         # Modular dropdown filter bar
│   │       ├── LoadingState.jsx      # Cybersecurity radar scanner animation
│   │       ├── Modal.jsx             # Accessible backdrop modal dialog
│   │       ├── PageHeader.jsx        # Unified header with breadcrumbs and actions
│   │       ├── SearchBar.jsx         # Debounce-ready search input with clear button
│   │       ├── StatCard.jsx          # KPI card with trend indicators
│   │       └── StatusBadge.jsx       # Color-coded badges (ALLOW, BLOCK, FLAG, ONLINE, etc.)
│   ├── data/
│   │   └── mockData.js               # ISOLATED MOCK DATA STORE (Ready for API hookup)
│   ├── layouts/
│   │   ├── MainLayout.jsx            # Desktop + mobile responsive drawer layout
│   │   ├── Sidebar.jsx               # Navigation bar with engine metrics widget
│   │   └── Topbar.jsx                # UTC clock, cluster pill, and alerts popover
│   ├── pages/
│   │   ├── DashboardPage.jsx
│   │   ├── DnsQueriesPage.jsx
│   │   ├── BlockedDomainsPage.jsx
│   │   ├── DomainCheckerPage.jsx
│   │   ├── ThreatIntelligencePage.jsx
│   │   ├── AnalyticsPage.jsx
│   │   ├── SystemStatusPage.jsx
│   │   └── SettingsPage.jsx
│   ├── utils/
│   │   └── formatters.js             # Data formatters and client-side CSV/JSON exporters
│   ├── App.jsx                       # Main controller with Alt+1..8 keyboard navigation
│   ├── main.jsx                      # React 18 DOM mount
│   └── index.css                     # Dark cybersecurity theme styles & animations
├── index.html
├── package.json
└── vite.config.js
```

---

## 🔌 API Integration Readiness

All mock data is cleanly centralized in [`src/data/mockData.js`](file:///d:/DNS_Filtering_Frontend/src/data/mockData.js). To connect to a live backend service in the future:
1. Replace imports from `mockData.js` in page components with React Query or `fetch`/`axios` calls.
2. The data structures adhere directly to standard DNS packet formats and SIEM schemas (RFC 1035).

---

## 🚀 Running Locally

### Prerequisites
- Node.js v18+ (tested on Node.js v22)
- npm v9+

### Commands

```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev

# 3. Build for production
npm run build

# 4. Preview production build
npm run preview
```
