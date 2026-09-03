# CareOS 🏥

**Open-source digital health platform for India** — connecting your entire healthcare journey in one place.

> ⚠️ **Current status:** Demo / Alpha — the patient-facing dashboard is fully functional with realistic demo data. Provider and Admin portals are on the roadmap. See the [Architecture](#architecture) section for the full picture.

---

## What is CareOS?

CareOS is a production-grade, open-source healthcare platform designed for the Indian market, built with the following principles at its core:

- **Privacy-first** — Patient data is isolated using Row-Level Security
- **Accessibility** — Clean, responsive UI that works on every device
- **Interoperability** — Structurally aligned with India's ABDM / ABHA framework
- **Responsible AI** — AI features carry clear disclaimers and are never presented as medical advice

### Current Features

| Module | Status |
|---|---|
| Landing Page | ✅ Complete |
| Authentication (Email + OAuth) | ✅ Complete |
| Patient Dashboard | ✅ Complete (demo data) |
| Health Record | ✅ Complete (demo data) |
| Care Timeline | ✅ Complete (demo data) |
| Appointments | ✅ Complete (demo data) |
| Medical Reports | ✅ Complete (demo data) |
| Medications | ✅ Complete (demo data) |
| Provider Portal | 🚧 Roadmap |
| Admin Portal | 🚧 Roadmap |
| AI Assistant | 🚧 Roadmap |
| Real PHR Backend | 🚧 Roadmap |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 + TypeScript 5 |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Auth + DB | Supabase (PostgreSQL + GoTrue) |
| Deployment | Vercel / Netlify |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20.0.0
- **npm** ≥ 9.0.0
- A free [Supabase](https://supabase.com) account

### 1. Clone the repository

```bash
git clone https://github.com/your-username/careos.git
cd careos
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> **Where to find these:** Supabase Dashboard → Settings → API

### 4. Set up the Supabase database

Run the migration SQL in your Supabase SQL Editor:

```
supabase/migrations/001_initial_schema.sql
```

This creates the `profiles` and `datasets` tables, enables Row-Level Security, and sets up the auto-profile trigger.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | Run TypeScript type checking |

---

## Project Structure

```
careos/
├── public/                         # Static assets
├── src/
│   ├── components/
│   │   ├── Auth/                   # Toast, PasswordMeter, UserProfileModal
│   │   ├── layout/                 # Sidebar, TopBar, DashboardShell
│   │   └── shared/                 # DemoBanner, AIDisclaimer, EmptyState
│   ├── context/
│   │   ├── AppContext.tsx          # Global UI state (role, page, sidebar)
│   │   └── AuthContext.tsx         # Authentication state (Supabase)
│   ├── lib/
│   │   └── supabaseClient.ts       # Supabase client initialization
│   ├── pages/
│   │   ├── landing/                # Public marketing page (11 sections)
│   │   └── patient/                # Authenticated patient portal
│   ├── services/
│   │   ├── authService.ts          # Auth operations (sign-in/up/out/OAuth)
│   │   └── mockData.ts             # ⚠️ Demo data (replace with real API)
│   ├── types/
│   │   └── careos.ts               # Full domain type definitions
│   ├── App.tsx                     # Root router (landing/auth/dashboard)
│   └── index.css                   # Design system + Tailwind v4
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # DB schema + RLS policies
├── .env.example                    # Environment variable template
├── vercel.json                     # Vercel deployment config + headers
└── netlify.toml                    # Netlify deployment config + headers
```

---

## Architecture

```
Browser (React SPA)
    │
    ├── Landing Page (public, no auth)
    ├── Auth Page (Supabase GoTrue)
    └── Dashboard Shell (authenticated)
           ├── Patient Portal (fully demo)
           ├── Provider Portal (roadmap)
           └── Admin Portal (roadmap)
                     │
               Supabase Backend
               ├── PostgreSQL (profiles, datasets tables)
               ├── Row-Level Security (per-user isolation)
               └── GoTrue Auth (email + OAuth)
```

**Current data flow:** All patient-facing data (appointments, medications, reports, timeline) is served from `src/services/mockData.ts`. The Supabase database currently only stores user profiles and dataset upload history. Connecting the patient modules to a real Supabase backend is the primary next engineering step.

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel Dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy — Vercel auto-detects Vite

### Netlify

1. Push to GitHub
2. Import in [Netlify](https://netlify.com)
3. The `netlify.toml` configures everything automatically
4. Add environment variables in Site Settings → Environment Variables

---

## Security

### What is protected

- **Row-Level Security** enforces that each user can only read/write their own data in Supabase
- **Environment variables** — the Supabase anon key is safe to expose client-side; it's restricted by RLS policies
- **No service_role key** is ever used client-side
- **Security headers** are configured in both `vercel.json` and `netlify.toml`

### Reporting a vulnerability

Please do **not** open a public GitHub issue for security vulnerabilities.  
Email us directly at: **security@careos.health** (or open a private GitHub Security Advisory).

---

## Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create a feature branch:** `git checkout -b feature/your-feature-name`
3. **Make your changes** following the code style
4. **Run type checking:** `npm run typecheck`
5. **Submit a pull request** with a clear description

### Code style guidelines

- TypeScript strict mode — no `any` types
- All components should have named exports (not default exports)
- Use the CareOS design system classes (`co-btn`, `co-card`, etc.) rather than raw Tailwind for UI consistency
- Mock data must be clearly labeled with `⚠️ DEMO DATA` comments
- AI features must include `<AIDisclaimer />` component

### Good first issues

- [ ] Add dark mode toggle (context is wired, UI toggle is commented out)
- [ ] Implement the `Profile Settings` page
- [ ] Build the Provider Portal dashboard
- [ ] Connect patient data to a real Supabase backend
- [ ] Add i18n support (Hindi, Tamil, Telugu)

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Disclaimer

CareOS is **not a medical device** and does not provide medical advice. All information displayed is for informational purposes only. AI features are clearly marked as demo and do not constitute clinical guidance. Always consult a qualified healthcare professional for medical decisions.

---

*Built with ❤️ for India's healthcare future — React + Vite + Tailwind CSS + Supabase*
