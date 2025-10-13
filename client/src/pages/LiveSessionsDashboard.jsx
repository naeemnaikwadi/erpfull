import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Video, Users, Calendar, Clock, Search, Filter, Play, Eye, Plus,
  Trash2, Edit, Mic, MicOff, Camera, CameraOff, MessageCircle, BarChart3,
  Share, Phone, Users2, Send, Hand
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { getCurrentUser, getAuthHeaders } from '../utils/auth';

const LiveSessionsDashboard = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [userRole, setUserRole] = useState('');
  
  // Video conferencing states
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showPolls, setShowPolls] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState([]);
  const [polls, setPolls] = useState([]);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUserRole(user.role);
      fetchLiveSessions();
      initializeMockData();
    }
  }, []);

  const initializeMockData = () => {
    setParticipants([
      { id: 1, name: 'Daniela Mandera', role: 'Organizer', isAudioOn: true, isVideoOn: true, isHandRaised: false },
      { id: 2, name: 'Aadi Kapoor', role: 'Participant', isAudioOn: true, isVideoOn: false, isHandRaised: false },
      { id: 3, name: 'Bryan Wright', role: 'Participant', isAudioOn: true, isVideoOn: true, isHandRaised: true },
    ]);

    setChatMessages([
      { id: 1, sender: 'Daniela Mandera', message: 'Welcome everyone to our weekly project briefing!', timestamp: '1:28 AM', isOrganizer: true },
      { id: 2, sender: 'Aadi Kapoor', message: 'Thanks for organizing this session', timestamp: '1:29 AM', isOrganizer: false },
    ]);

    setPolls([
      { id: 1, question: 'How confident are you with the current project timeline?', options: ['Very Confident', 'Confident', 'Neutral', 'Concerned'], votes: [5, 8, 3, 2], isActive: true },
    ]);
  };

  const fetchLiveSessions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:4000/api/live-sessions', {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched live sessions:', data);
        setSessions(data || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch live sessions:', response.status, errorData);
        setError(`Failed to load live sessions: ${errorData.error || response.statusText}`);
        setSessions([]);
      }
    } catch (error) {
      console.error('Error fetching live sessions:', error);
      setError('Failed to load live sessions. Please check your connection.');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = (sessionId) => {
    navigate(`/live-session/${sessionId}`);
  };

  const handleDeleteSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to delete this live session?')) {
      try {
        const response = await fetch(`http://localhost:4000/api/live-sessions/${sessionId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });

        if (response.ok) {
          setSessions(prev => prev.filter(s => s._id !== sessionId));
        } else {
          throw new Error('Failed to delete session');
        }
      } catch (error) {
        console.error('Error deleting session:', error);
        alert('Failed to delete session');
      }
    }
  };

  const sendChatMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        sender: 'You',
        message: newMessage,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        isOrganizer: userRole === 'instructor'
      };
      setChatMessages(prev => [...prev, message]);
      setNewMessage('');
    }
  };

  const createPoll = () => {
    const question = prompt('Enter poll question:');
    if (question) {
      const options = prompt('Enter options separated by commas:').split(',').map(opt => opt.trim());
      if (options.length > 1) {
        const newPoll = {
          id: Date.now(),
          question,
          options,
          votes: new Array(options.length).fill(0),
          isActive: true
        };
        setPolls(prev => [...prev, newPoll]);
      }
    }
  };

  const votePoll = (pollId, optionIndex) => {
    setPolls(prev => prev.map(poll => {
      if (poll.id === pollId) {
        const newVotes = [...poll.votes];
        newVotes[optionIndex]++;
        return { ...poll, votes: newVotes };
      }
      return poll;
    }));
  };

  const getFilteredSessions = () => {
    let filtered = sessions;

    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.instructorName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(session => {
            const sessionDate = new Date(session.scheduledTime);
            return sessionDate >= today && sessionDate < tomorrow;
          });
          break;
        case 'upcoming':
          filtered = filtered.filter(session => {
            const sessionDate = new Date(session.scheduledTime);
            return sessionDate > now;
          });
          break;
        case 'past':
          filtered = filtered.filter(session => {
            const sessionDate = new Date(session.scheduledTime);
            return sessionDate < now;
          });
          break;
        default:
          break;
      }
    }

    return filtered;
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'live':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'ended':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'live':
        return <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>;
      case 'scheduled':
        return <Clock className="w-4 h-4" />;
      case 'ended':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
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

  const filteredSessions = getFilteredSessions();

  return (
    <DashboardLayout role={userRole}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Live Sessions
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {userRole === 'instructor' 
                ? 'Manage and join your live learning sessions'
                : 'Join live learning sessions with your instructors'
              }
            </p>
          </div>
          {userRole === 'instructor' && (
            <button
              onClick={() => navigate('/create-live-session')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Session
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search sessions..."
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
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="live">Live</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="ended">Ended</option>
                </select>
              </div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sessions Grid */}
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                ? 'No sessions found' 
                : 'No live sessions available'
              }
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your filters'
                : userRole === 'instructor' 
                  ? 'Create your first live session to get started'
                  : 'Check back later for upcoming sessions'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map((session) => (
              <div key={session._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Session Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {session.title}
                    </h3>
                    <div className="flex gap-2">
                      {userRole === 'instructor' && (
                        <>
                          <button
                            onClick={() => navigate(`/edit-live-session/${session._id}`)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit Session"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session._id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Delete Session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {session.description || 'No description available'}
                  </p>
                </div>

                {/* Session Details */}
                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>Instructor: {session.instructorName || 'Unknown'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(session.scheduledTime)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>Duration: {session.duration || 60} minutes</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(session.status)}
                          {session.status?.charAt(0).toUpperCase() + session.status?.slice(1)}
                        </div>
                      </span>
                    </div>

                    {/* Session Features */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        {session.allowVideo ? (
                          <Camera className="w-3 h-3 text-green-500" />
                        ) : (
                          <CameraOff className="w-3 h-3 text-red-500" />
                        )}
                        <span>Video</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {session.allowAudio ? (
                          <Mic className="w-3 h-3 text-green-500" />
                        ) : (
                          <MicOff className="w-3 h-3 text-red-500" />
                        )}
                        <span>Audio</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6">
                    {session.status === 'live' ? (
                      <button
                        onClick={() => handleJoinSession(session._id)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Join Live Session
                      </button>
                    ) : session.status === 'scheduled' ? (
                      <button
                        onClick={() => handleJoinSession(session._id)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinSession(session._id)}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Recording
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Video Conferencing Interface Demo */}
        {filteredSessions.some(s => s.status === 'live') && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Active Session: Contoso West Weekly Project Briefing
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                Meeting duration: 00:28:02 • 10 participants
              </p>
            </div>

            <div className="p-6">
              {/* Control Bar */}
              <div className="flex items-center justify-between mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowParticipants(!showParticipants)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      showParticipants ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <Users2 className="w-4 h-4" />
                    <span className="hidden sm:inline">People</span>
                  </button>
                  
                  <button
                    onClick={() => setShowChat(!showChat)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      showChat ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Chat</span>
                  </button>

                  <button
                    onClick={() => setShowPolls(!showPolls)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      showPolls ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Polls</span>
                  </button>

                  {userRole === 'instructor' && (
                    <button
                      onClick={createPoll}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Create Poll</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAudioOn(!isAudioOn)}
                    className={`p-2 rounded-lg transition-colors ${
                      isAudioOn ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {isAudioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={() => setIsVideoOn(!isVideoOn)}
                    className={`p-2 rounded-lg transition-colors ${
                      isVideoOn ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {isVideoOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={() => setIsScreenSharing(!isScreenSharing)}
                    className={`p-2 rounded-lg transition-colors ${
                      isScreenSharing ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    <Share className="w-4 h-4" />
                  </button>

                  <button className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Video Area */}
                <div className="lg:col-span-3">
                  <div className="bg-gray-900 rounded-lg p-6 text-center">
                    <div className="w-32 h-32 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <Users className="w-16 h-16 text-gray-400" />
                    </div>
                    <p className="text-white text-lg">Video Conference Interface</p>
                    <p className="text-gray-400 text-sm mt-2">Click "Join Live Session" to enter the meeting</p>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  {/* Participants Panel */}
                  {showParticipants && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Users2 className="w-4 h-4" />
                        Participants ({participants.length})
                      </h3>
                      <div className="space-y-2">
                        {participants.map((participant) => (
                          <div key={participant.id} className="flex items-center gap-2 text-sm">
                            <div className="flex items-center gap-1">
                              {participant.isAudioOn ? (
                                <Mic className="w-3 h-3 text-green-500" />
                              ) : (
                                <MicOff className="w-3 h-3 text-red-500" />
                              )}
                              {participant.isVideoOn ? (
                                <Camera className="w-3 h-3 text-green-500" />
                              ) : (
                                <CameraOff className="w-3 h-3 text-red-500" />
                              )}
                              {participant.isHandRaised && (
                                <Hand className="w-3 h-3 text-yellow-500" />
                              )}
                            </div>
                            <span className="text-gray-700 dark:text-gray-300">{participant.name}</span>
                            {participant.role === 'Organizer' && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Organizer</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chat Panel */}
                  {showChat && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Chat
                      </h3>
                      <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                        {chatMessages.map((message) => (
                          <div key={message.id} className="text-sm">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${message.isOrganizer ? 'text-blue-600' : 'text-gray-700 dark:text-gray-300'}`}>
                                {message.sender}
                              </span>
                              <span className="text-xs text-gray-500">{message.timestamp}</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400">{message.message}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                        />
                        <button
                          onClick={sendChatMessage}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Polls Panel */}
                  {showPolls && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Active Polls
                      </h3>
                      <div className="space-y-3">
                        {polls.filter(poll => poll.isActive).map((poll) => (
                          <div key={poll.id} className="bg-white dark:bg-gray-600 rounded-lg p-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{poll.question}</p>
                            <div className="space-y-2">
                              {poll.options.map((option, index) => (
                                <button
                                  key={index}
                                  onClick={() => votePoll(poll.id, index)}
                                  className="w-full text-left p-2 text-sm bg-gray-100 dark:bg-gray-500 rounded hover:bg-gray-200 dark:hover:bg-gray-400 transition-colors"
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-700 dark:text-gray-300">{option}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{poll.votes[index]} votes</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LiveSessionsDashboard;
