const mongoose = require('mongoose');


const tradeSchema = mongoose.Schema({
    trade_id: {
        type: String,
        required: true
    },
    ticker_symbol: {
        type: String,
        uppercase: true,
        trim: true,
        required: true
    },
    price: {
        type: Number,
        min: 10,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        validate: {
            validator: Number.isInteger,
            message: '{VALUE} is not an integer value'
        }
    },
    side: {
        type: String,
        require: true,
        uppercase: true,
        trim: true,
        enum: ["BUY", "SELL"]
    },
    created: {
        type: Date,
        default: Date.now
    }
})


module.exports = mongoose.model('trade', tradeSchema);