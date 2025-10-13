import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import {
  FileText, Upload, Download, Edit, Trash2, Eye, Plus,
  CheckCircle, XCircle, Clock, Award, Users, BarChart3,
  Star, Calendar, CheckSquare
} from 'lucide-react';

const AssignmentSection = ({ courseId, classroomId }) => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxScore: 10,
    instructions: '',
    allowLateSubmission: false
  });

  const [assignmentPattern, setAssignmentPattern] = useState(null);

  const [gradeData, setGradeData] = useState({
    score: 0,
    feedback: '',
    gradedBy: ''
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchAssignments();
  }, [courseId]);

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/assignments/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      setError('Failed to fetch assignments');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = showEditModal 
        ? `http://localhost:4000/api/assignments/${selectedAssignment._id}`
        : 'http://localhost:4000/api/assignments';
      
      const method = showEditModal ? 'PUT' : 'POST';
      
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('dueDate', formData.dueDate);
      formDataToSend.append('maxScore', formData.maxScore);
      formDataToSend.append('instructions', formData.instructions);
      formDataToSend.append('allowLateSubmission', formData.allowLateSubmission);
      formDataToSend.append('courseId', courseId);
      formDataToSend.append('classroomId', classroomId);
      
      if (assignmentPattern) {
        formDataToSend.append('assignmentPattern', assignmentPattern);
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        setSuccess(showEditModal ? 'Assignment updated successfully!' : 'Assignment created successfully!');
        setShowCreateModal(false);
        setShowEditModal(false);
        setFormData({
          title: '',
          description: '',
          dueDate: '',
          maxScore: 10,
          instructions: '',
          allowLateSubmission: false
        });
        setAssignmentPattern(null);
        fetchAssignments();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to save assignment');
      }
    } catch (error) {
      setError('Failed to save assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate ? assignment.dueDate.split('T')[0] : '',
      maxScore: assignment.maxScore,
      instructions: assignment.instructions,
      allowLateSubmission: assignment.allowLateSubmission
    });
    setAssignmentPattern(null); // Reset file input for edit
    setShowEditModal(true);
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/instructor/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setSuccess('Assignment deleted successfully!');
        fetchAssignments();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to delete assignment');
      }
    } catch (error) {
      setError('Failed to delete assignment');
    }
  };

  const handleViewSubmissions = async (assignment) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/assignments/${assignment._id}/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        assignment.submissions = data.submissions || [];
        setSelectedAssignment(assignment);
        setShowSubmissionsModal(true);
      }
    } catch (error) {
      setError('Failed to fetch submissions');
    }
  };

  const handleGradeSubmission = (submission) => {
    setSelectedSubmission(submission);
    setGradeData({
      score: submission.score || 0,
      feedback: submission.feedback || '',
      gradedBy: user.name
    });
    setShowGradeModal(true);
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      // Use instructor alias (PUT) and fallback to core route (POST)
      let response = await fetch(`http://localhost:4000/api/instructor/assignments/${selectedAssignment._id}/submissions/${selectedSubmission._id}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(gradeData)
      });

      if (!response.ok) {
        // Fallback
        response = await fetch(`http://localhost:4000/api/assignments/${selectedAssignment._id}/grade/${selectedSubmission._id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(gradeData)
        });
      }

      if (response.ok) {
        setSuccess('Assignment graded successfully!');
        setShowGradeModal(false);
        handleViewSubmissions(selectedAssignment);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to grade assignment');
      }
    } catch (error) {
      setError('Failed to grade assignment');
    } finally {
      setLoading(false);
    }
  };

  const downloadSubmission = async (submission) => {
    try {
      const token = localStorage.getItem('token');
      // Show submission in viewer instead of download
      const url = `http://localhost:4000/api/assignments/${selectedAssignment._id}/submissions/${submission._id}/download?token=${encodeURIComponent(token)}`;
      setViewer({ open: true, src: url });
    } catch (error) {
      setError('Failed to view submission');
    }
  };

  const handleSubmitAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionFile(null);
    setShowSubmitModal(true);
  };

  const handleSubmissionSubmit = async (e) => {
    e.preventDefault();
    if (!submissionFile) {
      setError('Please select a file to submit');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('submission', submissionFile);

      const response = await fetch(`http://localhost:4000/api/assignments/${selectedAssignment._id}/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setSuccess('Assignment submitted successfully!');
        setShowSubmitModal(false);
        setSubmissionFile(null);
        fetchAssignments();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to submit assignment');
      }
    } catch (error) {
      setError('Failed to submit assignment');
    } finally {
      setLoading(false);
    }
  };

  const [viewer, setViewer] = useState({ open: false, src: '' });
  const downloadAssignmentPattern = async (assignment) => {
    try {
      const token = localStorage.getItem('token');
      if (!assignment.assignmentPattern) {
        setError('No assignment pattern available');
        return;
      }
      
      // Fetch the file URL from the server
      const response = await fetch(`http://localhost:4000/api/assignments/${assignment._id}/download-pattern`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          setViewer({ open: true, src: data.url });
        } else {
          setError('Assignment pattern URL not found');
        }
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to load assignment pattern');
      }
    } catch (error) {
      console.error('View error:', error);
      setError('Failed to open assignment pattern');
    }
  };

  const getStatusColor = (assignment) => {
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    
    if (now > dueDate) {
      return 'text-red-600';
    } else if (now > new Date(dueDate.getTime() - 24 * 60 * 60 * 1000)) {
      return 'text-yellow-600';
    }
    return 'text-green-600';
  };

  const getSubmissionStatus = (submission) => {
    if (submission.graded) {
      return { text: 'Graded', color: 'text-green-600', bg: 'bg-green-100' };
    } else if (submission.submitted) {
      return { text: 'Submitted', color: 'text-blue-600', bg: 'bg-blue-100' };
    }
    return { text: 'Not Submitted', color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const calculateAverageScore = (submissions) => {
    const gradedSubmissions = submissions.filter(s => s.graded);
    if (gradedSubmissions.length === 0) return 0;
    const totalScore = gradedSubmissions.reduce((sum, s) => sum + s.score, 0);
    return (totalScore / gradedSubmissions.length).toFixed(1);
  };

  // Filter and sort assignments
  const filteredAssignments = assignments
    .filter(assignment => {
      const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesStatus = true;
      if (filterStatus !== 'all') {
        const now = new Date();
        const dueDate = new Date(assignment.dueDate);
        if (filterStatus === 'active') {
          matchesStatus = now <= dueDate;
        } else if (filterStatus === 'overdue') {
          matchesStatus = now > dueDate;
        }
      }
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'dueDate':
          aValue = new Date(a.dueDate);
          bValue = new Date(b.dueDate);
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'submissions':
          aValue = a.submissions?.length || 0;
          bValue = b.submissions?.length || 0;
          break;
        case 'maxScore':
          aValue = a.maxScore;
          bValue = b.maxScore;
          break;
        default:
          aValue = new Date(a.dueDate);
          bValue = new Date(b.dueDate);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const [showAssignmentDetailsModal, setShowAssignmentDetailsModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Course Assignments
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {user.role === 'instructor' || user.role === 'admin' 
              ? 'Create and manage assignments for your students' 
              : 'View course assignments'}
          </p>
        </div>
        {/* Create Assignment Button - Only visible to instructors and admins */}
        {(user.role === 'instructor' || user.role === 'admin') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-lg font-semibold shadow-lg"
          >
            <Plus size={24} />
            Create Assignment
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Info Message - Only visible to instructors and admins */}
      {(user.role === 'instructor' || user.role === 'admin') && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-600" />
            <p className="text-green-800 dark:text-green-200 font-medium">
              You can now create and manage assignments for your students. Use the "Create Assignment" button above to get started!
            </p>
          </div>
        </div>
      )}

      {/* Filters - Only visible to instructors and admins */}
      {(user.role === 'instructor' || user.role === 'admin') && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="title">Title</option>
                <option value="dueDate">Due Date</option>
                <option value="createdAt">Date Created</option>
                <option value="submissions">Submissions</option>
                <option value="maxScore">Max Score</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredAssignments.length} of {assignments.length} assignments
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setSortBy('dueDate');
                setSortOrder('asc');
              }}
              className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Assignments List */}
      <div className="grid gap-4">
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No assignments found</p>
            <p className="text-sm">
              {assignments.length === 0 ? 'Create your first assignment to get started' : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          filteredAssignments.map((assignment) => (
           <div key={assignment._id} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
             <div className="flex justify-between items-start mb-4">
               <div className="flex-1">
                 <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                   {assignment.title}
                 </h4>
                 <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                   {assignment.description}
                 </p>
                 <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    Max Score: {assignment.maxScore}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {assignment.submissions?.length || 0} submissions
                  </span>
                  <span className={`flex items-center gap-1 ${getStatusColor(assignment)}`}>
                    <Clock className="w-4 h-4" />
                    {new Date(assignment.dueDate) > new Date() ? 'Active' : 'Overdue'}
                  </span>
                </div>
               {assignment.instructions && (
                 <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                   <p className="text-sm text-gray-700 dark:text-gray-300">
                     <strong>Instructions:</strong> {assignment.instructions}
                   </p>
                 </div>
               )}
               
               {assignment.assignmentPattern && (
                 <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                   <p className="text-sm text-blue-700 dark:text-blue-300">
                     <strong>📎 Assignment Pattern:</strong> {assignment.assignmentPattern.fileName}
                   </p>
                   <div className="flex gap-2 mt-2">
                     <button
                       onClick={() => downloadAssignmentPattern(assignment)}
                       className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center gap-1"
                     >
                       <Eye className="w-3 h-3" />
                       View Pattern
                     </button>
                     <button
                       onClick={() => {
                         const token = localStorage.getItem('token');
                         const url = `http://localhost:4000/api/assignments/${assignment._id}/download-pattern`;
                         window.open(url + `?token=${encodeURIComponent(token)}`, '_blank');
                       }}
                       className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 flex items-center gap-1"
                     >
                       <Download className="w-3 h-3" />
                       Download
                     </button>
                   </div>
                 </div>
               )}
               </div>
               {/* Action buttons */}
               <div className="flex gap-2">
                 {/* View button - Always visible */}
                 <button
                   onClick={() => {
                     if (user.role === 'student') {
                       setSelectedAssignment(assignment);
                       setShowAssignmentDetailsModal(true);
                     } else {
                       handleViewSubmissions(assignment);
                     }
                   }}
                   className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                   title={user.role === 'student' ? 'View Assignment Details' : 'View Submissions'}
                 >
                   <Eye className="w-4 h-4" />
                 </button>
                 
                 {/* Instructor/Admin only buttons */}
                 {(user.role === 'instructor' || user.role === 'admin') && (
                   <>
                     <button
                       onClick={() => handleEditAssignment(assignment)}
                       className="text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-50"
                       title="Edit Assignment"
                     >
                       <Edit className="w-4 h-4" />
                     </button>
                     <button
                       onClick={() => handleDeleteAssignment(assignment._id)}
                       className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50"
                       title="Delete Assignment"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </>
                 )}
               </div>
               
               {/* Student submission button */}
               {user.role === 'student' && (
                 <div className="flex gap-2">
                   {(() => {
                     const studentSubmission = (assignment.submissions || []).find(sub => String(sub.studentId) === String(user.id || user._id));
                     if (studentSubmission) {
                       const isGraded = !!(studentSubmission.isGraded || studentSubmission.graded);
                       return (
                         <div className="flex flex-col gap-1">
                           <span className={isGraded ? "text-green-600 text-sm font-medium" : "text-yellow-600 text-sm font-medium"}>
                             {isGraded ? '✓ Submitted & Graded' : '✓ Submitted (Pending Grade)'}
                           </span>
                           {typeof studentSubmission.score === 'number' && (
                             <span className="text-blue-600 text-sm font-bold">
                               Score: {studentSubmission.score}/{assignment.maxScore}
                             </span>
                           )}
                           {studentSubmission.feedback && (
                             <span className="text-gray-600 text-xs">
                               Feedback: {studentSubmission.feedback}
                             </span>
                           )}
                         </div>
                       );
                     }
                     return (
                       <button
                         onClick={() => handleSubmitAssignment(assignment)}
                         className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                       >
                         <Upload className="w-4 h-4" />
                         Submit Assignment
                       </button>
                     );
                   })()}
                 </div>
               )}
             </div>
           </div>
         ))
       )}
     </div>

     {/* Create/Edit Assignment Modal */}
     {(showCreateModal || showEditModal) && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
           <h2 className="text-xl font-semibold mb-4">
             {showEditModal ? 'Edit Assignment' : 'Create New Assignment'}
           </h2>
           <form onSubmit={handleSubmit} className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                   Assignment Title
                 </label>
                 <input
                   type="text"
                   name="title"
                   value={formData.title}
                   onChange={handleInputChange}
                   required
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                   Due Date
                 </label>
                 <input
                   type="date"
                   name="dueDate"
                   value={formData.dueDate}
                   onChange={handleInputChange}
                   required
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                 />
               </div>
             </div>
             
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                 Description
               </label>
               <textarea
                 name="description"
                 value={formData.description}
                 onChange={handleInputChange}
                 rows={3}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
               />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                   Maximum Score
                 </label>
                 <input
                   type="number"
                   name="maxScore"
                   value={formData.maxScore}
                   onChange={handleInputChange}
                   min="1"
                   max="100"
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                 />
               </div>
               <div className="flex items-center mt-6">
                 <input
                   type="checkbox"
                   name="allowLateSubmission"
                   checked={formData.allowLateSubmission}
                   onChange={handleInputChange}
                   className="mr-2 text-primary focus:ring-primary"
                 />
                 <label className="text-sm text-gray-700 dark:text-gray-300">
                   Allow late submissions
                 </label>
               </div>
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                 Instructions (Optional)
               </label>
               <textarea
                 name="instructions"
                 value={formData.instructions}
                 onChange={handleInputChange}
                 rows={3}
                 placeholder="Provide specific instructions for students..."
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
               />
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                 Assignment Pattern (PDF) - Optional
               </label>
               <input
                 type="file"
                 accept=".pdf"
                 onChange={(e) => setAssignmentPattern(e.target.files[0])}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
               />
               <p className="text-xs text-gray-500 mt-1">
                 Upload a PDF template or pattern for students to follow
               </p>
             </div>

             <div className="flex justify-end space-x-3">
               <button
                 type="button"
                 onClick={() => {
                   setShowCreateModal(false);
                   setShowEditModal(false);
                 }}
                 className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
               >
                 Cancel
               </button>
               <button
                 type="submit"
                 disabled={loading}
                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
               >
                 {loading ? 'Saving...' : (showEditModal ? 'Update Assignment' : 'Create Assignment')}
               </button>
             </div>
           </form>
         </div>
       </div>
     )}

     {/* Submissions Modal */}
     {showSubmissionsModal && selectedAssignment && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
           <h2 className="text-xl font-semibold mb-4">
             Submissions: {selectedAssignment.title}
           </h2>
           
           <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
               <div>
                 <div className="text-2xl font-bold text-primary">
                   {selectedAssignment.submissions?.length || 0}
                 </div>
                 <div className="text-sm text-gray-600 dark:text-gray-400">
                   Total Submissions
                 </div>
               </div>
               <div>
                 <div className="text-2xl font-bold text-green-600">
                   {calculateAverageScore(selectedAssignment.submissions || [])}
                 </div>
                 <div className="text-sm text-gray-600 dark:text-gray-400">
                   Average Score
                 </div>
               </div>
               <div>
                 <div className="text-2xl font-bold text-blue-600">
                   {selectedAssignment.submissions?.filter(s => s.graded).length || 0}
                 </div>
                 <div className="text-sm text-gray-600 dark:text-gray-400">
                   Graded
                 </div>
               </div>
             </div>
           </div>

           {(!selectedAssignment.submissions || selectedAssignment.submissions.length === 0) ? (
             <div className="text-center py-8 text-gray-500">
               <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
               <p>No submissions yet</p>
               <p className="text-sm">Students haven't submitted their assignments yet</p>
             </div>
           ) : (
             <div className="space-y-4">
               {selectedAssignment.submissions.map((submission, index) => (
                 <div key={submission._id || index} className="border border-gray-200 rounded-lg p-4">
                   <div className="flex justify-between items-center">
                     <div className="flex-1">
                       <h4 className="font-medium text-gray-900 dark:text-white">
                         {submission.student?.name || 'Unknown Student'}
                       </h4>
                       <p className="text-sm text-gray-600 dark:text-gray-400">
                         {submission.student?.email || 'No email'}
                       </p>
                       <div className="flex items-center gap-4 mt-2">
                         <span className={`px-2 py-1 rounded-full text-xs ${getSubmissionStatus(submission).bg} ${getSubmissionStatus(submission).color}`}>
                           {getSubmissionStatus(submission).text}
                         </span>
                         <span className="text-sm text-gray-500">
                           Submitted: {new Date(submission.submittedAt || submission.createdAt).toLocaleDateString()}
                         </span>
                         {submission.graded && (
                           <span className="text-sm font-medium text-gray-900 dark:text-white">
                             Score: {submission.score}/{selectedAssignment.maxScore}
                           </span>
                         )}
                       </div>
                     </div>
                     <div className="flex gap-2">
                       <button
                         onClick={() => downloadSubmission(submission)}
                         className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                         title="Download PDF"
                       >
                         <Download className="w-4 h-4" />
                       </button>
                       {!submission.graded && (
                         <button
                           onClick={() => handleGradeSubmission(submission)}
                           className="text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-50"
                           title="Grade Assignment"
                         >
                           <CheckSquare className="w-4 h-4" />
                         </button>
                       )}
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           )}

           <div className="flex justify-end mt-6">
             <button
               onClick={() => setShowSubmissionsModal(false)}
               className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
             >
               Close
             </button>
           </div>
         </div>

         
       </div>
     )}

     {/* Grade Assignment Modal */}
     {showGradeModal && selectedSubmission && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
           <h2 className="text-xl font-semibold mb-4">
             Grade Assignment
           </h2>
           <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
             Student: {selectedSubmission.student?.name || 'Unknown'}
           </p>
           <div className="mb-2">
             <button
               type="button"
               onClick={() => {
                 if (!selectedAssignment || !selectedSubmission) return;
                 const token = localStorage.getItem('token');
                 const url = `http://localhost:4000/api/assignments/${selectedAssignment._id}/submissions/${selectedSubmission._id}/download`;
                 window.open(url + `?token=${encodeURIComponent(token)}`, '_blank');
               }}
               className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
               title="Preview Submission"
             >
               Preview PDF
             </button>
           </div>
           
           <form onSubmit={handleGradeSubmit} className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                 Score (out of {selectedAssignment?.maxScore || 10})
               </label>
               <input
                 type="number"
                 value={gradeData.score}
                 onChange={(e) => setGradeData({ ...gradeData, score: parseInt(e.target.value) })}
                 min="0"
                 max={selectedAssignment?.maxScore || 10}
                 required
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
               />
             </div>
             
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                 Feedback (Optional)
               </label>
               <textarea
                 value={gradeData.feedback}
                 onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                 rows={3}
                 placeholder="Provide feedback to the student..."
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
               />
             </div>

             <div className="flex justify-end space-x-3">
               <button
                 type="button"
                 onClick={() => setShowGradeModal(false)}
                 className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
               >
                 Cancel
               </button>
               <button
                 type="submit"
                 disabled={loading}
                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
               >
                 {loading ? 'Grading...' : 'Submit Grade'}
               </button>
             </div>
           </form>
         </div>
       </div>
     )}

     {/* Student Submission Modal */}
     {showSubmitModal && selectedAssignment && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
           <h2 className="text-xl font-semibold mb-4">
             Submit Assignment
           </h2>
           <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
             Assignment: {selectedAssignment.title}
           </p>
           
           <form onSubmit={handleSubmissionSubmit} className="space-y-4">
             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                 Upload Your Assignment File
               </label>
               <input
                 type="file"
                 accept=".pdf,.doc,.docx,.txt"
                 onChange={(e) => setSubmissionFile(e.target.files[0])}
                 required
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
               />
               <p className="text-xs text-gray-500 mt-1">
                 Supported formats: PDF, DOC, DOCX, TXT
               </p>
             </div>

             {selectedAssignment.instructions && (
               <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                 <p className="text-sm text-gray-700 dark:text-gray-300">
                   <strong>Instructions:</strong> {selectedAssignment.instructions}
                 </p>
               </div>
             )}

             <div className="flex justify-end space-x-3">
               <button
                 type="button"
                 onClick={() => setShowSubmitModal(false)}
                 className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
               >
                 Cancel
               </button>
               <button
                 type="submit"
                 disabled={loading || !submissionFile}
                 className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
               >
                 {loading ? 'Submitting...' : 'Submit Assignment'}
               </button>
             </div>
           </form>
         </div>
       </div>
     )}

     {/* Inline PDF Viewer */}
     {viewer?.open && (
       <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setViewer({ open: false, src: '' })}>
         <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-7xl h-full max-h-[98vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
           <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
             <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">Document Viewer</h3>
             <button 
               className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm sm:text-base flex-shrink-0" 
               onClick={() => setViewer({ open: false, src: '' })}
             >
               Close
             </button>
           </div>
           <div className="flex-1 p-2 sm:p-4">
             <div className="w-full h-full border rounded-lg overflow-hidden bg-gray-100">
               <iframe 
                 title="pdf-viewer" 
                 src={`${viewer.src}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                 className="w-full h-full border-0" 
                 style={{ minHeight: '400px' }}
               />
             </div>
           </div>
         </div>
       </div>
     )}

     {/* Assignment Details Modal */}
     {showAssignmentDetailsModal && selectedAssignment && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
           <h2 className="text-xl font-semibold mb-4">
             Assignment Details: {selectedAssignment.title}
           </h2>
           
           <div className="space-y-4">
             <div>
               <h3 className="font-medium text-gray-900 dark:text-white mb-2">Description</h3>
               <p className="text-gray-600 dark:text-gray-400">{selectedAssignment.description}</p>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <h3 className="font-medium text-gray-900 dark:text-white mb-2">Due Date</h3>
                 <p className="text-gray-600 dark:text-gray-400">
                   {new Date(selectedAssignment.dueDate).toLocaleDateString()}
                 </p>
               </div>
               <div>
                 <h3 className="font-medium text-gray-900 dark:text-white mb-2">Max Score</h3>
                 <p className="text-gray-600 dark:text-gray-400">{selectedAssignment.maxScore} points</p>
               </div>
             </div>
             
             {selectedAssignment.instructions && (
               <div>
                 <h3 className="font-medium text-gray-900 dark:text-white mb-2">Instructions</h3>
                 <p className="text-gray-600 dark:text-gray-400">{selectedAssignment.instructions}</p>
               </div>
             )}
             
             {selectedAssignment.assignmentPattern && (
               <div>
                 <h3 className="font-medium text-gray-900 dark:text-white mb-2">Assignment Pattern</h3>
                 <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                   <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                     <strong>File:</strong> {selectedAssignment.assignmentPattern.fileName}
                   </p>
                   <div className="flex gap-2">
                     <button
                       onClick={() => downloadAssignmentPattern(selectedAssignment)}
                       className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                     >
                       Download Pattern
                     </button>
                     <button
                       onClick={() => {
                         const token = localStorage.getItem('token');
                         const url = `http://localhost:4000/api/assignments/${selectedAssignment._id}/download-pattern`;
                         window.open(url + `?token=${encodeURIComponent(token)}`, '_blank');
                       }}
                       className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                     >
                       View Pattern
                     </button>
                   </div>
                 </div>
               </div>
             )}
           </div>
           
           <div className="flex justify-end mt-6">
             <button
               onClick={() => setShowAssignmentDetailsModal(false)}
               className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
             >
               Close
             </button>
           </div>
         </div>
       </div>
     )}
   </div>
 );
};

export default AssignmentSection;
