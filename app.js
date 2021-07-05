// Import .env
require('dotenv').config()

var cryptoCOM = require('./lib/trading-bot/exchanges-connection/cryptoComApi')

// Crypto.com
const {
    CRYPTO_PUB_API_KEY,
    CRYPTO_SEC_API_KEY
} = process.env

var {
    roundNumber,
    valueFromTo
} = require('./lib/helpers/math')

var strategies = require('./lib/trading-bot/strategies/strategies')
const tradingBot = require('./lib/trading-bot/tradingBot')

var all_tickers
let start
let end
let time
var interval
let balance
const user = {
    strategies: [{
        id: 1,
        name: 'test1',
        type_: 'grid',
        depth: 0.15,
        volume: 2,
        amount_allocated: 8,
        currency: 'USD',
        n_grids: 4,
    },{
        id: 2,
        name: 'test2',
        type_: 'high_low',
        depth: 0.12,
        volume: 2,
        amount_allocated: 12,
        currency: 'USD',
    }],
    tradingBots: [{
        id: 1,
        pair: {
            i: 'ETH_BTC',
        },
        strategy: {
            id: 1,
            name: 'test1',
            type_: 'grid',
        },
        mode: 'live-trader', // enum: live-trader, paper-trader, backtest
        status: 'on', // on, off
        exchanges: ['crypto.com'],
    },{
        id: 2,
        pair: {
            i: 'ETH_BTC',
        },
        strategy: {
            id: 2,
            name: 'test2',
            type_: 'high_low',
        },
        mode: 'live-trader', // enum: live-trader, paper-trader, backtest
        status: 'on', // on, off
        exchanges: ['crypto.com'],
    }],
    exchanges: [{
        name: 'crypto.com',
        api_pub: CRYPTO_PUB_API_KEY,
        api_sec: CRYPTO_SEC_API_KEY,
    }]
}

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
let on = false

if (on) {
    startBot()
} else {
    stopBot()
}

async function stopBot() {
    tradingBot.off()
    console.log('Bot off.')
}

async function startBot() {
    let bot
    start = Date.now()
    // get the account balance
    let balances = await tradingBot.balance()
    // choosing the bot/s to use
    let tradingBots = [{
        id: 1,
    }]
    // start each bot & check account balances
    for (let i = 0; i < tradingBots.length; i++) {
        // get the right bot from user
        bot = user.tradingBots.filter(bot => bot.id === tradingBots[i].id)[0]
        // get the account balance for each coin
        let balance = balances.filter(bal => bot.pair.i.includes(bal.currency))
        // get right strategy from users
        let strategy = user.strategies.filter(strat => strat.id === bot.strategy.id)[0]
        // set bot with strategy
        user.tradingBots.forEach(bot => {
            if (bot.id === tradingBots[i].id) {
                bot.status = 'on'
                bot.strategy = strategy
                bot.balance = balance
            }
        })
        let orders = await tradingBot.on(bot)
        // bot.orders = orders
    }
    end = Date.now()
    time = end - start
    console.log(bot)
    console.log(`
    Execution time start tradingBot: ${time} ms

    Starting time: ${start}
    `)
}