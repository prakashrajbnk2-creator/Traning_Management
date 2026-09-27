import React from 'react';
import { HelperBanner } from '../common/HelperBanner.jsx';
import { Database, Shield, Server, Key, CheckCircle2 } from 'lucide-react';

export function SettingsView() {
  return (
    <div>
      <HelperBanner
        title="System Parameters & Database Status"
        description="Configuration and relational database telemetry for the Training Management System platform."
        tip="All data is stored in the local SQLite engine with WAL journaling and strict foreign key integrity."
        nextAction="Verify the encryption standards and server connectivity below."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <h3>Relational Database Engine</h3>
              <p>SQLite with Better-SQLite3 Driver</p>
            </div>
            <Database size={20} style={{ color: '#4f46e5' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Engine:</span>
              <strong>SQLite 3</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Foreign Keys:</span>
              <span className="badge badge-success">PRAGMA foreign_keys = ON</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Journal Mode:</span>
              <span className="badge badge-primary">WAL (Write-Ahead Logging)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Relational Tables:</span>
              <strong>12 Tables Active</strong>
            </div>
          </div>
        </div>

        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <h3>Security & Authentication</h3>
              <p>Cryptographic standards</p>
            </div>
            <Shield size={20} style={{ color: '#10b981' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Password Encryption:</span>
              <strong>bcrypt (10 Salt Rounds)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Token Algorithm:</span>
              <strong>HMAC SHA-256 (JWT)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Token Expiration:</span>
              <strong>24 Hours</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Role Isolation:</span>
              <span className="badge badge-success">Enforced by Middleware</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsView;
