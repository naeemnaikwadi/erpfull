const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
}

export async function listSessions() {
  const res = await fetch(`${API_URL}/api/chat/sessions`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch chat sessions');
  return res.json();
}

export async function createSession(title) {
  const res = await fetch(`${API_URL}/api/chat/sessions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ title })
  });
  if (!res.ok) throw new Error('Failed to create session');
  return res.json();
}

export async function getSession(sessionId) {
  const res = await fetch(`${API_URL}/api/chat/sessions/${sessionId}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to fetch session');
  return res.json();
}

export async function sendMessage(sessionId, message) {
  const res = await fetch(`${API_URL}/api/chat/sessions/${sessionId}/message`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ message })
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}


