import { Client } from 'ssh2';
import axios from 'axios';
import { logAccess } from './database.js';

/**
 * Huawei OptiXstar HG8145X7-10 Integration Module
 * 
 * This router model has limited public API, so we use multiple approaches:
 * 1. SSH (if enabled on the router)
 * 2. Web interface automation (via API calls)
 * 3. Standalone captive portal mode (recommended fallback)
 */

class HuaweiRouter {
  constructor(config = {}) {
    this.host = config.host || '192.168.100.1';  // Default Huawei ONT IP
    this.username = config.username || 'admin';
    this.password = config.password || '';
    this.port = config.port || 22;  // SSH port, or 80 for HTTP
    this.useSSH = config.useSSH || false;
    this.connected = false;
  }

  /**
   * Connect to router via SSH
   */
  async connectSSH() {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      
      conn.on('ready', () => {
        this.connected = true;
        this.sshConn = conn;
        console.log('SSH connection established to Huawei router');
        resolve(true);
      });
      
      conn.on('error', (err) => {
        console.error('SSH connection failed:', err.message);
        reject(err);
      });
      
      conn.connect({
        host: this.host,
        port: this.port,
        username: this.username,
        password: this.password,
        readyTimeout: 10000
      });
    });
  }

  /**
   * Add MAC address to whitelist via SSH
   */
  async addMACViaSSH(macAddress) {
    if (!this.connected) {
      await this.connectSSH();
    }
    
    return new Promise((resolve, reject) => {
      const normalizedMAC = macAddress.replace(/:/g, '-').toUpperCase();
      
      // Huawei ONT MAC filter commands (may vary by firmware)
      const commands = [
        `lanhostfilter add ${normalizedMAC}`,
        `saveconfig`
      ];
      
      this.sshConn.exec(commands.join('\n'), (err, stream) => {
        if (err) return reject(err);
        
        let output = '';
        stream.on('data', (data) => {
          output += data.toString();
        });
        
        stream.on('close', (code) => {
          logAccess(macAddress, 'ROUTER_ADD', `SSH: ${output}`);
          resolve({ success: true, output });
        });
      });
    });
  }

  /**
   * Remove MAC address from whitelist via SSH
   */
  async removeMACViaSSH(macAddress) {
    if (!this.connected) {
      await this.connectSSH();
    }
    
    return new Promise((resolve, reject) => {
      const normalizedMAC = macAddress.replace(/:/g, '-').toUpperCase();
      
      const commands = [
        `lanhostfilter del ${normalizedMAC}`,
        `saveconfig`
      ];
      
      this.sshConn.exec(commands.join('\n'), (err, stream) => {
        if (err) return reject(err);
        
        let output = '';
        stream.on('data', (data) => {
          output += data.toString();
        });
        
        stream.on('close', (code) => {
          logAccess(macAddress, 'ROUTER_REMOVE', `SSH: ${output}`);
          resolve({ success: true, output });
        });
      });
    });
  }

  /**
   * Login to Huawei web interface and get session token
   */
  async webLogin() {
    try {
      // First, get the login page to extract tokens
      const loginPage = await axios.get(`http://${this.host}/`, {
        timeout: 5000
      });
      
      // Huawei typically uses a POST to /login with credentials
      const response = await axios.post(`http://${this.host}/login`, {
        username: this.username,
        password: this.password
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      this.webSession = response.headers['set-cookie'];
      this.connected = true;
      
      return { success: true, token: response.data?.token };
    } catch (error) {
      console.error('Web login failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add MAC via web interface
   */
  async addMACViaWeb(macAddress) {
    if (!this.connected) {
      await this.webLogin();
    }
    
    try {
      const response = await axios.post(
        `http://${this.host}/api/macfilter/add`,
        { mac: macAddress, action: 'allow' },
        {
          headers: {
            'Cookie': this.webSession,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );
      
      logAccess(macAddress, 'ROUTER_ADD', `WEB: ${JSON.stringify(response.data)}`);
      return { success: true, data: response.data };
    } catch (error) {
      logAccess(macAddress, 'ROUTER_ADD_FAILED', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Standalone mode - just log the MAC (for captive portal setup)
   * In this mode, the router is configured with a static whitelist
   * and our system just tracks access duration
   */
  async addMACStandalone(macAddress) {
    logAccess(macAddress, 'STANDALONE_MODE', 'MAC logged for tracking only');
    return { 
      success: true, 
      mode: 'standalone',
      message: 'MAC logged. Ensure router is configured to allow all devices initially.'
    };
  }

  /**
   * Main method to add MAC - tries multiple approaches
   */
  async addMAC(macAddress, mode = 'auto') {
    try {
      if (mode === 'ssh' || mode === 'auto') {
        try {
          return await this.addMACViaSSH(macAddress);
        } catch (sshError) {
          if (mode === 'ssh') throw sshError;
          console.log('SSH failed, trying web...');
        }
      }
      
      if (mode === 'web' || mode === 'auto') {
        try {
          return await this.addMACViaWeb(macAddress);
        } catch (webError) {
          if (mode === 'web') throw webError;
          console.log('Web failed, using standalone mode...');
        }
      }
      
      // Fallback to standalone mode
      return await this.addMACStandalone(macAddress);
    } catch (error) {
      logAccess(macAddress, 'ROUTER_ERROR', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Disconnect from router
   */
  disconnect() {
    if (this.sshConn) {
      this.sshConn.end();
      this.connected = false;
    }
  }
}

export default HuaweiRouter;
