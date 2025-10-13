import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import API from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import {
  UserPlus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  FileText,
  Mail,
  Phone,
  Calendar,
  MapPin
} from 'lucide-react';

const AdmissionsPage = () => {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditAdmission, setShowEditAdmission] = useState(false);
  const [newAdmission, setNewAdmission] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'Male',
    address: { street: '', city: '', state: '', pincode: '', country: '' },
    course: '',
    branch: '',
    semester: '',
    academicYear: ''
  });

  const createAdmission = async () => {
    try {
      await API.post('/erp/admissions', newAdmission);
      setShowCreateModal(false);
      setNewAdmission({
        studentId: '', firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '',
        address: { city: '', state: '' }, course: '', branch: '', semester: '', academicYear: ''
      });
      fetchAdmissions();
    } catch (e) {
      alert(e.message);
    }
  };

  const EditAdmissionModal = ({ admission, onClose }) => {
    const [form, setForm] = useState({
      firstName: admission.firstName,
      lastName: admission.lastName,
      email: admission.email,
      phone: admission.phone,
      dateOfBirth: admission.dateOfBirth ? new Date(admission.dateOfBirth).toISOString().slice(0,10) : '',
      course: admission.course,
      branch: admission.branch,
      semester: admission.semester,
      academicYear: admission.academicYear,
      address: admission.address || { city:'', state:'' }
    });
    const save = async () => {
      try {
        await API.put(`/erp/admissions/${admission._id}`, { ...form, dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth) : undefined });
        onClose();
        fetchAdmissions();
      } catch (e) { alert('Failed to update admission'); }
    };
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Edit Admission</h2>
            <button onClick={onClose} className="text-gray-500"><XCircle className="w-6 h-6" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm text-gray-600 dark:text-gray-300">First Name</label>
            <input className="border rounded px-3 py-2 dark:bg-gray-700" value={form.firstName} onChange={e=>setForm({...form, firstName:e.target.value})} />
            <label className="text-sm text-gray-600 dark:text-gray-300">Last Name</label>
            <input className="border rounded px-3 py-2 dark:bg-gray-700" value={form.lastName} onChange={e=>setForm({...form, lastName:e.target.value})} />
            <label className="text-sm text-gray-600 dark:text-gray-300">Email</label>
            <input className="border rounded px-3 py-2 dark:bg-gray-700" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
            <label className="text-sm text-gray-600 dark:text-gray-300">Phone</label>
            <input className="border rounded px-3 py-2 dark:bg-gray-700" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} />
            <label className="text-sm text-gray-600 dark:text-gray-300">Date of Birth</label>
            <input type="date" className="border rounded px-3 py-2 dark:bg-gray-700" value={form.dateOfBirth} onChange={e=>setForm({...form, dateOfBirth:e.target.value})} />
            <label className="text-sm text-gray-600 dark:text-gray-300">Course</label>
            <input className="border rounded px-3 py-2 dark:bg-gray-700" value={form.course} onChange={e=>setForm({...form, course:e.target.value})} />
            <label className="text-sm text-gray-600 dark:text-gray-300">Branch</label>
            <input className="border rounded px-3 py-2 dark:bg-gray-700" value={form.branch} onChange={e=>setForm({...form, branch:e.target.value})} />
            <label className="text-sm text-gray-600 dark:text-gray-300">Semester</label>
            <input type="number" className="border rounded px-3 py-2 dark:bg-gray-700" value={form.semester} onChange={e=>setForm({...form, semester:Number(e.target.value)})} />
            <label className="text-sm text-gray-600 dark:text-gray-300">Academic Year</label>
            <input className="border rounded px-3 py-2 dark:bg-gray-700" value={form.academicYear} onChange={e=>setForm({...form, academicYear:e.target.value})} />
            <label className="text-sm text-gray-600 dark:text-gray-300">City</label>
            <input className="border rounded px-3 py-2 dark:bg-gray-700" value={form.address.city} onChange={e=>setForm({...form, address:{...form.address, city:e.target.value}})} />
            <label className="text-sm text-gray-600 dark:text-gray-300">State</label>
            <input className="border rounded px-3 py-2 dark:bg-gray-700" value={form.address.state} onChange={e=>setForm({...form, address:{...form.address, state:e.target.value}})} />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
            <button onClick={save} className="px-4 py-2 rounded bg-primary-600 text-white">Save</button>
          </div>
        </div>
      </div>
    );
  };

  const downloadAdmissionTemplate = () => {
    const rows = [
      { studentId: 'PRN2023XXXX', firstName: 'Amit', lastName: 'Patil', email: 'amit@example.com', phone: '9876543210', dateOfBirth: '2003-05-10', gender: 'Male', street: 'MG Road', city: 'Pune', state: 'MH', pincode: '411001', country: 'India', course: 'B.Tech', branch: 'CSE', semester: 1, academicYear: '2025' }
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Admissions');
    XLSX.writeFile(wb, 'admissions_template.xlsx');
  };

  const handleAdmissionExcelUpload = async (file) => {
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws);
      for (const row of json) {
        const payload = {
          studentId: row.studentId,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          phone: row.phone,
          dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth).toISOString() : undefined,
          gender: row.gender || 'Other',
          address: { street: row.street || '', city: row.city, state: row.state, pincode: row.pincode || '', country: row.country || '' },
          course: row.course,
          branch: row.branch,
          semester: Number(row.semester),
          academicYear: row.academicYear
        };
        const { data: created } = await API.post('/erp/admissions', { ...payload, autoCreateStudent: true });
        // Immediately approve and create student user with default password (requires role)
        try {
          await API.patch(`/erp/admissions/${created._id || created.id}/review`, { status: 'Approved', notes: 'Auto-approved via Excel upload' });
          await API.post(`/erp/admissions/${created._id || created.id}/create-student`);
        } catch (e) {
          // If current user lacks permission, skip silently for the upload; can be approved later by admin
          console.warn('Auto-approve/create-student skipped:', e?.response?.status);
        }
      }
      fetchAdmissions();
      alert('Admissions uploaded successfully');
    } catch (e) {
      console.error(e);
      alert('Failed to upload admissions');
    }
  };

  useEffect(() => {
    fetchAdmissions();
  }, [currentPage, statusFilter, courseFilter, branchFilter, yearFilter, searchTerm]);

  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(courseFilter !== 'all' && { course: courseFilter }),
        ...(branchFilter !== 'all' && { branch: branchFilter }),
        ...(yearFilter !== 'all' && { academicYear: yearFilter }),
        ...(searchTerm && { q: searchTerm })
      });

      const { data } = await API.get('/erp/admissions', { params: Object.fromEntries(params) });
      
      setAdmissions(data.admissions || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching admissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (admissionId, newStatus) => {
    try {
      await API.patch(`/erp/admissions/${admissionId}/review`, { status: newStatus, notes: `Status changed to ${newStatus}` });
        fetchAdmissions();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Under Review': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="w-4 h-4" />;
      case 'Rejected': return <XCircle className="w-4 h-4" />;
      case 'Under Review': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const AdmissionModal = ({ admission, onClose }) => {
    const [avatar, setAvatar] = useState('');

    useEffect(() => {
      if (!admission) return;
      const run = async () => {
        try {
          const { data } = await API.get('/users/lookup', { params: { email: admission.email, prn: admission.studentId } });
          setAvatar(data.avatarUrl || '');
        } catch (e) {
          // ignore
        }
      };
      run();
    }, [admission]);

    if (!admission) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Admission Details
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                  Personal Information
                </h3>
                <div className="space-y-2">
                  {avatar && (
                    <div className="flex items-center space-x-3 mb-2">
                      <img src={avatar} alt="avatar" className="h-10 w-10 rounded-full object-cover" />
                      <span className="text-sm text-gray-500">Profile Photo</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <UserPlus className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Student ID (PRN):</span>
                    <span className="font-medium">{admission.studentId}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <UserPlus className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Name:</span>
                    <span className="font-medium">{admission.firstName} {admission.lastName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="font-medium">{admission.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Phone:</span>
                    <span className="font-medium">{admission.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">DOB:</span>
                    <span className="font-medium">{new Date(admission.dateOfBirth).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Address:</span>
                    <span className="font-medium">{admission.address?.city}, {admission.address?.state}</span>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                  Academic Information
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Course:</span>
                    <span className="font-medium ml-2">{admission.course}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Branch:</span>
                    <span className="font-medium ml-2">{admission.branch}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Semester:</span>
                    <span className="font-medium ml-2">{admission.semester}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Academic Year:</span>
                    <span className="font-medium ml-2">{admission.academicYear}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status and Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(admission.admissionStatus)}`}>
                    {getStatusIcon(admission.admissionStatus)}
                    <span>{admission.admissionStatus}</span>
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleStatusChange(admission._id, 'Approved')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusChange(admission._id, 'Rejected')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                </div>
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admissions Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage student admissions and applications</p>
          </div>
          <div className="flex items-center gap-2">
          <button onClick={() => setShowCreateModal(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Admission</span>
          </button>
          <button onClick={() => window.open('/api/erp/admissions/export?format=csv', '_blank')} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search admissions..."
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
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Under Review">Under Review</option>
          </select>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Courses</option>
            <option value="B.Tech">B.Tech</option>
            <option value="M.Tech">M.Tech</option>
            <option value="BBA">BBA</option>
            <option value="MBA">MBA</option>
          </select>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Branches</option>
            <option value="CSE">CSE</option>
            <option value="CSBS">CSBS</option>
            <option value="ECE">ECE</option>
          </select>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="all">All Years</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
          <div className="flex items-center gap-2">
            <button onClick={() => window.open('/api/erp/admissions/export?format=csv', '_blank')} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <input id="admissionExcel" type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => e.target.files && handleAdmissionExcelUpload(e.target.files[0])} />
            <button onClick={() => document.getElementById('admissionExcel').click()} className="px-4 py-2 rounded-lg border">Upload Excel</button>
            <button onClick={downloadAdmissionTemplate} className="px-4 py-2 rounded-lg border">Sample Excel</button>
          </div>
        </div>
      </div>

      {/* Admissions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Applied Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : admissions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No admissions found
                  </td>
                </tr>
              ) : (
                admissions.map((admission) => (
                  <tr key={admission._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {admission.firstName} {admission.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {admission.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{admission.course}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{admission.branch}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1 w-fit ${getStatusColor(admission.admissionStatus)}`}>
                        {getStatusIcon(admission.admissionStatus)}
                        <span>{admission.admissionStatus}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(admission.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedAdmission(admission);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={()=>{setSelectedAdmission(admission); setShowCreateModal(false); setShowModal(false); setShowEditAdmission?.(true);}} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <AdmissionModal
          admission={selectedAdmission}
          onClose={() => {
            setShowModal(false);
            setSelectedAdmission(null);
          }}
        />
      )}
      {showEditAdmission && selectedAdmission && (
        <EditAdmissionModal admission={selectedAdmission} onClose={()=>{ setShowEditAdmission(false); setSelectedAdmission(null); }} />
      )}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">New Admission</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500"><XCircle className="w-6 h-6" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm text-gray-600 dark:text-gray-300">Student ID (PRN)</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={newAdmission.studentId} onChange={e => setNewAdmission({ ...newAdmission, studentId: e.target.value })} placeholder="PRN2023XXXX" />
              <label className="text-sm text-gray-600 dark:text-gray-300">First Name</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={newAdmission.firstName} onChange={e => setNewAdmission({ ...newAdmission, firstName: e.target.value })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Last Name</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={newAdmission.lastName} onChange={e => setNewAdmission({ ...newAdmission, lastName: e.target.value })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Email</label>
              <input type="email" className="border rounded px-3 py-2 dark:bg-gray-700" value={newAdmission.email} onChange={e => setNewAdmission({ ...newAdmission, email: e.target.value })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Phone</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={newAdmission.phone} onChange={e => setNewAdmission({ ...newAdmission, phone: e.target.value })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Date of Birth</label>
              <input type="date" className="border rounded px-3 py-2 dark:bg-gray-700" value={newAdmission.dateOfBirth} onChange={e => setNewAdmission({ ...newAdmission, dateOfBirth: e.target.value })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Gender</label>
              <select className="border rounded px-3 py-2 dark:bg-gray-700" value={newAdmission.gender} onChange={e => setNewAdmission({ ...newAdmission, gender: e.target.value })}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
              <label className="text-sm text-gray-600 dark:text-gray-300">Street</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={newAdmission.address.street} onChange={e => setNewAdmission({ ...newAdmission, address: { ...newAdmission.address, street: e.target.value } })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">City</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={newAdmission.address.city} onChange={e => setNewAdmission({ ...newAdmission, address: { ...newAdmission.address, city: e.target.value } })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">State</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={newAdmission.address.state} onChange={e => setNewAdmission({ ...newAdmission, address: { ...newAdmission.address, state: e.target.value } })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Pincode</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={newAdmission.address.pincode} onChange={e => setNewAdmission({ ...newAdmission, address: { ...newAdmission.address, pincode: e.target.value } })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Country</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={newAdmission.address.country} onChange={e => setNewAdmission({ ...newAdmission, address: { ...newAdmission.address, country: e.target.value } })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Course</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={newAdmission.course} onChange={e => setNewAdmission({ ...newAdmission, course: e.target.value })} placeholder="B.Tech" />
              <label className="text-sm text-gray-600 dark:text-gray-300">Branch</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={newAdmission.branch} onChange={e => setNewAdmission({ ...newAdmission, branch: e.target.value })} placeholder="CSE" />
              <label className="text-sm text-gray-600 dark:text-gray-300">Semester</label>
              <input type="number" className="border rounded px-3 py-2 dark:bg-gray-700" value={newAdmission.semester} onChange={e => setNewAdmission({ ...newAdmission, semester: Number(e.target.value) })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Academic Year</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={newAdmission.academicYear} onChange={e => setNewAdmission({ ...newAdmission, academicYear: e.target.value })} placeholder="2025" />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
              <button onClick={createAdmission} className="px-4 py-2 rounded bg-primary-600 text-white">Create</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
};

export default AdmissionsPage;
