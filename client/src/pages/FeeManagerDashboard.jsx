import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import DashboardLayout from '../components/DashboardLayout';
import {
  Activity,
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
  Calendar,
  BarChart3,
  PieChart,
  FileText
} from 'lucide-react';
import { downloadCSV } from '../utils/download';

const FeeManagerDashboard = () => {
  const { user } = useAuth();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedFee, setSelectedFee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'Online',
    transactionId: '',
    notes: ''
  });
  const [stats, setStats] = useState({
    totalFees: 0,
    collected: 0,
    pending: 0,
    overdue: 0
  });

  useEffect(() => {
    fetchFees();
    fetchStats();
  }, [currentPage, statusFilter, courseFilter]);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(courseFilter !== 'all' && { course: courseFilter })
      });

      const response = await fetch(`/api/erp/fees?${params}`);
      const data = await response.json();
      
      setFees(data.fees || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching fees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/erp/fees/stats/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      setStats({
        totalFees: data.totalFees?.totalAmount || 0,
        collected: data.totalFees?.paidAmount || 0,
        pending: data.totalFees?.pendingAmount || 0,
        overdue: data.totalFees?.overdueAmount || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handlePayment = async (feeId) => {
    try {
      const response = await fetch(`/api/erp/fees/${feeId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        setShowPaymentModal(false);
        setPaymentData({
          amount: '',
          paymentMethod: 'Online',
          transactionId: '',
          notes: ''
        });
        fetchFees();
        fetchStats();
      }
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  const generateReceipt = async (feeId) => {
    try {
      const response = await fetch(`/api/erp/fees/${feeId}/receipt`);
      const data = await response.json();
      
      // In a real application, you would generate and download a PDF
      console.log('Receipt data:', data);
      alert('Receipt generated successfully!');
    } catch (error) {
      console.error('Error generating receipt:', error);
    }
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

  return (
    <DashboardLayout role="fee_manager">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fee Management Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage student fees and payments efficiently</p>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => { fetchFees(); fetchStats(); }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <Activity className="w-4 h-4" />
                <span>Refresh Data</span>
              </button>
              <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Fee</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Fees"
            value={`₹${stats.totalFees.toLocaleString()}`}
            icon={<DollarSign className="w-6 h-6" />}
            color="bg-blue-500"
            subtitle="All time"
            trend="+12%"
          />
          <StatCard
            title="Collected"
            value={`₹${stats.collected.toLocaleString()}`}
            icon={<CheckCircle className="w-6 h-6" />}
            color="bg-green-500"
            subtitle={`${((stats.collected / stats.totalFees) * 100).toFixed(1)}% collection rate`}
            trend="+8%"
          />
          <StatCard
            title="Pending"
            value={`₹${stats.pending.toLocaleString()}`}
            icon={<Clock className="w-6 h-6" />}
            color="bg-yellow-500"
            subtitle="Outstanding amount"
            trend="-5%"
          />
          <StatCard
            title="Overdue"
            value={`₹${stats.overdue.toLocaleString()}`}
            icon={<AlertCircle className="w-6 h-6" />}
            color="bg-red-500"
            subtitle="Requires attention"
            trend="+2%"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button onClick={async () => {
              const token = localStorage.getItem('token') || '';
              const today = new Date();
              const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
              const end = new Date().toISOString();
              const qs = new URLSearchParams({ startDate: start, endDate: end }).toString();
              const res = await fetch(`/api/erp/fees/dashboard/stats?${qs}`, { headers: { Authorization: `Bearer ${token}` } });
              const data = await res.json();
              console.log('Fee Analytics (current month):', data);
              alert('Fee analytics refreshed for current month.');
            }} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <BarChart3 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <span className="text-sm font-medium">Generate Report</span>
            </button>
            <button onClick={async () => {
              const token = localStorage.getItem('token') || '';
              const res = await fetch('/api/erp/fees/stats/overview', { headers: { Authorization: `Bearer ${token}` } });
              const data = await res.json();
              console.log('Fee Analytics Overview:', data);
              alert('Analytics loaded (see console)');
            }} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <PieChart className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <span className="text-sm font-medium">Analytics</span>
            </button>
            <button onClick={async () => {
              const qs = new URLSearchParams({ format: 'csv' }).toString();
              await downloadCSV(`/api/erp/fees/export?${qs}`, 'fees.csv');
            }} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <FileText className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <span className="text-sm font-medium">Export Data</span>
            </button>
            <button onClick={() => {
              alert('Scheduling UI can be integrated here.');
            }} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Calendar className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <span className="text-sm font-medium">Schedule</span>
            </button>
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
            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
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
                              {fee.studentId}
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
      </div>
    </DashboardLayout>
  );
};

export default FeeManagerDashboard;
