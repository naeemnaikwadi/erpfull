import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/authContext';
import API from '../services/api';

const GroupsManagementPage = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [studentsQuery, setStudentsQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchAdmins();
    fetchClassrooms();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data } = await API.get('/erp/groups');
      setGroups(data.groups || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdmins = async () => {
    try {
      const { data } = await API.get('/erp/groups/lookups/admins');
      setAdmins(data.users || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchClassrooms = async () => {
    try {
      const { data } = await API.get('/erp/groups/lookups/classrooms', { params: { limit: 100 } });
      setClassrooms(data.classrooms || []);
    } catch (e) {
      console.error(e);
    }
  };

  const searchStudents = async (q) => {
    try {
      setStudentsQuery(q);
      if (!q || q.length < 2) { setStudents([]); return; }
      const { data } = await API.get('/erp/groups/lookups/students', { params: { q, limit: 10 } });
      setStudents(data.users || []);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleStudent = (id) => {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const createGroup = async () => {
    try {
      setLoading(true);
      await API.post('/erp/groups', {
        name: form.name,
        description: form.description,
        studentIds: selectedStudentIds
      });
      setForm({ name: '', description: '' });
      setSelectedStudentIds([]);
      setStudents([]);
      setStudentsQuery('');
      await fetchGroups();
    } catch (e) {
      console.error(e);
      alert('Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const assignAdmin = async (groupId, adminId) => {
    try {
      await API.post(`/erp/groups/${groupId}/assign-admin`, { adminId });
      await fetchGroups();
    } catch (e) {
      console.error(e);
      alert('Failed to assign admin');
    }
  };

  const assignClassroom = async (groupId, classroomId) => {
    try {
      await API.post(`/erp/groups/${groupId}/assign-classroom`, { classroomId });
      await fetchGroups();
    } catch (e) {
      console.error(e);
      alert('Failed to assign classroom');
    }
  };

  return (
    <DashboardLayout role={user?.role}>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create Student Group</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              className="px-3 py-2 rounded border dark:bg-gray-700 dark:text-white"
              placeholder="Group name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="px-3 py-2 rounded border dark:bg-gray-700 dark:text-white"
              placeholder="Description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="mt-4">
            <input
              className="w-full px-3 py-2 rounded border dark:bg-gray-700 dark:text-white"
              placeholder="Search students by name or email"
              value={studentsQuery}
              onChange={e => searchStudents(e.target.value)}
            />
            {students.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto border rounded p-2 dark:border-gray-600">
                {students.map(s => (
                  <label key={s._id} className="flex items-center justify-between py-1">
                    <div className="text-sm text-gray-800 dark:text-gray-200">{s.name} <span className="text-gray-500">({s.email})</span></div>
                    <input type="checkbox" checked={selectedStudentIds.includes(s._id)} onChange={() => toggleStudent(s._id)} />
                  </label>
                ))}
              </div>
            )}
          </div>
          <button disabled={loading || !form.name || selectedStudentIds.length === 0} onClick={createGroup} className="mt-4 px-4 py-2 bg-primary-600 text-white rounded disabled:opacity-50">{loading ? 'Creating...' : 'Create Group'}</button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Groups</h2>
          <div className="space-y-4">
            {groups.map(g => (
              <div key={g._id} className="border rounded p-4 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{g.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{g.description}</div>
                    <div className="text-xs text-gray-500 mt-1">{(g.students || []).length} students</div>
                    {g.assignedAdmin && (
                    <div className="text-xs text-gray-500 mt-1">Assigned Admin: {g.assignedAdminName || admins.find(a => a._id === g.assignedAdmin)?.name || '—'}</div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <div className="flex gap-2">
                      <select id={`admin_${g._id}`} defaultValue="" className="px-2 py-1 border rounded dark:bg-gray-700 dark:text-white">
                        <option value="" disabled>Select Admin</option>
                        {admins.map(a => <option key={a._id} value={a._id}>{a.name} ({a.email})</option>)}
                      </select>
                      <button onClick={() => {
                        const sel = document.getElementById(`admin_${g._id}`);
                        if (sel && sel.value) assignAdmin(g._id, sel.value);
                      }} className="px-3 py-1 bg-blue-600 text-white rounded">Assign Admin</button>
                    </div>
                    <div className="flex gap-2">
                      <select id={`class_${g._id}`} defaultValue="" className="px-2 py-1 border rounded dark:bg-gray-700 dark:text-white">
                        <option value="" disabled>Select Classroom</option>
                        {classrooms.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                      <button onClick={() => {
                        const sel = document.getElementById(`class_${g._id}`);
                        if (sel && sel.value) assignClassroom(g._id, sel.value);
                      }} className="px-3 py-1 bg-green-600 text-white rounded">Assign Classroom</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {groups.length === 0 && <div className="text-sm text-gray-500">No groups yet.</div>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GroupsManagementPage;


