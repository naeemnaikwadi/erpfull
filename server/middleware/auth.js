const jwt = require('jsonwebtoken');

const instructorOnly = (req, res, next) => {
  if (req.user && req.user.role === 'instructor') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Instructor role required.' });
  }
};

const studentOnly = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Student role required.' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
};

const adminOrInstructor = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'instructor')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin or Instructor role required.' });
  }
};

const auth = function(req, res, next) {
  // Get token from header
  let token = req.header('Authorization');

  // Check if token exists and is in 'Bearer <token>' format
  if (token && token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  }

  // Fallback: support token via query string for download redirects
  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = { auth, instructorOnly, studentOnly, adminOnly, adminOrInstructor };
