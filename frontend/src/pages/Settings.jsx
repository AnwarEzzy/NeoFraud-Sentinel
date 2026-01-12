import { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Trash2, Save, AlertTriangle } from 'lucide-react';

const Settings = () => {
    const { user, logout } = useAuth();
    const [formData, setFormData] = useState({
        username: user?.username || '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (formData.password && formData.password !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        setLoading(true);
        try {
            const payload = { username: formData.username };
            if (formData.password) payload.password = formData.password;

            const res = await api.patch('/users/profile/me', payload);
            if (res.data.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully' });
                // Ideally update context user here if username changed, but simplistic approach warrants re-login or just state update if critical
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm('Are you sure you want to PERMANENTLY delete your account? This action cannot be undone.')) return;

        try {
            await api.delete('/users/profile/me');
            logout();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete account');
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '2rem' }}>Account Settings</h2>

            {message.text && (
                <div style={{
                    padding: '1rem', marginBottom: '1.5rem', borderRadius: '0.5rem',
                    backgroundColor: message.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                    color: message.type === 'error' ? '#ef4444' : '#22c55e',
                    border: `1px solid ${message.type === 'error' ? '#ef4444' : '#22c55e'}`
                }}>
                    {message.text}
                </div>
            )}

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={20} /> Profile Information
                </h3>

                <form onSubmit={handleUpdate}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Username</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>New Password (leave blank to keep current)</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="password"
                                className="input-field"
                                style={{ paddingLeft: '2.5rem' }}
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Confirm New Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                type="password"
                                className="input-field"
                                style={{ paddingLeft: '2.5rem' }}
                                value={formData.confirmPassword}
                                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                    </button>
                </form>
            </div>

            <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.05)' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={20} /> Danger Zone
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Once you delete your account, there is no going back. Please be certain.
                </p>
                <button
                    onClick={handleDeleteAccount}
                    className="btn"
                    style={{
                        backgroundColor: '#ef4444', color: 'white',
                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}
                >
                    <Trash2 size={18} /> Delete Account
                </button>
            </div>
        </div>
    );
};

export default Settings;
