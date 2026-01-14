import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Check from './pages/Check';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Check />} />
            <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
    );
}

export default App;