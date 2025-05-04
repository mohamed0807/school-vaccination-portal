const express = require('express');
const {
  getDashboardStats,
  getVaccinationReport
} = require('../controllers/dashboardController');

const router = express.Router();

const { protect } = require('../middlewares/auth');

router.use(protect);

router.get('/', getDashboardStats);
router.get('/report', getVaccinationReport);

module.exports = router;