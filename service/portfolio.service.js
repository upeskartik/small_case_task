const Portfolio = require('../model/portfolio.model')

/**
 *get list of all the symbols own 
 *  
 * @param {JSON} filter query to get portfolio details
 * @returns list of all symbols owned
 */
const getPortfolio = async function (filter) {
    try {
        return await Portfolio.find(filter).select('ticker_symbol avg_price quantity -_id');
    } catch (err) {
        throw Error(err)
    }
}

/**
 * update the portfolio 
 * deactivate the symbol if the quantity is zero
 * 
 * @param {JSON}  query query to get portfolio details
 * @param {JSON} filter filter to check which portfolio to update
 * 
 */

const updatePortfolio = async function (query, filter) {
    try {

        console.log({ filter, query })
        console.log("Aaa")
        if (query.quantity === 0)
            return await Portfolio.findOneAndUpdate(filter, { quantity: query.quantity, active_status: false })

        query.active_status = true;
        return await Portfolio.findOneAndUpdate(filter, query);

    } catch (err) {
        throw Error(err)
    }
}

/**
 * Adds a new trade to portfolio
 * 
 * 
 */

const addTradeToPortfolio = async function (query) {
    try {

        console.log(query)
        const portfolio = new Portfolio(query);
        await portfolio.save()
        return Portfolio;
    } catch (err) {
        throw Error(err)
    }
}

/**
 * Calculates the total pnl of user based of current stock price
 * 
 * @param {Array} portfolio list of all the symbols own 
 * @returns pnl of the portfolio
 */

const getReturns = async function (portfolio) {
    try {

        let pnl = 0;

        let current_price = 100;

        for (let i = 0; i < portfolio.length; i++)
            pnl += (current_price - portfolio[i].avg_price) * current_price;

        return { pnl };
    } catch (err) {
        throw err;
    }
}


module.exports = { getReturs, addTradeToPortfolio, updatePortfolio, getPortfolio }