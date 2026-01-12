import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { format } from 'date-fns';
import api from '../api/axios';

const TransactionDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // State to hold data (initially from navigation, updateable via search)
    const [data, setData] = useState(location.state?.alertData || null);
    const [searchId, setSearchId] = useState('');
    const [loading, setLoading] = useState(false);

    // Update internal state if navigation state changes
    useEffect(() => {
        if (location.state?.alertData) {
            setData(location.state.alertData);
        }
    }, [location.state]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchId) return;
        setLoading(true);
        try {
            const res = await api.get(`/transactions/${searchId}`);
            if (res.data.success) {
                const txData = res.data.data;
                const firstAlert = txData.alerts && txData.alerts.length > 0 ? txData.alerts[0] : { rule: 'N/A', status: 'N/A' };
                // Backend now returns 'user' object with username
                const user = txData.user || (txData.account ? { username: txData.account.username } : { username: 'Unknown' });

                setData({
                    transaction: txData.transaction,
                    alert: firstAlert,
                    userInfo: user
                });
            } else {
                alert("Transaction introuvable");
            }
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la recherche");
        } finally {
            setLoading(false);
        }
    };

    if (!data && !loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', maxWidth: '500px', margin: '0 auto' }}>
                        <input
                            type="text"
                            className="input"
                            placeholder="Rechercher transaction ID..."
                            value={searchId}
                            onChange={e => setSearchId(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#fff',
                                borderRadius: '0.5rem',
                                outline: 'none',
                                fontSize: '1rem'
                            }}
                        />
                        <button type="submit" className="btn btn-primary"><Search size={18} /></button>
                    </form>
                </div>
                <h3>Aucune transaction sélectionnée</h3>
                <p style={{ marginBottom: '1rem' }}>Veuillez sélectionner une alerte ou rechercher une transaction.</p>
                <button onClick={() => navigate('/alerts')} className="btn btn-primary">
                    Aller aux Alertes
                </button>
            </div>
        );
    }

    const { transaction, alert, userInfo } = data || {};

    // Helper for safe date formatting
    const safeFormat = (date) => {
        try {
            if (!date) return '-';
            return format(new Date(date), 'PPpp');
        } catch (e) {
            return 'Date invalide';
        }
    };

    // Champs affichés: Transaction ID, Date, Montant, Devise, Marchand, Pays, Adresse IP, Appareil, Utilisateur, Règles déclenchées
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <button onClick={() => navigate('/alerts')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', gap: '0.5rem' }}>
                    <ArrowLeft size={18} /> Retour
                </button>

                {/* Search in Header */}
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Rechercher une transaction..."
                            style={{
                                padding: '1rem 1rem 1rem 3rem',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white',
                                borderRadius: '0.5rem',
                                width: '300px',
                                outline: 'none',
                                fontSize: '1rem'
                            }}
                            value={searchId}
                            onChange={e => setSearchId(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ height: '54px', padding: '0 2rem', fontSize: '1rem' }}>
                        Rechercher
                    </button>
                </form>
            </div>

            {loading ? <div style={{ textAlign: 'center', padding: '2rem' }}>Recherche...</div> : (
                <div className="card">
                    <h2>Détails Transaction</h2>

                    <div style={{ marginTop: '2rem', display: 'grid', gap: '1.5rem' }}>

                        <div className="detail-row"><strong>Transaction ID:</strong> {transaction?.txId}</div>
                        <div className="detail-row"><strong>Date:</strong> {safeFormat(alert?.createdAt || alert?.date || transaction?.date)}</div>
                        <div className="detail-row"><strong>Montant:</strong> {transaction?.amount}</div>
                        <div className="detail-row"><strong>Devise:</strong> {transaction?.currency || 'EUR'}</div>
                        <div className="detail-row"><strong>Marchand:</strong> Amazon Inc.</div>
                        <div className="detail-row"><strong>Pays:</strong> France</div>
                        <div className="detail-row"><strong>Adresse IP:</strong> 192.168.1.1</div>
                        <div className="detail-row"><strong>Appareil:</strong> iPhone 13</div>
                        <div className="detail-row"><strong>Utilisateur:</strong> {userInfo?.username || 'N/A'}</div>

                        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '4px' }}>
                            <strong>Règles déclenchées:</strong> {alert?.rule || 'Aucune'}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionDetails;
