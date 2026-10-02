import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const GITHUB_URL = 'https://github.com/harshhhhss/DevPilot-AI';

const INK = '#15181E';
const MUTED = '#5B6573';
const LINE = '#E2E5E1';
const CANVAS = '#F6F7F4';
const SLATE = '#8A94A6';
const BLUE = '#2F5FE0';
const AMBER = '#D98C2B';
const GREEN = '#2F8F5B';

const STEPS = [
  {
    n: '01',
    title: 'Describe the goal in plain English',
    body: 'Open a project and type the sprint goal the way you would explain it to a teammate. No templates, no required fields.',
  },
  {
    n: '02',
    title: 'Review the AI-drafted backlog',
    body: 'Gemini returns user stories, acceptance criteria, priorities, and story points as an editable draft. Nothing is saved yet.',
  },
  {
    n: '03',
    title: 'Confirm, and it becomes a real sprint',
    body: 'Edit anything, delete what you do not want, then confirm. Only at that point does it touch the database.',
  },
];

const FEATURES = [
  {
    color: BLUE,
    title: 'Kanban board, built on Socket.IO',
    body: 'Real drag-and-drop across To Do, In Progress, In Review, and Done. Status changes broadcast live to everyone viewing the project.',
  },
  {
    color: AMBER,
    title: 'Bug tracker',
    body: 'Severity and status workflows, steps to reproduce, linked tasks, and threaded comments on every report.',
  },
  {
    color: GREEN,
    title: 'Six Gemini-powered AI assistants',
    body: 'Sprint planning, user story generation, task prioritization, bug analysis, risk scoring, and meeting summarization. Every one hands back a draft, never a finished product.',
  },
  {
    color: SLATE,
    title: 'Role-based access, enforced on the server',
    body: 'Five roles (Admin, Project Manager, Developer, Tester, Stakeholder), checked on every route. The interface hides what a role cannot do; the API refuses it independently either way.',
  },
  {
    color: BLUE,
    title: 'Real-time chat and notifications',
    body: 'Socket.IO keeps comments, project chat, and board updates live across every connected client, no refresh needed.',
  },
  {
    color: AMBER,
    title: 'Analytics dashboards',
    body: 'Task and bug breakdowns, team workload, sprint progress, and an AI-generated risk score, organization-wide and per project.',
  },
];

const STACK = ['React', 'Vite', 'Tailwind CSS', 'Node.js', 'Express', 'MongoDB', 'Socket.IO', 'Gemini'];

function MockCard({ title, ticket, tag }) {
  return (
    <div className="rounded-md border p-2.5" style={{ borderColor: LINE, backgroundColor: '#FFFFFF' }}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-['Manrope'] text-[13px] leading-snug" style={{ color: INK }}>
          {title}
        </p>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-['JetBrains_Mono'] text-[10px] tracking-tight" style={{ color: MUTED }}>
          {ticket}
        </span>
        {tag && (
          <span
            className="rounded font-['JetBrains_Mono'] text-[9px] font-medium uppercase tracking-wide"
            style={{ color: AMBER, backgroundColor: `${AMBER}1a`, padding: '2px 5px' }}
          >
            AI-drafted
          </span>
        )}
      </div>
    </div>
  );
}

function MockColumn({ label, color, count, children }) {
  return (
    <div className="w-40 flex-none sm:w-44">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ backgroundColor: color }} />
        <span className="font-['JetBrains_Mono'] text-[10px] font-medium uppercase tracking-wide" style={{ color: MUTED }}>
          {label}
        </span>
        <span className="font-['JetBrains_Mono'] text-[10px]" style={{ color: MUTED }}>
          {count}
        </span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function KanbanMockup() {
  return (
    <div
      className="w-full rounded-lg border p-4 shadow-sm"
      style={{ borderColor: LINE, backgroundColor: '#FBFBFA' }}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="font-['JetBrains_Mono'] text-[10px]" style={{ color: MUTED }}>
          /projects/ecommerce-platform/kanban
        </span>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: GREEN }} />
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        <MockColumn label="To Do" color={SLATE} count={3}>
          <MockCard title="Write API docs for /tasks" ticket="ECOM-203" tag />
          <MockCard title="Add rate limiting to search API" ticket="ECOM-139" />
        </MockColumn>
        <MockColumn label="In Progress" color={BLUE} count={2}>
          <MockCard title="Stripe webhook retry logic" ticket="ECOM-118" />
          <MockCard title="Fix checkout validation error" ticket="ECOM-142" />
        </MockColumn>
        <MockColumn label="Done" color={GREEN} count={4}>
          <MockCard title="JWT authentication" ticket="ECOM-101" />
        </MockColumn>
      </div>
    </div>
  );
}

function PrimaryLink({ to, children }) {
  return (
    <Link
      to={to}
      className="rounded-md px-5 py-2.5 font-['Manrope'] text-sm font-semibold text-white transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ backgroundColor: BLUE, outlineColor: BLUE }}
    >
      {children}
    </Link>
  );
}

function SecondaryLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 rounded-md border px-5 py-2.5 font-['Manrope'] text-sm font-semibold transition-colors hover:bg-black/[0.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ borderColor: LINE, color: INK, outlineColor: BLUE }}
    >
      {children}
    </a>
  );
}

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  // The landing page has its own fixed, light-only palette regardless of the
  // signed-in app's theme preference — it's a distinct marketing surface, not
  // part of the themeable shell. Suspend the 'dark' class while it's mounted.
  useEffect(() => {
    const wasDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.remove('dark');
    return () => {
      if (wasDark) document.documentElement.classList.add('dark');
    };
  }, []);

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen font-['Manrope']" style={{ backgroundColor: CANVAS, color: INK }}>
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold text-white"
            style={{ backgroundColor: BLUE }}
          >
            D
          </div>
          <span className="text-[15px] font-bold">DevPilot AI</span>
        </div>
        <nav className="flex items-center gap-5">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden text-sm font-medium sm:block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: MUTED, outlineColor: BLUE }}
          >
            GitHub
          </a>
          <Link
            to="/login"
            className="rounded-md px-4 py-2 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ backgroundColor: BLUE, outlineColor: BLUE }}
          >
            Sign in
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-5 py-10 sm:px-8 lg:grid-cols-2 lg:gap-8 lg:py-16">
        <div>
          <h1 className="text-[2.1rem] font-extrabold leading-[1.12] tracking-tight sm:text-[2.6rem]" style={{ color: INK }}>
            Describe the sprint. DevPilot drafts the backlog. You decide what&apos;s real.
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed" style={{ color: MUTED }}>
            Projects and sprints with a Kanban board you can actually drag cards across. A bug tracker with real
            severity and status workflows. Six Gemini-powered assistants that read your goals, tasks, and bugs,
            then hand back a draft for you to accept, edit, or throw away.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <PrimaryLink to="/login">Sign in</PrimaryLink>
            <SecondaryLink href={GITHUB_URL}>View on GitHub</SecondaryLink>
          </div>
          <p className="mt-5 font-['JetBrains_Mono'] text-xs" style={{ color: MUTED }}>
            /login · seeded accounts for every role, password DevPilot@Demo123
          </p>
        </div>

        <KanbanMockup />
      </section>

      {/* How it works */}
      <section className="border-t" style={{ borderColor: LINE }}>
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <h2 className="text-xl font-bold sm:text-2xl" style={{ color: INK }}>
            How it works
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n}>
                <span className="text-sm font-bold" style={{ color: BLUE }}>
                  {step.n}
                </span>
                <h3 className="mt-2 text-[15px] font-bold" style={{ color: INK }}>
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: MUTED }}>
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t" style={{ borderColor: LINE }}>
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <h2 className="text-xl font-bold sm:text-2xl" style={{ color: INK }}>
            What&apos;s actually built
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-md border sm:grid-cols-2" style={{ borderColor: LINE, backgroundColor: LINE }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="border-l-4 p-5" style={{ borderLeftColor: f.color, backgroundColor: '#FFFFFF' }}>
                <h3 className="text-[15px] font-bold" style={{ color: INK }}>
                  {f.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: MUTED }}>
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why the AI is boring on purpose */}
      <section className="border-t" style={{ borderColor: LINE }}>
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold sm:text-2xl" style={{ color: INK }}>
              The AI is boring on purpose
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed" style={{ color: MUTED }}>
              Every assistant in DevPilot follows the same rule. It reads your data, writes a structured draft, and
              stops. Nothing it generates touches the database until a human reviews it and confirms, field by
              field if they want to. A sprint plan does not become real tasks until the Project Manager accepts it.
              A meeting summary does not become a saved record until someone checks it over.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed" style={{ color: MUTED }}>
              If Gemini is unavailable, misconfigured, or returns something that does not parse, the request fails
              with a clear error and the form stays open for manual entry. Nothing gets faked to look like it
              worked.
            </p>
          </div>
        </div>
      </section>

      {/* Stack */}
      <section className="border-t" style={{ borderColor: LINE }}>
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {STACK.map((item, i) => (
              <span key={item} className="flex items-center gap-6">
                <span className="text-sm font-medium" style={{ color: MUTED }}>
                  {item}
                </span>
                {i < STACK.length - 1 && (
                  <span aria-hidden="true" className="h-1 w-1 rounded-full" style={{ backgroundColor: LINE }} />
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: LINE }}>
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 py-8 sm:flex-row sm:items-center sm:px-8">
          <p className="text-sm" style={{ color: MUTED }}>
            Local, demo deployment. Every role has a seeded account, sign in and look around.
          </p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: INK, outlineColor: BLUE }}
          >
            Source on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
