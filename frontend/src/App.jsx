import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Alerts from './pages/Alerts';
import Upload from './pages/Upload';
import Users from './pages/Users';
import Rules from './pages/Rules';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import Detection from './pages/Detection';
import ImportHistory from './pages/ImportHistory';
import GraphExplorer from './pages/GraphExplorer';
import TransactionDetails from './pages/TransactionDetails';
import Decision from './pages/Decision';

const ProtectedRoute = ({ children }) => {
    const { token, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!token) return <Navigate to="/login" />;
    return children;
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        <Route index element={<Navigate to="/dashboard" />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="transactions" element={<Transactions />} />
                        <Route path="alerts" element={<Alerts />} />
                        <Route path="upload" element={<Upload />} />
                        <Route path="users" element={<Users />} />
                        <Route path="rules" element={<Rules />} />
                        <Route path="logs" element={<Logs />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="detection" element={<Detection />} />
                        <Route path="import-history" element={<ImportHistory />} />
                        <Route path="graph-viewer" element={<GraphExplorer />} />
                        <Route path="transaction-details" element={<TransactionDetails />} />
                        <Route path="decision" element={<Decision />} />
                    </Route>
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
