const Student = require('../models/Student');
const asyncHandler = require('express-async-handler');
const csv = require('csv-parser');
const fs = require('fs');

// @desc    Get all students
// @route   GET /api/students
// @access  Private
exports.getStudents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  const query = {};
  
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { studentId: { $regex: req.query.search, $options: 'i' } }
    ];
  }
  
  if (req.query.grade) {
    query.grade = req.query.grade;
  }

  const total = await Student.countDocuments(query);
  const students = await Student.find(query)
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

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
    count: students.length,
    pagination,
    data: students,
    total
  });
});

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
exports.getStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  res.status(200).json({
    success: true,
    data: student
  });
});

// @desc    Create new student
// @route   POST /api/students
// @access  Private
exports.createStudent = asyncHandler(async (req, res) => {
  const student = await Student.create(req.body);

  res.status(201).json({
    success: true,
    data: student
  });
});

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private
exports.updateStudent = asyncHandler(async (req, res) => {
  let student = await Student.findById(req.params.id);

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  student = await Student.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: student
  });
});

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private
exports.deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  await student.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Upload students via CSV
// @route   POST /api/students/upload
// @access  Private
exports.uploadStudents = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a CSV file');
  }

  const results = [];
  const errors = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', async (data) => {
      results.push(data);
    })
    .on('end', async () => {
      fs.unlinkSync(req.file.path);
      
      for (const row of results) {
        try {
          const studentData = {
            name: row.name,
            studentId: row.studentId,
            dateOfBirth: new Date(row.dateOfBirth),
            gender: row.gender,
            grade: row.grade,
            section: row.section,
            parentName: row.parentName,
            contactNumber: row.contactNumber,
            address: row.address
          };
          
          const existingStudent = await Student.findOne({ studentId: studentData.studentId });
          
          if (existingStudent) {
            await Student.findByIdAndUpdate(existingStudent._id, studentData, {
              runValidators: true
            });
          } else {
            await Student.create(studentData);
          }
        } catch (error) {
          errors.push({
            row,
            error: error.message
          });
        }
      }
      
      res.status(200).json({
        success: true,
        count: results.length - errors.length,
        data: {
          total: results.length,
          succeeded: results.length - errors.length,
          failed: errors.length,
          errors
        }
      });
    });
});