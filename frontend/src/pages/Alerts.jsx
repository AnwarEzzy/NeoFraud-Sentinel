import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Eye, Search, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const safeFormatDate = (dateStr) => {
    try {
        if (!dateStr) return '-';
        return format(new Date(dateStr), 'PPpp');
    } catch { return 'Invalid Date'; }
};

const Alerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const res = await api.get('/alerts');
                if (res.data.success) {
                    setAlerts(res.data.data);
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchAlerts();
    }, []);

    // Helper to sanitize data for navigation state
    const navigateTo = (path, alertData) => {
        const safeData = {
            alert: { ...alertData.alert },
            transaction: { ...alertData.transaction },
            userInfo: { ...alertData.userInfo }
        };
        navigate(path, { state: { alertData: safeData } });
    };

    const handleViewDetails = (alertData) => navigateTo('/transaction-details', alertData);
    const handleAnalyze = (alertData) => navigateTo('/graph-viewer', alertData);
    const handleComment = (alertData) => navigateTo('/decision', alertData);



    return (
        <div>
            <h2 style={{ marginBottom: '2rem' }}>Alertes</h2>



            <div className="card" style={{ padding: 0, overflow: 'auto' }}>
                {loading ? <div style={{ padding: '2rem' }}>Loading...</div> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                {/* Liste des alertes avec les champs: Exact naming */}
                                <th style={{ padding: '1rem' }}>Alert ID</th>
                                <th style={{ padding: '1rem' }}>Transaction ID</th>
                                <th style={{ padding: '1rem' }}>Type de fraude</th>
                                <th style={{ padding: '1rem' }}>Score de risque</th>
                                <th style={{ padding: '1rem' }}>Statut</th>
                                <th style={{ padding: '1rem' }}>Date & heure</th>
                                <th style={{ padding: '1rem' }}>Montant</th>
                                <th style={{ padding: '1rem' }}>Utilisateur concerné</th>
                                {user?.role !== 'AGENT' && <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {alerts.map(({ alert, transaction, userInfo }) => (
                                <tr key={alert.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{alert.id.substring(0, 8)}...</td>
                                    <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{transaction.txId}</td>
                                    <td style={{ padding: '1rem' }}>{alert.rule}</td>
                                    <td style={{ padding: '1rem' }}>{alert.severity === 'CRITICAL' ? 95 : 70}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem', borderRadius: '4px',
                                            backgroundColor: alert.status === 'NEW' ? 'rgba(234,179,8,0.2)' : alert.status === 'VALIDATED' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                                            color: alert.status === 'NEW' ? '#fbbf24' : alert.status === 'VALIDATED' ? '#4ade80' : '#f87171'
                                        }}>
                                            {alert.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>{safeFormatDate(alert.createdAt || alert.date)}</td>
                                    <td style={{ padding: '1rem' }}>{transaction.amount}</td>
                                    <td style={{ padding: '1rem' }}>{userInfo?.username || 'Utilisateur Inconnu'}</td>
                                    {user?.role !== 'AGENT' && (
                                        <td style={{ padding: '1rem', textAlign: 'center', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                            <button title="Voir détails" onClick={() => handleViewDetails({ alert, transaction, userInfo })} className="btn-icon" style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}><Eye size={18} /></button>
                                            <button title="Analyser" onClick={() => handleAnalyze({ alert, transaction, userInfo })} className="btn-icon" style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer' }}><Search size={18} /></button>
                                            <button title="Ajouter commentaire" onClick={() => handleComment({ alert, transaction, userInfo })} className="btn-icon" style={{ background: 'none', border: 'none', color: '#eab308', cursor: 'pointer' }}><FileText size={18} /></button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Alerts;
