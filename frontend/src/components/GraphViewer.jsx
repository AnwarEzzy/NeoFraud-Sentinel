import React, { useState } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

const GraphViewer = ({ transaction, height = 400 }) => {
    const [scale, setScale] = useState(1);
    const [selectedNode, setSelectedNode] = useState(null);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 2.0));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

    // Data Mapping from props (full transaction details)
    const { transaction: tx, user, account, merchant, ip, device } = transaction || {};

    const nodes = [
        { id: 'user', type: 'Utilisateur', x: 100, y: 200, color: '#3b82f6', label: user?.username || 'Unknown', info: user || { name: 'Unknown' } },
        { id: 'account', type: 'Compte bancaire', x: 250, y: 200, color: '#8b5cf6', label: account?.bankName || 'Bank', info: account || { bank: 'N/A' } },
        { id: 'tx', type: 'Transaction', x: 400, y: 200, color: '#ef4444', label: 'Tx', info: { id: tx?.txId, amount: tx?.amount, date: tx?.date } },
        { id: 'merchant', type: 'Marchand', x: 400, y: 350, color: '#f97316', label: merchant?.name || 'Store', info: merchant || { name: 'N/A' } },
        { id: 'ip', type: 'Adresse IP', x: 550, y: 200, color: '#10b981', label: ip?.address || 'IP', info: ip || { loc: 'N/A' } },
        { id: 'device', type: 'Appareil', x: 700, y: 200, color: '#64748b', label: device?.deviceId || 'Device', info: device || { deviceId: 'N/A' } },
        // Optional: Other users linked to device? (requires more data)
    ];

    const links = [
        { source: 'user', target: 'account' },
        { source: 'account', target: 'tx' },
        { source: 'tx', target: 'merchant' },
        { source: 'tx', target: 'ip' },
        { source: 'ip', target: 'device' },
    ];

    return (
        <div style={{ position: 'relative', border: '1px solid var(--border)', borderRadius: '0.5rem', backgroundColor: '#0f172a', overflow: 'hidden', height: `${height}px` }}>
            {/* Controls */}
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 10 }}>
                <button onClick={handleZoomIn} className="btn" style={{ padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)' }}><ZoomIn size={20} /></button>
                <button onClick={handleZoomOut} className="btn" style={{ padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)' }}><ZoomOut size={20} /></button>
            </div>

            {/* Details Panel (Cliquer sur un nœud -> détails) */}
            {selectedNode && (
                <div style={{
                    position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem',
                    backgroundColor: 'rgba(30, 41, 59, 0.95)', padding: '1rem', borderRadius: '0.5rem',
                    border: '1px solid var(--border)', zIndex: 20
                }}>
                    <strong style={{ color: selectedNode.color }}>{selectedNode.type}</strong>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {JSON.stringify(selectedNode.info).replace(/[{}"]/g, ' ')}
                    </div>
                </div>
            )}

            {/* SVG Area */}
            <svg width="100%" height="100%" viewBox="0 0 800 400">
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
                    </marker>
                </defs>
                <g transform={`scale(${scale})`}>
                    {links.map((link, i) => {
                        const s = nodes.find(n => n.id === link.source);
                        const t = nodes.find(n => n.id === link.target);
                        if (!s || !t) return null; // Prevent crash if node missing
                        return (
                            <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                                stroke={link.dashed ? '#ef4444' : '#475569'}
                                strokeWidth="2" strokeDasharray={link.dashed ? "5,5" : ""}
                                markerEnd="url(#arrowhead)" />
                        );
                    })}
                    {nodes.map(node => (
                        <g key={node.id} onClick={() => setSelectedNode(node)} style={{ cursor: 'pointer' }}>
                            <circle cx={node.x} cy={node.y} r="20" fill={node.color} stroke="white" strokeWidth="1" />
                            <text x={node.x} y={node.y + 4} textAnchor="middle" fill="white" fontSize="10">{node.type.substring(0, 3)}</text>
                            <text x={node.x} y={node.y + 35} textAnchor="middle" fill="#94a3b8" fontSize="11">{node.label}</text>
                        </g>
                    ))}
                </g>
            </svg>
        </div>
    );
};

export default GraphViewer;
