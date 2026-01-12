import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Users as UsersIcon, Shield, Trash2, Plus, X, Lock, Unlock, Edit } from 'lucide-react';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingRoleUser, setEditingRoleUser] = useState(null); // Valid user object if editing role
    const [newRole, setNewRole] = useState('');

    const [formData, setFormData] = useState({ username: '', password: '', role: 'ANALYSTE' });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users');
            if (res.data.success) {
                setUsers(res.data.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.delete(`/users/${id}`);
            setUsers(users.filter(u => u.id !== id));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete user');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/users', formData);
            if (res.data.success) {
                const newUser = { ...res.data.data, status: 'ACTIVE' }; // Ensure status is there
                setUsers([newUser, ...users]);
                setShowModal(false);
                setFormData({ username: '', password: '', role: 'ANALYST' });
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create user');
        }
    };

    const toggleStatus = async (user) => {
        const newStatus = user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
        if (!confirm(`Are you sure you want to ${newStatus === 'BLOCKED' ? 'BLOCK' : 'ACTIVATE'} this user?`)) return;

        try {
            await api.patch(`/users/${user.id}/status`, { status: newStatus });
            setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
        } catch (err) {
            alert('Failed to update user status');
        }
    };

    const handleUpdateRole = async () => {
        if (!editingRoleUser) return;
        try {
            const res = await api.patch(`/users/${editingRoleUser.id}/role`, { role: newRole });
            setUsers(users.map(u => u.id === editingRoleUser.id ? { ...u, role: newRole } : u));
            setEditingRoleUser(null);
        } catch (err) {
            alert('Failed to update role');
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>User Management</h2>
                <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={20} /> Add User
                </button>
            </div>

            {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Created At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: '1rem' }}>Loading...</td></tr> :
                                users.length === 0 ? (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No users found</td></tr>
                                ) : (
                                    users.map((u) => (
                                        <tr key={u.id}>
                                            <td style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'rgba(59,130,246,0.1)', color: 'var(--accent)' }}>
                                                    <UsersIcon size={16} />
                                                </div>
                                                <span style={{ fontWeight: 500 }}>{u.username}</span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.75rem',
                                                        borderRadius: '1rem',
                                                        fontSize: '0.75rem',
                                                        backgroundColor: u.role === 'ADMIN' ? 'rgba(234,179,8,0.1)' : 'rgba(59,130,246,0.1)',
                                                        color: u.role === 'ADMIN' ? 'var(--warning)' : 'var(--accent)',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem'
                                                    }}>
                                                        {u.role === 'ADMIN' && <Shield size={12} />}
                                                        {u.role}
                                                    </span>
                                                    <button onClick={() => { setEditingRoleUser(u); setNewRole(u.role); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                                        <Edit size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                                                    backgroundColor: u.status === 'BLOCKED' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
                                                    color: u.status === 'BLOCKED' ? '#f87171' : '#4ade80'
                                                }}>
                                                    {u.status || 'ACTIVE'}
                                                </span>
                                            </td>
                                            <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
                                            <td style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="btn"
                                                    title={u.status === 'BLOCKED' ? "Activate" : "Block"}
                                                    style={{ padding: '0.5rem', color: u.status === 'BLOCKED' ? 'var(--success)' : 'var(--warning)', backgroundColor: 'transparent' }}
                                                    onClick={() => toggleStatus(u)}
                                                >
                                                    {u.status === 'BLOCKED' ? <Unlock size={16} /> : <Lock size={16} />}
                                                </button>
                                                <button
                                                    className="btn"
                                                    style={{ padding: '0.5rem', color: 'var(--danger)', backgroundColor: 'rgba(239,68,68,0.1)' }}
                                                    onClick={() => handleDelete(u.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create User Modal */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Add New User</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleCreate}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Username</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Password</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Role</label>
                                <select
                                    className="input-field"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="ANALYSTE">Analyst</option>
                                    <option value="AGENT">Agent</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" className="btn" style={{ flex: 1, backgroundColor: 'var(--bg-dark)' }} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Role Modal */}
            {editingRoleUser && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '300px', maxWidth: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Edit Role</h3>
                            <button onClick={() => setEditingRoleUser(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Role</label>
                            <select
                                className="input-field"
                                value={newRole}
                                onChange={e => setNewRole(e.target.value)}
                            >
                                <option value="ANALYSTE">Analyst</option>
                                <option value="AGENT">Agent</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="button" className="btn" style={{ flex: 1, backgroundColor: 'var(--bg-dark)' }} onClick={() => setEditingRoleUser(null)}>Cancel</button>
                            <button onClick={handleUpdateRole} className="btn btn-primary" style={{ flex: 1 }}>Update</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
