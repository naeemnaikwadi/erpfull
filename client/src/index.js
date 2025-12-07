import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import './index.css';
import { AuthProvider } from './context/authContext';

// React Router v7 future flags can be set via global for react-router@6.22+
// These silence upgrade warnings and opt-in to new behavior safely.
// Note: This must be set before Router usage (App mounts BrowserRouter inside).
// eslint-disable-next-line no-undef

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <Router>
          <App />
        </Router>
      </AuthProvider>
    </Provider>
  </React.StrictMode>
);
