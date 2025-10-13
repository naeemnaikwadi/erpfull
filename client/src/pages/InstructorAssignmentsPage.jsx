import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import API from '../services/api';
import { useAuth } from '../context/authContext';

const InstructorAssignmentsPage = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [evaluations, setEvaluations] = useState({});

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const { data } = await API.get('/erp/examinations/instructor/assignments', { params: { limit: 50 } });
      setAssignments(data.assignments || []);
    } catch (e) {
      console.error(e);
    }
  };

  const addRow = (assignmentId) => {
    setEvaluations(prev => ({
      ...prev,
      [assignmentId]: [...(prev[assignmentId] || []), { studentId: '', studentName: '', marksObtained: 0, totalMarks: 100 }]
    }));
  };

  const updateRow = (assignmentId, index, field, value) => {
    setEvaluations(prev => {
      const list = [...(prev[assignmentId] || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, [assignmentId]: list };
    });
  };

  const submitEvaluation = async (assignmentId) => {
    try {
      const evaluatedPapers = evaluations[assignmentId] || [];
      await API.post(`/erp/examinations/assignments/${assignmentId}/instructor-submit`, { evaluatedPapers });
      await fetchAssignments();
      alert('Submitted');
    } catch (e) {
      console.error(e);
      alert('Failed to submit');
    }
  };

  return (
    <DashboardLayout role={user?.role}>
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Exam Assignments</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Evaluate assigned papers and upload marks.</p>
        </div>

        {assignments.map(a => (
          <div key={a._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">{a.examId?.examName} - {a.examId?.examType}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{a.examId?.subject} | Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : 'N/A'}</div>
              </div>
              <button onClick={() => addRow(a._id)} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded">Add Row</button>
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-2">
              {(evaluations[a._id] || []).map((row, idx) => (
                <div key={idx} className="md:col-span-5 grid grid-cols-1 md:grid-cols-5 gap-2">
                  <input className="px-2 py-1 border rounded dark:bg-gray-700 dark:text-white" placeholder="Student ID" value={row.studentId} onChange={e => updateRow(a._id, idx, 'studentId', e.target.value)} />
                  <input className="px-2 py-1 border rounded dark:bg-gray-700 dark:text-white" placeholder="Student Name" value={row.studentName} onChange={e => updateRow(a._id, idx, 'studentName', e.target.value)} />
                  <input type="number" className="px-2 py-1 border rounded dark:bg-gray-700 dark:text-white" placeholder="Marks" value={row.marksObtained} onChange={e => updateRow(a._id, idx, 'marksObtained', Number(e.target.value))} />
                  <input type="number" className="px-2 py-1 border rounded dark:bg-gray-700 dark:text-white" placeholder="Total" value={row.totalMarks} onChange={e => updateRow(a._id, idx, 'totalMarks', Number(e.target.value))} />
                  <button onClick={() => submitEvaluation(a._id)} className="px-3 py-1 bg-primary-600 text-white rounded">Submit</button>
                </div>
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

export default InstructorAssignmentsPage;


