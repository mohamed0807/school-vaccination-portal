const VaccinationDrive = require('../models/VaccinationDrive');
const VaccinationRecord = require('../models/VaccinationRecord');
const Student = require('../models/Student');
const asyncHandler = require('express-async-handler');

// @desc    Get all vaccination drives
// @route   GET /api/drives
// @access  Private
exports.getDrives = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  const query = {};
  
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  if (req.query.startDate && req.query.endDate) {
    query.driveDate = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  } else if (req.query.upcoming === 'true') {
    query.driveDate = { $gte: new Date() };
  } else if (req.query.upcoming30 === 'true') {
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);
    
    query.driveDate = {
      $gte: today,
      $lte: thirtyDaysLater
    };
  }

  const total = await VaccinationDrive.countDocuments(query);
  const drives = await VaccinationDrive.find(query)
    .sort({ driveDate: 1 })
    .skip(startIndex)
    .limit(limit)
    .populate('createdBy', 'name email');

  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.status(200).json({
    success: true,
    count: drives.length,
    pagination,
    data: drives,
    total
  });
});

// @desc    Get single vaccination drive
// @route   GET /api/drives/:id
// @access  Private
exports.getDrive = asyncHandler(async (req, res) => {
  const drive = await VaccinationDrive.findById(req.params.id)
    .populate('createdBy', 'name email');

  if (!drive) {
    res.status(404);
    throw new Error('Vaccination drive not found');
  }

  res.status(200).json({
    success: true,
    data: drive
  });
});

// @desc    Create new vaccination drive
// @route   POST /api/drives
// @access  Private
exports.createDrive = asyncHandler(async (req, res) => {
  const driveDate = new Date(req.body.driveDate);
  const today = new Date();
  const minimumDate = new Date();
  minimumDate.setDate(today.getDate() + 15);
  
  if (driveDate < minimumDate) {
    res.status(400);
    throw new Error('Vaccination drives must be scheduled at least 15 days in advance');
  }
  
  const existingDrive = await VaccinationDrive.findOne({
    driveDate: {
      $gte: new Date(driveDate.setHours(0, 0, 0)),
      $lt: new Date(driveDate.setHours(23, 59, 59))
    }
  });
  
  if (existingDrive) {
    res.status(400);
    throw new Error('A vaccination drive is already scheduled for this date');
  }

  req.body.createdBy = req.user.id;

  const drive = await VaccinationDrive.create(req.body);

  res.status(201).json({
    success: true,
    data: drive
  });
});

// @desc    Update vaccination drive
// @route   PUT /api/drives/:id
// @access  Private
exports.updateDrive = asyncHandler(async (req, res) => {
  let drive = await VaccinationDrive.findById(req.params.id);

  if (!drive) {
    res.status(404);
    throw new Error('Vaccination drive not found');
  }

  if (drive.driveDate < new Date()) {
    res.status(400);
    throw new Error('Cannot update a drive that has already occurred');
  }
  
  if (req.body.driveDate) {
    const newDriveDate = new Date(req.body.driveDate);
    const today = new Date();
    const minimumDate = new Date();
    minimumDate.setDate(today.getDate() + 15);
    
    if (newDriveDate < minimumDate) {
      res.status(400);
      throw new Error('Vaccination drives must be scheduled at least 15 days in advance');
    }
    
    const existingDrive = await VaccinationDrive.findOne({
      _id: { $ne: req.params.id },
      driveDate: {
        $gte: new Date(newDriveDate.setHours(0, 0, 0)),
        $lt: new Date(newDriveDate.setHours(23, 59, 59))
      }
    });
    
    if (existingDrive) {
      res.status(400);
      throw new Error('A vaccination drive is already scheduled for this date');
    }
  }

  drive = await VaccinationDrive.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: drive
  });
});

// @desc    Delete vaccination drive
// @route   DELETE /api/drives/:id
// @access  Private
exports.deleteDrive = asyncHandler(async (req, res) => {
  const drive = await VaccinationDrive.findById(req.params.id);

  if (!drive) {
    res.status(404);
    throw new Error('Vaccination drive not found');
  }

  if (drive.driveDate < new Date()) {
    res.status(400);
    throw new Error('Cannot delete a drive that has already occurred');
  }

  if (drive.createdBy.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Not authorized to delete this drive');
  }

  await drive.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Mark student as vaccinated in a drive
// @route   POST /api/drives/:driveId/vaccinate/:studentId
// @access  Private
exports.vaccinateStudent = asyncHandler(async (req, res) => {
  const drive = await VaccinationDrive.findById(req.params.driveId);
  
  if (!drive) {
    res.status(404);
    throw new Error('Vaccination drive not found');
  }
  
  const student = await Student.findById(req.params.studentId);
  
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }
  
  if (drive.driveDate > new Date()) {
    res.status(400);
    throw new Error('Cannot mark vaccination for a drive that has not occurred yet');
  }
  
  if (!drive.applicableGrades.includes(student.grade)) {
    res.status(400);
    throw new Error('This student\'s grade is not applicable for this vaccination drive');
  }
  
  const existingRecord = await VaccinationRecord.findOne({
    student: student._id,
    vaccinationDrive: drive._id
  });
  
  if (existingRecord) {
    res.status(400);
    throw new Error('This student has already been vaccinated in this drive');
  }
  
  const previousVaccination = await VaccinationRecord.findOne({
    student: student._id,
    vaccineName: drive.vaccineName
  });
  
  if (previousVaccination) {
    res.status(400);
    throw new Error(`This student has already received the ${drive.vaccineName} vaccine on ${previousVaccination.administeredDate.toDateString()}`);
  }
  
  if (drive.dosesAdministered >= drive.doses) {
    res.status(400);
    throw new Error('No doses left for this vaccination drive');
  }
  
  const vaccinationRecord = await VaccinationRecord.create({
    student: student._id,
    vaccinationDrive: drive._id,
    vaccineName: drive.vaccineName,
    administeredDate: req.body.administeredDate || new Date(),
    administeredBy: req.user.id,
    notes: req.body.notes || ''
  });
  
  drive.dosesAdministered += 1;
  await drive.save();
  
  if (drive.dosesAdministered >= drive.doses) {
    drive.status = 'completed';
    await drive.save();
  }
  
  res.status(201).json({
    success: true,
    data: vaccinationRecord
  });
});