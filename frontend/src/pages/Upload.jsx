import { useState } from 'react';
import api from '../api/axios';
import { Upload as UploadIcon, CheckCircle, AlertCircle } from 'lucide-react';

const Upload = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setMessage(null);
        setError(null);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                setMessage(`Success! Processed ${res.data.data.processed} transactions.`);
                if (res.data.data.errors > 0) {
                    setError(`Warning: ${res.data.data.errors} errors occurred.`);
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '2rem' }}>Upload Transactions</h2>

            <div className="card">
                <form onSubmit={handleUpload}>
                    <div style={{ border: '2px dashed var(--border)', borderRadius: '0.75rem', padding: '3rem', textAlign: 'center', marginBottom: '1.5rem', cursor: 'pointer', position: 'relative' }}>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                        />
                        <UploadIcon size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
                        <p style={{ margin: 0, fontWeight: 500 }}>
                            {file ? file.name : 'Click or drag CSV file here'}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            Supports CSV files with columns: txId, amount, userId, etc.
                        </p>
                    </div>

                    {message && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: '0.5rem' }}>
                            <CheckCircle size={20} />
                            {message}
                        </div>
                    )}

                    {error && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '0.5rem' }}>
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={!file || uploading}
                    >
                        {uploading ? 'Processing...' : 'Upload & Ingest'}
                    </button>
                </form>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <h3>Instructions</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Upload a CSV file containing transaction data. The system will automatically ingest nodes and relationships into the graph database.
                    After upload, go to the Alerts page to see any fraud detection results.
                </p>
            </div>
        </div>
    );
};

export default Upload;
