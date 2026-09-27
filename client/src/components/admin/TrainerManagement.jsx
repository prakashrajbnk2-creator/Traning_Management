import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { HelperBanner } from '../common/HelperBanner.jsx';
import { Modal } from '../common/Modal.jsx';
import { Plus, UserCheck, Edit2, Trash2, BookOpen, CheckCircle2, XCircle } from 'lucide-react';

export function TrainerManagement() {
  const [trainers, setTrainers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [assignCourseId, setAssignCourseId] = useState('');
  const [modalError, setModalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'Trainer@123',
    trainer_code: '',
    specialization: '',
    phone: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    fetchTrainers();
    fetchCourses();
  }, []);

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const res = await api.getAllTrainers();
      if (res.success) {
        setTrainers(res.trainers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.getAllCourses();
      if (res.success) setCourses(res.courses);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      password: 'Trainer@123',
      trainer_code: `TRN00${trainers.length + 1}`,
      specialization: '',
      phone: '',
      status: 'ACTIVE'
    });
    setModalError('');
    setIsAddOpen(true);
  };

  const handleCreateTrainer = async (e) => {
    e.preventDefault();
    try {
      setModalError('');
      const res = await api.createTrainer(formData);
      if (res.success) {
        setIsAddOpen(false);
        setSuccessMsg(`Faculty member "${formData.name}" added successfully.`);
        fetchTrainers();
      }
    } catch (err) {
      setModalError(err.message || 'Failed to create trainer.');
    }
  };

  const handleOpenEdit = (trainer) => {
    setSelectedTrainer(trainer);
    setFormData({
      name: trainer.name,
      specialization: trainer.specialization || '',
      phone: trainer.phone || '',
      status: trainer.status
    });
    setModalError('');
    setIsEditOpen(true);
  };

  const handleUpdateTrainer = async (e) => {
    e.preventDefault();
    try {
      setModalError('');
      const res = await api.updateTrainer(selectedTrainer.id, formData);
      if (res.success) {
        setIsEditOpen(false);
        setSuccessMsg('Trainer details updated.');
        fetchTrainers();
      }
    } catch (err) {
      setModalError(err.message || 'Failed to update trainer.');
    }
  };

  const handleDeleteTrainer = async (trainerId, trainerName) => {
    if (!window.confirm(`Are you sure you want to remove "${trainerName}" from faculty?`)) {
      return;
    }
    try {
      const res = await api.deleteTrainer(trainerId);
      if (res.success) {
        setSuccessMsg('Trainer removed.');
        fetchTrainers();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete trainer.');
    }
  };

  const handleOpenAssign = (trainer) => {
    setSelectedTrainer(trainer);
    setAssignCourseId(courses[0]?.id || '');
    setModalError('');
    setIsAssignOpen(true);
  };

  const handleAssignCourse = async (e) => {
    e.preventDefault();
    try {
      setModalError('');
      const res = await api.assignTrainer({ trainer_id: selectedTrainer.id, course_id: parseInt(assignCourseId, 10) });
      if (res.success) {
        setIsAssignOpen(false);
        setSuccessMsg('Trainer assigned to course successfully.');
        fetchTrainers();
      }
    } catch (err) {
      setModalError(err.message || 'Failed to assign course.');
    }
  };

  return (
    <div>
      <HelperBanner
        title="Faculty & Trainer Management"
        description="Monitor instructional faculty, manage qualifications, and allocate teaching assignments."
        tip="Instructors can only view and evaluate students in courses they are officially assigned to teach."
        nextAction="Click 'Assign Course' to allocate an instructor to a curriculum module."
      />

      {successMsg && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>
          ✔ {successMsg}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <h3>Registered Faculty Members</h3>
            <p>Active and past instructional personnel</p>
          </div>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={16} /> + Add Trainer
          </button>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Email</th>
                <th>Specialization</th>
                <th>Assigned Courses</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading trainers...</td></tr>
              ) : trainers.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No trainers registered yet.</td></tr>
              ) : (
                trainers.map((t) => (
                  <tr key={t.id}>
                    <td><span className="badge badge-neutral" style={{ fontWeight: 700 }}>{t.trainer_code}</span></td>
                    <td>
                      <strong>{t.name}</strong>
                      {t.phone && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t.phone}</div>}
                    </td>
                    <td>{t.email}</td>
                    <td>{t.specialization || 'Generalist'}</td>
                    <td>
                      <span className="badge badge-primary">{t.assigned_courses_count} Course(s)</span>
                    </td>
                    <td>
                      <span className={`badge ${t.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                        {t.status === 'ACTIVE' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {t.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleOpenAssign(t)} className="btn btn-outline btn-sm">
                          <BookOpen size={14} /> Assign Course
                        </button>
                        <button onClick={() => handleOpenEdit(t)} className="btn btn-outline btn-sm">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDeleteTrainer(t.id, t.name)} className="btn btn-outline btn-sm" style={{ color: '#ef4444' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Trainer Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register Faculty Member"
        footer={(
          <>
            <button type="button" onClick={() => setIsAddOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" form="add-trainer-form" className="btn btn-primary">+ Add Trainer</button>
          </>
        )}
      >
        {modalError && <div style={{ color: '#dc2626', background: '#fef2f2', padding: '10px', borderRadius: '8px', marginBottom: '16px' }}>{modalError}</div>}
        <form id="add-trainer-form" onSubmit={handleCreateTrainer}>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Dr. Jane Carter"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              className="form-control"
              placeholder="jane@tms.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Trainer Code *</label>
            <input
              type="text"
              className="form-control"
              placeholder="TRN003"
              value={formData.trainer_code}
              onChange={(e) => setFormData({ ...formData, trainer_code: e.target.value.toUpperCase() })}
              required
            />
          </div>
          <div className="form-group">
            <label>Specialization / Subject Matter Expertise</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Cloud Architecture & Kubernetes"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="text"
              className="form-control"
              placeholder="+1-555-0199"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Initial Password *</label>
            <input
              type="password"
              className="form-control"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>

      {/* Edit Trainer Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Faculty: ${selectedTrainer?.name}`}
        footer={(
          <>
            <button type="button" onClick={() => setIsEditOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" form="edit-trainer-form" className="btn btn-primary">Save Changes</button>
          </>
        )}
      >
        {modalError && <div style={{ color: '#dc2626', background: '#fef2f2', padding: '10px', borderRadius: '8px', marginBottom: '16px' }}>{modalError}</div>}
        <form id="edit-trainer-form" onSubmit={handleUpdateTrainer}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Specialization</label>
            <input
              type="text"
              className="form-control"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="text"
              className="form-control"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select
              className="form-control"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Assign Course Modal */}
      <Modal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title={`Assign Course to ${selectedTrainer?.name}`}
        footer={(
          <>
            <button type="button" onClick={() => setIsAssignOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" form="assign-course-form" className="btn btn-primary">Assign Course</button>
          </>
        )}
      >
        {modalError && <div style={{ color: '#dc2626', background: '#fef2f2', padding: '10px', borderRadius: '8px', marginBottom: '16px' }}>{modalError}</div>}
        <form id="assign-course-form" onSubmit={handleAssignCourse}>
          <div className="form-group">
            <label>Select Course</label>
            <select
              className="form-control"
              value={assignCourseId}
              onChange={(e) => setAssignCourseId(e.target.value)}
              required
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.code}] {c.title}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default TrainerManagement;
