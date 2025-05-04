const express = require('express');
const {
  getDrives,
  getDrive,
  createDrive,
  updateDrive,
  deleteDrive,
  vaccinateStudent
} = require('../controllers/driveController');

const router = express.Router();

const { protect } = require('../middlewares/auth');

router.use(protect);

router
  .route('/')
  .get(getDrives)
  .post(createDrive);

router
  .route('/:id')
  .get(getDrive)
  .put(updateDrive)
  .delete(deleteDrive);

router.post('/:driveId/vaccinate/:studentId', vaccinateStudent);

module.exports = router;