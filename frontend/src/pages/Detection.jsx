import { useState } from 'react';
import api from '../api/axios';
import { ShieldCheck, Play, CheckCircle, AlertTriangle } from 'lucide-react';

const Detection = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleRunDetection = async () => {
        setLoading(true);
        setResult(null);
        setError(null);
        try {
            const res = await api.post('/alerts/detect');
            if (res.data.success) {
                setResult(res.data.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Detection failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <ShieldCheck size={32} color="var(--accent)" /> Fraud Detection Engine
            </h2>

            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(59,130,246,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto'
                    }}>
                        <ShieldCheck size={40} color="var(--accent)" />
                    </div>
                    <h3>Run Detection Analysis</h3>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>
                        Trigger the fraud detection engine to scan all recent transactions against active fraud rules.
                    </p>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={handleRunDetection}
                    disabled={loading}
                    style={{ padding: '1rem 2rem', fontSize: '1.1rem', display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}
                >
                    {loading ? (
                        <>Processing...</>
                    ) : (
                        <><Play size={20} /> Start Detection</>
                    )}
                </button>

                {error && (
                    <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={20} />
                        {error}
                    </div>
                )}

                {result && (
                    <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: '0.5rem', border: '1px solid var(--success)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--success)', marginBottom: '1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
                            <CheckCircle size={24} />
                            Detection Complete
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'left' }}>
                            <div className="card" style={{ backgroundColor: 'var(--bg-main)', margin: 0 }}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Processed Transactions</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{result.processed || 0}</div>
                            </div>
                            <div className="card" style={{ backgroundColor: 'var(--bg-main)', margin: 0 }}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>New Alerts</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: result.newAlerts > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{result.newAlerts || 0}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Detection;
