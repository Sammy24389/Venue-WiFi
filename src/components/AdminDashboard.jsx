import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [devices, setDevices] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    // Refresh data every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, devicesRes, logsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/devices'),
        fetch('/api/admin/logs?limit=50')
      ]);

      const statsData = await statsRes.json();
      const devicesData = await devicesRes.json();
      const logsData = await logsRes.json();

      setStats(statsData.stats);
      setDevices(devicesData.devices);
      setLogs(logsData.logs);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExpire = async (macAddress) => {
    if (!confirm(`Revoke WiFi access for ${macAddress}?`)) return;

    try {
      const response = await fetch(`/api/admin/devices/${macAddress}/expire`, {
        method: 'POST'
      });

      if (response.ok) {
        loadData();
      }
    } catch (err) {
      alert('Failed to revoke access');
    }
  };

  const handleCleanup = async () => {
    if (!confirm('Clean up all expired device entries?')) return;

    try {
      const response = await fetch('/api/admin/cleanup', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Cleaned up ${data.cleaned} expired entries`);
        loadData();
      }
    } catch (err) {
      alert('Cleanup failed');
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleCleanup} className="btn btn-outline">
          🗑️ Cleanup Expired
        </button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.activeDevices}</div>
            <div className="stat-label">Active Devices</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalDevices}</div>
            <div className="stat-label">Total Devices</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.todaySessions}</div>
            <div className="stat-label">Sessions Today</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Active Devices
        </button>
        <button
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Devices
        </button>
        <button
          className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          Access Logs
        </button>
      </div>

      {/* Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="card">
            <h3 className="card-title">Currently Active Devices</h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>MAC Address</th>
                    <th>Device Name</th>
                    <th>Granted At</th>
                    <th>Expires In</th>
                    <th>Sessions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.filter(d => d.is_active === 1).length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center' }}>No active devices</td>
                    </tr>
                  ) : (
                    devices.filter(d => d.is_active === 1).map((device) => (
                      <tr key={device.id}>
                        <td><code>{device.mac_address}</code></td>
                        <td>{device.device_name || 'Unknown'}</td>
                        <td>{formatTime(device.granted_at)}</td>
                        <td>
                          <span className="badge badge-active">
                            {getTimeRemaining(device.expires_at)}
                          </span>
                        </td>
                        <td>{device.total_sessions}</td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleExpire(device.mac_address)}
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'all' && (
          <div className="card">
            <h3 className="card-title">All Devices</h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>MAC Address</th>
                    <th>Device Name</th>
                    <th>Status</th>
                    <th>Granted At</th>
                    <th>Expires At</th>
                    <th>Sessions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center' }}>No devices registered</td>
                    </tr>
                  ) : (
                    devices.map((device) => (
                      <tr key={device.id}>
                        <td><code>{device.mac_address}</code></td>
                        <td>{device.device_name || 'Unknown'}</td>
                        <td>
                          {device.is_active === 1 ? (
                            <span className="badge badge-active">Active</span>
                          ) : (
                            <span className="badge badge-expired">Expired</span>
                          )}
                        </td>
                        <td>{formatTime(device.granted_at)}</td>
                        <td>{formatTime(device.expires_at)}</td>
                        <td>{device.total_sessions}</td>
                        <td>
                          {device.is_active === 1 && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleExpire(device.mac_address)}
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="card">
            <h3 className="card-title">Access Logs</h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>MAC Address</th>
                    <th>Action</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center' }}>No logs available</td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id}>
                        <td>{formatTime(log.timestamp)}</td>
                        <td><code>{log.mac_address}</code></td>
                        <td>
                          <span className={`badge badge-${
                            log.action === 'GRANTED' ? 'active' : 
                            log.action === 'EXPIRED' ? 'expired' : 'pending'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td>{log.details || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
