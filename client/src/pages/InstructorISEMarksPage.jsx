import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import API from '../services/api';
import { useAuth } from '../context/authContext';

const InstructorISEMarksPage = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [rows, setRows] = useState([{ studentId: '', obtained: 0 }]);

  useEffect(() => {
    fetchISEExams();
  }, []);

  const fetchISEExams = async () => {
    try {
      const { data } = await API.get('/erp/examinations', { params: { examType: 'ISE1', limit: 50 } });
      const { data: data2 } = await API.get('/erp/examinations', { params: { examType: 'ISE2', limit: 50 } });
      setExams([...(data.examinations || []), ...(data2.examinations || [])]);
    } catch (e) {
      console.error(e);
    }
  };

  const addRow = () => setRows(prev => [...prev, { studentId: '', obtained: 0 }]);
  const updateRow = (i, field, value) => setRows(prev => { const copy = [...prev]; copy[i] = { ...copy[i], [field]: value }; return copy; });
  const removeRow = (i) => setRows(prev => prev.filter((_, idx) => idx !== i));

  const submit = async () => {
    try {
      await API.post(`/erp/examinations/${selectedExamId}/ise-marks`, { componentType: 'manual', marks: rows });
      alert('Marks saved and published');
      setRows([{ studentId: '', obtained: 0 }]);
    } catch (e) {
      console.error(e);
      alert('Failed to save');
    }
  };

  return (
    <DashboardLayout role={user?.role}>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Enter ISE1/ISE2 Marks</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Select an ISE exam and enter marks out of 10.</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
          <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} className="px-3 py-2 border rounded dark:bg-gray-700 dark:text-white">
            <option value="">Select Exam</option>
            {exams.map(ex => (
              <option key={ex._id} value={ex._id}>{ex.examName} - {ex.examType} - {ex.subject}</option>
            ))}
          </select>
          <div className="space-y-2">
            {rows.map((r, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <input className="px-2 py-1 border rounded dark:bg-gray-700 dark:text-white" placeholder="Student ID" value={r.studentId} onChange={e => updateRow(idx, 'studentId', e.target.value)} />
                <input type="number" max={10} min={0} className="px-2 py-1 border rounded dark:bg-gray-700 dark:text-white" placeholder="Obtained (0-10)" value={r.obtained} onChange={e => updateRow(idx, 'obtained', Number(e.target.value))} />
                <div className="md:col-span-3 flex gap-2">
                  <button onClick={addRow} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded">Add</button>
                  <button onClick={() => removeRow(idx)} className="px-3 py-1 bg-red-600 text-white rounded">Remove</button>
                </div>
              </div>
            ))}
          </div>
          <button disabled={!selectedExamId} onClick={submit} className="mt-2 px-4 py-2 bg-primary-600 text-white rounded disabled:opacity-50">Submit</button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InstructorISEMarksPage;


