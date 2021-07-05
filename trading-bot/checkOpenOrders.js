var cryptoCOM = require('./exchanges-connection/cryptoComApi')

var tradingBot = require('./tradingBot')

var {
    roundNumber,
    valueFromTo
} = require('../helpers/math')

const BUY = {
    price: 0,
    side: 'BUY',
    symbol: 0,
    volume: 0
}

const SELL = {
    price: 0,
    side: 'SELL',
    symbol: 0,
    volume: 0
}

function AnotInB(arrayB) {
    return (arrayA_element) => {
        return arrayB.filter(arrayB_element => arrayB_element.order_id === arrayA_element.order_id).length == 0
    }
}

function AinB(arrayA, arrayB) {
    return arrayA.map((arrayA_element) => { 
        return arrayB.filter(arrayB_element => arrayB_element.order_id === arrayA_element.order_id)[0]
    })
}

// TODO: check amount sell and buy orders cause sometimes price movement too fast and it can't keep up
// TODO: send back error
// TODO: send back order filled + new orders

module.exports = checkOpenOrders = {
    grid: async (bot, price) => {
        start = Date.now()
        // console.log(`Start bot open_orders: ${bot.open_orders.length}`)
        let { order_list } = await cryptoCOM.openOrders(bot.pair.i)
        let symbols = await cryptoCOM.getSymbols()
        let open_orders = bot.open_orders
        // check if order_list is defined
        if (order_list !== undefined) {            
            // grab the grid orders left in open orders
            var grid_orders_left = (AinB(open_orders, order_list)).filter(el => el !== undefined)
            console.log(`
            Grid orders left: ${grid_orders_left.length}
            Bot orders: ${open_orders.length}
            `)
            console.log('------------------------------------')
            // if grid orders left are different from the strategy orders
            if (grid_orders_left.length < bot.strategy.n_grids) {
                // grab the order canceled
                var grid_order_canceled = open_orders.filter(AnotInB(order_list))[0]
                console.log('Order canceled or filled')
                console.log(grid_order_canceled)

                let all_tickers = await cryptoCOM.ticker()
                // grab symbol
                let symbol = symbols.filter(s => s.instrument_name === grid_order_canceled.instrument_name)[0]
                // grab pair updated
                let pair = (await cryptoCOM.ticker(bot.pair.i))[0]
                // prev buy order
                let prev_buy_order = price - (price*(bot.strategy.depth / 100))
                // prev sell order
                let prev_sell_order = price + (price*(bot.strategy.depth / 100))
                // next buy order
                let buy_grid = grid_order_canceled.price - (grid_order_canceled.price*(bot.strategy.depth / 100))
                // next sell order
                let sell_grid = grid_order_canceled.price + (grid_order_canceled.price*(bot.strategy.depth / 100))
                // prev last sell order
                let last_sell_grid = grid_order_canceled.price + (grid_order_canceled.price*(bot.strategy.depth / 100)*(bot.strategy.n_grids/2))
                // prev last buy order
                let last_buy_grid = grid_order_canceled.price - (grid_order_canceled.price*(bot.strategy.depth / 100)*(bot.strategy.n_grids/2))
                // av price of the pair
                let av_price = (pair.k + pair.b) / 2
                console.log(`
                Order closed or filled
                
                price: ${grid_order_canceled.price}
                side: ${grid_order_canceled.side}

                prev_price: ${price}

                prev buy order: ${prev_buy_order}
                next buy grid: ${buy_grid}
                ask: ${pair.k}
                ask price < prev buy order ? ${prev_buy_order > pair.k}

                prev sell order: ${prev_sell_order}
                next sell grid: ${sell_grid}
                bid: ${pair.b}
                bid price > prev sell order ? ${pair.b > prev_sell_order}
                `)
                // if av price now is lower then next buy order or higher then next sell order => order is been filled
                if (pair.k < prev_buy_order || pair.b > prev_sell_order) {
                    if (grid_order_canceled.side === 'SELL') {

                        // create opposite side order
                        BUY.price = roundNumber(buy_grid, symbol.price_decimals)
                        BUY.symbol = pair.i
                        BUY.volume = roundNumber(grid_order_canceled.quantity, symbol.quantity_decimals)
                        console.log('create opposite side order')
                        console.log(BUY)
                        await cryptoCOM.createOrder(BUY)

                        // create same order side but last grid
                        SELL.price = roundNumber(last_sell_grid, symbol.price_decimals)
                        SELL.symbol = pair.i
                        SELL.volume = roundNumber(grid_order_canceled.quantity, symbol.quantity_decimals)
                        console.log('create same order side but last grid')
                        console.log(SELL)
                        await cryptoCOM.createOrder(SELL)

                        // delete last order of opposite side, first element in descending open_orders
                        open_orders.sort((a, b) => a.price - b.price)
                        console.log('delete last order of opposite side, first element in descending open_orders')
                        console.log(open_orders[0])
                        await cryptoCOM.deleteOrder(open_orders[0].instrument_name, open_orders[0].order_id)

                    } else if (grid_order_canceled.side === 'BUY') {
                        // create opposite side order
                        SELL.price = roundNumber(sell_grid, symbol.price_decimals)
                        SELL.symbol = pair.i
                        SELL.volume = roundNumber(grid_order_canceled.quantity, symbol.quantity_decimals)
                        console.log('create opposite side order')
                        console.log(SELL)
                        await cryptoCOM.createOrder(SELL)

                        // create same order side but last grid
                        BUY.price = roundNumber(last_buy_grid, symbol.price_decimals)
                        BUY.symbol = pair.i
                        BUY.volume = roundNumber(grid_order_canceled.quantity, symbol.quantity_decimals)
                        console.log('create same order side but last grid')
                        console.log(BUY)
                        await cryptoCOM.createOrder(BUY)

                        // delete last order of opposite side, first element in ascending open_orders
                        open_orders.sort((a, b) => b.price - a.price)
                        console.log('delete last order of opposite side, first element in descending open_orders')
                        console.log(open_orders[0])
                        await cryptoCOM.deleteOrder(open_orders[0].instrument_name, open_orders[0].order_id)
                    }
                // else av price is still in depth order it's been canceled
                } else if (pair.k > prev_buy_order || pair.b < prev_sell_order) {
                    console.log(`${grid_order_canceled.side} Order closed but still in depth range so open again.`)
                    if (grid_order_canceled.side === 'SELL') {
                        // open SELL order with grid_order_canceled.price
                        SELL.price = roundNumber(grid_order_canceled.price, symbol.price_decimals)
                        SELL.symbol = grid_order_canceled.instrument_name
                        SELL.volume = roundNumber(grid_order_canceled.quantity, symbol.quantity_decimals)
                        await cryptoCOM.createOrder(SELL)
                    } else if (grid_order_canceled.side === 'BUY') {
                        // open BUY order with grid_order_canceled.price
                        BUY.price = roundNumber(grid_order_canceled.price, symbol.price_decimals)
                        BUY.symbol = grid_order_canceled.instrument_name
                        BUY.volume = roundNumber(grid_order_canceled.quantity, symbol.quantity_decimals)
                        await cryptoCOM.createOrder(BUY)
                    }
                }
            }
        } else {
            clearInterval(bot.interval)
            console.log({error: 'order_list = undefined', msg: 'Something went wrong. Try to start the bot again'})
        }
        let orders = await cryptoCOM.openOrders(bot.pair.i)
        if (orders.order_list !== undefined) {
            bot.open_orders = orders.order_list
            // console.log(`End bot open_orders: ${bot.open_orders.length}`)
        }
        end = Date.now()
        time = end - start
        // console.log(`Execution time check open orders: ${time} ms`)
    },
}