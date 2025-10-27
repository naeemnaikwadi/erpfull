import React, { useState, useEffect } from 'react';
import { createHostel, allocateRoom } from '../services/hostelService';
import API from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import SkeletonLoader from '../components/SkeletonLoader';
import {
  Building,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Plus,
  Users,
  Home as HostelIcon,
  MapPin,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserPlus,
  Settings
} from 'lucide-react';

const HostelManagementPage = () => {
  const [hostels, setHostels] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [newHostel, setNewHostel] = useState({
    name: '',
    type: 'Boys',
    address: { city: '', state: '' },
    contactNumber: '',
    wardenName: '',
    totalRooms: 0,
    totalFloors: 0,
    roomsPerFloor: 0,
    totalCapacity: 0,
    monthlyRent: 0,
    securityDeposit: 0,
    maintenanceFee: 0
  });
  const [allocationForm, setAllocationForm] = useState({
    studentId: '',
    roomNumber: '',
    floorNumber: '',
    checkInDate: ''
  });
  const [activeTab, setActiveTab] = useState('hostels');
  const [allocationFilters, setAllocationFilters] = useState({ status: 'all', search: '' });

  useEffect(() => {
    fetchHostels();
  }, [currentPage, typeFilter]);

  const fetchHostels = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/erp/hostels');
      setHostels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching hostels:', error);
      setHostels([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllocations = async (hostelId) => {
    try {
      const params = { page: 1, limit: 20, ...(allocationFilters.status !== 'all' && { status: allocationFilters.status }) };
      const endpoint = hostelId ? `/erp/hostels/${hostelId}/allocations` : '/erp/hostels/allocations';
      const { data } = await API.get(endpoint, { params: { ...params, ...(hostelId ? {} : { hostelId }) } });
      setAllocations(Array.isArray(data.allocations) ? data.allocations : []);
    } catch (error) {
      console.error('Error fetching allocations:', error);
    }
  };

  const getOccupancyColor = (occupancy, capacity) => {
    const percentage = (occupancy / capacity) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const HostelModal = ({ hostel, onClose }) => {
    if (!hostel) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {hostel.name} - Details
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
                    <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
                    <span className="font-medium">{hostel.type}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Address:</span>
                    <span className="font-medium">{hostel.address?.city}, {hostel.address?.state}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Contact:</span>
                    <span className="font-medium">{hostel.contactNumber}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Warden:</span>
                    <span className="font-medium">{hostel.wardenName}</span>
                  </div>
                </div>
              </div>

              {/* Capacity Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                  Capacity & Occupancy
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Capacity:</span>
                    <span className="font-medium">{hostel.totalCapacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Current Occupancy:</span>
                    <span className={`font-medium ${getOccupancyColor(hostel.currentOccupancy, hostel.totalCapacity)}`}>
                      {hostel.currentOccupancy}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Available Spots:</span>
                    <span className="font-medium text-green-600">{hostel.availableSpots}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Rooms:</span>
                    <span className="font-medium">{hostel.totalRooms}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities */}
            {hostel.amenities && hostel.amenities.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2 mb-4">
                  Amenities
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hostel.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <CheckCircle className={`w-4 h-4 ${amenity.available ? 'text-green-500' : 'text-red-500'}`} />
                      <span className="text-sm font-medium">{amenity.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fee Structure */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2 mb-4">
                Fee Structure
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Monthly Rent</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    ₹{hostel.monthlyRent?.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Security Deposit</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    ₹{hostel.securityDeposit?.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Maintenance Fee</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    ₹{hostel.maintenanceFee?.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setActiveTab('allocations');
                    fetchAllocations(hostel._id);
                  }}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>View Allocations</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('allocations');
                    // Global view across hostels
                    fetchAllocations(undefined);
                  }}
                  className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>All Allocations</span>
                </button>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span onClick={() => setShowAllocateModal(true)}>Allocate Room</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hostel Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage hostels and room allocations</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Hostel</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Hostels</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <Building className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Capacity</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">1,200</p>
            </div>
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Occupied</p>
              <p className="text-2xl font-bold text-yellow-600">850</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <HostelIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available</p>
              <p className="text-2xl font-bold text-green-600">350</p>
            </div>
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('hostels')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'hostels'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Hostels
            </button>
            <button
              onClick={() => setActiveTab('allocations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'allocations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Allocations
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'hostels' ? (
            <div className="space-y-6">
              {/* Filters */}
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
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Types</option>
                  <option value="Boys">Boys</option>
                  <option value="Girls">Girls</option>
                  <option value="Co-ed">Co-ed</option>
                </select>
                <button onClick={async () => { window.open('/api/erp/hostels/export?type=hostels&format=csv', '_blank'); }} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>

              {/* Hostels Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  [...Array(6)].map((_, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    </div>
                  ))
                ) : hostels.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                    No hostels found
                  </div>
                ) : (
                  hostels.map((hostel) => (
                    <div key={hostel._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Building className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{hostel.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{hostel.type}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedHostel(hostel);
                            setShowModal(true);
                          }}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Capacity:</span>
                          <span className="font-medium">{hostel.totalCapacity}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Occupied:</span>
                          <span className={`font-medium ${getOccupancyColor(hostel.currentOccupancy, hostel.totalCapacity)}`}>
                            {hostel.currentOccupancy}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Available:</span>
                          <span className="font-medium text-green-600">{hostel.availableSpots}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Monthly Rent:</span>
                          <span className="font-medium">₹{hostel.monthlyRent?.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button className="flex-1 bg-primary-600 text-white px-3 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm" onClick={() => { setSelectedHostel(hostel); setShowModal(true); }}>
                          View Details
                        </button>
                        <button className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm" onClick={() => { setSelectedHostel(hostel); setShowAllocateModal(true); }}>
                          Allocate
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Allocations will be shown here</p>
            </div>
          )}
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create Hostel</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500"><XCircle className="w-6 h-6" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm text-gray-600 dark:text-gray-300">Hostel Name</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" placeholder="e.g. Boys Hostel A" value={newHostel.name} onChange={e => setNewHostel({ ...newHostel, name: e.target.value })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Hostel Type</label>
              <select className="border rounded px-3 py-2 dark:bg-gray-700" value={newHostel.type} onChange={e => setNewHostel({ ...newHostel, type: e.target.value })}>
                <option>Boys</option>
                <option>Girls</option>
                <option>Co-ed</option>
              </select>
              <label className="text-sm text-gray-600 dark:text-gray-300">City</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" placeholder="e.g. Pune" value={newHostel.address.city} onChange={e => setNewHostel({ ...newHostel, address: { ...newHostel.address, city: e.target.value } })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">State</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" placeholder="e.g. Maharashtra" value={newHostel.address.state} onChange={e => setNewHostel({ ...newHostel, address: { ...newHostel.address, state: e.target.value } })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Contact Number (warden/office)</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" placeholder="e.g. +91-9876543210" value={newHostel.contactNumber} onChange={e => setNewHostel({ ...newHostel, contactNumber: e.target.value })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Warden Name</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" placeholder="e.g. Mr. Sharma" value={newHostel.wardenName} onChange={e => setNewHostel({ ...newHostel, wardenName: e.target.value })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Total Capacity (beds)</label>
              <input type="number" className="border rounded px-3 py-2 dark:bg-gray-700" placeholder="e.g. 120" value={newHostel.totalCapacity} onChange={e => setNewHostel({ ...newHostel, totalCapacity: Number(e.target.value) })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Total Rooms</label>
              <input type="number" className="border rounded px-3 py-2 dark:bg-gray-700" placeholder="e.g. 60" value={newHostel.totalRooms} onChange={e => setNewHostel({ ...newHostel, totalRooms: Number(e.target.value) })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Total Floors</label>
              <input type="number" className="border rounded px-3 py-2 dark:bg-gray-700" placeholder="e.g. 3" value={newHostel.totalFloors} onChange={e => setNewHostel({ ...newHostel, totalFloors: Number(e.target.value) })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Rooms Per Floor</label>
              <input type="number" className="border rounded px-3 py-2 dark:bg-gray-700" placeholder="e.g. 20" value={newHostel.roomsPerFloor} onChange={e => setNewHostel({ ...newHostel, roomsPerFloor: Number(e.target.value) })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Monthly Rent (₹)</label>
              <input type="number" className="border rounded px-3 py-2 dark:bg-gray-700" placeholder="e.g. 3500" value={newHostel.monthlyRent} onChange={e => setNewHostel({ ...newHostel, monthlyRent: Number(e.target.value) })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Security Deposit (₹)</label>
              <input type="number" className="border rounded px-3 py-2 dark:bg-gray-700" placeholder="e.g. 5000" value={newHostel.securityDeposit} onChange={e => setNewHostel({ ...newHostel, securityDeposit: Number(e.target.value) })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Maintenance Fee (₹)</label>
              <input type="number" className="border rounded px-3 py-2 dark:bg-gray-700" placeholder="e.g. 500" value={newHostel.maintenanceFee} onChange={e => setNewHostel({ ...newHostel, maintenanceFee: Number(e.target.value) })} />
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
              <button onClick={async () => {
                try {
                  // Basic validation for required fields
                  const requiredNumeric = ['totalRooms','totalCapacity','monthlyRent','securityDeposit'];
                  for (const key of requiredNumeric) {
                    if (!newHostel[key] || Number(newHostel[key]) <= 0) {
                      alert(`Please provide a valid ${key}`);
                      return;
                    }
                  }
                  await createHostel(newHostel);
                  setShowCreateModal(false);
                  fetchHostels();
                } catch (e) {
                  alert(e?.response?.data?.message || e.message || 'Failed to create hostel');
                }
              }} className="px-4 py-2 rounded bg-primary-600 text-white">Create</button>
            </div>
          </div>
        </div>
      )}
      {showAllocateModal && selectedHostel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Allocate Room - {selectedHostel.name}</h2>
              <button onClick={() => setShowAllocateModal(false)} className="text-gray-500"><XCircle className="w-6 h-6" /></button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <label className="text-sm text-gray-600 dark:text-gray-300">Student ID (PRN/unique student identifier)</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" placeholder="e.g. PRN2023XXXX" value={allocationForm.studentId} onChange={e => setAllocationForm({ ...allocationForm, studentId: e.target.value })} />
              <p className="text-xs text-gray-500">Admission will be auto-resolved from PRN</p>
              <label className="text-sm text-gray-600 dark:text-gray-300">Room Number (exact room like 204)</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" placeholder="e.g. 204" value={allocationForm.roomNumber} onChange={e => setAllocationForm({ ...allocationForm, roomNumber: e.target.value })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Floor Number</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" placeholder="e.g. 2" value={allocationForm.floorNumber} onChange={e => setAllocationForm({ ...allocationForm, floorNumber: e.target.value })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Check-in Date</label>
              <input type="date" className="border rounded px-3 py-2 dark:bg-gray-700" value={allocationForm.checkInDate} onChange={e => setAllocationForm({ ...allocationForm, checkInDate: e.target.value })} />
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button onClick={() => setShowAllocateModal(false)} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
              <button onClick={async () => { await allocateRoom(selectedHostel._id, allocationForm); setShowAllocateModal(false); fetchAllocations(selectedHostel._id); window.dispatchEvent(new Event('hostelAllocated')); }} className="px-4 py-2 rounded bg-green-600 text-white">Allocate</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
};

export default HostelManagementPage;
