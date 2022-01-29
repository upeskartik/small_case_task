const express = require('express');
const router = express.Router();
const portfolioController = require('./../controller/portfolio.controller');;

// get the list of all stock in portfolio 
router.get('/', portfolioController.getPortoflio);

// get the total pnl on current proftolio
router.get('/returns', portfolioController.getReturns);

module.exports = router;
