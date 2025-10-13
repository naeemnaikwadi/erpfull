import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LiveKitRoom,
  VideoConference,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  useLocalParticipant,
  useRoomContext,
  useParticipants,
  Chat,
  ConnectionStateToast,
} from '@livekit/components-react';
import {
  Track,
  Room,
  ConnectionState,
  RemoteParticipant,
  LocalParticipant,
  DataPacket_Kind,
  RoomEvent,
} from 'livekit-client';
import { getCurrentUser, getAuthHeaders } from '../utils/auth';
import socket from '../services/socket';
import ScreenShareControls from '../components/ScreenShareControls';
import '@livekit/components-styles';

const LiveSessionRoom = () => {
  const { roomName } = useParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [previousPage, setPreviousPage] = useState('/');
  
  // Instructor controls state
  const [participants, setParticipants] = useState([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showPolls, setShowPolls] = useState(false);
  const [polls, setPolls] = useState([]);
  const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''] });
  
  // Student interaction state
  const [handRaised, setHandRaised] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [activePoll, setActivePoll] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [raisedHands, setRaisedHands] = useState({}); // {participantName: true}

  const currentUser = getCurrentUser();
  const isInstructor = currentUser?.role === 'instructor';

  useEffect(() => {
    // Store the previous page location
    const referrer = document.referrer;
    const currentPath = window.location.pathname;
    
    // Get the path from localStorage if available, otherwise use referrer
    const storedPath = localStorage.getItem('redirectAfterLogin');
    if (storedPath && storedPath !== currentPath) {
      setPreviousPage(storedPath);
    } else if (referrer && referrer !== window.location.href) {
      try {
        const url = new URL(referrer);
        if (url.pathname !== currentPath) {
          setPreviousPage(url.pathname);
        }
      } catch (e) {
        // If URL parsing fails, use a default path
        setPreviousPage('/');
      }
    } else {
      // Default fallback paths based on user role
      if (currentUser?.role === 'instructor') {
        setPreviousPage('/instructor');
      } else if (currentUser?.role === 'student') {
        setPreviousPage('/student');
      } else {
        setPreviousPage('/');
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (roomName && currentUser) {
      fetchToken();
    }
  }, [roomName, currentUser]);

  const fetchToken = async () => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/livekit/join-room?roomName=${roomName}&identity=${currentUser.name}`,
        {
          headers: getAuthHeaders()
        }
      );

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setUserRole(data.role);
      } else {
        throw new Error('Failed to get room token');
      }
    } catch (error) {
      console.error('Error fetching token:', error);
      setError('Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  // Join socket room for real-time reactions/hand raise/polls
  useEffect(() => {
    if (!roomName || !currentUser) return;
    socket.emit('join-room', { room: roomName, user: { name: currentUser.name, id: currentUser._id } });

    const onNewMessage = (msg) => {
      // Expect shapes: { type: 'reaction'|'hand'|'poll'|'vote', ... }
      try {
        if (msg?.type === 'reaction') {
          const reactionId = Date.now() + Math.random();
          const reaction = { 
            id: reactionId, 
            emoji: msg.emoji, 
            user: msg.user, 
            timestamp: Date.now() 
          };
          setReactions((prev) => [...prev, reaction]);
          setTimeout(() => setReactions((prev) => prev.filter(r => r.id !== reactionId)), 3000);
        } else if (msg?.type === 'hand') {
          setRaisedHands((prev) => ({ ...prev, [msg.user]: msg.raised }));
        } else if (msg?.type === 'poll') {
          // Students receive poll
          if (!isInstructor) {
            setActivePoll(msg.poll);
            setHasVoted(false);
          }
          // Instructors mirror poll list
          if (isInstructor) {
            setPolls((prev) => [...prev, msg.poll]);
          }
        } else if (msg?.type === 'vote' && isInstructor) {
          // Update vote counts serverless in-memory
          setPolls((prev) => prev.map(p => {
            if (p.id === msg.pollId) {
              const votes = { ...(p.votes || {}) };
              votes[msg.user] = msg.optionIndex;
              return { ...p, votes };
            }
            return p;
          }));
        }
      } catch {}
    };
    socket.on('room-message', onNewMessage);
    socket.on('user-joined', () => {
      if (isInstructor) fetchParticipants();
    });
    return () => {
      socket.off('room-message', onNewMessage);
      socket.off('user-joined');
    };
  }, [roomName, currentUser, isInstructor]);

  // Keep participant list fresh for instructor
  useEffect(() => {
    if (!connected || !isInstructor) return;
    fetchParticipants();
    const interval = setInterval(fetchParticipants, 5000);
    return () => clearInterval(interval);
  }, [connected, isInstructor, roomName]);

  const handleDisconnected = useCallback(() => {
    setConnected(false);
    navigate(previousPage);
  }, [navigate, previousPage]);

  const handleConnected = useCallback(() => {
    setConnected(true);
  }, []);

  // Instructor functions
  const fetchParticipants = async () => {
    if (!isInstructor) return;
    
    try {
      const response = await fetch(`http://localhost:4000/api/livekit/room/${roomName}/participants`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setParticipants(data.participants);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const removeParticipant = async (participantIdentity) => {
    if (!isInstructor) return;
    
    try {
      const response = await fetch(`http://localhost:4000/api/livekit/room/${roomName}/remove-participant`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ participantIdentity })
      });
      
      if (response.ok) {
        fetchParticipants();
      }
    } catch (error) {
      console.error('Error removing participant:', error);
    }
  };

  const toggleParticipantPermissions = async (participantIdentity, canPublish) => {
    if (!isInstructor) return;
    
    try {
      const response = await fetch(`http://localhost:4000/api/livekit/room/${roomName}/update-permissions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ participantIdentity, canPublish: !canPublish })
      });
      
      if (response.ok) {
        fetchParticipants();
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
    }
  };

  const createPoll = () => {
    if (!isInstructor || !newPoll.question.trim()) return;
    
    const poll = {
      id: Date.now(),
      question: newPoll.question,
      options: newPoll.options.filter(opt => opt.trim()),
      votes: {},
      active: true,
      createdAt: new Date()
    };
    
    setPolls(prev => [...prev, poll]);
    setNewPoll({ question: '', options: ['', ''] });
    
    // Broadcast poll to all participants (socket)
    socket.emit('message', { room: roomName, msg: { type: 'poll', poll } });
  };

  const endRoom = async () => {
    if (!isInstructor) return;
    
    if (window.confirm('Are you sure you want to end this session for everyone?')) {
      try {
        const response = await fetch(`http://localhost:4000/api/livekit/room/${roomName}/end`, {
          method: 'POST',
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          navigate(previousPage);
        }
      } catch (error) {
        console.error('Error ending room:', error);
      }
    }
  };

  // Student functions
  const toggleHandRaise = () => {
    const next = !handRaised;
    setHandRaised(next);
    // Broadcast via socket so instructor sees it
    socket.emit('message', { room: roomName, msg: { type: 'hand', user: currentUser.name, raised: next } });
  };

  const sendReaction = (emoji) => {
    const reactionId = Date.now() + Math.random();
    const reaction = {
      id: reactionId,
      emoji,
      user: currentUser.name,
      timestamp: Date.now()
    };
    
    // Add reaction locally
    setReactions(prev => [...prev, reaction]);
    
    // Remove reaction after 3 seconds
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== reactionId));
    }, 3000);
    
    // Broadcast reaction to everyone via socket
    socket.emit('message', { room: roomName, msg: { type: 'reaction', emoji, user: currentUser.name } });
  };

  const castVote = (pollId, optionIndex) => {
    if (hasVoted) return;
    setHasVoted(true);
    // Inform instructor
    socket.emit('message', { room: roomName, msg: { type: 'vote', pollId, optionIndex, user: currentUser.name } });
    // Close active poll UI for student after voting
    setTimeout(() => setActivePoll(null), 500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Joining session...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button
            onClick={() => navigate(previousPage)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 relative">
      <LiveKitRoom
        video={isInstructor}
        audio={isInstructor}
        token={token}
        serverUrl={process.env.REACT_APP_LIVEKIT_URL || 'wss://skillsync-yhs0e6yq.livekit.cloud'}
        data-lk-theme="default"
        style={{ height: '100vh' }}
        onConnected={handleConnected}
        onDisconnected={handleDisconnected}
      >
        {/* Main Video Conference */}
        <VideoConference
          chatMessageFormatter={(message, participant) =>
            `${participant?.name}: ${message}`
          }
        />

        {/* Header Bar (Instructor only) */}
        {isInstructor && (
          <div className="absolute top-0 left-0 w-full bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6 py-3 z-40">
            <div className="text-white font-semibold">
              {roomName} – Live Session
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
              >
                Participants ({participants.length})
              </button>
              <button
                onClick={() => setShowPolls(!showPolls)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
              >
                Polls
              </button>
              <button
                onClick={endRoom}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded text-sm"
              >
                End Session
              </button>
            </div>
          </div>
        )}

        {/* Bottom Control Bar (Everyone) */}
        <div className="absolute bottom-0 left-0 w-full bg-gray-800 border-t border-gray-700 flex items-center justify-center space-x-4 py-3 z-40">
          <ScreenShareControls isInstructor={isInstructor} />

          {!isInstructor && (
            <>
              <button
                onClick={toggleHandRaise}
                className={`px-4 py-2 rounded text-sm ${
                  handRaised ? 'bg-yellow-600' : 'bg-gray-700 hover:bg-gray-600'
                } text-white`}
              >
                ✋ {handRaised ? 'Lower Hand' : 'Raise Hand'}
              </button>
              <div className="flex space-x-2">
                {['👍', '👏', '❤️', '😂', '😮'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => sendReaction(emoji)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-sm"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          )}

          <button
            onClick={() => navigate(previousPage)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Leave
          </button>
        </div>

        {/* Right Slide-in Panels */}
        {showParticipants && isInstructor && (
          <div className="absolute top-0 right-0 h-full w-80 bg-gray-900 border-l border-gray-700 p-4 z-50 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-lg">Participants ({participants.length})</h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="text-gray-400 hover:text-white text-xl transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              {participants.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No participants yet</p>
                  <p className="text-sm">Students will appear here when they join</p>
                </div>
              ) : (
                (() => {
                  // Sort participants: instructor first, then students
                  const sortedParticipants = [...participants].sort((a, b) => {
                    const aIsInstructor = a.name === currentUser.name || a.identity === currentUser.name;
                    const bIsInstructor = b.name === currentUser.name || b.identity === currentUser.name;
                    
                    if (aIsInstructor && !bIsInstructor) return -1;
                    if (!aIsInstructor && bIsInstructor) return 1;
                    return (a.name || '').localeCompare(b.name || '');
                  });

                  return sortedParticipants.map((participant) => {
                    const isInstructorParticipant = participant.name === currentUser.name || participant.identity === currentUser.name;
                    const displayName = participant.name || participant.identity || 'Unknown';
                    const handRaised = raisedHands[displayName] || false;
                    
                    return (
                      <div
                        key={participant.identity}
                        className={`rounded-lg p-3 border ${
                          isInstructorParticipant 
                            ? 'bg-blue-800 border-blue-600 ring-2 ring-blue-500' 
                            : 'bg-gray-800 border-gray-600'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className={`font-medium flex items-center gap-2 ${
                              isInstructorParticipant ? 'text-blue-200' : 'text-white'
                            }`}>
                              {displayName}
                              {isInstructorParticipant && (
                                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                                  Instructor
                                </span>
                              )}
                              {handRaised && (
                                <span className="text-yellow-400 text-lg">✋</span>
                              )}
                            </div>
                            <div className="text-gray-400 text-sm">
                              {participant.permission?.canPublish
                                ? '🟢 Can Share'
                                : '🔴 View Only'}
                            </div>
                          </div>
                          {!isInstructorParticipant && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() =>
                                  toggleParticipantPermissions(
                                    participant.identity,
                                    participant.permission?.canPublish
                                  )
                                }
                                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
                              >
                                {participant.permission?.canPublish
                                  ? 'Restrict'
                                  : 'Allow'}
                              </button>
                              <button
                                onClick={() => removeParticipant(participant.identity)}
                                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </div>
        )}

        {showPolls && isInstructor && (
          <div className="absolute top-0 right-0 h-full w-96 bg-gray-900 border-l border-gray-700 p-4 z-50 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-lg">Live Polls</h3>
              <button
                onClick={() => setShowPolls(false)}
                className="text-gray-400 hover:text-white text-xl transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Create Poll */}
            <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-600">
              <h4 className="text-white font-medium mb-3">Create New Poll</h4>
              <input
                type="text"
                placeholder="Poll question..."
                value={newPoll.question}
                onChange={(e) =>
                  setNewPoll((prev) => ({ ...prev, question: e.target.value }))
                }
                className="w-full bg-gray-700 text-white p-2 rounded mb-3 border border-gray-600 focus:ring-2 focus:ring-blue-500"
              />
              
              {newPoll.options.map((option, index) => (
                <input
                  key={index}
                  type="text"
                  placeholder={`Option ${index + 1}...`}
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...newPoll.options];
                    newOptions[index] = e.target.value;
                    setNewPoll((prev) => ({ ...prev, options: newOptions }));
                  }}
                  className="w-full bg-gray-700 text-white p-2 rounded mb-2 border border-gray-600 focus:ring-2 focus:ring-blue-500"
                />
              ))}
              
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={() =>
                    setNewPoll((prev) => ({
                      ...prev,
                      options: [...prev.options, ''],
                    }))
                  }
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Add Option
                </button>
                <button
                  onClick={createPoll}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Create Poll
                </button>
              </div>
            </div>

            {/* Active Polls */}
            <div className="space-y-4">
              <h4 className="text-white font-medium">Active Polls</h4>
              {polls.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No active polls</p>
                  <p className="text-sm">Create a poll to get started</p>
                </div>
              ) : (
                polls.map((poll) => (
                  <div key={poll.id} className="bg-gray-800 rounded-lg p-3 border border-gray-600">
                    <div className="text-white font-medium mb-3">
                      {poll.question}
                    </div>
                    <div className="space-y-2">
                      {poll.options.map((option, index) => {
                        const voteCount = Object.values(poll.votes).filter((v) => v === index).length;
                        const totalVotes = Object.keys(poll.votes).length;
                        const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                        
                        return (
                          <div key={index} className="bg-gray-700 rounded p-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-gray-300 text-sm">{option}</span>
                              <span className="text-gray-400 text-xs">{voteCount} votes ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-gray-400 text-xs mt-2">
                      Total votes: {Object.keys(poll.votes).length}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Student Active Poll Prompt */}
        {!isInstructor && activePoll && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-gray-800 text-white rounded-lg shadow-lg p-4 w-[28rem] border border-gray-700">
              <div className="font-semibold mb-3">{activePoll.question}</div>
              <div className="space-y-2">
                {activePoll.options.map((opt, idx) => (
                  <button
                    key={idx}
                    disabled={hasVoted}
                    onClick={() => castVote(activePoll.id, idx)}
                    className={`w-full text-left px-3 py-2 rounded border ${hasVoted ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-700 hover:bg-gray-600 border-gray-600'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {hasVoted && (
                <div className="text-green-400 text-sm mt-3">Vote submitted</div>
              )}
            </div>
          </div>
        )}

                 {/* Reactions Overlay */}
         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40">
           {reactions.map((reaction) => (
             <div
               key={reaction.id}
               className="absolute animate-bounce text-4xl transition-all duration-300"
               style={{
                 left: `${Math.random() * 200 - 100}px`,
                 top: `${Math.random() * 200 - 100}px`,
                 animationDuration: '2s',
                 animationIterationCount: '1',
               }}
             >
               {reaction.emoji}
             </div>
           ))}
         </div>

         {/* Raise Hand Overlay */}
         <div className="absolute top-4 right-4 pointer-events-none z-40">
           {Object.entries(raisedHands).map(([userName, isRaised]) => {
             if (isRaised && userName !== currentUser.name) {
               return (
                 <div
                   key={userName}
                   className="bg-yellow-500 text-white px-3 py-2 rounded-lg shadow-lg animate-pulse mb-2"
                 >
                   <div className="flex items-center gap-2">
                     <span className="text-xl">✋</span>
                     <span className="font-medium">{userName} raised hand</span>
                   </div>
                 </div>
               );
             }
             return null;
           })}
         </div>

        {/* Connection Status */}
        <ConnectionStateToast />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
};

export default LiveSessionRoom;