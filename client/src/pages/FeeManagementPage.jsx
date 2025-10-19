import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import API from '../services/api';
import { downloadCSV } from '../utils/download';
import DashboardLayout from '../components/DashboardLayout';
import {
  DollarSign,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  CreditCard,
  Receipt,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react';

// Small helper to show student avatar/name/email
const StudentIdentity = ({ prn, admission, studentUser }) => {
  const avatar = studentUser?.avatarUrl;
  return (
    <div className="flex items-center space-x-3 mb-2">
      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
        {avatar ? (
          <img src={avatar.startsWith('http') ? avatar : `http://localhost:4000${avatar}`} alt="avatar" className="h-10 w-10 object-cover" onError={(e)=>{e.target.src='/logo192.png';}} />
        ) : (
          <Users className="h-5 w-5 text-gray-600" />
        )}
      </div>
      <div className="text-sm">
        <div className="font-medium">{admission?.firstName} {admission?.lastName}</div>
        <div className="text-gray-500">{studentUser?.email || admission?.email}</div>
      </div>
    </div>
  );
};

const FeeManagementPage = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedFee, setSelectedFee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newFee, setNewFee] = useState({
    studentId: '', course: '', branch: '', semester: '', academicYear: '',
    tuitionFee: 0, libraryFee: 0, laboratoryFee: 0, examinationFee: 0
  });
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'Online',
    transactionId: '',
    notes: ''
  });

  useEffect(() => {
    fetchFees();
  }, [currentPage, statusFilter, courseFilter, branchFilter, yearFilter, searchTerm]);

  const fetchFees = async () => {
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

      const { data } = await API.get('/erp/fees', { params: Object.fromEntries(params) });
      
      setFees(data.fees || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching fees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (feeId) => {
    try {
      await API.post(`/erp/fees/${feeId}/payment`, paymentData);
        setShowPaymentModal(false);
        setPaymentData({
          amount: '',
          paymentMethod: 'Online',
          transactionId: '',
          notes: ''
        });
        fetchFees();
        // Notify student portal view to refresh if open
        window.dispatchEvent(new Event('feeUpdated'));
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  const generateReceipt = async (feeId) => {
    try {
      const { data } = await API.get(`/erp/fees/${feeId}/receipt`);
      
      // In a real application, you would generate and download a PDF
      console.log('Receipt data:', data);
      alert('Receipt generated successfully!');
    } catch (error) {
      console.error('Error generating receipt:', error);
    }
  };

  const createFee = async () => {
    try {
      const totalAmount = Number(newFee.tuitionFee) + Number(newFee.libraryFee) + Number(newFee.laboratoryFee) + Number(newFee.examinationFee);
      const payload = { ...newFee, totalAmount };
      await API.post('/erp/fees', payload);
      setShowCreateModal(false);
      fetchFees();
    } catch (e) { alert(e.message); }
  };

  const downloadFeeTemplate = () => {
    const rows = [
      { studentId: 'PRN2023XXXX', course: 'B.Tech', branch: 'CSE', semester: 1, academicYear: '2025', tuitionFee: 50000, libraryFee: 1000, laboratoryFee: 2000, examinationFee: 1500 }
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fees');
    XLSX.writeFile(wb, 'fees_template.xlsx');
  };

  const handleFeeExcelUpload = async (file) => {
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws);
      // Build a PRN -> admission map for the sheet to avoid N requests
      const prns = json.map(r => r.studentId || r.PRN || r.prn).filter(Boolean);
      const uniquePrns = Array.from(new Set(prns));
      const { data: approvedList } = await API.get('/erp/admissions', { params: { page: 1, limit: 10000, status: 'Approved' } });
      const admissionsArr = approvedList.admissions || [];
      const prnToAdmission = new Map(admissionsArr.filter(a => uniquePrns.includes(a.studentId)).map(a => [a.studentId, a]));

      for (const row of json) {
        const prn = row.studentId || row.PRN || row.prn;
        if (!prn) continue;
        const admission = prnToAdmission.get(prn);
        if (!admission) continue;
        const totalAmount = Number(row.tuitionFee||0) + Number(row.libraryFee||0) + Number(row.laboratoryFee||0) + Number(row.examinationFee||0);
        const payload = {
          studentId: prn,
          admissionId: admission._id,
          academicYear: row.academicYear || admission.academicYear,
          semester: Number(row.semester || admission.semester),
          course: row.course || admission.course,
          branch: row.branch || admission.branch,
          tuitionFee: Number(row.tuitionFee||0),
          libraryFee: Number(row.libraryFee||0),
          laboratoryFee: Number(row.laboratoryFee||0),
          examinationFee: Number(row.examinationFee||0),
          totalAmount,
          dueDate: row.dueDate ? new Date(row.dueDate).toISOString() : new Date(Date.now() + 30*24*60*60*1000).toISOString()
        };
        await API.post('/erp/fees', payload);
      }
      fetchFees();
      alert('Fees uploaded successfully');
    } catch (e) { console.error(e); alert('Failed to upload fees'); }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Partial': return 'bg-yellow-100 text-yellow-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Paid': return <CheckCircle className="w-4 h-4" />;
      case 'Partial': return <Clock className="w-4 h-4" />;
      case 'Overdue': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const FeeModal = ({ fee, onClose }) => {
    if (!fee) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Fee Details
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Student Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                  Student Information
                </h3>
                <div className="space-y-2">
                  <StudentIdentity prn={fee.studentId} admission={fee.admissionId} studentUser={fee.studentUser} />
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Student ID:</span>
                    <span className="font-medium ml-2">{fee.studentId}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Name:</span>
                    <span className="font-medium ml-2">{fee.admissionId?.firstName} {fee.admissionId?.lastName}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="font-medium ml-2">{fee.admissionId?.email}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Course:</span>
                    <span className="font-medium ml-2">{fee.course} - {fee.branch}</span>
                  </div>
                </div>
              </div>

              {/* Fee Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                  Fee Information
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Tuition Fee:</span>
                    <span className="font-medium">₹{fee.tuitionFee?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Library Fee:</span>
                    <span className="font-medium">₹{fee.libraryFee?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Laboratory Fee:</span>
                    <span className="font-medium">₹{fee.laboratoryFee?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Examination Fee:</span>
                    <span className="font-medium">₹{fee.examinationFee?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span className="text-gray-900 dark:text-white">Total Amount:</span>
                    <span className="text-gray-900 dark:text-white">₹{fee.totalAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span className="text-sm">Paid Amount:</span>
                    <span className="font-medium">₹{fee.paidAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span className="text-sm">Pending Amount:</span>
                    <span className="font-medium">₹{fee.pendingAmount?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment History */}
            {fee.payments && fee.payments.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2 mb-4">
                  Payment History
                </h3>
                <div className="space-y-2">
                  {fee.payments.map((payment, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <span className="font-medium">₹{payment.amount?.toLocaleString()}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                          via {payment.paymentMethod}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setSelectedFee(fee);
                    setShowPaymentModal(true);
                  }}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Record Payment</span>
                </button>
                <button
                  onClick={() => generateReceipt(fee._id)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Generate Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PaymentModal = ({ onClose }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Record Payment
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="Online">Online</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transaction ID
                </label>
                <input
                  type="text"
                  value={paymentData.transactionId}
                  onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter transaction ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows="3"
                  placeholder="Enter notes"
                />
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => handlePayment(selectedFee?._id)}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Record Payment
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const EditFeeModal = ({ fee, onClose }) => {
    const [form, setForm] = useState({
      tuitionFee: fee.tuitionFee || 0,
      libraryFee: fee.libraryFee || 0,
      laboratoryFee: fee.laboratoryFee || 0,
      examinationFee: fee.examinationFee || 0,
      course: fee.course || '',
      branch: fee.branch || '',
      semester: fee.semester || 1,
      academicYear: fee.academicYear || ''
    });
    const save = async () => {
      try {
        const totalAmount = Number(form.tuitionFee)||0 + Number(form.libraryFee)||0 + Number(form.laboratoryFee)||0 + Number(form.examinationFee)||0;
        await API.put(`/erp/fees/${fee._id}`, { ...form, totalAmount });
        onClose();
      } catch (e) { alert('Failed to update fee'); }
    };
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Fee</h2>
              <button onClick={onClose} className="text-gray-500"><XCircle className="w-6 h-6" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm text-gray-600 dark:text-gray-300">Course</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={form.course} onChange={e=>setForm({...form, course:e.target.value})} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Branch</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={form.branch} onChange={e=>setForm({...form, branch:e.target.value})} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Semester</label>
              <input type="number" className="border rounded px-3 py-2 dark:bg-gray-700" value={form.semester} onChange={e=>setForm({...form, semester:Number(e.target.value)})} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Academic Year</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={form.academicYear} onChange={e=>setForm({...form, academicYear:e.target.value})} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Tuition Fee</label>
              <input type="number" className="border rounded px-3 py-2 dark:bg-gray-700" value={form.tuitionFee} onChange={e=>setForm({...form, tuitionFee:Number(e.target.value)})} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Library Fee</label>
              <input type="number" className="border rounded px-3 py-2 dark:bg-gray-700" value={form.libraryFee} onChange={e=>setForm({...form, libraryFee:Number(e.target.value)})} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Laboratory Fee</label>
              <input type="number" className="border rounded px-3 py-2 dark:bg-gray-700" value={form.laboratoryFee} onChange={e=>setForm({...form, laboratoryFee:Number(e.target.value)})} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Examination Fee</label>
              <input type="number" className="border rounded px-3 py-2 dark:bg-gray-700" value={form.examinationFee} onChange={e=>setForm({...form, examinationFee:Number(e.target.value)})} />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
              <button onClick={save} className="px-4 py-2 rounded bg-primary-600 text-white">Save</button>
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fee Management</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage student fees and payments</p>
          </div>
          <div className="flex items-center gap-2">
          <button onClick={() => setShowCreateModal(true)} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Fee</span>
          </button>
          <button onClick={() => downloadCSV('/api/erp/fees/export?format=csv', 'fees.csv')} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Fees</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹2,45,000</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Collected</p>
              <p className="text-2xl font-bold text-green-600">₹1,85,000</p>
            </div>
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">₹60,000</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
              <p className="text-2xl font-bold text-red-600">₹15,000</p>
            </div>
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
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
              placeholder="Search fees..."
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
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
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
            <button onClick={() => downloadCSV('/api/erp/fees/export?format=csv', 'fees.csv')} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <input id="feeExcel" type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => e.target.files && handleFeeExcelUpload(e.target.files[0])} />
            <button onClick={() => document.getElementById('feeExcel').click()} className="px-4 py-2 rounded-lg border">Upload Excel</button>
            <button onClick={downloadFeeTemplate} className="px-4 py-2 rounded-lg border">Sample Excel</button>
          </div>
        </div>
      </div>

      {/* Fees Table */}
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
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Paid Amount
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
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : fees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No fees found
                  </td>
                </tr>
              ) : (
                fees.map((fee) => (
                  <tr key={fee._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {fee.admissionId?.firstName} {fee.admissionId?.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {fee.studentUser?.email || fee.studentId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{fee.course}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{fee.branch}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ₹{fee.totalAmount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      ₹{fee.paidAmount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center space-x-1 w-fit ${getStatusColor(fee.feeStatus)}`}>
                        {getStatusIcon(fee.feeStatus)}
                        <span>{fee.feeStatus}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedFee(fee);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setSelectedFee(fee); setShowEditModal(true); }} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300">
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

      {/* Modals */}
      {showModal && (
        <FeeModal
          fee={selectedFee}
          onClose={() => {
            setShowModal(false);
            setSelectedFee(null);
          }}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedFee(null);
          }}
        />
      )}
      {showEditModal && selectedFee && (
        <EditFeeModal fee={selectedFee} onClose={() => { setShowEditModal(false); setSelectedFee(null); fetchFees(); }} />
      )}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create Fee</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500"><XCircle className="w-6 h-6" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm text-gray-600 dark:text-gray-300">Student ID (PRN)</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={newFee.studentId} onChange={e => setNewFee({ ...newFee, studentId: e.target.value })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Course</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={newFee.course} onChange={e => setNewFee({ ...newFee, course: e.target.value })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Branch</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={newFee.branch} onChange={e => setNewFee({ ...newFee, branch: e.target.value })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Semester</label>
              <input type="number" className="border rounded px-3 py-2 dark:bg-gray-700" value={newFee.semester} onChange={e => setNewFee({ ...newFee, semester: Number(e.target.value) })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Academic Year</label>
              <input className="border rounded px-3 py-2 dark:bg-gray-700" value={newFee.academicYear} onChange={e => setNewFee({ ...newFee, academicYear: e.target.value })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Tuition Fee (₹)</label>
              <input type="number" className="border rounded px-3 py-2 dark:bg-gray-700" value={newFee.tuitionFee} onChange={e => setNewFee({ ...newFee, tuitionFee: Number(e.target.value) })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Library Fee (₹)</label>
              <input type="number" className="border rounded px-3 py-2 dark:bg-gray-700" value={newFee.libraryFee} onChange={e => setNewFee({ ...newFee, libraryFee: Number(e.target.value) })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Laboratory Fee (₹)</label>
              <input type="number" className="border rounded px-3 py-2 dark:bg-gray-700" value={newFee.laboratoryFee} onChange={e => setNewFee({ ...newFee, laboratoryFee: Number(e.target.value) })} />
              <label className="text-sm text-gray-600 dark:text-gray-300">Examination Fee (₹)</label>
              <input type="number" className="border rounded px-3 py-2 dark:bg-gray-700" value={newFee.examinationFee} onChange={e => setNewFee({ ...newFee, examinationFee: Number(e.target.value) })} />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
              <button onClick={createFee} className="px-4 py-2 rounded bg-primary-600 text-white">Create</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
};

export default FeeManagementPage;
