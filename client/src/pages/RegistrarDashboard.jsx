import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import DashboardLayout from '../components/DashboardLayout';
import SkeletonLoader from '../components/SkeletonLoader';
import {
  UserPlus,
  Shield,
  DollarSign,
  Building,
  ClipboardList,
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Award,
  Video,
  Target,
  MessageCircle,
  Upload,
  Star,
  Activity,
  LayoutDashboard,
  PieChart,
  Download,
  Settings,
  Library
} from 'lucide-react';
import { downloadCSV } from '../utils/download';

const RegistrarDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    admissions: { total: 0, pending: 0, approved: 0 },
    fees: { total: 0, collected: 0, pending: 0 },
    hostels: { total: 0, occupied: 0, available: 0 },
    examinations: { total: 0, upcoming: 0, completed: 0 }
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [higherRoles, setHigherRoles] = useState({ users: [], loading: false, search: '', role: '' });
  const [groups, setGroups] = useState({ groups: [], loading: false });
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // No auto polling

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch statistics for all modules with authentication
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const promises = [
        fetch('/api/erp/admissions/stats/overview', { headers }).then(res => res.json()).catch(() => null),
        fetch('/api/erp/fees/stats/overview', { headers }).then(res => res.json()).catch(() => null),
        fetch('/api/erp/hostels/stats/overview', { headers }).then(res => res.json()).catch(() => null),
        fetch('/api/erp/examinations/stats/overview', { headers }).then(res => res.json()).catch(() => null)
      ];

      const results = await Promise.all(promises);
      
      // Process results
      let newStats = { ...stats };
      
      // Admissions stats
      const admissionStats = results[0];
      if (admissionStats) {
        newStats.admissions = {
          total: admissionStats.totalAdmissions || 0,
          pending: admissionStats.statusBreakdown?.find(s => s._id === 'Pending')?.count || 0,
          approved: admissionStats.statusBreakdown?.find(s => s._id === 'Approved')?.count || 0
        };
      }
      
      // Fees stats
      const feeStats = results[1];
      if (feeStats) {
        newStats.fees = {
          total: feeStats.totalFees?.totalAmount || 0,
          collected: feeStats.totalFees?.paidAmount || 0,
          pending: feeStats.totalFees?.pendingAmount || 0
        };
      }
      
      // Hostels stats
      const hostelStats = results[2];
      if (hostelStats) {
        newStats.hostels = {
          total: hostelStats.totalCapacity || 0,
          occupied: hostelStats.totalOccupancy || 0,
          available: hostelStats.totalAvailable || 0
        };
      }
      
      // Examinations stats
      const examStats = results[3];
      if (examStats) {
        newStats.examinations = {
          total: examStats.totalExaminations || 0,
          upcoming: examStats.upcomingExams || 0,
          completed: examStats.statusBreakdown?.find(s => s._id === 'Completed')?.count || 0
        };
      }
      
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHigherRoles = async (q = '', role = '') => {
    try {
      setHigherRoles(prev => ({ ...prev, loading: true, search: q, role }));
      const params = new URLSearchParams({ ...(q && { search: q }), ...(role && { role }) });
      const res = await fetch(`/api/registrar/higher-roles?${params.toString()}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });
      const data = await res.json();
      setHigherRoles(prev => ({ ...prev, users: data.users || [], loading: false }));
    } catch (e) {
      setHigherRoles(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchGroups = async () => {
    try {
      setGroups(prev => ({ ...prev, loading: true }));
      const res = await fetch('/api/registrar/groups', { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });
      const data = await res.json();
      setGroups(prev => ({ ...prev, groups: data.groups || [], loading: false }));
    } catch (e) {
      setGroups(prev => ({ ...prev, loading: false }));
    }
  };

  const updateHigherRole = async (userId, updates) => {
    try {
      const res = await fetch(`/api/registrar/higher-roles/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (res.ok) {
        fetchHigherRoles(higherRoles.search, higherRoles.role);
        setEditingUser(null);
        alert('Updated successfully');
      } else {
        alert(data.message || 'Update failed');
      }
    } catch (e) {
      alert('Update failed');
    }
  };

  const getModules = () => {
    return [
      {
        title: 'Admissions',
        icon: <UserPlus className="w-8 h-8" />,
        path: '/erp/admissions',
        color: 'bg-blue-500',
        stats: stats.admissions,
        description: 'Manage student admissions and applications'
      },
      {
        title: 'Fee Management',
        icon: <DollarSign className="w-8 h-8" />,
        path: '/erp/fees',
        color: 'bg-green-500',
        stats: stats.fees,
        description: 'Handle fee collection and payments'
      },
      {
        title: 'Hostel Management',
        icon: <Building className="w-8 h-8" />,
        path: '/erp/hostels',
        color: 'bg-purple-500',
        stats: stats.hostels,
        description: 'Manage hostel allocations and accommodations'
      },
      {
        title: 'Examinations',
        icon: <ClipboardList className="w-8 h-8" />,
        path: '/erp/examinations',
        color: 'bg-orange-500',
        stats: stats.examinations,
        description: 'Oversee examinations and assessments'
      },
      {
        title: 'Library Management',
        icon: <Library className="w-8 h-8" />,
        path: '/librarian',
        color: 'bg-teal-500',
        stats: {},
        description: 'Manage library operations and book circulation'
      },
      {
        title: 'Reports & Analytics',
        icon: <BarChart3 className="w-8 h-8" />,
        path: '/erp/reports',
        color: 'bg-indigo-500',
        stats: {},
        description: 'Generate comprehensive reports'
      },
      {
        title: 'System Settings',
        icon: <Settings className="w-8 h-8" />,
        path: '/admin',
        color: 'bg-gray-500',
        stats: {},
        description: 'Configure system parameters'
      }
    ];
  };

  const getStatsCards = () => {
    return [
      {
        title: 'Total Admissions',
        value: stats.admissions.total,
        icon: <UserPlus className="w-6 h-6" />,
        color: 'bg-blue-500',
        subtitle: `${stats.admissions.pending} pending review`,
        trend: '+12%'
      },
      {
        title: 'Fee Collection',
        value: `₹${stats.fees.collected.toLocaleString()}`,
        icon: <DollarSign className="w-6 h-6" />,
        color: 'bg-green-500',
        subtitle: `₹${stats.fees.pending.toLocaleString()} pending`,
        trend: '+8%'
      },
      {
        title: 'Hostel Occupancy',
        value: `${stats.hostels.occupied}/${stats.hostels.total}`,
        icon: <Building className="w-6 h-6" />,
        color: 'bg-purple-500',
        subtitle: `${stats.hostels.available} available`,
        trend: '+5%'
      },
      {
        title: 'Examinations',
        value: stats.examinations.total,
        icon: <ClipboardList className="w-6 h-6" />,
        color: 'bg-orange-500',
        subtitle: `${stats.examinations.upcoming} upcoming`,
        trend: '+15%'
      }
    ];
  };

  const StatCard = ({ title, value, icon, color, subtitle, trend }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
          {trend && (
            <div className="flex items-center mt-1">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-xs text-green-600">{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color} text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const ModuleCard = ({ module }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-full ${module.color} text-white`}>
          {module.icon}
        </div>
        <Eye className="w-5 h-5 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{module.title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{module.description}</p>
      {module.stats && Object.keys(module.stats).length > 0 && (
        <div className="space-y-1">
          {Object.entries(module.stats).map(([key, value]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400 capitalize">{key}:</span>
              <span className="font-medium text-gray-900 dark:text-white">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout role="registrar">
        <SkeletonLoader type="erp-dashboard" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="registrar">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Registrar Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete academic administration and student management system
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {getStatsCards().map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
            <button 
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <Activity className="w-4 h-4" />
              <span>Refresh Data</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button onClick={async()=>{
              try {
                await downloadCSV('/api/registrar/reports/consolidated?format=xlsx', 'registrar_report.xlsx');
              } catch (e) {
                // fallback to CSV
                await downloadCSV('/api/registrar/reports/consolidated?format=csv', 'registrar_report.csv');
              }
            }} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <BarChart3 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <span className="text-sm font-medium">Generate Report</span>
            </button>
            <button onClick={async()=>{
              const token = localStorage.getItem('token')||'';
              const headers = { Authorization: `Bearer ${token}` };
              const res = await fetch('/api/erp/admissions/stats/overview', { headers });
              const data = await res.json();
              console.log('Analytics', data);
              alert('Analytics loaded (see console).');
            }} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <PieChart className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <span className="text-sm font-medium">Analytics</span>
            </button>
            <button onClick={async()=>{
              await downloadCSV('/api/erp/admissions/export?format=csv', 'admissions.csv');
            }} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Download className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <span className="text-sm font-medium">Export Data</span>
            </button>
            <button className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Settings className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <span className="text-sm font-medium">Settings</span>
            </button>
            <button onClick={() => fetchHigherRoles()} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Shield className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <span className="text-sm font-medium">Higher Roles</span>
            </button>
            <button onClick={() => fetchGroups()} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Users className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
              <span className="text-sm font-medium">Groups</span>
            </button>
          </div>
        </div>

        {/* ERP Modules + Higher Roles */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Available Modules
          </h2>
          {higherRoles.users.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Higher Roles</h3>
                <div className="flex gap-2">
                  <input placeholder="Search name/email" className="px-3 py-2 rounded border dark:bg-gray-700 dark:text-white" value={higherRoles.search} onChange={(e)=>fetchHigherRoles(e.target.value, higherRoles.role)} />
                  <select className="px-3 py-2 rounded border dark:bg-gray-700 dark:text-white" value={higherRoles.role} onChange={(e)=>fetchHigherRoles(higherRoles.search, e.target.value)}>
                    <option value="">All</option>
                    <option value="admin">Admin</option>
                    <option value="admission_officer">Admission Officer</option>
                    <option value="fee_manager">Fee Manager</option>
                    <option value="hostel_manager">Hostel Manager</option>
                    <option value="exam_controller">Exam Controller</option>
                    <option value="accountant">Accountant</option>
                    <option value="registrar">Registrar</option>
                    <option value="instructor">Instructor</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {higherRoles.users.map(u => (
                  <div key={u._id} className="border rounded p-4 dark:border-gray-700">
                    <div className="font-semibold text-gray-900 dark:text-white">{u.name}</div>
                    <div className="text-sm text-gray-500">{u.email}</div>
                    <div className="text-xs mt-1">Role: {u.role}</div>
                    <div className="text-xs">Dept: {u.department || '—'}</div>
                    <div className="text-xs">Designation: {u.designation || '—'}</div>
                    <div className="text-xs">Employee ID: {u.employeeId || '—'}</div>
                    <div className="text-xs">Mobile: {u.mobileNo || '—'}</div>
                    <div className="text-xs">DOB: {u.dateOfBirth ? new Date(u.dateOfBirth).toLocaleDateString() : '—'}</div>
                    <div className="text-xs">Joining: {u.joiningDate ? new Date(u.joiningDate).toLocaleDateString() : '—'}</div>
                    {u.address && (
                      <div className="text-xs mt-1 text-gray-500">
                        {u.address.city && u.address.state ? `${u.address.city}, ${u.address.state}` : '—'}
                      </div>
                    )}
                    <button onClick={() => setEditingUser(u)} className="mt-2 text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Edit</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {groups.groups.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Student Groups</h3>
                <button onClick={fetchGroups} className="text-sm px-3 py-1 border rounded">Refresh</button>
              </div>
              <div className="space-y-4">
                {groups.groups.map(g => (
                  <div key={g._id} className="border rounded p-4 dark:border-gray-700">
                    <div className="font-semibold text-gray-900 dark:text-white mb-2">{g.name}</div>
                    <div className="text-sm text-gray-500 mb-2">Assigned Admin: {g.assignedAdmin?.name || '—'} ({g.assignedAdmin?.email || '—'})</div>
                    <div className="text-xs text-gray-500 mb-3">Dept: {g.assignedAdmin?.department || '—'} | Designation: {g.assignedAdmin?.designation || '—'}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {(g.students || []).map(s => (
                        <div key={s._id} className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-xs">
                          <div className="font-medium">{s.name}</div>
                          <div className="text-gray-500">{s.email}</div>
                          <div>PRN: {s.prn || '—'}</div>
                          <div>{s.course} {s.branch} Sem {s.semester || '—'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getModules().map((module, index) => (
              <ModuleCard key={index} module={module} />
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Recent Activities
          </h2>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No recent activities</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit {editingUser.name}</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              updateHigherRole(editingUser._id, {
                name: formData.get('name'),
                department: formData.get('department'),
                designation: formData.get('designation'),
                employeeId: formData.get('employeeId'),
                joiningDate: formData.get('joiningDate'),
                mobileNo: formData.get('mobileNo'),
                dateOfBirth: formData.get('dateOfBirth'),
                address: {
                  street: formData.get('street'),
                  city: formData.get('city'),
                  state: formData.get('state'),
                  pincode: formData.get('pincode'),
                  country: formData.get('country')
                }
              });
            }}>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <input name="name" defaultValue={editingUser.name} placeholder="Name" className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white" required />
                  <input name="department" defaultValue={editingUser.department || ''} placeholder="Department" className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input name="designation" defaultValue={editingUser.designation || ''} placeholder="Designation" className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white" />
                  <input name="employeeId" defaultValue={editingUser.employeeId || ''} placeholder="Employee ID" className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input name="joiningDate" type="date" defaultValue={editingUser.joiningDate || ''} placeholder="Joining Date" className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white" />
                  <input name="mobileNo" defaultValue={editingUser.mobileNo || ''} placeholder="Mobile Number" className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white" />
                </div>
                <input name="dateOfBirth" type="date" defaultValue={editingUser.dateOfBirth || ''} placeholder="Date of Birth" className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white" />
                
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</h4>
                  <div className="space-y-2">
                    <input name="street" defaultValue={editingUser.address?.street || ''} placeholder="Street Address" className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white" />
                    <div className="grid grid-cols-2 gap-2">
                      <input name="city" defaultValue={editingUser.address?.city || ''} placeholder="City" className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white" />
                      <input name="state" defaultValue={editingUser.address?.state || ''} placeholder="State" className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input name="pincode" defaultValue={editingUser.address?.pincode || ''} placeholder="Pincode" className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white" />
                      <input name="country" defaultValue={editingUser.address?.country || ''} placeholder="Country" className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Save</button>
                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default RegistrarDashboard;
