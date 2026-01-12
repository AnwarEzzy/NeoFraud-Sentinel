import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import GraphViewer from '../components/GraphViewer';
import api from '../api/axios';

const GraphExplorer = () => {
    const location = useLocation();
    const [txId, setTxId] = useState('');
    const [searchedTx, setSearchedTx] = useState(null);



    // Fetch full details including graph nodes
    const fetchTransactionDetails = async (id) => {
        try {
            const res = await api.get(`/transactions/${id}`);
            if (res.data.success) {
                // Backend now returns { transaction, user, account, merchant, ip, device, alerts }
                setSearchedTx(res.data.data);
            } else {
                alert("Erreur serveur: " + (res.data.message || 'Données manquantes'));
            }
        } catch (err) {
            console.error("Graph fetch error", err);
            // Show error to user to diagnose "blank page"
            alert("Erreur chargement graphe: " + (err.response?.data?.message || err.message));
        }
    };

    // Auto-load from navigation state
    useEffect(() => {
        if (location.state?.alertData) {
            const { transaction } = location.state.alertData;
            setTxId(transaction.txId);
            fetchTransactionDetails(transaction.txId);
        }
    }, [location.state]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (txId) {
            fetchTransactionDetails(txId);
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '2rem' }}>Graph Viewer / Explorer</h2>

            <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            style={{
                                width: '100%',
                                padding: '1rem 1rem 1rem 3rem',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '0.5rem',
                                color: '#fff',
                                outline: 'none',
                                fontSize: '1rem'
                            }}
                            placeholder="Rechercher une transaction (ID)..."
                            value={txId}
                            onChange={(e) => setTxId(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ height: '54px', padding: '0 2rem' }}>
                        Visualiser
                    </button>
                </form>
            </div>

            {searchedTx ? (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                        <h3 style={{ margin: 0 }}>Visualisation: <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{searchedTx.transaction?.txId || searchedTx.txId}</span></h3>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            {searchedTx.transaction?.date ? new Date(searchedTx.transaction.date).toLocaleString() : ''}
                        </span>
                    </div>

                    <GraphViewer transaction={searchedTx} height={600} />

                    <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Utilisateur</div>
                            <div style={{ fontWeight: 'bold', color: '#3b82f6' }}>{searchedTx.user?.username || 'N/A'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Marchand</div>
                            <div style={{ fontWeight: 'bold', color: '#10b981' }}>{searchedTx.merchant?.name || 'Inconnu'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Montant</div>
                            <div style={{ fontWeight: 'bold', color: '#ef4444' }}>{searchedTx.transaction?.amount} {searchedTx.transaction?.currency || 'EUR'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Appareil</div>
                            <div style={{ fontWeight: 'bold', color: '#a855f7' }}>{searchedTx.device?.deviceId || 'Inconnu'}</div>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <Search size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p>Recherchez une transaction ou sélectionnez "Analyser" depuis le tableau des alertes.</p>
                </div>
            )}
        </div>
    );
};

export default GraphExplorer;
