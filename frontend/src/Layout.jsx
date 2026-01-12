import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { LayoutDashboard, FileText, AlertTriangle, Upload, LogOut, ShieldCheck, Users as UsersIcon, Clock, Shield, Settings, History, Network, Bell, ClipboardCheck } from 'lucide-react';

const Layout = () => {
    const { logout, user } = useAuth();
    const location = useLocation();

    let navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/transactions', label: 'Transactions', icon: FileText },
        { path: '/alerts', label: 'Alerts', icon: AlertTriangle },
        { path: '/upload', label: 'Upload Data', icon: Upload },
    ];

    if (user?.role === 'ADMIN') {
        navItems = [
            { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/users', label: 'Users', icon: UsersIcon },
            { path: '/rules', label: 'Fraud Rules', icon: Shield },
            { path: '/logs', label: 'System Logs', icon: Clock },
            { path: '/settings', label: 'Settings', icon: Settings }
        ];
    } else if (user?.role === 'AGENT') {
        navItems = [
            { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/upload', label: 'Import Transactions', icon: Upload },
            { path: '/detection', label: 'Run Detection', icon: ShieldCheck },
            { path: '/alerts', label: 'Alerts', icon: AlertTriangle },
            { path: '/import-history', label: 'Import History', icon: History }
        ];
    } else if (user?.role === 'ANALYSTE') {
        // EXACT USER STRUCTURE
        navItems = [
            { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { path: '/alerts', label: 'Alertes', icon: Bell },
            { path: '/graph-viewer', label: 'Graph Viewer', icon: Network },
            { path: '/transaction-details', label: 'Détails transaction', icon: FileText },
            { path: '/decision', label: 'Décision', icon: ClipboardCheck }
        ];
    }

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <aside style={{ width: '260px', backgroundColor: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ShieldCheck size={32} color="var(--accent)" />
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>GraphShield</h1>
                </div>

                <nav style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '0.5rem',
                                    color: isActive ? 'white' : 'var(--text-secondary)',
                                    backgroundColor: isActive ? 'var(--accent)' : 'transparent',
                                    marginBottom: '0.5rem',
                                    fontWeight: 500
                                }}
                            >
                                <Icon size={20} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-card)' }}>
                    <div style={{ marginBottom: '1rem', padding: '0 0.5rem' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>{user?.username}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user?.role}</div>
                    </div>
                    <button
                        onClick={logout}
                        className="btn"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>
            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', height: '100vh' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
