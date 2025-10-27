import React, { useState, useEffect } from 'react';
import { createHostel } from '../services/hostelService';
import { useAuth } from '../context/authContext';
import DashboardLayout from '../components/DashboardLayout';
import SkeletonLoader from '../components/SkeletonLoader';
import {
  Building,
  Users,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  BarChart3,
  PieChart,
  Calendar,
  FileText,
  TrendingUp,
  AlertCircle,
  MapPin,
  Bed,
  Home
} from 'lucide-react';
import { downloadCSV } from '../utils/download';

const HostelManagerDashboard = () => {
  const { user } = useAuth();
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newHostel, setNewHostel] = useState({ name: '', location: '', capacity: 0, status: 'Available' });
  const [stats, setStats] = useState({
    totalCapacity: 0,
    totalOccupancy: 0,
    totalAvailable: 0,
    occupancyRate: 0
  });

  useEffect(() => {
    fetchHostels();
    fetchStats();
  }, [currentPage, statusFilter]);

  const fetchHostels = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await fetch(`/api/erp/hostels?${params}`);
      const data = await response.json();
      
      setHostels(data.hostels || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching hostels:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/erp/hostels/stats/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      setStats({
        totalCapacity: data.totalCapacity || 0,
        totalOccupancy: data.totalOccupancy || 0,
        totalAvailable: data.totalAvailable || 0,
        occupancyRate: data.occupancyRate || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Occupied': return 'bg-blue-100 text-blue-800';
      case 'Maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'Reserved': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Available': return <CheckCircle className="w-4 h-4" />;
      case 'Occupied': return <Users className="w-4 h-4" />;
      case 'Maintenance': return <Clock className="w-4 h-4" />;
      case 'Reserved': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
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

  const HostelModal = ({ hostel, onClose }) => {
    if (!hostel) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Hostel Details
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hostel Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                  Hostel Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Name:</span>
                    <span className="font-medium">{hostel.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Location:</span>
                    <span className="font-medium">{hostel.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bed className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Capacity:</span>
                    <span className="font-medium">{hostel.capacity} students</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Occupied:</span>
                    <span className="font-medium">{hostel.occupied || 0} students</span>
                  </div>
                </div>
              </div>

              {/* Room Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                  Room Details
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Room Type:</span>
                    <span className="font-medium ml-2">{hostel.roomType || 'Standard'}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Facilities:</span>
                    <span className="font-medium ml-2">{hostel.facilities?.join(', ') || 'Basic amenities'}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Rent:</span>
                    <span className="font-medium ml-2">₹{hostel.rent?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(hostel.status)}`}>
                      {hostel.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-4">
                <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                  Edit Hostel
                </button>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  View Allocations
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout role="hostel_manager">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hostel Management Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage hostel allocations and accommodations efficiently</p>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Hostel</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Capacity"
            value={stats.totalCapacity}
            icon={<Building className="w-6 h-6" />}
            color="bg-blue-500"
            subtitle="All hostels"
            trend="+5%"
          />
          <StatCard
            title="Occupied"
            value={stats.totalOccupancy}
            icon={<Users className="w-6 h-6" />}
            color="bg-green-500"
            subtitle={`${stats.occupancyRate.toFixed(1)}% occupancy rate`}
            trend="+8%"
          />
          <StatCard
            title="Available"
            value={stats.totalAvailable}
            icon={<Bed className="w-6 h-6" />}
            color="bg-purple-500"
            subtitle="Vacant rooms"
            trend="-3%"
          />
          <StatCard
            title="Hostels"
            value={hostels.length}
            icon={<Home className="w-6 h-6" />}
            color="bg-orange-500"
            subtitle="Total buildings"
            trend="+2%"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button onClick={async()=>{
              const token = localStorage.getItem('token')||'';
              const res = await fetch('/api/erp/hostels/dashboard/stats', { headers: { Authorization: `Bearer ${token}` }});
              const data = await res.json();
              console.log('Hostel report data:', data);
              alert('Hostel report generated (see console).');
            }} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <BarChart3 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <span className="text-sm font-medium">Generate Report</span>
            </button>
            <button onClick={async()=>{
              const token = localStorage.getItem('token')||'';
              const res = await fetch('/api/erp/hostels/dashboard/stats', { headers: { Authorization: `Bearer ${token}` }});
              const data = await res.json();
              console.log('Analytics:', data);
              alert('Analytics loaded (see console).');
            }} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <PieChart className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <span className="text-sm font-medium">Analytics</span>
            </button>
            <button onClick={async()=>{
              await downloadCSV('/api/erp/hostels/export?format=csv', 'hostels.csv');
            }} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <FileText className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <span className="text-sm font-medium">Export Data</span>
            </button>
            <button onClick={()=>alert('Scheduling UI can be integrated here.')} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Calendar className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <span className="text-sm font-medium">Schedule</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search hostels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Reserved">Reserved</option>
            </select>
            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Hostels Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Hostel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Occupied
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  [...Array(3)].map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                      <td className="px-6 py-4"><div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                    </tr>
                  ))
                ) : hostels.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No hostels found
                    </td>
                  </tr>
                ) : (
                  hostels.map((hostel) => (
                    <tr key={hostel._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {hostel.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {hostel.roomType || 'Standard'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{hostel.location}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Block A</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {hostel.capacity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {hostel.occupied || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1 w-fit ${getStatusColor(hostel.status)}`}>
                          {getStatusIcon(hostel.status)}
                          <span>{hostel.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedHostel(hostel);
                              setShowModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <HostelModal
            hostel={selectedHostel}
            onClose={() => {
              setShowModal(false);
              setSelectedHostel(null);
            }}
          />
        )}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Create Hostel</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-500"><XCircle className="w-6 h-6" /></button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <input className="border rounded px-3 py-2 dark:bg-gray-700" placeholder="Name" value={newHostel.name} onChange={e => setNewHostel({ ...newHostel, name: e.target.value })} />
                <input className="border rounded px-3 py-2 dark:bg-gray-700" placeholder="Location" value={newHostel.location} onChange={e => setNewHostel({ ...newHostel, location: e.target.value })} />
                <input type="number" className="border rounded px-3 py-2 dark:bg-gray-700" placeholder="Capacity" value={newHostel.capacity} onChange={e => setNewHostel({ ...newHostel, capacity: Number(e.target.value) })} />
                <select className="border rounded px-3 py-2 dark:bg-gray-700" value={newHostel.status} onChange={e => setNewHostel({ ...newHostel, status: e.target.value })}>
                  <option value="Available">Available</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Reserved">Reserved</option>
                </select>
              </div>
              <div className="mt-6 flex justify-end space-x-2">
                <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
                <button onClick={async () => { await createHostel(newHostel); setShowCreateModal(false); fetchHostels(); }} className="px-4 py-2 rounded bg-primary-600 text-white">Create</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default HostelManagerDashboard;
