import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import API from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import {
  UserPlus,
  DollarSign,
  Building,
  ClipboardList,
  Eye,
  Download,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Receipt,
  MapPin,
  Phone,
  Mail,
  BookOpen
} from 'lucide-react';

const StudentERPView = () => {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState({
    admission: null,
    fees: [],
    hostel: null,
    examinations: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFee, setSelectedFee] = useState(null);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [paying, setPaying] = useState(false);
  const [examFilter, setExamFilter] = useState('all');

  const buildFeeReceiptHtml = (fee) => {
    const rows = [];
    if (fee.tuitionFee > 0) rows.push({ label: 'Tuition Fee', amount: fee.tuitionFee });
    if (fee.libraryFee > 0) rows.push({ label: 'Library Fee', amount: fee.libraryFee });
    if (fee.laboratoryFee > 0) rows.push({ label: 'Laboratory Fee', amount: fee.laboratoryFee });
    if (fee.examinationFee > 0) rows.push({ label: 'Examination Fee', amount: fee.examinationFee });
    if (fee.hostelFee > 0) rows.push({ label: 'Hostel Fee', amount: fee.hostelFee });
    if (Array.isArray(fee.otherFees)) fee.otherFees.forEach(f => rows.push({ label: f.name, amount: f.amount }));

    const payments = Array.isArray(fee.payments) ? fee.payments : [];

    return `
      <html>
      <head>
        <title>Fee Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          h1 { margin: 0 0 8px; }
          .muted { color: #555; }
          .section { margin-top: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
          th { background: #f7f7f7; }
          .right { text-align: right; }
          .totals { margin-top: 12px; }
        </style>
      </head>
      <body>
        <h1>Fee Receipt</h1>
        <div class="muted">${fee.course} - ${fee.branch} | Semester ${fee.semester} | ${fee.academicYear}</div>
        <div class="section">
          <strong>Student:</strong> ${user?.name || ''} (${user?.email || ''})
        </div>
        <div class="section">
          <table>
            <thead><tr><th>Particulars</th><th class="right">Amount (₹)</th></tr></thead>
            <tbody>
              ${rows.map(r => `<tr><td>${r.label}</td><td class="right">${(r.amount||0).toLocaleString()}</td></tr>`).join('')}
            </tbody>
          </table>
          <div class="totals">
            <div><strong>Total:</strong> ₹${(fee.totalAmount||0).toLocaleString()}</div>
            <div><strong>Paid:</strong> ₹${(fee.paidAmount||0).toLocaleString()}</div>
            <div><strong>Pending:</strong> ₹${(fee.pendingAmount||0).toLocaleString()}</div>
          </div>
        </div>
        ${payments.length ? `
        <div class="section">
          <h3>Payments</h3>
          <table>
            <thead><tr><th>Date</th><th>Method</th><th class="right">Amount (₹)</th><th>Status</th></tr></thead>
            <tbody>
              ${payments.map(p => `<tr><td>${new Date(p.paymentDate).toLocaleDateString()}</td><td>${p.paymentMethod||''}</td><td class="right">${(p.amount||0).toLocaleString()}</td><td>${p.status||''}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>` : ''}
      </body>
      </html>`;
  };

  const buildHostelReceiptHtml = (hostel) => {
    const payments = Array.isArray(hostel.payments) ? hostel.payments : [];
    return `
      <html>
      <head>
        <title>Hostel Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          h1 { margin: 0 0 8px; }
          .muted { color: #555; }
          .section { margin-top: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
          th { background: #f7f7f7; }
          .right { text-align: right; }
          .totals { margin-top: 12px; }
        </style>
      </head>
      <body>
        <h1>Hostel Receipt</h1>
        <div class="muted">${hostel.name} (${hostel.type}) | Room ${hostel.roomNumber}, Floor ${hostel.floorNumber}</div>
        <div class="section">
          <strong>Student:</strong> ${user?.name || ''} (${user?.email || ''})
        </div>
        <div class="section">
          <table>
            <tbody>
              <tr><td>Monthly Rent</td><td class="right">₹${(hostel.monthlyRent||0).toLocaleString()}</td></tr>
              <tr><td>Security Deposit</td><td class="right">₹${(hostel.securityDeposit||0).toLocaleString()}</td></tr>
              ${hostel.maintenanceFee ? `<tr><td>Maintenance</td><td class="right">₹${(hostel.maintenanceFee||0).toLocaleString()}</td></tr>` : ''}
            </tbody>
          </table>
          <div class="totals">
            <div><strong>Total:</strong> ₹${(hostel.totalAmount||0).toLocaleString()}</div>
            <div><strong>Paid:</strong> ₹${(hostel.paidAmount||0).toLocaleString()}</div>
            <div><strong>Pending:</strong> ₹${(hostel.pendingAmount||0).toLocaleString()}</div>
          </div>
        </div>
        ${payments.length ? `
        <div class="section">
          <h3>Payments</h3>
          <table>
            <thead><tr><th>Date</th><th>Method</th><th class="right">Amount (₹)</th><th>Status</th></tr></thead>
            <tbody>
              ${payments.map(p => `<tr><td>${new Date(p.paymentDate).toLocaleDateString()}</td><td>${p.paymentMethod||''}</td><td class="right">${(p.amount||0).toLocaleString()}</td><td>${p.status||''}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>` : ''}
      </body>
      </html>`;
  };

  const printHtml = (html, filename = 'receipt.pdf') => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    // Fallback: trigger download via blob after print dialog (best-effort)
    try {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = win.document.createElement('a');
      a.href = url;
      a.download = filename;
      win.document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 0);
    } catch (_) {}
  };

  const handleDownloadReceipt = (feeId) => {
    const fee = (studentData.fees || []).find(f => f._id === feeId);
    if (!fee) return;
    const html = buildFeeReceiptHtml(fee);
    printHtml(html, 'fee-receipt.html');
  };

  const handleViewFee = (fee) => {
    setSelectedFee(fee);
    setShowFeeModal(true);
  };

  // hostel receipt handled by async variant below

  useEffect(() => {
    fetchStudentData();
  }, []);

  // Refresh student data after hostel allocation or fee payment events
  useEffect(() => {
    const handler = () => fetchStudentData();
    window.addEventListener('hostelAllocated', handler);
    window.addEventListener('feeUpdated', handler);
    return () => {
      window.removeEventListener('hostelAllocated', handler);
      window.removeEventListener('feeUpdated', handler);
    };
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      // Use authenticated student portal endpoints to get precise data for logged-in student
      const [profileRes, admissionRes, feesRes, upcomingExamsRes, hostelRes] = await Promise.all([
        API.get('/student/profile'),
        API.get('/student/admission').catch(() => ({ data: null })),
        API.get('/student/fees', { params: { page: 1, limit: 50 } }).catch(() => ({ data: { fees: [] } })),
        API.get('/student/exams/upcoming').catch(() => ({ data: [] })),
        API.get('/student/hostel').catch(err => {
          if (err?.response?.status === 404) return { data: null };
          throw err;
        })
      ]);

      // Normalize hostel allocation shape: include room/floor/dates and fees
      const allocation = hostelRes?.data || null;
      const hostelInfo = allocation && allocation.hostelId ? {
        ...allocation.hostelId,
        contactNumber: allocation.hostelId.contactNumber,
        monthlyRent: allocation.monthlyRent,
        securityDeposit: allocation.securityDeposit,
        roomNumber: allocation.roomNumber,
        floorNumber: allocation.floorNumber,
        allocationStatus: allocation.allocationStatus,
        allocationDate: allocation.allocationDate,
        checkInDate: allocation.checkInDate,
        checkOutDate: allocation.checkOutDate,
        maintenanceFee: allocation.maintenanceFee,
        totalAmount: allocation.totalAmount,
        paidAmount: allocation.paidAmount,
        pendingAmount: allocation.pendingAmount,
        payments: allocation.payments || []
      } : null;

      setStudentData({
        admission: admissionRes?.data || null,
        fees: feesRes?.data?.fees || [],
        hostel: hostelInfo,
        examinations: Array.isArray(upcomingExamsRes?.data) ? upcomingExamsRes.data : []
      });
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  // duplicate removed

  // removed duplicate handleDownloadReceipt variant

  const handlePayFee = async (fee) => {
    try {
      if (!fee?.pendingAmount || fee.pendingAmount <= 0) return;
      setPaying(true);
      const { data } = await API.post(`/student/fees/${fee._id}/pay`, {
        amount: fee.pendingAmount,
        paymentMethod: 'Online',
        transactionId: `TXN_${Date.now()}`,
        notes: 'Student portal payment'
      });
      window.dispatchEvent(new Event('feeUpdated'));
      setShowFeeModal(false);
      await fetchStudentData();
    } catch (e) {
      console.error('Payment failed', e);
    } finally {
      setPaying(false);
    }
  };

  const handleHostelPay = async () => {
    try {
      if (!studentData?.hostel || studentData.hostel.pendingAmount <= 0) return;
      setPaying(true);
      // Need allocation id; fetch allocation first
      const alloc = await API.get('/student/hostel');
      const allocId = alloc?.data?._id;
      if (!allocId) throw new Error('Allocation not found');
      await API.post(`/erp/hostels/allocations/${allocId}/pay`, {
        amount: alloc.data.pendingAmount,
        paymentMethod: 'Online',
        transactionId: `HTXN_${Date.now()}`,
        notes: 'Student portal hostel payment'
      });
      window.dispatchEvent(new Event('hostelAllocated'));
      await fetchStudentData();
    } catch (e) {
      console.error('Hostel payment failed', e);
    } finally {
      setPaying(false);
    }
  };

  const handleHostelReceipt = async () => {
    try {
      const alloc = await API.get('/student/hostel');
      const allocId = alloc?.data?._id;
      if (!allocId) return;
      
      // Request PDF format
      const response = await fetch(`http://localhost:4000/api/erp/hostels/allocations/${allocId}/receipt?format=pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download receipt');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hostel_receipt_${allocId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Hostel receipt download failed', e);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
      case 'Paid':
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Rejected':
      case 'Overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
      case 'Paid':
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      case 'Pending': return <Clock className="w-4 h-4" />;
      case 'Rejected':
      case 'Overdue': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            My Academic Information
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View your admission, fees, hostel, and examination details
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: <FileText className="w-4 h-4" /> },
                { id: 'admission', label: 'Admission', icon: <UserPlus className="w-4 h-4" /> },
                { id: 'fees', label: 'Fees', icon: <DollarSign className="w-4 h-4" /> },
                { id: 'hostel', label: 'Hostel', icon: <Building className="w-4 h-4" /> },
                { id: 'examinations', label: 'Examinations', icon: <ClipboardList className="w-4 h-4" /> },
                { id: 'library', label: 'Library', icon: <BookOpen className="w-4 h-4" /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Academic Overview
                </h2>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Admission Status</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {studentData.admission?.admissionStatus || 'Not Available'}
                        </p>
                      </div>
                      <UserPlus className="w-8 h-8 text-primary-600" />
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Fees</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          ₹{studentData.fees.reduce((sum, fee) => sum + (fee.totalAmount || 0), 0).toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Hostel Status</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {studentData.hostel ? 'Allocated' : 'Not Allocated'}
                        </p>
                      </div>
                      <Building className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming Exams</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {studentData.examinations.filter(exam => 
                            new Date(exam.examDate) > new Date() && exam.examStatus === 'Scheduled'
                          ).length}
                        </p>
                      </div>
                      <Calendar className="w-8 h-8 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'admission' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Admission Details
                </h2>
                
                {studentData.admission ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                        Personal Information
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <UserPlus className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Name:</span>
                          <span className="font-medium">{studentData.admission.firstName} {studentData.admission.lastName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                          <span className="font-medium">{studentData.admission.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Phone:</span>
                          <span className="font-medium">{studentData.admission.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">DOB:</span>
                          <span className="font-medium">{new Date(studentData.admission.dateOfBirth).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b pb-2">
                        Academic Information
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Course:</span>
                          <span className="font-medium ml-2">{studentData.admission.course}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Branch:</span>
                          <span className="font-medium ml-2">{studentData.admission.branch}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Semester:</span>
                          <span className="font-medium ml-2">{studentData.admission.semester}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Academic Year:</span>
                          <span className="font-medium ml-2">{studentData.admission.academicYear}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No admission data found</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'fees' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Fee Details
                </h2>
                
                {studentData.fees.length > 0 ? (
                  <div className="space-y-4">
                    {studentData.fees.map((fee, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {fee.course} - {fee.branch}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Semester {fee.semester} - {fee.academicYear}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(fee.feeStatus)}`}>
                            {getStatusIcon(fee.feeStatus)}
                            <span>{fee.feeStatus}</span>
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              ₹{fee.totalAmount?.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Paid Amount</p>
                            <p className="text-lg font-semibold text-green-600">
                              ₹{fee.paidAmount?.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Pending Amount</p>
                            <p className="text-lg font-semibold text-red-600">
                              ₹{fee.pendingAmount?.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex space-x-2">
                          <button onClick={() => handleDownloadReceipt(fee._id)} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2">
                            <Receipt className="w-4 h-4" />
                            <span>Download Receipt</span>
                          </button>
                          <button onClick={() => handleViewFee(fee)} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2">
                            <Eye className="w-4 h-4" />
                            <span>View Details</span>
                          </button>
                          {fee.pendingAmount > 0 && (
                            <button onClick={() => handlePayFee(fee)} disabled={paying} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors">
                              {paying ? 'Processing...' : 'Pay Now'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No fee data found</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'hostel' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Hostel Information
                </h2>
                
                {studentData.hostel ? (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {studentData.hostel.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {studentData.hostel.type} Hostel
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        Allocated
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Address:</span>
                          <span className="font-medium">{studentData.hostel.address?.city}, {studentData.hostel.address?.state}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Contact:</span>
                          <span className="font-medium">{studentData.hostel.contactNumber}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Rent:</span>
                          <span className="font-medium ml-2">₹{studentData.hostel.monthlyRent?.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Security Deposit:</span>
                          <span className="font-medium ml-2">₹{studentData.hostel.securityDeposit?.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Room:</span>
                          <span className="font-medium ml-2">{studentData.hostel.roomNumber} (Floor {studentData.hostel.floorNumber})</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                          <span className="font-medium ml-2">{studentData.hostel.allocationStatus}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Check-in:</span>
                          <span className="font-medium ml-2">{studentData.hostel.checkInDate ? new Date(studentData.hostel.checkInDate).toLocaleDateString() : '-'}</span>
                        </div>
                        {studentData.hostel.checkOutDate && (
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">Check-out:</span>
                            <span className="font-medium ml-2">{new Date(studentData.hostel.checkOutDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Allocation payments */}
                    <div className="mt-6">
                      <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Hostel Payments</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                          <p className="font-medium">₹{studentData.hostel.totalAmount?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Paid</p>
                          <p className="font-medium text-green-600">₹{studentData.hostel.paidAmount?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                          <p className="font-medium text-red-600">₹{studentData.hostel.pendingAmount?.toLocaleString()}</p>
                        </div>
                      </div>

                      {Array.isArray(studentData.hostel.payments) && studentData.hostel.payments.length > 0 && (
                        <div className="mt-4 overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600 text-sm">
                            <thead>
                              <tr>
                                <th className="px-3 py-2 text-left">Date</th>
                                <th className="px-3 py-2 text-left">Method</th>
                                <th className="px-3 py-2 text-left">Amount</th>
                                <th className="px-3 py-2 text-left">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {studentData.hostel.payments.map((p, i) => (
                                <tr key={i}>
                                  <td className="px-3 py-2">{new Date(p.paymentDate).toLocaleDateString()}</td>
                                  <td className="px-3 py-2">{p.paymentMethod}</td>
                                  <td className="px-3 py-2">₹{p.amount?.toLocaleString()}</td>
                                  <td className="px-3 py-2">{p.status}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      <div className="mt-4 flex space-x-2">
                        <button onClick={handleHostelReceipt} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">Download Receipt</button>
                        {studentData.hostel.pendingAmount > 0 && (
                          <button onClick={handleHostelPay} disabled={paying} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60">{paying ? 'Processing...' : `Pay ₹${studentData.hostel.pendingAmount?.toLocaleString()}`}</button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No hostel allocation found</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'examinations' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Examination Schedule
                </h2>
                <div className="flex space-x-2 mb-2">
                  {['all','ISE1','MSE','ISE2','ESE'].map(type => (
                    <button key={type} onClick={() => setExamFilter(type)} className={`px-3 py-1 rounded text-sm ${examFilter===type ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>
                      {type === 'all' ? 'All' : type}
                    </button>
                  ))}
                </div>
                
                {studentData.examinations.length > 0 ? (
                  <div className="space-y-4">
                    {studentData.examinations.filter(e => examFilter==='all' || e.examType===examFilter).map((exam, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {exam.examName}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {exam.subject} - {exam.examType}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(exam.examStatus)}`}>
                            {getStatusIcon(exam.examStatus)}
                            <span>{exam.examStatus}</span>
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                              <p className="font-medium">{new Date(exam.examDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Time</p>
                              <p className="font-medium">{exam.startTime} - {exam.endTime}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Venue</p>
                              <p className="font-medium">{exam.venue}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No examination data found</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'library' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Library Information
                </h2>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Library Access</h3>
                      <p className="text-blue-700 dark:text-blue-300">Browse books, check your issued books, and manage your library account</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Available Books</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Browse and search through the library catalog</p>
                      <button 
                        onClick={() => window.open('/student-library', '_blank')}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Browse Books
                      </button>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">My Books</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">View your currently issued books and due dates</p>
                      <button 
                        onClick={() => window.open('/student-library', '_blank')}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        My Library Account
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">Library Guidelines</p>
                        <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                          <li>• Maximum 5 books can be issued at a time</li>
                          <li>• Books are issued for 14 days and can be renewed up to 3 times</li>
                          <li>• Late return charges: ₹5 per day</li>
                          <li>• Contact librarian for book requests and renewals</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
    {showFeeModal && selectedFee && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Fee Details</h3>
            <button onClick={() => setShowFeeModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Course</p>
              <p className="font-medium">{selectedFee.course} - {selectedFee.branch}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Semester / Year</p>
              <p className="font-medium">Sem {selectedFee.semester} - {selectedFee.academicYear}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="font-medium">₹{selectedFee.totalAmount?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Paid</p>
              <p className="font-medium text-green-600">₹{selectedFee.paidAmount?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="font-medium text-red-600">₹{selectedFee.pendingAmount?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Due Date</p>
              <p className="font-medium">{selectedFee.dueDate ? new Date(selectedFee.dueDate).toLocaleDateString() : '-'}</p>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="text-md font-semibold mb-2">Fee Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {selectedFee.tuitionFee > 0 && (
                <div className="flex justify-between">
                  <span>Tuition Fee:</span>
                  <span>₹{selectedFee.tuitionFee?.toLocaleString()}</span>
                </div>
              )}
              {selectedFee.libraryFee > 0 && (
                <div className="flex justify-between">
                  <span>Library Fee:</span>
                  <span>₹{selectedFee.libraryFee?.toLocaleString()}</span>
                </div>
              )}
              {selectedFee.laboratoryFee > 0 && (
                <div className="flex justify-between">
                  <span>Laboratory Fee:</span>
                  <span>₹{selectedFee.laboratoryFee?.toLocaleString()}</span>
                </div>
              )}
              {selectedFee.examinationFee > 0 && (
                <div className="flex justify-between">
                  <span>Examination Fee:</span>
                  <span>₹{selectedFee.examinationFee?.toLocaleString()}</span>
                </div>
              )}
              {selectedFee.hostelFee > 0 && (
                <div className="flex justify-between">
                  <span>Hostel Fee:</span>
                  <span>₹{selectedFee.hostelFee?.toLocaleString()}</span>
                </div>
              )}
              {selectedFee.transportFee > 0 && (
                <div className="flex justify-between">
                  <span>Transport Fee:</span>
                  <span>₹{selectedFee.transportFee?.toLocaleString()}</span>
                </div>
              )}
              {Array.isArray(selectedFee.otherFees) && selectedFee.otherFees.length > 0 && (
                selectedFee.otherFees.map((f, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{f.name}:</span>
                    <span>₹{f.amount?.toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {Array.isArray(selectedFee.payments) && selectedFee.payments.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <h4 className="text-md font-semibold mb-2">Payments</h4>
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600 text-sm">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Method</th>
                    <th className="px-3 py-2 text-left">Amount</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {selectedFee.payments.map((p, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{new Date(p.paymentDate).toLocaleDateString()}</td>
                      <td className="px-3 py-2">{p.paymentMethod}</td>
                      <td className="px-3 py-2">₹{p.amount?.toLocaleString()}</td>
                      <td className="px-3 py-2">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-2">
            <button onClick={() => handleDownloadReceipt(selectedFee._id)} className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200">Download Receipt</button>
            {selectedFee.pendingAmount > 0 && (
              <button onClick={() => handlePayFee(selectedFee)} disabled={paying} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60">
                {paying ? 'Processing...' : `Pay ₹${selectedFee.pendingAmount?.toLocaleString()}`}
              </button>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default StudentERPView;
