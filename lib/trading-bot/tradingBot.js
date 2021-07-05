var cryptoCOM = require('./exchanges-connection/cryptoComApi')

var strategies = require('./strategies/strategies')

var checkOpenOrders = require('./checkOpenOrders')

var {
    roundNumber,
    valueFromTo
} = require('../helpers/math')

let interval
let open_orders

module.exports = tradingBot = {
    on: async (tradingBot) => {
        let orders
        // start each strategy and checkOpenOrders to update
        if (tradingBot.strategy.type_ === 'grid') {
            let {
                price,
                grid_orders
            } = await strategies.grid(tradingBot.strategy, tradingBot.pair)
            orders = await cryptoCOM.openOrders(tradingBot.pair.i)
            tradingBot.open_orders = orders.order_list;
            tradingBot.interval = setInterval(() => checkOpenOrders.grid(tradingBot, price), 3000)
        }
        return orders.order_list
    },
    off: (tradingBot) => {
        clearInterval(interval)
    },
    balance: async (tradingBot) => {
        return await cryptoCOM.account();
    }
}

async function checkOpenOrders(tradingBot, price, pair) {
    start = Date.now()
    let { order_list } = await cryptoCOM.openOrders(pair.i)
    let open_orders = tradingBot.open_orders
    if (tradingBot.strategy.type_ === 'grid') {
        if (order_list !== undefined) {
            console.log(`tradingBot.open_orders: ${tradingBot.open_orders.length}, order_list: ${order_list.length}, n_grids ${tradingBot.strategy.n_grids}`)
            if (open_orders.length > order_list.length && order_list.length < tradingBot.strategy.n_grids) {
                for (let i = 0; i < open_orders.length; i++) {
                    for (let j = 0; j < order_list.length; j++) {
                        if (open_orders[i].order_id === order_list[j].order_id) {
                            open_orders.splice(i, 1)
                            // clearInterval(interval)
                        }            
                    }
                }
                console.log(open_orders)
                let all_tickers = await cryptoCOM.ticker()
                let symbols = await cryptoCOM.getSymbols()
                let symbol = symbols.filter(s => s.instrument_name === open_orders[0].instrument_name)[0]
                let p = (await cryptoCOM.ticker(pair.i))[0]
                let COIN_USDT = all_tickers.filter(t => t.i === (open_orders[0].instrument_name))[0]
                for (let i = 0; i < tradingBot.strategies.length; i++) {
                    if (tradingBot.strategies[i].type_ === 'grid') {
                        // if price it's still in depth re-open same order else open opposite side order
                        let buy_grid = prev_price - (prev_price*(tradingBot.strategies[i].depth / 100))
                        let sell_grid = prev_price + (prev_price*(tradingBot.strategies[i].depth / 100))
                        let last_order_sell = prev_price + (prev_price*(tradingBot.strategies[i].depth / 100)*tradingBot.strategies[i].n_grids)
                        let last_order_buy = prev_price - (prev_price*(tradingBot.strategies[i].depth / 100)*tradingBot.strategies[i].n_grids)
                        let av_price = (p.k + p.b) / 2
                        console.log(buy_grid, av_price, sell_grid)
                        if (buy_grid > av_price || av_price > sell_grid) {
                            console.log(`${open_orders[0].side} Order filled.`)
                            if (open_orders[0].side === 'SELL') {

                                // create opposite side order
                                let buy_price = open_orders[0].price - (open_orders[0].price*(tradingBot.strategies[i].depth / 100))
                                BUY.price = roundNumber(buy_price, symbol.price_decimals)
                                BUY.symbol = pair.i
                                BUY.volume = roundNumber(open_orders[0].quantity, symbol.quantity_decimals);
                                await cryptoCOM.createOrder(BUY)

                                // create same order side but last grid
                                let sell_price = open_orders[0].price + (open_orders[0].price*(tradingBot.strategies[i].depth / 100)*tradingBot.strategies[i].n_grids)
                                SELL.price = roundNumber(sell_price, symbol.price_decimals)
                                SELL.symbol = pair.i
                                SELL.volume = roundNumber(open_orders[0].quantity, symbol.quantity_decimals)
                                await cryptoCOM.createOrder(SELL)

                                // delete last order of opposite side, first element in descending order_list
                                order_list.sort((a, b) => a.price - b.price)
                                await cryptoCOM.deleteOrder(order_list[0].instrument_name, order_list[0].id)

                            } else if (open_orders[0].side === 'BUY') {
                                // create opposite side order
                                let sell_price = open_orders[0].price + (open_orders[0].price*(tradingBot.strategies[i].depth / 100))
                                SELL.price = roundNumber(sell_price, symbol.price_decimals)
                                SELL.symbol = pair.i
                                SELL.volume = roundNumber(open_orders[0].quantity, symbol.quantity_decimals)
                                await cryptoCOM.createOrder(SELL)

                                // create same order side but last grid
                                let buy_price = open_orders[0].price - (open_orders[0].price*(tradingBot.strategies[i].depth / 100)*tradingBot.strategies[i].n_grids)
                                BUY.price = roundNumber(buy_price, symbol.price_decimals)
                                BUY.symbol = pair.i
                                BUY.volume = roundNumber(open_orders[0].quantity, symbol.quantity_decimals)
                                await cryptoCOM.createOrder(BUY)

                                // delete last order of opposite side, first element in ascending order_list
                                order_list.sort((a, b) => b.price - a.price)
                                await cryptoCOM.deleteOrder(order_list[0].instrument_name, order_list[0].id)

                            }
                        } else if (buy_grid < av_price || av_price < sell_grid) {
                            console.log(`${open_orders[0].side} Order closed but still in depth range so open again.`)
                            if (open_orders[0].side === 'SELL') {
                                // open BUY order with open_orders[0].price
                                SELL.price = roundNumber(open_orders[0].price, symbol.price_decimals)
                                SELL.symbol = open_orders[0].instrument_name
                                SELL.volume = roundNumber(open_orders[0].quantity, symbol.quantity_decimals)
                                await cryptoCOM.createOrder(SELL)
                            } else if (open_orders[0].side === 'BUY') {
                                // open SELL order with open_orders[0].price
                                BUY.price = roundNumber(open_orders[0].price, symbol.price_decimals)
                                BUY.symbol = pair.i
                                BUY.volume = roundNumber(open_orders[0].quantity, symbol.quantity_decimals)
                                await cryptoCOM.createOrder(BUY)
                            }
                        }
                    }
                    
                }
            }
        }
    }
    let orders = await cryptoCOM.openOrders(pair.i)
    tradingBot.open_orders = orders.order_list
    // console.log(`open orders: ${tradingBot.open_orders.length}, new open orders: ${order_list.length}, n_grids ${tradingBot.strategy.n_grids}`)
    end = Date.now()
    time = end - start
    // console.log(`Execution time check open orders: ${time} ms`)
}