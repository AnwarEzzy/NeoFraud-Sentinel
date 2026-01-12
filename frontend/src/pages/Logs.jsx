import { useState, useEffect } from 'react';
import api from '../api/axios';
import { History, Search } from 'lucide-react';
import { format } from 'date-fns';

const Logs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await api.get('/logs?limit=500'); // Get last 500
                setLogs(res.data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log =>
        log.username.toLowerCase().includes(filter.toLowerCase()) ||
        log.action.toLowerCase().includes(filter.toLowerCase()) ||
        log.details.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div style={{ color: 'var(--text-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <History color="var(--accent)" /> System Logs
                </h1>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        className="input-field"
                        style={{ paddingLeft: '2.5rem', marginBottom: 0 }}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>Time</th>
                            <th style={{ padding: '1rem' }}>User</th>
                            <th style={{ padding: '1rem' }}>Action</th>
                            <th style={{ padding: '1rem' }}>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
                        ) : filteredLogs.length === 0 ? (
                            <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No system logs found.</td></tr>
                        ) : (
                            filteredLogs.map((log) => (
                                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                        {log.createdAt ? format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss') : '-'}
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 500 }}>{log.username}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                                            backgroundColor: 'rgba(255,255,255,0.1)'
                                        }}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{log.details}</td>
                                </tr>
                            )))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Logs;
