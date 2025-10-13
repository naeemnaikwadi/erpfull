import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import API from '../services/api';
import { useAuth } from '../context/authContext';

const AdminExamAssignmentsPage = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAssignments();
    fetchInstructors();
  }, []);

  const fetchAssignments = async () => {
    try {
      const { data } = await API.get('/erp/examinations/assignments', { params: { limit: 50 } });
      setAssignments(data.assignments || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInstructors = async () => {
    try {
      const { data } = await API.get('/admin/users', { params: { role: 'instructor', limit: 200 } });
      setInstructors(data.users || []);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleInstructor = (assignmentId, instructorId) => {
    setSelected(prev => {
      const current = prev[assignmentId] || [];
      return {
        ...prev,
        [assignmentId]: current.includes(instructorId)
          ? current.filter(id => id !== instructorId)
          : [...current, instructorId]
      };
    });
  };

  const assign = async (assignmentId) => {
    try {
      setLoading(true);
      const instructorIds = selected[assignmentId] || [];
      await API.post(`/erp/examinations/assignments/${assignmentId}/assign-to-instructors`, { instructorIds });
      await fetchAssignments();
      alert('Assigned successfully');
    } catch (e) {
      console.error(e);
      alert('Failed to assign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role={user?.role}>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Exam Paper Assignments</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Assign uploaded exam papers to instructors for evaluation.</p>
        </div>

        {assignments.map(a => (
          <div key={a._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">{a.examId?.examName} - {a.examId?.examType}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{a.examId?.subject} | {a.status}</div>
              </div>
              <button disabled={loading} onClick={() => assign(a._id)} className="px-3 py-2 bg-primary-600 text-white rounded disabled:opacity-50">Assign Selected</button>
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {instructors.map(i => (
                <label key={i._id} className="flex items-center justify-between px-2 py-1 border rounded dark:border-gray-700">
                  <span className="text-sm text-gray-800 dark:text-gray-200">{i.name} <span className="text-gray-500">({i.email})</span></span>
                  <input type="checkbox" onChange={() => toggleInstructor(a._id, i._id)} checked={(selected[a._id] || []).includes(i._id)} />
                </label>
              ))}
            </div>
          </div>
        ))}

        {assignments.length === 0 && (
          <div className="text-sm text-gray-500">No assignments yet.</div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminExamAssignmentsPage;


