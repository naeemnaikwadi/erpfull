import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileText, 
  Video, 
  Image, 
  Music, 
  Archive, 
  Search, 
  Filter, 
  Calendar,
  Clock,
  File,
  Eye,
  Trash2,
  SortAsc,
  SortDesc,
  Users
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { getCurrentUser, getAuthHeaders } from '../utils/auth';

const DownloadsDashboard = () => {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUserRole(user.role);
      fetchDownloads();
    }
  }, []);

  const fetchDownloads = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4000/api/downloads', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setDownloads(data);
      } else {
        throw new Error('Failed to fetch downloads');
      }
    } catch (error) {
      console.error('Error fetching downloads:', error);
      setError('Failed to load downloads');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDownload = async (downloadId) => {
    if (window.confirm('Are you sure you want to remove this download from your list?')) {
      try {
        const response = await fetch(`http://localhost:4000/api/downloads/${downloadId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });

        if (response.ok) {
          setDownloads(prev => prev.filter(d => d._id !== downloadId));
        } else {
          throw new Error('Failed to delete download');
        }
      } catch (error) {
        console.error('Error deleting download:', error);
        alert('Failed to delete download');
      }
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('video')) return <Video className="w-5 h-5 text-red-500" />;
    if (fileType?.includes('image')) return <Image className="w-5 h-5 text-green-500" />;
    if (fileType?.includes('audio')) return <Music className="w-5 h-5 text-purple-500" />;
    if (fileType?.includes('zip') || fileType?.includes('rar')) return <Archive className="w-5 h-5 text-orange-500" />;
    if (fileType?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const getFileType = (fileType) => {
    if (fileType?.includes('video')) return 'Video';
    if (fileType?.includes('image')) return 'Image';
    if (fileType?.includes('audio')) return 'Audio';
    if (fileType?.includes('zip') || fileType?.includes('rar')) return 'Archive';
    if (fileType?.includes('pdf')) return 'PDF';
    if (fileType?.includes('doc')) return 'Document';
    if (fileType?.includes('ppt')) return 'Presentation';
    if (fileType?.includes('xls')) return 'Spreadsheet';
    return 'File';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredDownloads = () => {
    let filtered = downloads;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(download =>
        download.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        download.originalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        download.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        download.instructorName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(download => {
        const fileType = download.fileType || download.mimetype;
        switch (typeFilter) {
          case 'video':
            return fileType?.includes('video');
          case 'image':
            return fileType?.includes('image');
          case 'audio':
            return fileType?.includes('audio');
          case 'document':
            return fileType?.includes('pdf') || fileType?.includes('doc') || fileType?.includes('txt');
          case 'archive':
            return fileType?.includes('zip') || fileType?.includes('rar') || fileType?.includes('7z');
          default:
            return true;
        }
      });
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(download => {
            const downloadDate = new Date(download.downloadedAt);
            return downloadDate >= today;
          });
          break;
        case 'yesterday':
          filtered = filtered.filter(download => {
            const downloadDate = new Date(download.downloadedAt);
            return downloadDate >= yesterday && downloadDate < today;
          });
          break;
        case 'week':
          filtered = filtered.filter(download => {
            const downloadDate = new Date(download.downloadedAt);
            return downloadDate >= weekAgo;
          });
          break;
        case 'month':
          filtered = filtered.filter(download => {
            const downloadDate = new Date(download.downloadedAt);
            return downloadDate >= monthAgo;
          });
          break;
        default:
          break;
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.fileName || a.originalName || '';
          bValue = b.fileName || b.originalName || '';
          break;
        case 'size':
          aValue = a.fileSize || 0;
          bValue = b.fileSize || 0;
          break;
        case 'date':
        default:
          aValue = new Date(a.downloadedAt);
          bValue = new Date(b.downloadedAt);
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  if (loading) {
    return (
      <DashboardLayout role={userRole}>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const filteredDownloads = getFilteredDownloads();

  return (
    <DashboardLayout role={userRole}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Downloads
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Access all your downloaded learning materials and resources
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{downloads.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Downloads</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {downloads.filter(d => d.fileType?.includes('pdf') || d.fileType?.includes('doc')).length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Documents</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Video className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {downloads.filter(d => d.fileType?.includes('video')).length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Videos</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Image className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {downloads.filter(d => d.fileType?.includes('image')).length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Images</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search downloads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">All Types</option>
                  <option value="video">Videos</option>
                  <option value="image">Images</option>
                  <option value="audio">Audio</option>
                  <option value="document">Documents</option>
                  <option value="archive">Archives</option>
                </select>
              </div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="date">Date</option>
                  <option value="name">Name</option>
                  <option value="size">Size</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-5 h-5" /> : <SortDesc className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Downloads Grid */}
        {filteredDownloads.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <Download className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || typeFilter !== 'all' || dateFilter !== 'all' 
                ? 'No downloads found' 
                : 'No downloads available'
              }
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || typeFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Download materials from your courses to see them here'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDownloads.map((download) => (
              <div key={download._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* File Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      {getFileIcon(download.fileType || download.mimetype)}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {download.fileName || download.originalName || 'Unknown File'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {getFileType(download.fileType || download.mimetype)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(download.url || download.cloudinaryUrl, '_blank')}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="View File"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDownload(download._id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Remove from Downloads"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* File Details */}
                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <File className="w-4 h-4" />
                      <span>Size: {formatFileSize(download.fileSize || 0)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Downloaded: {formatDate(download.downloadedAt)}</span>
                    </div>

                    {download.courseName && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <FileText className="w-4 h-4" />
                        <span>Course: {download.courseName}</span>
                      </div>
                    )}

                    {download.instructorName && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>Instructor: {download.instructorName}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex gap-2">
                    <button
                      onClick={() => window.open(download.url || download.cloudinaryUrl, '_blank')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View File
                    </button>
                    <a
                      href={download.url || download.cloudinaryUrl}
                      download={download.fileName || download.originalName}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DownloadsDashboard;

