import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import {
  BookOpen, CheckCircle, XCircle, Plus, Edit, Trash2, Eye,
  FileText, Target, Clock, BarChart3, Users, Award
} from 'lucide-react';

const QuizSection = ({ courseId, classroomId }) => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedQuizResults, setSelectedQuizResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // CourseQuiz taking state (student)
  const [activeQuiz, setActiveQuiz] = useState(null); // full quiz object
  const [attemptId, setAttemptId] = useState('');
  const [answerMap, setAnswerMap] = useState({}); // {questionId: value}

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'mcq-single',
    timeLimit: 30,
    questions: [
      {
        question: '',
        type: 'mcq-single',
        options: ['', '', '', ''],
        correctAnswer: '',
        correctAnswers: [],
        points: 1
      }
    ]
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchQuizzes();
  }, [courseId]);

  const fetchQuizzes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/course-quizzes/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setQuizzes(data.quizzes || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch quizzes');
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setError('Failed to fetch quizzes');
    }
  };

  const startQuizAsStudent = async (quiz) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/course-quizzes/${quiz._id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const err = await response.json();
        setError(err.error || 'Failed to start quiz');
        return;
      }
      const data = await response.json();
      setAttemptId(data.attemptId);
      // Fetch quiz details
      const qRes = await fetch(`http://localhost:4000/api/course-quizzes/${quiz._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!qRes.ok) {
        const err = await qRes.json();
        setError(err.error || 'Failed to load quiz');
        return;
      }
      const q = await qRes.json();
      setActiveQuiz(q);
      setAnswerMap({});
    } catch (e) {
      setError('Failed to start quiz');
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setFormData({ ...formData, questions: newQuestions });
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          question: '',
          type: 'mcq-single',
          options: ['', '', '', ''],
          correctAnswer: '',
          correctAnswers: [],
          points: 1
        }
      ]
    });
  };

  const removeQuestion = (index) => {
    const newQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!classroomId) {
      setError('Classroom ID is missing. Please refresh the page and try again.');
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = showEditModal 
        ? `http://localhost:4000/api/course-quizzes/${selectedQuiz._id}`
        : 'http://localhost:4000/api/course-quizzes';
      
      const method = showEditModal ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          courseId,
          classroomId
        })
      });

      if (response.ok) {
        setSuccess(showEditModal ? 'Quiz updated successfully!' : 'Quiz created successfully!');
        setShowCreateModal(false);
        setShowEditModal(false);
        setFormData({
          title: '',
          description: '',
          type: 'mcq-single',
          timeLimit: 30,
          questions: [
            {
              question: '',
              type: 'mcq-single',
              options: ['', '', '', ''],
              correctAnswer: '',
              correctAnswers: [],
              points: 1
            }
          ]
        });
        fetchQuizzes();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to save quiz');
      }
    } catch (error) {
      setError('Failed to save quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setFormData({
      title: quiz.title,
      description: quiz.description,
      type: quiz.type,
      timeLimit: quiz.timeLimit,
      questions: quiz.questions
    });
    setShowEditModal(true);
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/course-quizzes/${quizId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setSuccess('Quiz deleted successfully!');
        fetchQuizzes();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to delete quiz');
      }
    } catch (error) {
      setError('Failed to delete quiz');
    }
  };

  const handleViewResults = async (quiz) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/course-quizzes/${quiz._id}/results`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedQuizResults(data.results || []);
        setSelectedQuiz(quiz);
        setShowResultsModal(true);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to fetch quiz results');
      }
    } catch (error) {
      setError('Failed to fetch quiz results');
    }
  };

  const renderQuestionInput = (question) => {
    const qid = question._id;
    const qType = question.type;
    if (qType === 'mcq' || qType === 'mcq-single') {
      return (
        <div className="space-y-2">
          {(question.options || []).map((opt, idx) => (
            <label key={idx} className="flex items-center gap-2">
              <input
                type="radio"
                name={`q_${qid}`}
                checked={String(answerMap[qid]) === String(idx)}
                onChange={() => setAnswerMap({ ...answerMap, [qid]: idx })}
              />
              <span>{opt.text || opt}</span>
            </label>
          ))}
        </div>
      );
    }
    if (qType === 'multiple_choice' || qType === 'mcq-multiple') {
      const selected = Array.isArray(answerMap[qid]) ? answerMap[qid] : [];
      return (
        <div className="space-y-2">
          {(question.options || []).map((opt, idx) => (
            <label key={idx} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.map(String).includes(String(idx))}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...selected, idx]
                    : selected.filter((v) => String(v) !== String(idx));
                  setAnswerMap({ ...answerMap, [qid]: next });
                }}
              />
              <span>{opt.text || opt}</span>
            </label>
          ))}
        </div>
      );
    }
    if (qType === 'numerical' || qType === 'numeric') {
      return (
        <input
          type="number"
          value={answerMap[qid] ?? ''}
          onChange={(e) => setAnswerMap({ ...answerMap, [qid]: e.target.value })}
          className="w-full px-3 py-2 border rounded"
        />
      );
    }
    // long_answer
    return (
      <textarea
        rows={3}
        value={answerMap[qid] || ''}
        onChange={(e) => setAnswerMap({ ...answerMap, [qid]: e.target.value })}
        className="w-full px-3 py-2 border rounded"
      />
    );
  };

  const submitActiveQuiz = async () => {
    if (!activeQuiz || !attemptId) return;
    try {
      const token = localStorage.getItem('token');
      const answers = (activeQuiz.questions || []).map((q) => {
        const qid = q._id;
        let answer = answerMap[qid];
        return { questionId: qid, answer };
      });
      const res = await fetch(`http://localhost:4000/api/course-quizzes/${activeQuiz._id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ attemptId, answers })
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to submit quiz');
        return;
      }
      setActiveQuiz(null);
      setAttemptId('');
      setAnswerMap({});
      setSuccess('Quiz submitted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError('Failed to submit quiz');
    }
  };

  const getQuestionTypeLabel = (type) => {
    switch (type) {
      case 'mcq-single': return 'MCQ (Single Correct)';
      case 'mcq-multiple': return 'MCQ (Multiple Correct)';
      case 'numeric': return 'Numeric Answer';
      case 'long-answer': return 'Long Answer';
      default: return type;
    }
  };

  const calculateAverageScore = (results) => {
    if (results.length === 0) return 0;
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    return (totalScore / results.length).toFixed(2);
  };

  // Filter and sort quizzes
  const filteredQuizzes = quizzes
    .filter(quiz => {
      const matchesSearch = quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quiz.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || quiz.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'timeLimit':
          aValue = a.timeLimit;
          bValue = b.timeLimit;
          break;
        case 'questions':
          aValue = a.questions.length;
          bValue = b.questions.length;
          break;
        default:
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Course Quizzes
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {user.role === 'instructor' || user.role === 'admin' 
              ? 'Create and manage quizzes for your students' 
              : 'View course quizzes'}
          </p>
        </div>
        {/* Create Quiz Button - Only visible to instructors and admins */}
        {(user.role === 'instructor' || user.role === 'admin') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-lg font-semibold shadow-lg"
            >
            <Plus size={24} />
            Create Quiz
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
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            <p className="text-blue-800 dark:text-blue-200 font-medium">
              You can now create and manage quizzes for your students. Use the "Create Quiz" button above to get started!
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
                placeholder="Search quizzes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="mcq-single">MCQ Single</option>
                <option value="mcq-multiple">MCQ Multiple</option>
                <option value="numeric">Numeric</option>
                <option value="long-answer">Long Answer</option>
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
                <option value="createdAt">Date Created</option>
                <option value="timeLimit">Time Limit</option>
                <option value="questions">Question Count</option>
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
              Showing {filteredQuizzes.length} of {quizzes.length} quizzes
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setSortBy('createdAt');
                setSortOrder('desc');
              }}
              className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Quizzes List */}
      <div className="grid gap-4">
        {filteredQuizzes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No quizzes found</p>
            <p className="text-sm">
              {quizzes.length === 0 ? 'Create your first quiz to get started' : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          filteredQuizzes.map((quiz) => (
           <div key={quiz._id} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
             <div className="flex justify-between items-start mb-4">
               <div className="flex-1">
                 <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                   {quiz.title}
                 </h4>
                 <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                   {quiz.description}
                 </p>
                 <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {getQuestionTypeLabel(quiz.type)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {quiz.timeLimit} min
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {quiz.questions.length} questions
                  </span>
                </div>
               </div>
               {/* Action buttons - Only visible to instructors and admins */}
               {(user.role === 'instructor' || user.role === 'admin') ? (
                 <div className="flex gap-2">
                   <button
                     onClick={() => handleViewResults(quiz)}
                     className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                     title="View Results"
                   >
                     <BarChart3 className="w-4 h-4" />
                   </button>
                   <button
                     onClick={() => handleEditQuiz(quiz)}
                     className="text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-50"
                     title="Edit Quiz"
                   >
                     <Edit className="w-4 h-4" />
                   </button>
                   <button
                     onClick={() => handleDeleteQuiz(quiz._id)}
                     className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50"
                     title="Delete Quiz"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
               ) : (
                 <div>
                   <button
                     onClick={() => startQuizAsStudent(quiz)}
                     className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                     title="Start Quiz"
                   >
                     Start Quiz
                   </button>
                 </div>
               )}
             </div>
           </div>
         ))
       )}
     </div>

      {/* Active Course Quiz Modal for Students */}
      {activeQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-4xl relative max-h-[90vh] overflow-y-auto p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-semibold">{activeQuiz.title}</h3>
              <button className="px-3 py-1 bg-gray-600 text-white rounded" onClick={() => { setActiveQuiz(null); setAttemptId(''); setAnswerMap({}); }}>Close</button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Time limit: {activeQuiz.timeLimit} min • Questions: {activeQuiz.questions?.length || 0}</p>
            <div className="space-y-4">
              {(activeQuiz.questions || []).map((q, idx) => (
                <div key={q._id || idx} className="border rounded p-3">
                  <div className="font-medium mb-2">Q{idx + 1}. {q.question}</div>
                  {renderQuestionInput(q)}
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4 gap-2">
              <button className="px-4 py-2 border rounded" onClick={() => { setActiveQuiz(null); setAttemptId(''); setAnswerMap({}); }}>Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={submitActiveQuiz}>Submit</button>
            </div>
          </div>
        </div>
      )}

     {/* Create/Edit Quiz Modal */}
     {(showCreateModal || showEditModal) && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
           <h2 className="text-xl font-semibold mb-4">
             {showEditModal ? 'Edit Quiz' : 'Create New Quiz'}
           </h2>
           <form onSubmit={handleSubmit} className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                   Quiz Title
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
                   Quiz Type
                 </label>
                 <select
                   name="type"
                   value={formData.type}
                   onChange={handleInputChange}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                 >
                   <option value="mcq-single">MCQ (Single Correct)</option>
                   <option value="mcq-multiple">MCQ (Multiple Correct)</option>
                   <option value="numeric">Numeric Answer</option>
                   <option value="long-answer">Long Answer</option>
                 </select>
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

             <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                 Time Limit (minutes)
               </label>
               <input
                 type="number"
                 name="timeLimit"
                 value={formData.timeLimit}
                 onChange={handleInputChange}
                 min="1"
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
               />
             </div>

             {/* Questions */}
             <div>
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-medium">Questions</h3>
                 <button
                   type="button"
                   onClick={addQuestion}
                   className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                 >
                   <Plus className="w-4 h-4 inline mr-1" />
                   Add Question
                 </button>
               </div>
               
               <div className="space-y-4">
                 {formData.questions.map((question, qIndex) => (
                   <div key={qIndex} className="border border-gray-200 rounded-lg p-4">
                     <div className="flex justify-between items-start mb-3">
                       <h4 className="font-medium">Question {qIndex + 1}</h4>
                       <button
                         type="button"
                         onClick={() => removeQuestion(qIndex)}
                         className="text-red-600 hover:text-red-800"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                     </div>
                     
                     <div className="space-y-3">
                       <input
                         type="text"
                         placeholder="Enter your question"
                         value={question.question}
                         onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                       />
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                             Question Type
                           </label>
                           <select
                             value={question.type}
                             onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)}
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                           >
                             <option value="mcq-single">MCQ (Single Correct)</option>
                             <option value="mcq-multiple">MCQ (Multiple Correct)</option>
                             <option value="numeric">Numeric Answer</option>
                             <option value="long-answer">Long Answer</option>
                           </select>
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                             Points
                           </label>
                           <input
                             type="number"
                             value={question.points}
                             onChange={(e) => handleQuestionChange(qIndex, 'points', parseInt(e.target.value))}
                             min="1"
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                           />
                         </div>
                       </div>

                       {/* MCQ Options */}
                       {(question.type === 'mcq-single' || question.type === 'mcq-multiple') && (
                         <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                             Options
                           </label>
                           <div className="space-y-2">
                             {question.options.map((option, oIndex) => (
                               <div key={oIndex} className="flex items-center gap-2">
                                 <input
                                   type={question.type === 'mcq-single' ? 'radio' : 'checkbox'}
                                   name={`correct-${qIndex}`}
                                   value={oIndex}
                                   checked={
                                     question.type === 'mcq-single'
                                       ? question.correctAnswer === oIndex.toString()
                                       : question.correctAnswers.includes(oIndex.toString())
                                   }
                                   onChange={(e) => {
                                     if (question.type === 'mcq-single') {
                                       handleQuestionChange(qIndex, 'correctAnswer', e.target.value);
                                     } else {
                                       const newCorrectAnswers = e.target.checked
                                         ? [...question.correctAnswers, e.target.value]
                                         : question.correctAnswers.filter(a => a !== e.target.value);
                                       handleQuestionChange(qIndex, 'correctAnswers', newCorrectAnswers);
                                     }
                                   }}
                                   className="text-primary focus:ring-primary"
                                 />
                                 <input
                                   type="text"
                                   placeholder={`Option ${oIndex + 1}`}
                                   value={option}
                                   onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                   className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                 />
                               </div>
                             ))}
                           </div>
                         </div>
                       )}

                       {/* Numeric Answer */}
                       {question.type === 'numeric' && (
                         <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                             Correct Answer
                           </label>
                           <input
                             type="number"
                             value={question.correctAnswer}
                             onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                           />
                         </div>
                       )}

                       {/* Long Answer */}
                       {question.type === 'long-answer' && (
                         <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                             Sample Answer (Optional)
                           </label>
                           <textarea
                             value={question.correctAnswer}
                             onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                             rows={3}
                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                           />
                         </div>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
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
                 {loading ? 'Saving...' : (showEditModal ? 'Update Quiz' : 'Create Quiz')}
               </button>
             </div>
           </form>
         </div>
       </div>
     )}

     {/* Quiz Results Modal */}
     {showResultsModal && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
         <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
           <h2 className="text-xl font-semibold mb-4">
             Quiz Results: {selectedQuiz?.title}
           </h2>
           
           <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
               <div>
                 <div className="text-2xl font-bold text-primary">
                   {selectedQuizResults.length}
                 </div>
                 <div className="text-sm text-gray-600 dark:text-gray-400">
                   Total Attempts
                 </div>
               </div>
               <div>
                 <div className="text-2xl font-bold text-green-600">
                   {calculateAverageScore(selectedQuizResults)}%
                 </div>
                 <div className="text-sm text-gray-600 dark:text-gray-400">
                   Average Score
                 </div>
               </div>
               <div>
                 <div className="text-2xl font-bold text-blue-600">
                   {selectedQuizResults.filter(r => r.score >= 70).length}
                 </div>
                 <div className="text-sm text-gray-600 dark:text-gray-400">
                   Passed (≥70%)
                 </div>
               </div>
             </div>
           </div>

           {selectedQuizResults.length === 0 ? (
             <div className="text-center py-8 text-gray-500">
               <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
               <p>No results yet</p>
               <p className="text-sm">Students haven't taken this quiz yet</p>
             </div>
           ) : (
             <div className="space-y-4">
               {selectedQuizResults.map((result, index) => (
                 <div key={result._id || index} className="border border-gray-200 rounded-lg p-4">
                   <div className="flex justify-between items-center">
                     <div>
                       <h4 className="font-medium text-gray-900 dark:text-white">
                         {result.student?.name || 'Unknown Student'}
                       </h4>
                       <p className="text-sm text-gray-600 dark:text-gray-400">
                         {result.student?.email || 'No email'}
                       </p>
                       <div className="text-xs text-gray-500 mt-1">
                         Score: {result.totalScore}/{result.maxScore} ({result.score}%)
                       </div>
                     </div>
                     <div className="text-right">
                       <div className={`text-lg font-bold ${
                         result.score >= 70 ? 'text-green-600' : 
                         result.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                       }`}>
                         {result.score}%
                       </div>
                       <div className="text-sm text-gray-500">
                         {new Date(result.completedAt || result.createdAt).toLocaleDateString()}
                       </div>
                       <div className={`text-xs px-2 py-1 rounded-full ${
                         result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                       }`}>
                         {result.passed ? 'Passed' : 'Failed'}
                       </div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           )}

           <div className="flex justify-end mt-6">
             <button
               onClick={() => setShowResultsModal(false)}
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

export default QuizSection;
