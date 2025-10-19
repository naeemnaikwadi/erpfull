import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import DashboardLayout from '../components/DashboardLayout';
import {
  BookOpen,
  Search,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  RefreshCw,
  Filter,
  Calendar,
  User,
  Book,
  TrendingUp,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import axios from 'axios';

const StudentLibrary = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('available');
  const [books, setBooks] = useState([]);
  const [myBooks, setMyBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [studentInfo, setStudentInfo] = useState(null);

  useEffect(() => {
    fetchStudentInfo();
    if (activeTab === 'available') {
      fetchAvailableBooks();
    } else if (activeTab === 'mybooks') {
      fetchMyBooks();
    }
  }, [activeTab, searchTerm, selectedGenre, currentPage]);

  const fetchStudentInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:4000/api/library/student/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudentInfo(response.data.student);
    } catch (error) {
      console.error('Error fetching student info:', error);
    }
  };

  const fetchAvailableBooks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12,
        status: 'Available',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedGenre && { genre: selectedGenre })
      });
      
      const response = await axios.get(`http://localhost:4000/api/library/books?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBooks(response.data.books);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching available books:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBooks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:4000/api/library/student/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMyBooks(response.data.issuedBooks || []);
    } catch (error) {
      console.error('Error fetching my books:', error);
    } finally {
      setLoading(false);
    }
  };

  const BookCard = ({ book, showIssueButton = false }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">{book.title}</h3>
        {book.coverImage?.cloudinaryUrl && (
          <img
            src={book.coverImage.cloudinaryUrl}
            alt={book.title}
            className="w-16 h-20 object-cover rounded ml-2"
          />
        )}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">by {book.author}</p>
      <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
        <p><span className="font-medium">Genre:</span> {book.genre}</p>
        {book.isbn && <p><span className="font-medium">ISBN:</span> {book.isbn}</p>}
        <p><span className="font-medium">Shelf:</span> {book.shelfNo}</p>
        <p><span className="font-medium">Available:</span> {book.availableQuantity}/{book.quantity}</p>
        {book.edition && <p><span className="font-medium">Edition:</span> {book.edition}</p>}
        {book.publicationYear && <p><span className="font-medium">Year:</span> {book.publicationYear}</p>}
      </div>
      {book.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{book.description}</p>
      )}
      {showIssueButton && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              // This would typically open a modal or navigate to issue page
              alert('Book issue functionality would be implemented here. Please contact the librarian.');
            }}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Request Book
          </button>
        </div>
      )}
    </div>
  );

  const MyBookCard = ({ issue }) => {
    const isOverdue = new Date() > new Date(issue.dueDate);
    const daysUntilDue = Math.ceil((new Date(issue.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    return (
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
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">by {issue.book?.author}</p>
        <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
          <p><span className="font-medium">Issue Date:</span> {new Date(issue.issueDate).toLocaleDateString()}</p>
          <p><span className="font-medium">Due Date:</span> {new Date(issue.dueDate).toLocaleDateString()}</p>
          {issue.returnDate && (
            <p><span className="font-medium">Return Date:</span> {new Date(issue.returnDate).toLocaleDateString()}</p>
          )}
          <p><span className="font-medium">ISBN:</span> {issue.book?.isbn || 'N/A'}</p>
          {issue.fineAmount > 0 && (
            <p className="text-red-600 font-medium">Fine: ₹{issue.fineAmount}</p>
          )}
        </div>
        {issue.status === 'Issued' && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                {isOverdue ? (
                  <span className="text-red-600 font-medium">
                    Overdue by {Math.abs(daysUntilDue)} days
                  </span>
                ) : (
                  <span className="text-gray-600">
                    Due in {daysUntilDue} days
                  </span>
                )}
              </div>
              {issue.canRenew && (
                <button
                  onClick={() => {
                    // This would typically handle renewal
                    alert('Book renewal functionality would be implemented here. Please contact the librarian.');
                  }}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Renew
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-full ${color} text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Library
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse available books and manage your library account
          </p>
        </div>

        {/* Student Info */}
        {studentInfo && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Library Account</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                <p className="font-medium text-gray-900 dark:text-white">{studentInfo.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">PRN</p>
                <p className="font-medium text-gray-900 dark:text-white">{studentInfo.prn || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Course</p>
                <p className="font-medium text-gray-900 dark:text-white">{studentInfo.course || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Branch</p>
                <p className="font-medium text-gray-900 dark:text-white">{studentInfo.branch || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'available', label: 'Available Books', icon: <Book className="w-4 h-4" /> },
              { id: 'mybooks', label: 'My Books', icon: <User className="w-4 h-4" /> }
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

        {/* Available Books Tab */}
        {activeTab === 'available' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search books by title, author, or ISBN..."
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
                <button
                  onClick={fetchAvailableBooks}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Books Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {loading ? (
                <div className="col-span-full flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : books.length > 0 ? (
                books.map(book => (
                  <BookCard key={book._id} book={book} showIssueButton={true} />
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

        {/* My Books Tab */}
        {activeTab === 'mybooks' && (
          <div className="space-y-6">
            {/* My Books Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Books Issued"
                value={myBooks.length}
                icon={<Book className="w-5 h-5" />}
                color="bg-blue-500"
                subtitle="Currently with you"
              />
              <StatCard
                title="Overdue Books"
                value={myBooks.filter(book => book.status === 'Overdue').length}
                icon={<AlertTriangle className="w-5 h-5" />}
                color="bg-red-500"
                subtitle="Need attention"
              />
              <StatCard
                title="Total Fine"
                value={`₹${myBooks.reduce((sum, book) => sum + (book.fineAmount || 0), 0)}`}
                icon={<Clock className="w-5 h-5" />}
                color="bg-yellow-500"
                subtitle="Outstanding amount"
              />
            </div>

            {/* My Books List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : myBooks.length > 0 ? (
                myBooks.map(issue => (
                  <MyBookCard key={issue._id} issue={issue} />
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No books currently issued</p>
                  <p className="text-sm">Visit the Available Books tab to find books to borrow</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentLibrary;
