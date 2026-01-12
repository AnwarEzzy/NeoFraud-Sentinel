import { useEffect, useState } from 'react';
import api from '../api/axios';
import { History, FileText, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

const ImportHistory = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Fetch logs and filter for UPLOAD actions on client side as we don't have a specific endpoint yet
                // Ideally, backend should support filtering by action
                const res = await api.get('/logs?limit=100');
                if (res.data.success) {
                    const uploadLogs = res.data.data.filter(log => log.action === 'IMPORT_CSV' || log.action === 'UPLOAD');
                    setLogs(uploadLogs);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <History size={28} color="var(--accent)" /> Import History
            </h2>

            <div className="card">
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
                ) : logs.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>No import history found.</p>
                    </div>
                ) : (
                    <div className="list-group">
                        {logs.map((log) => (
                            <div key={log.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '1rem', borderBottom: '1px solid var(--border)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ padding: '0.75rem', borderRadius: '50%', backgroundColor: 'rgba(34,197,94,0.1)', color: 'var(--success)' }}>
                                        <CheckCircle size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>Transaction Import</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            by {log.username} • {log.details}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    <Clock size={14} />
                                    {log.createdAt && format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImportHistory;
