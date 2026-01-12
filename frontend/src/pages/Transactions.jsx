import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Search, ChevronRight, AlertTriangle } from 'lucide-react';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const res = await api.get('/transactions?limit=100');
                if (res.data.success) {
                    setTransactions(res.data.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, []);

    const filtered = transactions.filter(t =>
        t.txId.toLowerCase().includes(filter.toLowerCase()) ||
        t.status.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Transactions</h2>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Search Transaction ID..."
                        className="input-field"
                        style={{ paddingLeft: '2.5rem', marginBottom: 0 }}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Alerts</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No transactions found</td></tr>
                            ) : (
                                filtered.map((t) => (
                                    <tr key={t.txId} style={{ backgroundColor: t.alerts?.length > 0 ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                                        <td style={{ fontFamily: 'monospace' }}>{t.txId}</td>
                                        <td>{new Date(t.date).toLocaleString()}</td>
                                        <td style={{ fontWeight: 600 }}>{t.amount.toLocaleString()} {t.currency}</td>
                                        <td>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '0.25rem',
                                                fontSize: '0.75rem',
                                                backgroundColor: t.status === 'SUCCESS' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                                                color: t.status === 'SUCCESS' ? 'var(--success)' : 'var(--danger)'
                                            }}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td>
                                            {t.alerts?.length > 0 ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--danger)' }}>
                                                    <AlertTriangle size={16} />
                                                    {t.alerts.length}
                                                </div>
                                            ) : <span style={{ color: 'var(--text-secondary)' }}>-</span>}
                                        </td>
                                        <td>
                                            <button className="btn" style={{ padding: '0.25rem 0.5rem' }}>
                                                <ChevronRight size={18} color="var(--text-secondary)" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Transactions;
