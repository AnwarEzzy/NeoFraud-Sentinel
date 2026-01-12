import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { ShieldCheck } from 'lucide-react';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('ANALYSTE'); // Default role
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Prompt requirements: Roles: ADMIN, ANALYSTE, BANQUE
            // Validation? We'll rely on backend.
            const res = await api.post('/auth/register', { username, password, role });
            if (res.data.success) {
                navigate('/login');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-dark)' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <ShieldCheck size={48} color="var(--accent)" style={{ marginBottom: '1rem' }} />
                    <h2>Create Account</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Join GraphShield</p>
                </div>

                {error && <div style={{ backgroundColor: 'rgba(239,68,68,0.2)', color: '#fca5a5', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Username</label>
                        <input
                            type="text"
                            className="input-field"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Role</label>
                        <select
                            className="input-field"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="ANALYSTE">Analyste</option>
                            <option value="BANQUE">Agent Banquire</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register</button>

                    <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Already have an account? <Link to="/login" style={{ color: 'var(--accent)' }}>Login</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
