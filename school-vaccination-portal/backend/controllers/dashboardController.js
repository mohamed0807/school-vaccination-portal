const Student = require('../models/Student');
const VaccinationDrive = require('../models/VaccinationDrive');
const VaccinationRecord = require('../models/VaccinationRecord');
const asyncHandler = require('express-async-handler');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard
// @access  Private
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const totalStudents = await Student.countDocuments();
  
  const vaccinated = await VaccinationRecord.aggregate([
    {
      $group: {
        _id: '$student',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const studentsVaccinated = vaccinated.length;
  
  const vaccinationPercentage = totalStudents > 0 
    ? (studentsVaccinated / totalStudents) * 100 
    : 0;
  
  const today = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(today.getDate() + 30);
  
  const upcomingDrives = await VaccinationDrive.find({
    driveDate: {
      $gte: today,
      $lte: thirtyDaysLater
    },
    status: 'scheduled'
  }).sort({ driveDate: 1 }).limit(5);
  
  const vaccineTypeCounts = await VaccinationRecord.aggregate([
    {
      $group: {
        _id: '$vaccineName',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  const recentVaccinations = await VaccinationRecord.find()
    .sort({ administeredDate: -1 })
    .limit(5)
    .populate('student', 'name studentId grade')
    .populate('vaccinationDrive', 'vaccineName driveDate');
  
  res.status(200).json({
    success: true,
    data: {
      totalStudents,
      studentsVaccinated,
      vaccinationPercentage: vaccinationPercentage.toFixed(2),
      upcomingDrives,
      vaccineTypeCounts,
      recentVaccinations
    }
  });
});

// @desc    Get vaccination report with filters
// @route   GET /api/dashboard/report
// @access  Private
exports.getVaccinationReport = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  const pipeline = [];
  
  pipeline.push({
    $lookup: {
      from: 'students',
      localField: 'student',
      foreignField: '_id',
      as: 'studentInfo'
    }
  });
  
  pipeline.push({
    $unwind: '$studentInfo'
  });
  
  pipeline.push({
    $lookup: {
      from: 'vaccinationdrives',
      localField: 'vaccinationDrive',
      foreignField: '_id',
      as: 'driveInfo'
    }
  });
  
  pipeline.push({
    $unwind: '$driveInfo'
  });
  
  const matchQuery = {};
  
  if (req.query.vaccineName) {
    matchQuery['vaccineName'] = req.query.vaccineName;
  }
  
  if (req.query.grade) {
    matchQuery['studentInfo.grade'] = req.query.grade;
  }
  
  if (req.query.startDate && req.query.endDate) {
    matchQuery['administeredDate'] = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }
  
  if (Object.keys(matchQuery).length > 0) {
    pipeline.push({
      $match: matchQuery
    });
  }
  
  pipeline.push({
    $project: {
      _id: 1,
      studentName: '$studentInfo.name',
      studentId: '$studentInfo.studentId',
      grade: '$studentInfo.grade',
      section: '$studentInfo.section',
      vaccineName: 1,
      administeredDate: 1,
      driveName: '$driveInfo.vaccineName',
      driveDate: '$driveInfo.driveDate',
      notes: 1
    }
  });
  
  pipeline.push({
    $sort: { administeredDate: -1 }
  });
  
  const countPipeline = [...pipeline];
  countPipeline.push({ $count: 'total' });
  const countResult = await VaccinationRecord.aggregate(countPipeline);
  const total = countResult.length > 0 ? countResult[0].total : 0;
  
  pipeline.push({ $skip: startIndex });
  pipeline.push({ $limit: limit });
  
  const records = await VaccinationRecord.aggregate(pipeline);
  
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
  
  const vaccineNames = await VaccinationRecord.distinct('vaccineName');
  
  const grades = await Student.distinct('grade');
  
  res.status(200).json({
    success: true,
    count: records.length,
    pagination,
    data: records,
    total,
    filters: {
      vaccineNames,
      grades
    }
  });
});