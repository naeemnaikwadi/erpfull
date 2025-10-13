const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Download = require('../models/Download');

// Get all downloads for a user
router.get('/', auth, async (req, res) => {
  try {
    const downloads = await Download.find({ userId: req.user.id })
      .populate('courseId', 'name')
      .populate('instructorId', 'name')
      .sort({ downloadedAt: -1 });
    
    res.json(downloads);
  } catch (error) {
    console.error('Error fetching downloads:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new download record
router.post('/', auth, async (req, res) => {
  try {
    const { fileName, originalName, fileType, fileSize, url, courseId, instructorId } = req.body;
    
    const download = new Download({
      userId: req.user.id,
      fileName,
      originalName,
      fileType,
      fileSize,
      url,
      courseId,
      instructorId,
      downloadedAt: new Date()
    });
    
    await download.save();
    res.status(201).json(download);
  } catch (error) {
    console.error('Error creating download record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a download record
router.delete('/:id', auth, async (req, res) => {
  try {
    const download = await Download.findById(req.params.id);
    
    if (!download) {
      return res.status(404).json({ message: 'Download not found' });
    }
    
    if (download.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    await download.deleteOne();
    res.json({ message: 'Download removed' });
  } catch (error) {
    console.error('Error deleting download:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
