const express = require('express');
const router = express.Router();
const tradeController = require('./../controller/trade.controller');
const tradeHelper = require('../helper/trade.helper')

// post a new trade
router.post('/', tradeHelper.validateTrade, tradeController.addNewTrade);

// get all the trades
router.get('/', tradeController.getTrade);

// update a trades and modify the transaction
router.put('/', tradeHelper.validateTrade, tradeController.updateTrade);

// remove a trade and rollback the transction
router.post('/remove-trade', tradeController.removeTrade);

module.exports = router;
