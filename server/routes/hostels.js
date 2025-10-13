const express = require('express');
const router = express.Router();
const Hostel = require('../models/Hostel');
const HostelAllocation = require('../models/HostelAllocation');
const Room = require('../models/Room');
const User = require('../models/User');
const FinancialTransaction = require('../models/FinancialTransaction');
let PDFDocument;
try {
  PDFDocument = require('pdfkit');
} catch (e) {
  console.warn('PDFKit not available, PDF receipts disabled');
}
const { auth } = require('../middleware/auth');

// Get all hostels
router.get('/', auth, async (req, res) => {
  try {
    const hostels = await Hostel.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(hostels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get hostel by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!hostel) {
      return res.status(404).json({ message: 'Hostel not found' });
    }

    res.json(hostel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new hostel
router.post('/', auth, async (req, res) => {
  try {
    const allowedRoles = ['admin', 'hostel_manager', 'registrar', 'accountant', 'admission_officer'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to create hostels' });
    }

    const hostelData = {
      ...req.body,
      createdBy: req.user.id
    };

    // Validate minimal required fields to avoid 400 due to model requirements
    const required = ['name','type','totalRooms','totalCapacity','monthlyRent','securityDeposit'];
    const missing = required.filter(k => hostelData[k] === undefined || hostelData[k] === null || hostelData[k] === '' || Number.isNaN(Number(hostelData[k])) && ['totalRooms','totalCapacity','monthlyRent','securityDeposit'].includes(k));
    if (missing.length > 0) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(', ')}` });
    }

    const hostel = new Hostel(hostelData);
    await hostel.save();

    res.status(201).json(hostel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update hostel
router.put('/:id', auth, async (req, res) => {
  try {
    if (!['admin', 'hostel_manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) {
      return res.status(404).json({ message: 'Hostel not found' });
    }

    Object.assign(hostel, req.body);
    await hostel.save();

    res.json(hostel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get hostel allocations (global, filterable)
router.get('/allocations', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, hostelId, studentId, search, from, to } = req.query;

    const filter = {};
    if (status) filter.allocationStatus = status;
    if (hostelId) filter.hostelId = hostelId;
    if (studentId) filter.studentId = studentId;
    if (from || to) {
      filter.checkInDate = {};
      if (from) filter.checkInDate.$gte = new Date(from);
      if (to) filter.checkInDate.$lte = new Date(to);
    }

    // Text search on student or hostel name via populated fields
    const query = HostelAllocation.find(filter)
      .populate('admissionId', 'firstName lastName email phone')
      .populate('hostelId', 'name type')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const [allocations, total] = await Promise.all([
      query.exec().catch(() => []),
      HostelAllocation.countDocuments(filter).catch(() => 0)
    ]);

    // Optional in-memory fuzzy filter when search provided
    const filtered = search
      ? allocations.filter(a => {
          const name = `${a?.admissionId?.firstName || ''} ${a?.admissionId?.lastName || ''}`.toLowerCase();
          const email = (a?.admissionId?.email || '').toLowerCase();
          const prn = (a?.studentId || '').toLowerCase();
          const hostelName = (a?.hostelId?.name || '').toLowerCase();
          const term = String(search).toLowerCase();
          return name.includes(term) || email.includes(term) || prn.includes(term) || hostelName.includes(term);
        })
      : allocations;

    res.json({
      allocations: filtered || [],
      totalPages: Math.ceil((total || 0) / limit),
      currentPage: parseInt(page),
      total: total || 0
    });
  } catch (error) {
    console.error('Error fetching allocations:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch allocations' });
  }
});

// Get hostel allocations (per-hostel)
router.get('/:id/allocations', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { hostelId: req.params.id };
    
    if (status) filter.allocationStatus = status;

    const allocations = await HostelAllocation.find(filter)
      .populate('admissionId', 'firstName lastName email phone')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await HostelAllocation.countDocuments(filter);

    res.json({
      allocations,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get latest allocation by student PRN
router.get('/allocations/by-student/:studentId', auth, async (req, res) => {
  try {
    const allocation = await HostelAllocation.findOne({ studentId: req.params.studentId })
      .populate('hostelId', 'name type address contactNumber wardenName wardenPhone')
      .sort({ createdAt: -1 });
    if (!allocation) {
      return res.status(404).json({ message: 'No hostel allocation found' });
    }
    res.json(allocation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Allocate hostel to student
router.post('/:id/allocate', auth, async (req, res) => {
  try {
    const allowedRoles = ['admin', 'hostel_manager', 'registrar', 'accountant'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to allocate hostels' });
    }

    const { studentId, admissionId, roomNumber, floorNumber, checkInDate } = req.body;

    // If admissionId is not provided, try to resolve it from Admissions by studentId (PRN)
    let resolvedAdmissionId = admissionId;
    if (!resolvedAdmissionId && studentId) {
      try {
        const Admission = require('../models/Admission');
        const admissionDoc = await Admission.findOne({ studentId: studentId });
        if (admissionDoc) resolvedAdmissionId = admissionDoc._id;
      } catch (_) {}
    }
    if (!resolvedAdmissionId) {
      return res.status(400).json({ message: 'admissionId is required (unable to resolve by studentId)' });
    }

    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) {
      return res.status(404).json({ message: 'Hostel not found' });
    }

    // Check if room is available
    const existingAllocation = await HostelAllocation.findOne({
      hostelId: req.params.id,
      roomNumber,
      allocationStatus: { $in: ['Allocated', 'Active'] }
    });

    if (existingAllocation) {
      return res.status(400).json({ message: 'Room is already allocated' });
    }

    const allocationData = {
      studentId,
      admissionId: resolvedAdmissionId,
      hostelId: req.params.id,
      roomNumber,
      floorNumber,
      checkInDate,
      monthlyRent: hostel.monthlyRent,
      securityDeposit: hostel.securityDeposit,
      maintenanceFee: hostel.maintenanceFee,
      totalAmount: hostel.monthlyRent + hostel.securityDeposit + hostel.maintenanceFee,
      createdBy: req.user.id
    };

    const allocation = new HostelAllocation(allocationData);
    await allocation.save();

    // Update hostel occupancy
    hostel.currentOccupancy += 1;
    await hostel.save();

    res.status(201).json(allocation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update allocation status
router.patch('/allocations/:allocationId/status', auth, async (req, res) => {
  try {
    if (!['admin', 'hostel_manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { status, checkOutDate } = req.body;
    const allocation = await HostelAllocation.findById(req.params.allocationId);
    
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    allocation.allocationStatus = status;
    if (checkOutDate) allocation.checkOutDate = checkOutDate;
    await allocation.save();

    // If student is vacating, update hostel occupancy
    if (status === 'Vacated') {
      const hostel = await Hostel.findById(allocation.hostelId);
      if (hostel) {
        hostel.currentOccupancy = Math.max(0, hostel.currentOccupancy - 1);
        await hostel.save();
      }
    }

    res.json(allocation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get hostel statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const hostels = await Hostel.find({ isActive: true });
    const allocations = await HostelAllocation.find();

    const stats = {
      totalHostels: hostels.length,
      totalCapacity: hostels.reduce((sum, h) => sum + h.totalCapacity, 0),
      totalOccupancy: hostels.reduce((sum, h) => sum + h.currentOccupancy, 0),
      totalAvailable: hostels.reduce((sum, h) => sum + h.availableSpots, 0),
      occupancyRate: 0
    };

    if (stats.totalCapacity > 0) {
      stats.occupancyRate = (stats.totalOccupancy / stats.totalCapacity) * 100;
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete hostel
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!['admin', 'hostel_manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) {
      return res.status(404).json({ message: 'Hostel not found' });
    }

    // Check if there are active allocations
    const activeAllocations = await HostelAllocation.countDocuments({
      hostelId: req.params.id,
      allocationStatus: { $in: ['Allocated', 'Active'] }
    });

    if (activeAllocations > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete hostel with active allocations' 
      });
    }

    hostel.isActive = false;
    await hostel.save();

    res.json({ message: 'Hostel deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== ROOM MANAGEMENT ROUTES ====================

// Get all rooms for a hostel
router.get('/:hostelId/rooms', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, floorNumber } = req.query;
    const filter = { hostelId: req.params.hostelId };
    
    if (status) filter.status = status;
    if (floorNumber) filter.floorNumber = parseInt(floorNumber);

    const rooms = await Room.find(filter)
      .populate('createdBy', 'name email')
      .sort({ floorNumber: 1, roomNumber: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Room.countDocuments(filter);

    res.json({
      rooms,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new room
router.post('/:hostelId/rooms', auth, async (req, res) => {
  try {
    const allowedRoles = ['admin', 'hostel_manager', 'registrar'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to create rooms' });
    }

    const hostel = await Hostel.findById(req.params.hostelId);
    if (!hostel) {
      return res.status(404).json({ message: 'Hostel not found' });
    }

    const roomData = {
      ...req.body,
      hostelId: req.params.hostelId,
      createdBy: req.user.id
    };

    const room = new Room(roomData);
    await room.save();

    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update room
router.put('/rooms/:roomId', auth, async (req, res) => {
  try {
    if (!['admin', 'hostel_manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const room = await Room.findById(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    Object.assign(room, req.body);
    await room.save();

    res.json(room);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete room
router.delete('/rooms/:roomId', auth, async (req, res) => {
  try {
    if (!['admin', 'hostel_manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const room = await Room.findById(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if room has active allocations
    const activeAllocations = await HostelAllocation.countDocuments({
      hostelId: room.hostelId,
      roomNumber: room.roomNumber,
      allocationStatus: { $in: ['Allocated', 'Active'] }
    });

    if (activeAllocations > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete room with active allocations' 
      });
    }

    room.isActive = false;
    await room.save();

    res.json({ message: 'Room deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get available rooms for allocation
router.get('/:hostelId/available-rooms', auth, async (req, res) => {
  try {
    const { floorNumber, roomType } = req.query;
    const filter = { 
      hostelId: req.params.hostelId,
      status: 'Available',
      availableSpots: { $gt: 0 }
    };
    
    if (floorNumber) filter.floorNumber = parseInt(floorNumber);
    if (roomType) filter.roomType = roomType;

    const rooms = await Room.find(filter)
      .sort({ floorNumber: 1, roomNumber: 1 });

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== ENHANCED ALLOCATION ROUTES ====================

// Get student's hostel allocation
router.get('/student/:studentId/allocation', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Check if student is accessing their own allocation
    if (req.user.role === 'student' && req.user.prn !== studentId) {
      return res.status(403).json({ message: 'Not authorized to view other student allocations' });
    }

    const allocation = await HostelAllocation.findOne({ studentId })
      .populate('hostelId', 'name type address')
      .populate('admissionId', 'firstName lastName email phone');

    if (!allocation) {
      return res.status(404).json({ message: 'No hostel allocation found for this student' });
    }

    res.json(allocation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Record payment against hostel allocation (by allocationId)
router.post('/allocations/:allocationId/pay', auth, async (req, res) => {
  try {
    const { amount, paymentMethod = 'Online', transactionId, notes } = req.body;
    const allocation = await HostelAllocation.findById(req.params.allocationId);
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    if (req.user.role === 'student' && allocation.studentId !== req.user.prn) {
      return res.status(403).json({ message: 'Not authorized to pay for this allocation' });
    }

    if (amount > allocation.pendingAmount) {
      return res.status(400).json({ message: 'Amount exceeds pending' });
    }

    const payment = {
      paymentId: `HOSPAY_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,
      amount,
      paymentMethod,
      transactionId,
      notes,
      status: 'Completed'
    };

    allocation.payments.push(payment);
    allocation.paidAmount = (allocation.paidAmount || 0) + amount;
    allocation.pendingAmount = (allocation.totalAmount || 0) - (allocation.paidAmount || 0);
    await allocation.save();

    try {
      await FinancialTransaction.create({
        transactionId: `TXN_HOSTEL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        transactionType: 'Income',
        category: 'Student Fees',
        subCategory: 'Hostel',
        amount,
        description: `Hostel payment for PRN ${allocation.studentId}`,
        paymentMethod,
        transactionDate: new Date(),
        status: 'Completed',
        studentId: allocation.studentId,
        hostelId: allocation.hostelId,
        admissionId: allocation.admissionId,
        approvedBy: req.user.id
      });
    } catch (_) {}

    res.json({ message: 'Payment successful', allocation, payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate hostel receipt
router.get('/allocations/:allocationId/receipt', auth, async (req, res) => {
  try {
    const allocation = await HostelAllocation.findById(req.params.allocationId)
      .populate('hostelId', 'name type address')
      .populate('admissionId', 'firstName lastName email phone');
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation not found' });
    }

    if (req.user.role === 'student' && allocation.studentId !== req.user.prn) {
      return res.status(403).json({ message: 'Not authorized to view this receipt' });
    }

    const receipt = {
      receiptNumber: `HOSREC_${Date.now()}`,
      studentId: allocation.studentId,
      studentName: allocation.admissionId ? `${allocation.admissionId.firstName} ${allocation.admissionId.lastName}` : '',
      hostel: allocation.hostelId?.name,
      roomNumber: allocation.roomNumber,
      floorNumber: allocation.floorNumber,
      totalAmount: allocation.totalAmount,
      paidAmount: allocation.paidAmount,
      pendingAmount: allocation.pendingAmount,
      generatedAt: new Date(),
      generatedBy: req.user.name
    };
    // If client wants PDF, check query
    if (req.query.format === 'pdf') {
      if (!PDFDocument) {
        return res.status(503).json({ message: 'PDF generation not available' });
      }
      const doc = new PDFDocument({ margin: 40 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=hostel_receipt_${allocation.studentId}.pdf`);
      doc.pipe(res);
      doc.fontSize(18).text('Hostel Payment Receipt', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Receipt #: ${receipt.receiptNumber}`);
      doc.text(`Student: ${receipt.studentName}`);
      doc.text(`PRN: ${receipt.studentId}`);
      doc.text(`Hostel: ${receipt.hostel}`);
      doc.text(`Room: ${receipt.roomNumber} (Floor ${receipt.floorNumber})`);
      doc.moveDown();
      doc.text(`Total: ₹${receipt.totalAmount}`);
      doc.text(`Paid: ₹${receipt.paidAmount}`);
      doc.text(`Pending: ₹${receipt.pendingAmount}`);
      doc.end();
    } else {
      res.json(receipt);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get hostel dashboard for hostel manager
router.get('/dashboard/stats', auth, async (req, res) => {
  try {
    if (!['admin', 'hostel_manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get hostel statistics
    const hostelStats = await Hostel.aggregate([
      {
        $group: {
          _id: null,
          totalHostels: { $sum: 1 },
          totalCapacity: { $sum: '$totalCapacity' },
          currentOccupancy: { $sum: '$currentOccupancy' }
        }
      }
    ]);

    // Get room statistics
    const roomStats = await Room.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get allocation statistics
    const allocationStats = await HostelAllocation.aggregate([
      {
        $group: {
          _id: '$allocationStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent allocations
    const recentAllocations = await HostelAllocation.find()
      .populate('hostelId', 'name type')
      .populate('admissionId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get occupancy by hostel
    const occupancyByHostel = await Hostel.find({ isActive: true })
      .select('name type totalCapacity currentOccupancy availableSpots');

    res.json({
      hostelStats: hostelStats[0] || { totalHostels: 0, totalCapacity: 0, currentOccupancy: 0 },
      roomStats,
      allocationStats,
      recentAllocations,
      occupancyByHostel
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Bulk allocate rooms
router.post('/bulk-allocate', auth, async (req, res) => {
  try {
    if (!['admin', 'hostel_manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { allocations } = req.body; // Array of allocation objects

    if (!Array.isArray(allocations) || allocations.length === 0) {
      return res.status(400).json({ message: 'Allocations array is required' });
    }

    const results = [];
    const errors = [];

    for (const allocationData of allocations) {
      try {
        const { studentId, admissionId, hostelId, roomNumber, floorNumber, checkInDate } = allocationData;

        // Check if room is available
        const existingAllocation = await HostelAllocation.findOne({
          hostelId,
          roomNumber,
          allocationStatus: { $in: ['Allocated', 'Active'] }
        });

        if (existingAllocation) {
          errors.push({ studentId, error: 'Room is already allocated' });
          continue;
        }

        const hostel = await Hostel.findById(hostelId);
        if (!hostel) {
          errors.push({ studentId, error: 'Hostel not found' });
          continue;
        }

        const allocation = await HostelAllocation.create({
          studentId,
          admissionId,
          hostelId,
          roomNumber,
          floorNumber,
          checkInDate,
          monthlyRent: hostel.monthlyRent,
          securityDeposit: hostel.securityDeposit,
          maintenanceFee: hostel.maintenanceFee,
          totalAmount: hostel.monthlyRent + hostel.securityDeposit + hostel.maintenanceFee,
          createdBy: req.user.id
        });

        // Update hostel occupancy
        hostel.currentOccupancy += 1;
        await hostel.save();

        results.push(allocation);
      } catch (error) {
        errors.push({ studentId: allocationData.studentId, error: error.message });
      }
    }

    res.json({
      message: `Successfully allocated ${results.length} rooms`,
      successful: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Export hostel data
router.get('/export', auth, async (req, res) => {
  try {
    if (!['admin', 'hostel_manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { format = 'json', type = 'allocations' } = req.query;

    if (type === 'allocations') {
      const allocations = await HostelAllocation.find()
        .populate('hostelId', 'name type')
        .populate('admissionId', 'firstName lastName email phone')
        .sort({ createdAt: -1 });

      if (format === 'csv') {
        const csvData = allocations.map(allocation => ({
          'Student ID': allocation.studentId,
          'Student Name': `${allocation.admissionId.firstName} ${allocation.admissionId.lastName}`,
          'Email': allocation.admissionId.email,
          'Phone': allocation.admissionId.phone,
          'Hostel': allocation.hostelId.name,
          'Room Number': allocation.roomNumber,
          'Floor': allocation.floorNumber,
          'Status': allocation.allocationStatus,
          'Check-in Date': allocation.checkInDate,
          'Monthly Rent': allocation.monthlyRent,
          'Security Deposit': allocation.securityDeposit
        }));

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=hostel_allocations.csv');
        
        const csv = Object.keys(csvData[0] || {}).join(',') + '\n' +
          csvData.map(row => Object.values(row).join(',')).join('\n');
        
        res.send(csv);
      } else {
        res.json(allocations);
      }
    } else {
      const hostels = await Hostel.find({ isActive: true })
        .populate('createdBy', 'name email');

      if (format === 'csv') {
        const csvData = hostels.map(hostel => ({
          'Hostel Name': hostel.name,
          'Type': hostel.type,
          'Address': `${hostel.address.street}, ${hostel.address.city}`,
          'Total Capacity': hostel.totalCapacity,
          'Current Occupancy': hostel.currentOccupancy,
          'Available Spots': hostel.availableSpots,
          'Monthly Rent': hostel.monthlyRent,
          'Security Deposit': hostel.securityDeposit
        }));

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=hostels.csv');
        
        const csv = Object.keys(csvData[0] || {}).join(',') + '\n' +
          csvData.map(row => Object.values(row).join(',')).join('\n');
        
        res.send(csv);
      } else {
        res.json(hostels);
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
