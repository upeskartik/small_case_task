// const UserTrades = require('../model/userTrade');
const tradeService = require('../service/trade.service');
const portfolioService = require('../service/portfolio.service');



/**
 * Checks the trade is possible or not
 * update the user portfolio accorgin the trade result
 * 
 * @returns trade data  { trade_id, ticker_symbol, price, quantity, side }
 * 
 */
const addNewTrade = async (req, res) => {
    try {
        let { avg_price, quantity, status } = await tradeService.validateTrade(req.body);

        status === "ADD" ?
            await portfolioService.addTradeToPortfolio({ ticker_symbol: req.body.ticker_symbol, avg_price, quantity }) :
            await portfolioService.updatePortfolio({ avg_price, quantity }, { ticker_symbol: req.body.ticker_symbol })

        res.json(await tradeService.postTrades(req.body));

    } catch (err) {
        console.error(err)
        res.status(400).json({ error: err.message });
    }
};


/**
 * returns the trade list
 * 
 * 
 * @returns {Array} array of objects  [{ trade_id, ticker_symbol, price, quantity, side }]
 * 
 */
const getTrade = async (req, res) => {
    try {
        // let tradelist = 
        res.json(await tradeService.getTrades());
    } catch (err) {
        console.error(err)
        res.status(400).json({ error: err.message });
    }
};


/**
 * checks if the trade can be modified and updates the trade and portfolio 
 * 
 * 
 * @returns  updated trade [{ trade_id, ticker_symbol, price, quantity, side }]
 * 
 */
const updateTrade = async (req, res) => {
    try {

        let tradeDetails = await tradeService.getTrades({ trade_id: req.body.trade_id })

        if (tradeDetails.length === 0)
            return res.json({ msg: "invalid trade_id" })

        // if updated trade is of different symbol removes check and remove the previous trade. 
        // console.log(tradeDetails.ticker_symbol,req.body.ticker_symbol)
        if (tradeDetails[0].ticker_symbol != req.body.ticker_symbol) {

            let { avg_price, quantity, status } = await tradeService.validateTrade(req.body);

            await tradeService.removeTrade(tradeDetails[0]);

            status === "ADD" ?
                await portfolioService.addTradeToPortfolio({ ticker_symbol: req.body.ticker_symbol, avg_price, quantity }) :
                await portfolioService.updatePortfolio({ avg_price, quantity }, { ticker_symbol: req.body.ticker_symbol })

            return res.json(await tradeService.updateTradeDetails({ trade_id: req.body.trade_id }, req.body))
        }

        console.log(tradeDetails[0], req.body)
        res.json(await tradeService.updateTrade(tradeDetails[0], req.body))

    } catch (err) {
        console.error(err)
        res.status(400).json({ error: err.message });
    }
}

/**
 * Remove the trade from trade list and updates the portfolio 
 * 
 * 
 */
const removeTrade = async (req, res) => {
    try {
        let tradeDetails = await tradeService.getTrades({ trade_id: req.body.trade_id })

        if (tradeDetails.length === 0)
            return res.json({ msg: "invalid trade_id" })

        await tradeService.removeTrade(tradeDetails[0]);
        await tradeService.deleteTrade(req.body.trade_id);
        res.json({ msg: " trade removed succesfully" });
    } catch (err) {
        console.error(err)
        res.status(400).json({ error: err.message });
    }
}

module.exports = { getTrade, addNewTrade, updateTrade, removeTrade };