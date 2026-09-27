import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { HelperBanner } from '../common/HelperBanner.jsx';
import { Modal } from '../common/Modal.jsx';
import { Megaphone, Plus, Calendar, User, CheckCircle2 } from 'lucide-react';

export function AnnouncementsView() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState('ALL');
  const [modalError, setModalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.getAllAnnouncements();
      if (res.success) {
        setAnnouncements(res.announcements);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setModalError('');
      const res = await api.createAnnouncement({ title, content, target_role: targetRole });
      if (res.success) {
        setIsAddOpen(false);
        setTitle('');
        setContent('');
        setSuccessMsg('Announcement broadcasted successfully.');
        fetchAnnouncements();
      }
    } catch (err) {
      setModalError(err.message || 'Failed to post announcement.');
    }
  };

  return (
    <div>
      <HelperBanner
        title="Institution Announcements & Bulletins"
        description="Broadcast important deadlines, operational notices, and campus updates to students and faculty."
        tip="Target your announcements by role (All Users, Students Only, or Faculty Only)."
        nextAction="Click '+ Post Announcement' to send out a notice."
      />

      {successMsg && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>
          ✔ {successMsg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Published Announcements ({announcements.length})</h3>
        <button onClick={() => setIsAddOpen(true)} className="btn btn-primary">
          <Plus size={16} /> + Post Announcement
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No announcements published yet.</div>
        ) : (
          announcements.map((a) => (
            <div key={a.id} className="card" style={{ margin: 0, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Megaphone size={18} style={{ color: '#4f46e5' }} />
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{a.title}</h4>
                </div>
                <span className={`badge ${a.target_role === 'STUDENT' ? 'badge-primary' : a.target_role === 'TRAINER' ? 'badge-success' : 'badge-neutral'}`}>
                  Target: {a.target_role}
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.6, marginBottom: '12px' }}>
                {a.content}
              </p>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', gap: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} /> {a.created_at?.slice(0, 10)}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={13} /> Author: {a.author_name || 'System'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Announcement Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Broadcast New Announcement"
        footer={(
          <>
            <button type="button" onClick={() => setIsAddOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" form="add-announcement-form" className="btn btn-primary">Publish Announcement</button>
          </>
        )}
      >
        {modalError && <div style={{ color: '#dc2626', background: '#fef2f2', padding: '10px', borderRadius: '8px', marginBottom: '16px' }}>{modalError}</div>}
        <form id="add-announcement-form" onSubmit={handleCreate}>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Midterm Schedule Announcement"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Target Audience *</label>
            <select
              className="form-control"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            >
              <option value="ALL">Everyone (Students, Faculty, Staff)</option>
              <option value="STUDENT">Students Only</option>
              <option value="TRAINER">Faculty / Trainers Only</option>
            </select>
          </div>
          <div className="form-group">
            <label>Announcement Details *</label>
            <textarea
              className="form-control"
              rows="4"
              placeholder="Type message content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AnnouncementsView;
