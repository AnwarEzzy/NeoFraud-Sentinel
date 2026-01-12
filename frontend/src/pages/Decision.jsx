import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Save, ArrowLeft, Search } from 'lucide-react';

const Decision = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // State data
    const [data, setData] = useState(location.state?.alertData || null);
    const [searchId, setSearchId] = useState('');
    const [loadingSearch, setLoadingSearch] = useState(false);

    const [decision, setDecision] = useState('');
    const [comment, setComment] = useState('');
    const [gravity, setGravity] = useState('Low');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (location.state?.alertData) {
            setData(location.state.alertData);
        }
    }, [location.state]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchId) return;
        setLoadingSearch(true);
        try {
            const res = await api.get(`/transactions/${searchId}`);
            if (res.data.success) {
                const txData = res.data.data;
                const activeAlert = txData.alerts?.find(a => a.status === 'NEW');

                if (!activeAlert) {
                    alert("Aucune alerte active (NEW) trouvée pour cette transaction.");
                    // We could arguably show closed alerts too, but decision is usually for new ones.
                    return;
                }

                const user = txData.user || (txData.account ? { username: txData.account.username } : { username: 'Inconnu' });

                setData({
                    transaction: txData.transaction,
                    alert: activeAlert,
                    userInfo: user
                });
                // Reset form fields
                setDecision('');
                setComment('');
            } else {
                alert("Transaction introuvable");
            }
        } catch (err) {
            console.error(err);
            alert("Erreur de recherche");
        } finally {
            setLoadingSearch(false);
        }
    };

    if (!data && !loadingSearch) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', maxWidth: '400px', margin: '0 auto' }}>
                        <input
                            type="text"
                            className="input"
                            placeholder="Entrez ID Transaction pour statuer..."
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
                <h3>Aucune alerte sélectionnée</h3>
                <p style={{ marginBottom: '1rem' }}>Recherchez une transaction ou sélectionnez depuis les alertes.</p>
                <button onClick={() => navigate('/alerts')} className="btn btn-primary">
                    Aller aux Alertes
                </button>
            </div>
        );
    }

    // Fallback if data is null during render but not in "if" above (e.g. loading)
    if (!data) return <div>Chargement...</div>;

    const { transaction, alert: alertItem, userInfo } = data; // Rename alert -> alertItem to avoid confusion with window.alert

    const handleSave = async () => {
        if (!decision) return alert("Choisir une décision");
        setSubmitting(true);
        try {
            await api.patch(`/alerts/${alertItem.id}/resolve`, {
                status: decision,
                comment: `[${gravity}] ${comment}`
            });
            alert("Décision enregistrée");
            navigate('/alerts');
        } catch { alert("Erreur"); }
        finally { setSubmitting(false); }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
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
                                color: '#fff',
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

            <div className="card">
                <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <h2 style={{ marginBottom: '0.5rem' }}>Décision / Rapport</h2>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Transaction: <strong style={{ color: 'white', fontFamily: 'monospace' }}>{transaction.txId}</strong><br />
                        Utilisateur: <strong style={{ color: 'white' }}>{userInfo?.username}</strong>
                    </div>
                </div>

                {/* Formulaire avec: Décision (Valider fraude, Rejeter alerte) */}
                <div style={{ margin: '1.5rem 0' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Décision</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={() => setDecision('VALIDATED')}
                            style={{
                                flex: 1, padding: '1rem', borderRadius: '4px', border: '1px solid #22c55e',
                                background: decision === 'VALIDATED' ? '#22c55e' : 'transparent', color: 'white', cursor: 'pointer'
                            }}>
                            Valider fraude
                        </button>
                        <button onClick={() => setDecision('REJECTED')}
                            style={{
                                flex: 1, padding: '1rem', borderRadius: '4px', border: '1px solid #ef4444',
                                background: decision === 'REJECTED' ? '#ef4444' : 'transparent', color: 'white', cursor: 'pointer'
                            }}>
                            Rejeter alerte
                        </button>
                    </div>
                </div>

                {/* Commentaire analyste */}
                <div style={{ margin: '1.5rem 0' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Commentaire analyste</label>
                    <textarea
                        className="input"
                        rows={4}
                        style={{ width: '100%' }}
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                    />
                </div>

                {/* Niveau de gravité */}
                <div style={{ margin: '1.5rem 0' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Niveau de gravité</label>
                    <select className="input" style={{ width: '100%' }} value={gravity} onChange={e => setGravity(e.target.value)}>
                        <option>Faible</option>
                        <option>Moyenne</option>
                        <option>Élevée</option>
                        <option>Critique</option>
                    </select>
                </div>

                {/* Date de décision */}
                <div style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Date de décision: {new Date().toLocaleDateString()}
                </div>

                {/* Actions: Enregistrer décision */}
                <button onClick={handleSave} className="btn btn-primary" style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                    <Save size={20} />
                    {submitting ? 'Enregistrement...' : 'Enregistrer décision'}
                </button>

            </div>
        </div>
    );
};

export default Decision;
