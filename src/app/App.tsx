import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  CircleHelp,
  Database,
  FlaskConical,
  Gauge,
  GitCompareArrows,
  LayoutDashboard,
  Menu,
  Moon,
  Settings2,
  Sun,
  X,
  CircleDollarSign,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  LoaderCircle,
} from 'lucide-react';
import type { Dataset } from '../types';
import { loadDataset } from '../data/load';
import { AppProvider, useApp } from './context';
import { useRoute, navigate } from '../hooks/useRoute';
import { EmptyState } from '../components/UI';
const Dashboard = lazy(() => import('../pages/Dashboard'));
const DatabasePage = lazy(() => import('../pages/Database'));
const Well = lazy(() => import('../pages/Well'));
const Selection = lazy(() => import('../pages/Selection'));
const Comparison = lazy(() => import('../pages/Comparison'));
const Cost = lazy(() => import('../pages/Cost'));
const References = lazy(() => import('../pages/References'));
const Settings = lazy(() => import('../pages/Settings'));
const modules = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/well', label: 'Well Conditions', icon: Gauge },
  { path: '/selection', label: 'Material Selection', icon: FlaskConical },
  { path: '/comparison', label: 'Material Comparison', icon: GitCompareArrows },
  { path: '/database', label: 'Materials Database', icon: Database },
  { path: '/cost', label: 'Cost Analysis', icon: CircleDollarSign },
  { path: '/references', label: 'Engineering References', icon: BookOpen },
  { path: '/settings', label: 'Settings', icon: Settings2 },
];
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: string }> {
  state = { error: '' };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message || 'An unexpected application error occurred.' };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('OCTG application error', error, info.componentStack);
  }
  render() {
    return this.state.error ? (
      <main className="startup-state">
        <div className="startup-mark">O</div>
        <h1>Unable to display this workspace</h1>
        <p>{this.state.error}</p>
        <button className="button primary" onClick={() => window.location.reload()}>
          Reload application
        </button>
        <p>Your original source files and saved browser scenarios have not been changed.</p>
      </main>
    ) : (
      this.props.children
    );
  }
}
function Shell() {
  const { dataset, comparison, toggleComparison, theme, setTheme, notice } = useApp();
  const { path } = useRoute();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    setMobile(false);
  }, [path]);
  const active = modules.find((item) => item.path === path);
  const page =
    path === '/' ? (
      <Dashboard />
    ) : path === '/database' ? (
      <DatabasePage />
    ) : path === '/well' ? (
      <Well />
    ) : path === '/selection' ? (
      <Selection />
    ) : path === '/comparison' ? (
      <Comparison />
    ) : path === '/cost' ? (
      <Cost />
    ) : path === '/references' ? (
      <References />
    ) : path === '/settings' ? (
      <Settings />
    ) : (
      <EmptyState
        title="Page not found"
        action={
          <button className="button primary" onClick={() => navigate('/')}>
            Go to dashboard
          </button>
        }
      >
        This route is not part of the current workspace.
      </EmptyState>
    );
  return (
    <div
      className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''} ${mobile ? 'mobile-nav-open' : ''}`}
    >
      <a
        href="#main-content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        Skip to main content
      </a>
      {mobile && (
        <button
          className="sidebar-scrim"
          onClick={() => setMobile(false)}
          aria-label="Close navigation"
        />
      )}
      <aside className="sidebar" aria-label="Primary navigation">
        <a className="brand" href="#/" aria-label="OCTG Materials Intelligence dashboard">
          <span className="brand-mark">
            <svg width="31" height="34" viewBox="0 0 31 34" aria-hidden="true">
              <path
                d="M15.5 1L29 8.8V25.2L15.5 33L2 25.2V8.8Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path d="M15.5 7L24 12V22L15.5 27L7 22V12Z" fill="none" stroke="currentColor" />
              <path d="M15.5 12L20 14.5V19.5L15.5 22L11 19.5V14.5Z" fill="currentColor" />
            </svg>
          </span>
          <span className="brand-text">
            <strong>
              OCTG<span> /</span>
            </strong>
            <small>MATERIALS INTELLIGENCE</small>
          </span>
        </a>
        <button
          className="mobile-close icon-button"
          aria-label="Close sidebar"
          onClick={() => setMobile(false)}
        >
          <X size={20} />
        </button>
        <div className="nav-heading">WORKSPACE</div>
        <nav>
          {modules.slice(0, 6).map(({ path: route, label, icon: Icon }) => (
            <a
              key={route}
              href={`#${route}`}
              title={collapsed ? label : undefined}
              className={`nav-link ${path === route ? 'active' : ''}`}
              aria-current={path === route ? 'page' : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
              {route === '/database' && <small>{dataset.materials.length}</small>}
              {route === '/comparison' && comparison.length > 0 && (
                <small>{comparison.length}</small>
              )}
            </a>
          ))}
        </nav>
        <div className="nav-heading resources-label">REFERENCES</div>
        <nav>
          {modules.slice(6).map(({ path: route, label, icon: Icon }) => (
            <a
              key={route}
              href={`#${route}`}
              title={collapsed ? label : undefined}
              className={`nav-link ${path === route ? 'active' : ''}`}
              aria-current={path === route ? 'page' : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-assurance">
            <ShieldCheck size={20} />
            <strong>Engineering review</strong>
            <p>
              Screening is preliminary. Verify source data and qualification separately.
            </p>
            <a href="#/references">
              Methodology & references
              <ArrowRight size={13} />
            </a>
          </div>
          <button
            className="collapse-button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            <span>Collapse navigation</span>
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={21} />
            </button>
            <span>{active?.label || 'Not found'}</span>
          </div>
          <div className="topbar-right">
            <button
              className="icon-button"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <a
              href="#/references"
              className="icon-button"
              aria-label="Engineering references and help"
            >
              <CircleHelp size={18} />
            </a>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="main-content">
          <Suspense
            fallback={
              <div className="page-loading">
                <LoaderCircle className="spin" size={22} />
                Loading module…
              </div>
            }
          >
            {page}
          </Suspense>
        </main>
        {comparison.length > 0 && path !== '/comparison' && (
          <div className="comparison-tray">
            <div>
              <GitCompareArrows size={18} />
              <strong>
                Compare <span>{comparison.length}/4</span>
              </strong>
              <div className="tray-chips">
                {comparison.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => toggleComparison(m)}
                    aria-label={`Remove ${m.grade} from comparison`}
                  >
                    {m.grade}
                    <X size={11} />
                  </button>
                ))}
              </div>
            </div>
            <button className="button primary small-button" onClick={() => navigate('/comparison')}>
              View comparison
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
      {notice && (
        <div className="toast" role="status">
          <span className="toast-dot" />
          {notice}
        </div>
      )}
    </div>
  );
}
export default function App() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    loadDataset(controller.signal)
      .then(setDataset)
      .catch((error) => {
        if (error?.name !== 'AbortError')
          setError(error instanceof Error ? error.message : 'Data could not be loaded.');
      });
    return () => controller.abort();
  }, []);
  if (error)
    return (
      <main className="startup-state">
        <div className="startup-mark">O</div>
        <h1>The source library could not be loaded</h1>
        <p>{error}</p>
        <p>Check your connection and the deployed data files, then reload to retry.</p>
        <button className="button primary" onClick={() => window.location.reload()}>
          Retry data loading
        </button>
      </main>
    );
  if (!dataset)
    return (
      <main className="startup-state">
        <div className="startup-mark">O</div>
        <h1>OCTG Materials Intelligence</h1>
        <p>
          <LoaderCircle size={18} className="spin" />
          Loading and validating the source library…
        </p>
      </main>
    );
  return (
    <AppProvider dataset={dataset}>
      <Shell />
    </AppProvider>
  );
}
