const mongoose = require('mongoose');

const portifolioSchema = mongoose.Schema({
    ticker_symbol: {
        type: String,
        uppercase: true,
        trim: true,
        required: true
    },
    avg_price: {
        type: Number,
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
    active_status:{
        type: Boolean, 
        default: true
    },
    created: {
        type: Date,
        default: Date.now
    }
})


module.exports = mongoose.model('portfolio', portifolioSchema);