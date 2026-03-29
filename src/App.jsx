import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CustomerPortal from './components/CustomerPortal';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">
            <span className="wifi-icon">📶</span>
            Venue WiFi Access
          </div>
          <div className="nav-links">
            <Link to="/">Customer Portal</Link>
            <Link to="/admin">Admin</Link>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<CustomerPortal />} />
            <Route path="/portal" element={<CustomerPortal />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>WiFi Access Control System &copy; 2026</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
