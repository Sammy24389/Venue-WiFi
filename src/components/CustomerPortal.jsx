import { useState, useEffect } from 'react';
import './CustomerPortal.css';

function CustomerPortal() {
  const [macAddress, setMacAddress] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  // Auto-detect MAC address (note: browsers limit this for privacy)
  // User will need to enter it manually or scan QR
  useEffect(() => {
    // Try to get MAC from network info (works in some environments)
    const getDeviceMAC = async () => {
      try {
        // This is limited in browsers, but we can try WebRTC or other methods
        // For now, we'll guide the user on how to find their MAC
      } catch (err) {
        console.log('MAC auto-detection not available');
      }
    };
    
    getDeviceMAC();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/access/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          macAddress: macAddress.trim(),
          deviceName: deviceName.trim() || 'Customer Device'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      setResult(data);
      
      // Check status after granting
      checkStatus(macAddress.trim());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async (mac) => {
    try {
      const response = await fetch(`/api/access/status/${mac}`);
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error('Status check failed:', err);
    }
  };

  const formatMAC = (value) => {
    // Format as XX:XX:XX:XX:XX:XX
    const cleaned = value.replace(/[^a-fA-F0-9]/g, '');
    const parts = [];
    for (let i = 0; i < cleaned.length && i < 12; i++) {
      if (i > 0 && i % 2 === 0) parts.push(':');
      parts.push(cleaned[i]);
    }
    return parts.join('').toUpperCase();
  };

  const handleMACChange = (e) => {
    const formatted = formatMAC(e.target.value);
    setMacAddress(formatted);
  };

  return (
    <div className="customer-portal">
      <div className="portal-hero">
        <h1>Welcome to Venue WiFi</h1>
        <p>Get complimentary internet access for 24 hours</p>
      </div>

      <div className="portal-content">
        <div className="card">
          <h2 className="card-title">Request WiFi Access</h2>
          
          {status?.active && (
            <div className="alert alert-success">
              <strong>✅ Access Active!</strong>
              <p>Your device has internet access until {new Date(status.expiresAt).toLocaleString()}</p>
            </div>
          )}

          {result?.granted && !result.existing && (
            <div className="alert alert-success">
              <strong>✅ Access Granted!</strong>
              <p>Your device now has internet access for the next 24 hours.</p>
              <p><strong>Expires:</strong> {new Date(result.expiresAt).toLocaleString()}</p>
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <strong>Error:</strong> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Device MAC Address</label>
              <input
                type="text"
                className="form-input"
                placeholder="00:1A:2B:3C:4D:5E"
                value={macAddress}
                onChange={handleMACChange}
                maxLength={17}
                required
              />
              <small className="form-hint">
                Find MAC: Settings → About → WiFi Address (iOS) or Settings → Network → MAC (Android)
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Device Name (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., John's iPhone"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block"
              disabled={loading || status?.active}
            >
              {loading ? (
                <span className="spinner-small"></span>
              ) : status?.active ? (
                'Access Already Active'
              ) : (
                'Get WiFi Access'
              )}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 className="card-title">How It Works</h3>
          <ol className="steps-list">
            <li>
              <strong>Find your MAC address</strong>
              <p>Go to your device settings and locate the WiFi/MAC address</p>
            </li>
            <li>
              <strong>Enter MAC above</strong>
              <p>Input your device's MAC address in the form</p>
            </li>
            <li>
              <strong>Get instant access</strong>
              <p>Your device will be granted access for 24 hours</p>
            </li>
            <li>
              <strong>Auto-renew daily</strong>
              <p>Access resets every 24 hours automatically</p>
            </li>
          </ol>
        </div>

        <div className="card">
          <h3 className="card-title">Need Help?</h3>
          <p>Ask our staff for assistance finding your MAC address or connecting to WiFi.</p>
        </div>
      </div>
    </div>
  );
}

export default CustomerPortal;
