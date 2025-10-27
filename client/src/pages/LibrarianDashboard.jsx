import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import DashboardLayout from '../components/DashboardLayout';
import SkeletonLoader from '../components/SkeletonLoader';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Upload,
  Download,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  BarChart3,
  FileText,
  Calendar,
  User,
  Book,
  TrendingUp,
  Activity,
  Settings,
  X,
  Save,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import axios from 'axios';

const LibrarianDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    totalIssues: 0,
    activeIssues: 0,
    overdueBooks: 0,
    returnedBooks: 0
  });
  const [books, setBooks] = useState([]);
  const [students, setStudents] = useState([]);
  const [issues, setIssues] = useState([]);
  const [overdueBooks, setOverdueBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddBook, setShowAddBook] = useState(false);
  const [showIssueBook, setShowIssueBook] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');

  // Form states
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    genre: '',
    quantity: 1,
    shelfNo: '',
    description: '',
    edition: '',
    publisher: '',
    publicationYear: '',
    language: 'English',
    pages: '',
    price: '',
    isResearchPaper: false,
    researchPaperType: 'Journal',
    doi: '',
    keywords: '',
    abstract: ''
  });

  const [issueForm, setIssueForm] = useState({
    studentId: '',
    bookId: '',
    dueDate: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'books') {
      fetchBooks();
    } else if (activeTab === 'issues') {
      fetchIssues();
    } else if (activeTab === 'overdue') {
      fetchOverdueBooks();
    }
  }, [activeTab, searchTerm, selectedGenre, selectedStatus, currentPage]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:4000/api/library/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedGenre && { genre: selectedGenre }),
        ...(selectedStatus && { status: selectedStatus })
      });
      
      const response = await axios.get(`http://localhost:4000/api/library/books?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBooks(response.data.books);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:4000/api/library/issues', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIssues(response.data.issues || []);
    } catch (error) {
      console.error('Error fetching issues:', error);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverdueBooks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:4000/api/library/overdue', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOverdueBooks(response.data.overdueBooks || []);
    } catch (error) {
      console.error('Error fetching overdue books:', error);
      setOverdueBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const searchStudents = async (query) => {
    if (query.length < 2) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:4000/api/library/students/search?search=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data);
    } catch (error) {
      console.error('Error searching students:', error);
    }
  };

  const searchBooks = async (query) => {
    if (query.length < 2) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:4000/api/library/books?search=${query}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBooks(response.data.books);
    } catch (error) {
      console.error('Error searching books:', error);
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const bookData = {
        ...bookForm,
        keywords: bookForm.keywords.split(',').map(k => k.trim()).filter(k => k),
        quantity: parseInt(bookForm.quantity),
        publicationYear: bookForm.publicationYear ? parseInt(bookForm.publicationYear) : undefined,
        pages: bookForm.pages ? parseInt(bookForm.pages) : undefined,
        price: bookForm.price ? parseFloat(bookForm.price) : undefined
      };

      await axios.post('http://localhost:4000/api/library/books', bookData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowAddBook(false);
      setBookForm({
        title: '',
        author: '',
        isbn: '',
        genre: '',
        quantity: 1,
        shelfNo: '',
        description: '',
        edition: '',
        publisher: '',
        publicationYear: '',
        language: 'English',
        pages: '',
        price: '',
        isResearchPaper: false,
        researchPaperType: 'Journal',
        doi: '',
        keywords: '',
        abstract: ''
      });
      fetchBooks();
      fetchDashboardData();
    } catch (error) {
      console.error('Error adding book:', error);
      alert('Error adding book: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleIssueBook = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const issueData = {
        ...issueForm,
        dueDate: issueForm.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      };

      await axios.post('http://localhost:4000/api/library/issue', issueData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowIssueBook(false);
      setIssueForm({ studentId: '', bookId: '', dueDate: '' });
      setSelectedStudent(null);
      setSelectedBook(null);
      fetchIssues();
      fetchDashboardData();
    } catch (error) {
      console.error('Error issuing book:', error);
      alert('Error issuing book: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleReturnBook = async (issueId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.post(`http://localhost:4000/api/library/return/${issueId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchIssues();
      fetchDashboardData();
    } catch (error) {
      console.error('Error returning book:', error);
      alert('Error returning book: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.delete(`http://localhost:4000/api/library/books/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchBooks();
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Error deleting book: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    const file = e.target.excelFile.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('excelFile', file);

      const response = await axios.post('http://localhost:4000/api/library/books/bulk-upload', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert(`Bulk upload completed. ${response.data.results.success} books added, ${response.data.results.errors} errors.`);
      setShowBulkUpload(false);
      fetchBooks();
      fetchDashboardData();
    } catch (error) {
      console.error('Error uploading books:', error);
      alert('Error uploading books: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:4000/api/library/books/template', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'library_books_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };

  const exportData = async (type) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:4000/api/library/export?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `library_${type}_export.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color} text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const BookCard = ({ book }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{book.title}</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedBook(book);
              setIssueForm({ ...issueForm, bookId: book._id });
              setShowIssueBook(true);
            }}
            className="p-1 text-blue-600 hover:text-blue-800"
            title="Issue Book"
          >
            <BookOpen className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteBook(book._id)}
            className="p-1 text-red-600 hover:text-red-800"
            title="Delete Book"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">by {book.author}</p>
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500 dark:text-gray-400">Available: {book.availableQuantity}/{book.quantity}</span>
        <span className={`px-2 py-1 rounded text-xs ${
          book.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {book.status}
        </span>
      </div>
    </div>
  );

  const IssueCard = ({ issue }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{issue.book?.title}</h3>
        <span className={`px-2 py-1 rounded text-xs ${
          issue.status === 'Issued' ? 'bg-blue-100 text-blue-800' :
          issue.status === 'Overdue' ? 'bg-red-100 text-red-800' :
          'bg-green-100 text-green-800'
        }`}>
          {issue.status}
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        Student: {issue.student?.name} ({issue.student?.prn})
      </p>
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500 dark:text-gray-400">
          Due: {new Date(issue.dueDate).toLocaleDateString()}
        </span>
        {issue.status === 'Issued' && (
          <button
            onClick={() => handleReturnBook(issue._id)}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Return
          </button>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout role="librarian">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Library Management Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage books, track issues, and monitor library operations
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
              { id: 'books', label: 'Books', icon: <Book className="w-4 h-4" /> },
              { id: 'issues', label: 'Issues', icon: <Users className="w-4 h-4" /> },
              { id: 'overdue', label: 'Overdue', icon: <AlertTriangle className="w-4 h-4" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                title="Total Books"
                value={stats.totalBooks}
                icon={<Book className="w-6 h-6" />}
                color="bg-blue-500"
                subtitle={`${stats.availableBooks} available`}
              />
              <StatCard
                title="Active Issues"
                value={stats.activeIssues}
                icon={<Users className="w-6 h-6" />}
                color="bg-green-500"
                subtitle={`${stats.returnedBooks} returned`}
              />
              <StatCard
                title="Overdue Books"
                value={stats.overdueBooks}
                icon={<AlertTriangle className="w-6 h-6" />}
                color="bg-red-500"
                subtitle="Need attention"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setShowAddBook(true)}
                  className="flex items-center justify-center space-x-2 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Plus className="w-6 h-6 text-blue-500" />
                  <span className="text-sm font-medium">Add Book</span>
                </button>
                <button
                  onClick={() => setShowIssueBook(true)}
                  className="flex items-center justify-center space-x-2 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <BookOpen className="w-6 h-6 text-green-500" />
                  <span className="text-sm font-medium">Issue Book</span>
                </button>
                <button
                  onClick={() => setShowBulkUpload(true)}
                  className="flex items-center justify-center space-x-2 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Upload className="w-6 h-6 text-purple-500" />
                  <span className="text-sm font-medium">Bulk Upload</span>
                </button>
                <button
                  onClick={() => exportData('books')}
                  className="flex items-center justify-center space-x-2 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Download className="w-6 h-6 text-orange-500" />
                  <span className="text-sm font-medium">Export Data</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Books Tab */}
        {activeTab === 'books' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search books..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Genres</option>
                  <option value="Fiction">Fiction</option>
                  <option value="Non-Fiction">Non-Fiction</option>
                  <option value="Science">Science</option>
                  <option value="Technology">Technology</option>
                  <option value="History">History</option>
                  <option value="Literature">Literature</option>
                  <option value="Research">Research</option>
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Status</option>
                  <option value="Available">Available</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Lost">Lost</option>
                  <option value="Withdrawn">Withdrawn</option>
                </select>
                <button
                  onClick={fetchBooks}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Books Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                [...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
                    <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))
              ) : books.length > 0 ? (
                books.map(book => (
                  <BookCard key={book._id} book={book} />
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                  No books found
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Issues Tab */}
        {activeTab === 'issues' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                [...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))
              ) : issues.length > 0 ? (
                issues.map(issue => (
                  <IssueCard key={issue._id} issue={issue} />
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                  No issues found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Overdue Tab */}
        {activeTab === 'overdue' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                [...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))
              ) : overdueBooks.length > 0 ? (
                overdueBooks.map(issue => (
                  <IssueCard key={issue._id} issue={issue} />
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                  No overdue books
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Book Modal */}
        {showAddBook && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add New Book</h3>
                <button
                  onClick={() => setShowAddBook(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddBook} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      value={bookForm.title}
                      onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Author *</label>
                    <input
                      type="text"
                      required
                      value={bookForm.author}
                      onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ISBN</label>
                    <input
                      type="text"
                      value={bookForm.isbn}
                      onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Genre *</label>
                    <input
                      type="text"
                      required
                      value={bookForm.genre}
                      onChange={(e) => setBookForm({ ...bookForm, genre: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={bookForm.quantity}
                      onChange={(e) => setBookForm({ ...bookForm, quantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shelf No *</label>
                    <input
                      type="text"
                      required
                      value={bookForm.shelfNo}
                      onChange={(e) => setBookForm({ ...bookForm, shelfNo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    value={bookForm.description}
                    onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddBook(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Book'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Issue Book Modal */}
        {showIssueBook && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Issue Book</h3>
                <button
                  onClick={() => setShowIssueBook(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleIssueBook} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Student</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name, email, or PRN..."
                      value={studentSearch}
                      onChange={(e) => {
                        setStudentSearch(e.target.value);
                        searchStudents(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  {students.length > 0 && (
                    <div className="mt-1 border border-gray-300 dark:border-gray-600 rounded-lg max-h-40 overflow-y-auto">
                      {students.map(student => (
                        <div
                          key={student._id}
                          onClick={() => {
                            setSelectedStudent(student);
                            setIssueForm({ ...issueForm, studentId: student._id });
                            setStudentSearch(student.name);
                            setStudents([]);
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          <div className="font-medium">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.email} - {student.prn}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Book</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by title or author..."
                      value={bookSearch}
                      onChange={(e) => {
                        setBookSearch(e.target.value);
                        searchBooks(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                  {books.length > 0 && (
                    <div className="mt-1 border border-gray-300 dark:border-gray-600 rounded-lg max-h-40 overflow-y-auto">
                      {books.map(book => (
                        <div
                          key={book._id}
                          onClick={() => {
                            setSelectedBook(book);
                            setIssueForm({ ...issueForm, bookId: book._id });
                            setBookSearch(book.title);
                            setBooks([]);
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          <div className="font-medium">{book.title}</div>
                          <div className="text-sm text-gray-500">by {book.author} - Available: {book.availableQuantity}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={issueForm.dueDate}
                    onChange={(e) => setIssueForm({ ...issueForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowIssueBook(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !selectedStudent || !selectedBook}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Issuing...' : 'Issue Book'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Upload Modal */}
        {showBulkUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bulk Upload Books</h3>
                <button
                  onClick={() => setShowBulkUpload(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleBulkUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Excel File</label>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    name="excelFile"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>Download the template to see the required format:</p>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Download Template
                  </button>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowBulkUpload(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {loading ? 'Uploading...' : 'Upload Books'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LibrarianDashboard;
