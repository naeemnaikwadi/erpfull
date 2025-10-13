import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import API from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import {
  ClipboardList,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Award,
  BarChart3
} from 'lucide-react';

const ExaminationsPage = () => {
  const [examinations, setExaminations] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedExam, setSelectedExam] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('examinations');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newExam, setNewExam] = useState({
    examName: '', examType: 'Midterm', subject: '', course: '', branch: '', semester: 1,
    academicYear: '', examDate: '', startTime: '', endTime: '', duration: 60, venue: '', totalMarks: 100, passingMarks: 35
  });

  const createExam = async () => {
    try {
      await API.post('/erp/examinations', newExam);
      setShowCreateModal(false);
      fetchExaminations();
    } catch (e) { alert(e.message); }
  };

  const downloadResultsTemplate = () => {
    const rows = [
      { studentId: 'PRN2023XXXX', subject: 'Maths', course: 'B.Tech', branch: 'CSE', semester: 1, marksObtained: 78, grade: 'A' }
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Results');
    XLSX.writeFile(wb, 'exam_results_template.xlsx');
  };

  const handleResultsExcelUpload = async (examId, file) => {
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws);
      await API.post(`/erp/examinations/${examId}/bulk-results`, { results: json });
      alert('Results uploaded successfully');
    } catch (e) { console.error(e); alert('Failed to upload results'); }
  };

  useEffect(() => {
    fetchExaminations();
  }, [currentPage, typeFilter, statusFilter]);

  const fetchExaminations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(typeFilter !== 'all' && { examType: typeFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const { data } = await API.get('/erp/examinations', { params: Object.fromEntries(params) });
      
      setExaminations(data.examinations || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching examinations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async (examId) => {
    try {
      const { data } = await API.get(`/erp/examinations/${examId}/results`);
      setResults(data.results || []);
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Ongoing': return 'bg-blue-100 text-blue-800';
      case 'Scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Postponed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      case 'Ongoing': return <Clock className="w-4 h-4" />;
      case 'Scheduled': return <Calendar className="w-4 h-4" />;
      case 'Cancelled': return <XCircle className="w-4 h-4" />;
      case 'Postponed': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+':
      case 'A': return 'text-green-600';
      case 'B+':
      case 'B': return 'text-blue-600';
      case 'C+':
      case 'C': return 'text-yellow-600';
      case 'D': return 'text-orange-600';
      case 'F': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const ExamModal = ({ exam, onClose }) => {
    if (!exam) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {exam.examName}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Exam Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                  Exam Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <ClipboardList className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="font-medium">{exam.examType}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Subject:</span>
                    <span className="font-medium">{exam.subject}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Date:</span>
                    <span className="font-medium">{new Date(exam.examDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Time:</span>
                    <span className="font-medium">{exam.startTime} - {exam.endTime}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Venue:</span>
                    <span className="font-medium">{exam.venue}</span>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                  Academic Details
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Course:</span>
                    <span className="font-medium">{exam.course}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Branch:</span>
                    <span className="font-medium">{exam.branch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Semester:</span>
                    <span className="font-medium">{exam.semester}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Academic Year:</span>
                    <span className="font-medium">{exam.academicYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Credits:</span>
                    <span className="font-medium">{exam.credits}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Exam Details */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2 mb-4">
                Exam Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Marks</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {exam.totalMarks}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Passing Marks</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {exam.passingMarks}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Duration</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {exam.duration} mins
                  </div>
                </div>
              </div>
            </div>

            {/* Status and Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(exam.examStatus)}`}>
                    {getStatusIcon(exam.examStatus)}
                    <span>{exam.examStatus}</span>
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setActiveTab('results');
                      fetchResults(exam._id);
                    }}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>View Results</span>
                  </button>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Add Results</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Examination Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage examinations and results</p>
          </div>
          <div className="flex items-center gap-2">
          <button onClick={() => setShowCreateModal(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Create Exam</span>
          </button>
          <button onClick={() => window.open('/api/erp/examinations/export?type=examinations&format=csv', '_blank')} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Exams</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">45</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Upcoming</p>
              <p className="text-2xl font-bold text-yellow-600">12</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <Calendar className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-green-600">28</p>
            </div>
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ongoing</p>
              <p className="text-2xl font-bold text-blue-600">5</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('examinations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'examinations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Examinations
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'results'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Results
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'examinations' ? (
            <div className="space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search examinations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Types</option>
                  <option value="Midterm">Midterm</option>
                  <option value="Final">Final</option>
                  <option value="Quiz">Quiz</option>
                  <option value="Assignment">Assignment</option>
                  <option value="Practical">Practical</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <div className="flex items-center gap-2">
                  <button onClick={() => window.open('/api/erp/examinations/export?type=examinations&format=csv', '_blank')} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                  <input id="resultsExcel" type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => e.target.files && selectedExam && handleResultsExcelUpload(selectedExam._id, e.target.files[0])} />
                  <button onClick={() => document.getElementById('resultsExcel').click()} className="px-4 py-2 rounded-lg border">Upload Results Excel</button>
                  <button onClick={downloadResultsTemplate} className="px-4 py-2 rounded-lg border">Sample Excel</button>
                </div>
              </div>

              {/* Examinations Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Exam
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Venue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        </td>
                      </tr>
                    ) : examinations.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                          No examinations found
                        </td>
                      </tr>
                    ) : (
                      examinations.map((exam) => (
                        <tr key={exam._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                  <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {exam.examName}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {exam.examType}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">{exam.subject}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{exam.course} - {exam.branch}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {new Date(exam.examDate).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {exam.startTime} - {exam.endTime}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {exam.venue}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1 w-fit ${getStatusColor(exam.examStatus)}`}>
                              {getStatusIcon(exam.examStatus)}
                              <span>{exam.examStatus}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedExam(exam);
                                  setShowModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                                <Edit className="w-4 h-4" />
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
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Results will be shown here</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <ExamModal
          exam={selectedExam}
          onClose={() => {
            setShowModal(false);
            setSelectedExam(null);
          }}
        />
      )}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create Examination</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500"><XCircle className="w-6 h-6" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm text-gray-600 dark:text-gray-300">Exam Name</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={newExam.examName} onChange={e => setNewExam({ ...newExam, examName: e.target.value })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Exam Type</label>
              <select className="border rounded px-3 py-2 dark:bg-gray-700" value={newExam.examType} onChange={e => setNewExam({ ...newExam, examType: e.target.value })}>
                <option>Midterm</option>
                <option>Final</option>
                <option>Quiz</option>
                <option>Practical</option>
              </select>
              <label className="text-sm text-gray-600 dark:text-gray-300">Subject</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={newExam.subject} onChange={e => setNewExam({ ...newExam, subject: e.target.value })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Course</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={newExam.course} onChange={e => setNewExam({ ...newExam, course: e.target.value })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Branch</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={newExam.branch} onChange={e => setNewExam({ ...newExam, branch: e.target.value })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Semester</label>
              <input type="number" className="border rounded px-3 py-2 dark:bg-gray-700" value={newExam.semester} onChange={e => setNewExam({ ...newExam, semester: Number(e.target.value) })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Academic Year</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={newExam.academicYear} onChange={e => setNewExam({ ...newExam, academicYear: e.target.value })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Exam Date</label>
              <input type="date" className="border rounded px-3 py-2 dark:bg-gray-700" value={newExam.examDate} onChange={e => setNewExam({ ...newExam, examDate: e.target.value })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Start Time</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={newExam.startTime} onChange={e => setNewExam({ ...newExam, startTime: e.target.value })} placeholder="09:00" />
              <label className="text-sm text-gray-600 dark:text-gray-300">End Time</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={newExam.endTime} onChange={e => setNewExam({ ...newExam, endTime: e.target.value })} placeholder="12:00" />
              <label className="text-sm text-gray-600 dark:text-gray-300">Duration (mins)</label>
              <input type="number" className="border rounded px-3 py-2 dark:bg-gray-700" value={newExam.duration} onChange={e => setNewExam({ ...newExam, duration: Number(e.target.value) })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Venue</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={newExam.venue} onChange={e => setNewExam({ ...newExam, venue: e.target.value })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Total Marks</label>
              <input type="number" className="border rounded px-3 py-2 dark:bg-gray-700" value={newExam.totalMarks} onChange={e => setNewExam({ ...newExam, totalMarks: Number(e.target.value) })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Passing Marks</label>
              <input type="number" className="border rounded px-3 py-2 dark:bg-gray-700" value={newExam.passingMarks} onChange={e => setNewExam({ ...newExam, passingMarks: Number(e.target.value) })} />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
              <button onClick={createExam} className="px-4 py-2 rounded bg-primary-600 text-white">Create</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
};

export default ExaminationsPage;
