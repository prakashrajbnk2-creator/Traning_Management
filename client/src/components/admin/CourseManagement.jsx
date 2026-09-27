import React, { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { HelperBanner } from '../common/HelperBanner.jsx';
import { Modal } from '../common/Modal.jsx';
import { Plus, BookOpen, Edit2, Trash2, Users, UserCheck, Layers, CheckCircle2 } from 'lucide-react';

export function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [modalError, setModalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    modules: [{ title: 'Module 1: Foundations', description: '' }]
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.getAllCourses();
      if (res.success) {
        setCourses(res.courses);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      code: `CS${Math.floor(200 + Math.random() * 800)}`,
      title: '',
      description: '',
      modules: [
        { title: 'Module 1: Core Fundamentals', description: 'Core principles and definitions' },
        { title: 'Module 2: Practical Implementation', description: 'Hands-on project work' }
      ]
    });
    setModalError('');
    setIsAddOpen(true);
  };

  const handleAddModuleField = () => {
    setFormData({
      ...formData,
      modules: [
        ...formData.modules,
        { title: `Module ${formData.modules.length + 1}: `, description: '' }
      ]
    });
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      setModalError('');
      const res = await api.createCourse(formData);
      if (res.success) {
        setIsAddOpen(false);
        setSuccessMsg(`Course "${formData.title}" created with syllabus modules.`);
        fetchCourses();
      }
    } catch (err) {
      setModalError(err.message || 'Failed to create course.');
    }
  };

  const handleOpenEdit = (course) => {
    setSelectedCourse(course);
    setFormData({
      title: course.title,
      description: course.description || '',
      status: course.status
    });
    setModalError('');
    setIsEditOpen(true);
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    try {
      setModalError('');
      const res = await api.updateCourse(selectedCourse.id, formData);
      if (res.success) {
        setIsEditOpen(false);
        setSuccessMsg('Course details updated.');
        fetchCourses();
      }
    } catch (err) {
      setModalError(err.message || 'Failed to update course.');
    }
  };

  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (!window.confirm(`Are you sure you want to delete course "${courseTitle}"? This will delete all enrolled progress and assessments.`)) {
      return;
    }
    try {
      const res = await api.deleteCourse(courseId);
      if (res.success) {
        setSuccessMsg('Course deleted successfully.');
        fetchCourses();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete course.');
    }
  };

  return (
    <div>
      <HelperBanner
        title="Curriculum & Course Management"
        description="Design course syllabi, set learning modules, and monitor cohort enrollments."
        tip="Every course consists of sequential modules. Students earn progress percentage as they complete each module."
        nextAction="Click '+ Create Course' to launch a new curriculum."
      />

      {successMsg && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px' }}>
          ✔ {successMsg}
        </div>
      )}

      {/* Courses Cards Grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Active Training Curriculums ({courses.length})</h3>
        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={16} /> + Create Course
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading courses...</div>
        ) : (
          courses.map((c) => (
            <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', margin: 0 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className="badge badge-primary" style={{ fontWeight: 800, fontSize: '0.8rem' }}>{c.code}</span>
                  <span className={`badge ${c.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>{c.status}</span>
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>{c.title}</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5, marginBottom: '16px' }}>{c.description || 'Comprehensive training curriculum.'}</p>
              </div>

              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '12px', background: '#f8fafc', borderRadius: '10px', marginBottom: '16px', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Modules</div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#4f46e5' }}>{c.modules_count}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Students</div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0ea5e9' }}>{c.students_count}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Faculty</div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#10b981' }}>{c.trainers_count}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button onClick={() => handleOpenEdit(c)} className="btn btn-outline btn-sm">
                    <Edit2 size={14} /> Edit
                  </button>
                  <button onClick={() => handleDeleteCourse(c.id, c.title)} className="btn btn-outline btn-sm" style={{ color: '#ef4444' }}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Course Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create New Training Course"
        maxWidth="600px"
        footer={(
          <>
            <button type="button" onClick={() => setIsAddOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" form="create-course-form" className="btn btn-primary">+ Create Course</button>
          </>
        )}
      >
        {modalError && <div style={{ color: '#dc2626', background: '#fef2f2', padding: '10px', borderRadius: '8px', marginBottom: '16px' }}>{modalError}</div>}
        <form id="create-course-form" onSubmit={handleCreateCourse}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px' }}>
            <div className="form-group">
              <label>Course Code *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. CS101"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="form-group">
              <label>Course Title *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Full-Stack Web Engineering"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Course Description</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Outline the course objectives and prerequisites..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ margin: 0, fontWeight: 700 }}>Syllabus Modules ({formData.modules.length})</label>
              <button type="button" onClick={handleAddModuleField} className="btn btn-outline btn-sm">
                + Add Module
              </button>
            </div>
            {formData.modules.map((m, idx) => (
              <div key={idx} style={{ marginBottom: '10px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder={`Module ${idx + 1} Title`}
                  value={m.title}
                  onChange={(e) => {
                    const updated = [...formData.modules];
                    updated[idx].title = e.target.value;
                    setFormData({ ...formData, modules: updated });
                  }}
                  required
                />
              </div>
            ))}
          </div>
        </form>
      </Modal>

      {/* Edit Course Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Course: ${selectedCourse?.title}`}
        footer={(
          <>
            <button type="button" onClick={() => setIsEditOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" form="edit-course-form" className="btn btn-primary">Save Changes</button>
          </>
        )}
      >
        {modalError && <div style={{ color: '#dc2626', background: '#fef2f2', padding: '10px', borderRadius: '8px', marginBottom: '16px' }}>{modalError}</div>}
        <form id="edit-course-form" onSubmit={handleUpdateCourse}>
          <div className="form-group">
            <label>Course Title</label>
            <input
              type="text"
              className="form-control"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Course Description</label>
            <textarea
              className="form-control"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
    </div>
  );
}

export default CourseManagement;
