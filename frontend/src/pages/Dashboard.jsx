import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Activity, AlertOctagon, Users, Shield, CheckCircle, XCircle,
    Server, Database, Lock, UserPlus, FileText, Upload, ShieldCheck, AlertTriangle, Clock as ClockIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{title}</p>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>{value}</h3>
        </div>
        <div style={{ padding: '0.75rem', borderRadius: '0.75rem', backgroundColor: `${color}20`, color: color }}>
            <Icon size={28} />
        </div>
    </div >
);

const SectionTitle = ({ children }) => (
    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {children}
    </h3>
);

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/dashboard/stats');
                if (res.data.success) {
                    setStats(res.data.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div style={{ padding: '2rem' }}>Loading dashboard...</div>;

    const counts = stats?.counts || {};

    // Graph Data Example
    const graphData = [
        { name: 'Nouveau', count: counts.totalPending || 5, fill: '#eab308' },
        { name: 'Validé', count: counts.totalValidated || 2, fill: '#22c55e' },
        { name: 'Rejeté', count: counts.totalRejected || 1, fill: '#ef4444' },
    ];

    // --- VIEW: ANALYSTE ---
    if (user?.role === 'ANALYSTE') {
        return (
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <h2 style={{ marginBottom: '2rem' }}>Dashboard Analyste</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <StatCard title="Total alertes" value={counts.totalAlerts} icon={AlertTriangle} color="#6366f1" />
                    <StatCard title="Alertes critiques" value={stats?.riskStats?.critical || 0} icon={AlertOctagon} color="#ef4444" />
                    <StatCard title="Alertes moyennes" value={stats?.riskStats?.medium || 0} icon={Activity} color="#f59e0b" />
                    <StatCard title="Alertes traitées" value={(counts.totalValidated || 0) + (counts.totalRejected || 0)} icon={CheckCircle} color="#22c55e" />
                    <StatCard title="Alertes en attente" value={counts.totalPending} icon={ClockIcon} color="#eab308" />
                </div>
                <div className="card" style={{ height: '350px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem' }}>Évolution des alertes</h3>
                    <div style={{ width: '100%', height: '100%' }}>
                        <ResponsiveContainer width="100%" height="90%">
                            <BarChart data={graphData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                                <YAxis stroke="var(--text-secondary)" allowDecimals={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid var(--border)' }} itemStyle={{ color: '#fff' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW: AGENT ---
    if (user?.role === 'AGENT') {
        return (
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <h2 style={{ marginBottom: '2rem' }}>Dashboard Agent</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <StatCard title="Transactions Importées" value={counts.totalTransactions} icon={Activity} color="#3b82f6" />
                    <StatCard title="Fichiers CSV" value={counts.totalImportFiles || 0} icon={FileText} color="#10b981" />
                    <StatCard title="Alertes Générées" value={counts.totalAlerts} icon={AlertOctagon} color="#ef4444" />
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Dernière Détection</p>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
                            {stats?.counts?.lastDetection ? format(new Date(stats.counts.lastDetection), 'dd MMM, HH:mm') : '-'}
                        </h3>
                    </div>
                </div>
                <div className="card">
                    <SectionTitle>Activité Récente (Imports)</SectionTitle>
                    {stats?.recentImports && stats.recentImports.length > 0 ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '0.75rem' }}>Fichier</th>
                                    <th style={{ padding: '0.75rem' }}>Date</th>
                                    <th style={{ padding: '0.75rem' }}>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentImports.map((imp, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '0.75rem' }}>{imp.filename}</td>
                                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{imp.date ? format(new Date(imp.date), 'PPpp') : '-'}</td>
                                        <td style={{ padding: '0.75rem', color: '#10b981' }}>Succès</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : <p>Aucun import récent.</p>}
                </div>
            </div>
        );
    }

    // --- VIEW: ADMIN (DEFAULT) ---
    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '2rem' }}>Dashboard Admin</h2>

            {/* 1. Indicateurs Principaux */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <StatCard title="Utilisateurs" value={counts.totalUsers} icon={Users} color="#3b82f6" />
                <StatCard title="Transactions" value={counts.totalTransactions} icon={Activity} color="#10b981" />
                <StatCard title="Alertes en cours" value={counts.totalPending} icon={AlertOctagon} color="#ef4444" />
                <StatCard title="Règles Actives" value={counts.activeRules} icon={Shield} color="#eab308" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>

                {/* 2. Activité Récente */}
                <div style={{ gridColumn: 'span 8' }}>
                    <div className="card" style={{ height: '100%' }}>
                        <SectionTitle>Activité Récente</SectionTitle>
                        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {stats.recentActivity.slice(0, 7).map((log, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                minWidth: '32px', height: '32px', borderRadius: '50%',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                backgroundColor: log.action === 'LOGIN' ? 'rgba(59,130,246,0.1)' : log.action === 'DETECTION_RUN' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                                                color: log.action === 'LOGIN' ? '#3b82f6' : log.action === 'DETECTION_RUN' ? '#ef4444' : '#10b981'
                                            }}>
                                                {log.action === 'LOGIN' ? <Users size={16} /> : log.action === 'DETECTION_RUN' ? <ShieldCheck size={16} /> : <FileText size={16} />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 500 }}>{log.action.replace('_', ' ')}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    {log.username} - {log.details || 'Action système'}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                            {log.date ? format(new Date(log.date), 'dd MMM HH:mm') : '-'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p>Aucune activité.</p>}
                    </div>
                </div>

                {/* Right Column: Roles & System & Quick Actions */}
                <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* 3. Répartition des Rôles */}
                    <div className="card">
                        <SectionTitle>Répartition des Rôles</SectionTitle>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                <span>Admins</span>
                                <span style={{ fontWeight: 'bold' }}>{stats?.roles?.ADMIN || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                <span>Analystes</span>
                                <span style={{ fontWeight: 'bold' }}>{stats?.roles?.ANALYSTE || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                <span>Agents Bancaires</span>
                                <span style={{ fontWeight: 'bold' }}>{stats?.roles?.BANQUE || stats?.roles?.AGENT || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* 4. État du Système */}
                    <div className="card">
                        <SectionTitle>État du Système</SectionTitle>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                    <Server size={16} color="var(--text-secondary)" /> Backend
                                </div>
                                <CheckCircle size={16} color="#22c55e" />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                    <Database size={16} color="var(--text-secondary)" /> Neo4j
                                </div>
                                <CheckCircle size={16} color="#22c55e" />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                    <Lock size={16} color="var(--text-secondary)" /> JWT Auth
                                </div>
                                <CheckCircle size={16} color="#22c55e" />
                            </div>
                        </div>
                    </div>

                    {/* 5. Accès Rapides */}
                    <div className="card">
                        <SectionTitle>Accès Rapides</SectionTitle>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button onClick={() => navigate('/settings')} className="btn" style={{ justifyContent: 'flex-start', padding: '0.75rem', backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'none' }}>
                                <UserPlus size={18} style={{ marginRight: '0.5rem' }} /> Ajouter Utilisateur
                            </button>
                            <button onClick={() => navigate('/rules')} className="btn" style={{ justifyContent: 'flex-start', padding: '0.75rem', backgroundColor: 'rgba(234,179,8,0.1)', color: '#eab308', border: 'none' }}>
                                <Shield size={18} style={{ marginRight: '0.5rem' }} /> Gérer Règles
                            </button>
                            <button onClick={() => navigate('/settings')} className="btn" style={{ justifyContent: 'flex-start', padding: '0.75rem', backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'none' }}>
                                <Users size={18} style={{ marginRight: '0.5rem' }} /> Voir Utilisateurs
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;
