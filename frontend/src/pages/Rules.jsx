import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Trash, Edit, Check, X, ShieldAlert } from 'lucide-react';

const Rules = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState(null);

    const [newItem, setNewItem] = useState({
        name: '',
        description: '',
        type: 'MONTANT_ELEVE',
        status: 'Active',
        threshold: '',
        cypherQuery: '', // For custom only
        parameters: '{}'
    });

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const res = await api.get('/rules');
            setRules(res.data.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch rules');
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this rule?')) return;
        try {
            await api.delete(`/rules/${id}`);
            setRules(rules.filter(r => r.id !== id));
        } catch (err) {
            alert('Failed to delete rule');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...newItem };
            // Ensure status is mapped to enabled bool for update or backend logic for create
            if (editingRule) {
                // For edits, we might only update threshold/status/desc
                // We don't typically change type of existing rule easily without full recreation logic
                const updates = {
                    description: newItem.description,
                    threshold: newItem.threshold ? parseFloat(newItem.threshold) : undefined,
                    enabled: newItem.status === 'Active'
                };
                const res = await api.patch(`/rules/${editingRule.id}`, updates);
                setRules(rules.map(r => r.id === editingRule.id ? { ...r, ...res.data.data } : r));
            } else {
                const res = await api.post('/rules', payload);
                setRules([...rules, res.data.data]);
            }
            setShowModal(false);
            setEditingRule(null);
            setNewItem({ name: '', description: '', type: 'MONTANT_ELEVE', status: 'Active', threshold: '', cypherQuery: '', parameters: '{}' });
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save rule');
        }
    };

    const openEdit = (rule) => {
        setEditingRule(rule);
        setNewItem({
            name: rule.name,
            description: rule.description,
            type: rule.type || 'CUSTOM',
            status: rule.enabled ? 'Active' : 'Inactive',
            threshold: rule.threshold || '',
            cypherQuery: rule.cypherQuery,
            parameters: JSON.stringify(rule.parameters || {}, null, 2)
        });
        setShowModal(true);
    };

    const toggleStatus = async (rule) => {
        try {
            const res = await api.patch(`/rules/${rule.id}`, { enabled: !rule.enabled });
            setRules(rules.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r));
        } catch (err) {
            alert('Failed to update status');
        }
    };

    if (loading) return <div style={{ color: 'white' }}>Loading rules...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    return (
        <div style={{ color: 'var(--text-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldAlert color="var(--accent)" /> Fraud Rules
                </h1>
                <button
                    onClick={() => { setEditingRule(null); setNewItem({ name: '', description: '', type: 'MONTANT_ELEVE', status: 'Active', threshold: '' }); setShowModal(true); }}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={18} /> Add Rule
                </button>
            </div>

            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>Name</th>
                            <th style={{ padding: '1rem' }}>Type</th>
                            <th style={{ padding: '1rem' }}>Description</th>
                            <th style={{ padding: '1rem' }}>Threshold</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rules.map(rule => (
                            <tr key={rule.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem', fontWeight: 500 }}>{rule.name}</td>
                                <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--accent)' }}>{rule.type || 'Custom'}</td>
                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{rule.description}</td>
                                <td style={{ padding: '1rem' }}>
                                    {rule.threshold !== undefined ? rule.threshold : '-'}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '999px',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        backgroundColor: rule.enabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                        color: rule.enabled ? '#4ade80' : '#f87171'
                                    }}>
                                        {rule.enabled ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <button onClick={() => openEdit(rule)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginRight: '0.5rem' }}>
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(rule.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
                                        <Trash size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: '0.5rem', width: '500px', maxWidth: '90%' }}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>{editingRule ? 'Edit Rule' : 'Add New Rule'}</h2>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Rule Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    required
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                    placeholder="e.g. MONTANT_ELEVE"
                                />
                            </div>

                            {!editingRule && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Rule Type</label>
                                    <select
                                        className="input-field"
                                        value={newItem.type}
                                        onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                                    >
                                        <option value="MONTANT_ELEVE">Montant élevé</option>
                                        <option value="IP_PARTAGEE">IP partagée</option>
                                        <option value="MULTI_COMPTES">Multi-comptes</option>
                                        <option value="TRANSACTIONS_RAPIDES">Transactions rapides</option>
                                        <option value="CUSTOM">Custom (Advanced)</option>
                                    </select>
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Description</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    required
                                    value={newItem.description}
                                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                    placeholder="Brief description of the rule"
                                />
                            </div>

                            {newItem.type !== 'CUSTOM' && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Threshold (Seuil)</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={newItem.threshold}
                                        onChange={(e) => setNewItem({ ...newItem, threshold: e.target.value })}
                                        placeholder={
                                            newItem.type === 'MONTANT_ELEVE' ? 'e.g. 10000' :
                                                newItem.type === 'TRANSACTIONS_RAPIDES' ? 'e.g. 5 (transactions)' :
                                                    'e.g. 2 (accounts)'
                                        }
                                    />
                                    <small style={{ color: 'var(--text-secondary)' }}>
                                        {newItem.type === 'MONTANT_ELEVE' ? 'Amount limit' :
                                            newItem.type === 'TRANSACTIONS_RAPIDES' ? 'Max transactions in 10min' :
                                                'Max linked accounts'}
                                    </small>
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Status</label>
                                <select
                                    className="input-field"
                                    value={newItem.status}
                                    onChange={(e) => setNewItem({ ...newItem, status: e.target.value })}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            {/* Show Custom query fields only if editing existing custom rule or creating new custom */}
                            {(newItem.type === 'CUSTOM' || (editingRule && !['MONTANT_ELEVE', 'IP_PARTAGEE', 'MULTI_COMPTES', 'TRANSACTIONS_RAPIDES'].includes(editingRule.type))) && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Cypher Query</label>
                                    <textarea
                                        className="input-field"
                                        style={{ height: '100px', fontFamily: 'monospace' }}
                                        value={newItem.cypherQuery}
                                        onChange={(e) => setNewItem({ ...newItem, cypherQuery: e.target.value })}
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn" onClick={() => setShowModal(false)} style={{ flex: 1, backgroundColor: 'var(--bg-dark)' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Rule</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Rules;
