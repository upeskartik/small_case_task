const _ = require('lodash')

/**
 * validates the request (maxIntegerLimit, negative_qty, invalid side)
 *  
 */

const validateTrade = async (req, res, next) => {
    try {

        // check if have all paramters
        let tradeParameter = ["ticker_symbol", "price", "quantity", "side", "trade_id"];

        if (!Object.keys(req.body).every(key => tradeParameter.includes(key))) {
            return res.send({ msg: "Mandatory parameters or extra parameters sent" })
        }

        // convert the ticker_symbol and side to uppercase
        if (req.body.side == null || req.body.ticker_symbol == null)
            return res.json({ msg: "invalid side. Side must be BUY or SELL" })

        req.body.side = (req.body.side).trim().toUpperCase()
        req.body.ticker_symbol = (req.body.ticker_symbol).trim().toUpperCase()

        if (req.body.side != process.env.TRADE_TYPE_BUY && req.body.side != process.env.TRADE_TYPE_SELL)
            return res.json({ msg: "invalid side. Side must be BUY or SELL" })

        // check the price and quantity limit 
        let { price, quantity } = req.body;
        if (_.isString(price) || price < 0 || price > Number.MAX_SAFE_INTEGER || price == null) {
            return res.json({ msg: "invalid price" });
        }

        req.body.price = Number.parseFloat(price).toFixed(2);

        if (!Number.isSafeInteger(quantity) || quantity < 0)
            return res.json({ msg: "qty too large or not integer" })

        next();
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: err.message });
    }
};

module.exports = { validateTrade };