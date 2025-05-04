const express = require('express');
const {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  uploadStudents
} = require('../controllers/studentController');

const router = express.Router();

const { protect } = require('../middlewares/auth');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      return cb(new Error('Only CSV files are allowed'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 1024 * 1024 * 5
  }
});

router.use(protect);

router
  .route('/')
  .get(getStudents)
  .post(createStudent);

router.post('/upload', upload.single('file'), uploadStudents);

router
  .route('/:id')
  .get(getStudent)
  .put(updateStudent)
  .delete(deleteStudent);

module.exports = router;