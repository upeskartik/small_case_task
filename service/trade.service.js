const Trade = require('../model/trade.model')
const Portfolio = require('../model/portfolio.model')
const portfolioService = require("../service/portfolio.service")
const uuidv4 = require('uuid').v4;

/**
 * Get list of all the trades based on query
 * 
 * @param query paramters to get the trades
 */
const getTrades = async function (query) {
    try {
        return await Trade.find(query).sort("created").select('trade_id ticker_symbol price quantity side -_id');
    } catch (e) {
        throw Error(e)
    }
}


/**
 * Add a new trade to trade list
 * 
 * @param query {trade_id,ticker_symbol,price, quantity , side}
 */
const postTrades = async function (query) {
    try {
        query.trade_id = uuidv4();
        const trade = new Trade(query);
        await trade.save()
        return { trade_id: trade.trade_id, ticker_symbol: trade.ticker_symbol, price: trade.price, quantity: trade.quantity, side: trade.side };
    } catch (e) {
        console.log(e)
        throw Error(e)
    }
}




// todo check case for trade side
// todo handle very large numbers
// todo handle ticker symol change

/**
 * checks if updating a trade is possible and update the trade and user 
 * @param oldTradeDetails trade to be modified
 * @param  newTradeDetails new trade details 
 */
const updateTrade = async function (oldTradeDetails, newTradeDetails) {
    try {

        let portfolio = await Portfolio.findOne({ ticker_symbol: oldTradeDetails.ticker_symbol, active_status: true })

        console.log(portfolio)

        if (newTradeDetails.side === process.env.TRADE_TYPE_SELL) {

            if (oldTradeDetails.side === process.env.TRADE_TYPE_BUY)
                return await changeBuyToSell(portfolio, oldTradeDetails, newTradeDetails);

            return await updateSell(portfolio, oldTradeDetails, newTradeDetails);
        }

        if (oldTradeDetails.side === process.env.TRADE_TYPE_SELL)
            return await changeSellToBuy(portfolio, oldTradeDetails, newTradeDetails);

        return await updateBuy(portfolio, oldTradeDetails, newTradeDetails)

    } catch (e) {
        console.log(e)
        throw Error(e)
    }
}

/**
 * Remove a trade and rollbacks the transaction done on portfolio
 * 
 * @param TradeDetails trade to be removed
 */
const removeTrade = async function (TradeDetails) {
    try {

        console.log("in remove trade")
        console.log(TradeDetails)

        let portfolio = await Portfolio.findOne({ ticker_symbol: TradeDetails.ticker_symbol, active_status: true })

        console.log(portfolio);

        console.log(TradeDetails.ticker_symbol)

        if (TradeDetails.side === process.env.TRADE_TYPE_SELL) {

            let query = { quantity: portfolio.quantity + TradeDetails.quantity }

            await portfolioService.updatePortfolio({ quantity: portfolio.quantity + TradeDetails.quantity }, { ticker_symbol: TradeDetails.ticker_symbol });

            return;
        }

        let netQty = portfolio.quantity - TradeDetails.quantity;

        let newAvgPrice = netQty === 0 ? portfolio.avg_price : (((portfolio.avg_price * portfolio.quantity) - (TradeDetails.price * TradeDetails.quantity)) / netQty)

        await portfolioService.updatePortfolio({ avg_price: newAvgPrice, quantity: netQty }, { ticker_symbol: TradeDetails.ticker_symbol })

        return;

    } catch (err) {
        console.log(err)
        throw Error(err)
    }
}

/**
 * delets a trade from the trade list
 * @param  {String} trade_id  trade_id to be deleted
 */
const deleteTrade = async function (trade_id) {
    try {
        await Trade.deleteOne({ trade_id });
        return;
    } catch (err) {
        throw err
    }
}


/**
 * Calulates the avy_price and qty after the trades executes
 * 
 * @param  {Number} current_avg_price 
 * @param   {Number} current_quantity 
 * @param  {Number} side 
 * @param  {Number} quantity 
 * @param  {Number} price 
 * @returns 
 */
const calculatePriceAndQty = function (current_avg_price, current_quantity, side, quantity, price) {
    try {
        console.log(current_avg_price, current_quantity, side, quantity, price)

        if (side === process.env.TRADE_TYPE_SELL && current_quantity < quantity)
            throw "cannot sell quantity more then the current quantity."

        if (side === process.env.TRADE_TYPE_BUY) {
            return {
                new_avg_price: (((current_avg_price * current_quantity) + (price * quantity)) / (current_quantity + quantity)).toFixed(2),
                new_qty: current_quantity + quantity
            }
        }
        return {
            new_avg_price: current_avg_price,
            new_qty: current_quantity - quantity
        }

    } catch (e) {
        throw Error(e)
    }
}

/**
 * Validate if a trade is possible or not.
 * 
 * returns the status flag:
 * UPDATE: if portfolio has to updates
 * ADD: if new trade has to added to portfolio
 * 
 * @param {JSON} tradeDetails 
 * 
 */
const validateTrade = async function (tradeDetails) {
    try {
        let portfolio = await portfolioService.getPortfolio({ ticker_symbol: tradeDetails.ticker_symbol });

        console.log("in validate trade")
        console.log(portfolio)

        if (portfolio.length > 0) {



            let { new_avg_price, new_qty } = calculatePriceAndQty(portfolio[0].avg_price, portfolio[0].quantity, tradeDetails.side, tradeDetails.quantity, tradeDetails.price);

            console.log(new_avg_price, new_qty)
            console.log("update")

            return { avg_price: new_avg_price, quantity: new_qty, status: "UPDATE" }
        }

        if (tradeDetails.side === process.env.TRADE_TYPE_SELL) {
            throw "cannot sell a symbol you down own"
        }
        console.log("add")
        return { avg_price: tradeDetails.price, quantity: tradeDetails.quantity, status: "ADD" }

    } catch (err) {
        console.log(err)
        throw Error(err)
    }
}


// helper function

/**
 * Modify the a BUY trade to SELL trade.
 * Validates if trade can be modified or not
 * 
 * @param {JSON} portfolio 
 * @param {JSON} oldTradeDetails 
 * @param {JSON} newTradeDetails 
 * 
 */
const changeBuyToSell = async (portfolio, oldTradeDetails, newTradeDetails) => {
    try {
        let netQty = (portfolio.quantity - oldTradeDetails.quantity - newTradeDetails.quantity);

        if (netQty < 0)
            return { msg: "cannot sell this qty" }

        if (netQty == 0) {

            await portfolioService.updatePortfolio({ quantity: netQty }, { ticker_symbol: newTradeDetails.ticker_symbol })

            return updateTradeDetails(oldTradeDetails, newTradeDetails);
        }

        let newAvgPrice = (((portfolio.avg_price * portfolio.quantity) - (oldTradeDetails.price * oldTradeDetails.quantity)) / (portfolio.quantity - oldTradeDetails.quantity))

        await portfolioService.updatePortfolio({ avg_price: newAvgPrice, quantity: netQty }, { ticker_symbol: newTradeDetails.ticker_symbol })

        return updateTradeDetails(oldTradeDetails, newTradeDetails);

    } catch (err) {
        throw err
    }
}


/**
 * Modify the a SELL to BUY trade.
 * Validates if trade can be modified or not
 * 
 * @param {JSON} portfolio 
 * @param {JSON} oldTradeDetails 
 * @param {JSON} newTradeDetails 
 * 
 */
const changeSellToBuy = async (portfolio, oldTradeDetails, newTradeDetails) => {
    try {

        // if (portfolio.active_status === false) {

        let current_quantity = portfolio.quantity + oldTradeDetails.quantity;
        let avg_price = portfolio.avg_price;

        let { new_avg_price, new_qty } = calculatePriceAndQty(avg_price, current_quantity, newTradeDetails.side, newTradeDetails.quantity, newTradeDetails.price)

        await portfolioService.updatePortfolio({ avg_price: new_avg_price, quantity: new_qty }, { ticker_symbol: newTradeDetails.ticker_symbol })

        return updateTradeDetails(oldTradeDetails, newTradeDetails);
        // }

    } catch (err) {
        throw err
    }
}


/**
 * Update a sell trade 
 * Validates if trade can be modified or not
 * 
 * @param {JSON} portfolio 
 * @param {JSON} oldTradeDetails 
 * @param {JSON} newTradeDetails 
 * 
 */
const updateSell = async (portfolio, oldTradeDetails, newTradeDetails) => {
    try {

        // checks if no qty in portfolio
        if (!portfolio)
            portfolio.quantity = 0;

        let netQty = (portfolio.quantity + oldTradeDetails.quantity - newTradeDetails.quantity);

        if (netQty < 0)
            return { msg: "cannot sell this qty" }

        await portfolioService.updatePortfolio({ quantity: netQty }, { ticker_symbol: newTradeDetails.ticker_symbol })

        return updateTradeDetails(oldTradeDetails, newTradeDetails);

    } catch (err) {
        throw err;
    }
}


/**
 * Modify the a BUY trade.
 * Validates if trade can be modified or not
 * 
 * @param {JSON} portfolio 
 * @param {JSON} oldTradeDetails 
 * @param {JSON} newTradeDetails 
 * 
 */
const updateBuy = async (portfolio, oldTradeDetails, newTradeDetails) => {
    try {

        let netQty = (portfolio.quantity - oldTradeDetails.quantity);

        console.log(netQty)

        if (netQty === 0) {

            await portfolioService.updatePortfolio({ quantity: newTradeDetails.quantity, avg_price: newTradeDetails.price }, { ticker_symbol: newTradeDetails.ticker_symbol })

            return updateTradeDetails(oldTradeDetails, newTradeDetails);
        }

        let newAvgPrice = (((portfolio.avg_price * portfolio.quantity) - (oldTradeDetails.price * oldTradeDetails.quantity)) / (portfolio.quantity - oldTradeDetails.quantity));

        await portfolioService.updatePortfolio({  quantity: netQty + newTradeDetails.quantity,  avg_price: newAvgPrice }, { ticker_symbol: newTradeDetails.ticker_symbol })

        return updateTradeDetails(oldTradeDetails, newTradeDetails);

    } catch (err) {
        throw err;
    }
}


/**
 * Modify the trade details
 * 
 * @param {JSON} oldTradeDetails 
 * @param {JSON} newTradeDetails 
 * 
 */
const updateTradeDetails = async (oldTradeDetails, newTradeDetails) => {

    console.log(newTradeDetails);

    let newTrade = await Trade.findOneAndUpdate({ trade_id: oldTradeDetails.trade_id },
        {
            ticker_symbol: newTradeDetails.ticker_symbol,
            price: newTradeDetails.price,
            quantity: newTradeDetails.quantity,
            side: newTradeDetails.side
        }, { new: true, select: "trade_id ticker_symbol price quantity side" })

    return newTrade;
}


module.exports = { calculatePriceAndQty, getTrades, postTrades, updateTrade, removeTrade, validateTrade, updateTradeDetails, deleteTrade }