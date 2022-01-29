// const UserTrades = require('../model/userTrade');
const tradeService = require('../service/trade.service');
const portfolioService = require('../service/portfolio.service');


/**
 * Get the current portoflio status
 * 
 * @returns array of object as  {ticker_symbol, avg_price, quantity}
 * 
 */
const getPortoflio = async (req, res) => {
    try {

        res.json(await portfolioService.getPortfolio({ active_status: true }));

    } catch (err) {
        console.error(err)
        res.status(400).json({ error: err.message });
    }
};


/**
 * Calculates the current pnl for you current portfolio
 * 
 * @returns {json} { "pnl": 35952}
 */
const getReturns = async (req, res) => {
    try {
        let portfolio = await portfolioService.getPortfolio({ active_status: true })

        res.json(await portfolioService.getReturns(portfolio));
    } catch (err) {
        res.status(400).send(err)
    }
};

module.exports = { getPortoflio, getReturns };