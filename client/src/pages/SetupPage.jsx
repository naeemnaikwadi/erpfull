import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Database,
  UserPlus
} from 'lucide-react';

const SetupPage = () => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState(null);
  const [userCheck, setUserCheck] = useState(null);

  const checkUsers = async () => {
    setChecking(true);
    try {
      const response = await fetch('/api/setup/check-erp-users');
      const data = await response.json();
      setUserCheck(data);
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Error checking users: ' + error.message
      });
    } finally {
      setChecking(false);
    }
  };

  const createUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/setup/create-erp-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStatus({
          type: 'success',
          message: data.message,
          details: data
        });
        setUsers(data.users);
        // Refresh user check
        checkUsers();
      } else {
        setStatus({
          type: 'error',
          message: data.message || 'Failed to create users'
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Error creating users: ' + error.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            ERP System Setup
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create ERP users and verify system setup
          </p>
        </div>

        {/* User Check Status */}
        {userCheck && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                User Status Check
              </h2>
              <button
                onClick={checkUsers}
                disabled={checking}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Found: {userCheck.found}
                  </span>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">
                    Missing: {userCheck.missing.length}
                  </span>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Total: {userCheck.total}
                  </span>
                </div>
              </div>
            </div>

            {userCheck.missing.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800 dark:text-yellow-200">
                    Missing Users
                  </span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {userCheck.missing.join(', ')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Create Users Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Create ERP Users
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create all ERP users with default credentials. This will replace any existing users with the same emails.
          </p>
          
          <button
            onClick={createUsers}
            disabled={loading}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <UserPlus className="w-5 h-5" />
            )}
            <span>{loading ? 'Creating Users...' : 'Create ERP Users'}</span>
          </button>
        </div>

        {/* Status Messages */}
        {status && (
          <div className={`rounded-lg p-4 mb-6 ${
            status.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700' 
              : 'bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700'
          }`}>
            <div className="flex items-center space-x-2">
              {status.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <p className={`font-medium ${
                status.type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
              }`}>
                {status.message}
              </p>
            </div>
            {status.details && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <p>Created: {status.details.count} users</p>
              </div>
            )}
          </div>
        )}

        {/* Created Users List */}
        {users.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Created Users
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Password
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {user.role.replace('_', ' ').toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {user.password}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
            Setup Instructions
          </h3>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <p>1. Click "Create ERP Users" to create all required users</p>
            <p>2. Use the provided credentials to login to the system</p>
            <p>3. Each role has access to specific ERP modules</p>
            <p>4. Admin has full access to all modules</p>
            <p>5. Students can view their academic information and results</p>
            <p>6. Instructors can view student statistics and reports</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;
