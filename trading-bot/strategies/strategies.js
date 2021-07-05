var cryptoCOM = require('../exchanges-connection/cryptoComApi');

var {
    roundNumber,
    valueFromTo
} = require('../../helpers/math');

const BUY = {
    price: 0,
    side: 'BUY',
    symbol: 0,
    volume: 0
};
const SELL = {
    price: 0,
    side: 'SELL',
    symbol: 0,
    volume: 0
};

module.exports = strategies = {
    grid: async (strategy, p) => {
        start = Date.now();
        var { depth, volume, amount_allocated, n_grids, max, min } = strategy;
        let pair = (await cryptoCOM.ticker(p.i))[0];
        let grids = [];
        let price = (pair.k + pair.b) / 2;
        depth = depth / 100;
        console.log(depth, volume, amount_allocated, n_grids, pair.i, pair.k, pair.b, price);
        if (n_grids === undefined) {
            n_grids = amount_allocated / volume;
        }
        for (let i = 1; i < (n_grids/2)+1; i++) {
            let b = price + ( price * depth * i);
            let c = price - ( price * depth * i);
            grids.push(b);
            grids.push(c);
        }
        grids.sort((a, b) => b - a);
        // create orders
        let grid_orders = await createOrders(grids, p, volume);
        // add grid[price now]
        grids.push(price);
        grids.sort((a, b) => b - a);
        end = Date.now();
        time = end - start;
        console.log(`Execution time grid strategy: ${time} ms`);
        return {price,grid_orders};
    },
    high_low: async () => {
        let COIN = 'BTC';
        let pair = 'ETH_CRO';
        let volume = 5; // in USD
        let order_limit = 1;
        let highest_pair;
        let lowest_pair;
        let depth = 10;
        var profit = 0;
        let usd_threshold = 2*volume;
        let available_pairs = [];
        let X = {};
        let COIN_USDT;
        let X_USDT;
        let X_COIN;
        let COIN_X;
        let Y = {};
        let Y_USDT;
        let X_Y;
        let Y_X;
        let maker_fee = 0.0009;
        let taker_fee = 0.00144;
        var exchanges = [{
            name: 'crypto.com',
            api_sec: 'api_sec',
            api_pub: 'api_pub',
        }];
    
        const BUY = {
            price: 0,
            side: 'BUY',
            symbol: 0,
            volume: 0
        };
        const SELL = {
            price: 0,
            side: 'SELL',
            symbol: 0,
            volume: 0
        };
    
        start = Date.now();
        
        for (let i = 0; i < exchanges.length; i++) {
            let exchange = getDataFromExchange(exchanges[i]);
            let account = loadAccount(exchanges[i]);
            exchanges[i].all_tickers = exchange.all_tickers;
            exchanges[i].symbols = exchange.symbols;
        };
        console.log(exchanges); 
    
        // get all the symbols
        const symbols = await cryptoCOM.getSymbols();
    
        // const test_pairs = await cryptoCOM.ticker(pair);
        // console.log(test_pairs);
    
        // get all tickers
        all_tickers = await cryptoCOM.ticker();
    
        // get only coin pairs
        // const coin_pairs = await cryptoCOM.ticker(COIN);
    
        
    
        // NOT WORKING ---------!!!
        // get the order book
        // const book = await cryptoCOM.getBook(pair, depth);
        // console.log(book);
    
        // get all coins in account
        // var account = [
        //     {
        //         balance: 1,
        //         available: 1,
        //         order: 0,
        //         stake: 0,
        //         currency: 'BTC'
        //     },{
        //         balance: 1,
        //         available: 1,
        //         order: 0,
        //         stake: 0,
        //         currency: 'ETH'
        //     },{
        //         balance: 10000,
        //         available: 10000,
        //         order: 0,
        //         stake: 0,
        //         currency: 'CRO'
        //     },{
        //         balance: 100,
        //         available: 100,
        //         order: 0,
        //         stake: 0,
        //         currency: 'AAVE'
        //     },{
        //         balance: 1000000,
        //         available: 10,
        //         order: 0,
        //         stake: 0,
        //         currency: 'VET'
        //     },{
        //         balance: 1000,
        //         available: 1000,
        //         order: 0,
        //         stake: 0,
        //         currency: 'USDT'
        //     }
        // ]
        const account = await cryptoCOM.account();
        // console.log(account);
    
        // get a specific coin in account
        // const coin_amount = await cryptoCOM.account(COIN);
    
        // NOT WORKING ---------!!!
        // get candlesticks
        // const candleStick = await cryptoCOM.candleStick(pair);
        // console.log(candleStick);
    
        // console.log(coin_pairs.length);
        // console.log(all_tickers[0]);
    
        /**
         * get secondary pairs for what's in balance
         * 
         */
        let secondary_pairs = [];
        for (let i = 0; i < account.length; i++) {
            if (!account[i].currency.includes('USD')) {
                account[i].available_in_USDTbid = valueFromTo(account[i].available, account[i].currency, 'USDT');
                // console.log(`${account[i].currency} ${account[i].available_in_USDTbid}`);
            }else {
                account[i].available_in_USDTbid = account[i].available;
            }       
            if (account[i].available_in_USDTbid >= usd_threshold) {
                secondary_pairs.push(account[i].currency);
            }
        };
        // console.log(secondary_pairs);
        var open_orders = [];        
        /**
         * get the available_pairs except pair with stablecoins (USD + DAI + ...)
         * 
         */
        for (let i = 0; i < account.length; i++) {
            /**
             * get open orders
             */
            for (let z = 0; z < secondary_pairs.length; z++) {
                let pair = account[i].currency + '_' + secondary_pairs[z];
                let ticker = all_tickers.filter(ticker => ticker.i === pair)[0];
                if (ticker != undefined) {
                    let open_order = await cryptoCOM.openOrders(ticker.i);
                    let order;
                    if (open_order.order_list && open_order.count != undefined) {
                        order = {
                            i: pair,
                            orders_list: open_order.order_list,
                            count: open_order.count
                        }
                        open_orders.push(order);
                    }else {
                        order = {
                            i: pair,
                            count: 0
                        }
                        open_orders.push(order);
                    }
                }
            }
            /**
             * check if balance is more then USD amount
             */        
            if (account[i].available_in_USDTbid >= usd_threshold) {
                for (let j = 0; j < all_tickers.length; j++) {
                    for (let k = 0; k < secondary_pairs.length; k++) {
                        if (all_tickers[j].i.split('_')[0] === account[i].currency && all_tickers[j].i.split('_')[1] === secondary_pairs[k] && !all_tickers[j].i.includes('USD')) {                        
                            available_pairs.push(all_tickers[j]);
                        }
                        if (all_tickers[j].i.split('_')[1] === account[i].currency && all_tickers[j].i.split('_')[0] === secondary_pairs[k] && !all_tickers[j].i.includes('USD')) {                        
                            available_pairs.push(all_tickers[j]);
                        }
                    }
                }
            }
        }
        console.log(open_orders.filter(order => order.count > 0));
        /**
         * create fake orders
         */
        // SELL.price = 0.05;
        // SELL.side = 'SELL';
        // SELL.symbol = 'ETH_BTC';
        // let symbol_one = symbols.filter(symbol => symbol.instrument_name === SELL.symbol)[0];
        // SELL.volume = roundNumber(0.003, symbol_one.quantity_decimals);
        // let orders = [];
        // let one = await cryptoCOM.createOrder(SELL);
        // orders.push(one);
        // SELL.price = 0.000009;
        // SELL.side = 'SELL';
        // SELL.symbol = 'CRO_BTC';
        // let symbol_two = symbols.filter(symbol => symbol.instrument_name === SELL.symbol)[0];
        // SELL.volume = roundNumber(72.25433526011561, symbol_two.quantity_decimals);
        // let two = await cryptoCOM.createOrder(SELL);
        // orders.push(two);
        // SELL.price = 0.08;
        // SELL.side = 'SELL';
        // SELL.symbol = 'CRO_USDT';
        // let symbol_three = symbols.filter(symbol => symbol.instrument_name === SELL.symbol)[0];
        // SELL.volume = roundNumber(72.25433526011561, symbol_three.quantity_decimals);
        // let three = await cryptoCOM.createOrder(SELL);
        // orders.push(three);
        // BUY.price = 700;
        // BUY.side = 'BUY';
        // BUY.symbol = 'ETH_USDT';
        // let symbol_four = symbols.filter(symbol => symbol.instrument_name === BUY.symbol)[0];
        // BUY.volume = roundNumber(0.003, symbol_four.quantity_decimals);
        // let four = await cryptoCOM.createOrder(BUY);
        // orders.push(four);
        // console.log(orders);
        // await cryptoCOM.deleteAllOrders(BUY.symbol);    
        /**
         * BID
         */
        for (let i = 0; i < available_pairs.length; i++) {
            /**
             * COIN_X
             */
            if (available_pairs[i].i.split('_')[0] === COIN && !available_pairs[i].i.includes('_USDT')) {
                /**
                 * BUY X with COIN (SELL COIN for X)
                 * price = COIN_X.k
                 * USDT price for 1 COIN = X_USDT.b * COIN_X.k
                 * 
                 * SELL X for USDT
                 * price = X_USDT.b
                 * 
                 * BUY COIN with USDT
                 * price = COIN_USDT.k
                 * 
                 * check if USDT price for 1 COIN > COIN_USDT.k (+ fees)
                 */
                X_USDT = all_tickers.filter(pair => pair.i === available_pairs[i].i.split('_')[1] + '_USDT')[0];
                COIN_X = available_pairs.filter(pair => pair.i === COIN +  '_' + available_pairs[i].i.split('_')[1])[0];
                COIN_USDT = all_tickers.filter(pair => pair.i === COIN + '_USDT')[0];
                X.i = COIN_X.i.split('_')[1];
                available_pairs[i].COIN_USDT_bid = X_USDT.b * COIN_X.k;
                // console.log(`${available_pairs[i].i}:\n`);
                // console.log(`\task: ${available_pairs[i].k}`);
                // console.log(`\tCOIN_USDT_bid: ${available_pairs[i].COIN_USDT_bid}`);
                // console.log(`\ttrading`);
                // console.log(`\t${X_USDT.i} @ ${X_USDT.b}`);
                // console.log(`\t${COIN_X.i} @ ${COIN_X.k}`);            
            }
            /**
             * X_COIN
             */
            if (available_pairs[i].i.split('_')[1] === COIN) {
                /**
                 * SELL COIN for X
                 * price = X_COIN.b
                 * USDT price for 1 COIN = X_USDT.b / X_COIN.b
                 * 
                 * SELL X for USDT
                 * price = X_USDT.b
                 * 
                 * BUY COIN with USDT
                 * price = COIN_USDT.k
                 * 
                 * check if USDT price for 1 COIN > COIN_USDT.k (+ fees)
                 */
                X_USDT = all_tickers.filter(pair => pair.i === available_pairs[i].i.split('_')[0] + '_USDT')[0];
                X_COIN = available_pairs.filter(pair => pair.i === available_pairs[i].i.split('_')[0] +  '_' + COIN)[0];
                X.i = X_COIN.i.split('_')[0];
                COIN_USDT = all_tickers.filter(pair => pair.i === COIN + '_USDT')[0];
                available_pairs[i].COIN_USDT_bid = X_USDT.b / X_COIN.b;            
                // console.log(`${available_pairs[i].i}:\n`);
                // console.log(`\tbid: ${available_pairs[i].b}`);
                // console.log(`\tCOIN_USDT_bid: ${available_pairs[i].COIN_USDT_bid}`);
                // console.log(`\ttrading`);
                // console.log(`\t${X_USDT.i} @ ${X_USDT.b}`);
                // console.log(`\t${X_COIN.i} @ ${X_COIN.k}`);
                // console.log(`\tSELL ${COIN} for ${X.i} @ ${X_COIN.b}`);
                // console.log(`\tSELL ${X.i} for USDT @ ${X_USDT.b}`);
                // console.log(`\tBUY ${COIN} with USDT @ ${COIN_USDT.k}`);
            }
            
        };
        /**
         * ASK
         */
        for (let i = 0; i < available_pairs.length; i++) {
            /**
             * COIN_X
             */
            if (available_pairs[i].i.split('_')[0] === COIN && !available_pairs[i].i.includes('_USDT')) {
                /**
                 * BUY COIN with X (SELL X for COIN)
                 * price = COIN_X.b
                 * USDT price for 1 COIN = X_USDT.b * COIN_X.k
                 * 
                 * check if USDT price for 1 COIN > COIN_USDT.k (+ fees)
                 */
                X_USDT = all_tickers.filter(pair => pair.i === available_pairs[i].i.split('_')[1] + '_USDT')[0];
                COIN_X = available_pairs.filter(pair => pair.i === COIN +  '_' + available_pairs[i].i.split('_')[1])[0];
                COIN_USDT = all_tickers.filter(pair => pair.i === COIN + '_USDT')[0];
                X.i = COIN_X.i.split('_')[1];
                available_pairs[i].COIN_USDT_ask = X_USDT.k * COIN_X.b;
                // console.log(`${available_pairs[i].i}:\n`);
                // console.log(`\tbid: ${available_pairs[i].b}`);
                // console.log(`\tCOIN_USDT_ask: ${available_pairs[i].COIN_USDT_ask}`);
                // console.log(`\ttrading`);
                // console.log(`\t${X_USDT.i} @ ${X_USDT.k}`);
                // console.log(`\t${COIN_X.i} @ ${COIN_X.b}`);
                // console.log(`\tBUY ${X.i} with ${COIN} (SELL ${COIN} for ${X.i}) @ ${COIN_X.k}`);                        
            }
            /**
             * X_COIN
             */
            if (available_pairs[i].i.split('_')[1] === COIN) {
                /**
                 * SELL X for COIN
                 * price = X_COIN.b
                 * USDT price for 1 COIN = X_USDT.k / X_COIN.b
                 * 
                 * check if USDT price for 1 COIN > COIN_USDT.k (+ fees)
                 */
                X_USDT = all_tickers.filter(pair => pair.i === available_pairs[i].i.split('_')[0] + '_USDT')[0];
                X_COIN = available_pairs.filter(pair => pair.i === available_pairs[i].i.split('_')[0] +  '_' + COIN)[0];
                X.i = X_COIN.i.split('_')[0];
                COIN_USDT = all_tickers.filter(pair => pair.i === COIN + '_USDT')[0];
                available_pairs[i].COIN_USDT_ask = X_USDT.k / X_COIN.b;
                // console.log(`${available_pairs[i].i}:\n`);
                // console.log(`\tbid: ${available_pairs[i].b}`);
                // console.log(`\tCOIN_USDT_ask: ${available_pairs[i].COIN_USDT_ask}`);
                // console.log(`\ttrading`);
                // console.log(`\t${X_USDT.i} @ ${X_USDT.k}`);
                // console.log(`\t${X_COIN.i} @ ${X_COIN.b}`);
                // console.log(`\tSELL ${X.i} for ${COIN} @ ${X_COIN.b}`);
            }
        };
        // delete if available_pairs[i] has no COIN_USDT_bid or COIN_USDT_ask
        for (let i = 0; i < available_pairs.length; i++) {
            if(!available_pairs[i].COIN_USDT_bid) {
                available_pairs.splice(i, 1);
            }
        }
        /**
         * get lowest pair price
         * 
         * available_pairs[0] after ascending sort
         */    
        available_pairs.sort((a, b) => a.COIN_USDT_ask - b.COIN_USDT_ask);
        lowest_pair = available_pairs[0];
        /**
         * get highest pair price
         * 
         * available_pairs[0] after descending sort
         */
        available_pairs.sort((a, b) => b.COIN_USDT_bid - a.COIN_USDT_bid);
        highest_pair = available_pairs[0];
    
    
        let diff = highest_pair.COIN_USDT_bid - lowest_pair.COIN_USDT_ask;
        console.log(`\nHighest pair (${highest_pair.i}) - Lowest pair (${lowest_pair.i}) = ${diff}$ for 1 ${COIN}`);
    
        let buy_volume;
        let sell_volume;
        let order_pair_bid = open_orders.filter(order => order.i === highest_pair.i)[0];
        let order_pair_ask = open_orders.filter(order => order.i === lowest_pair.i)[0];
        
        if (order_pair_bid.count < order_limit && order_pair_ask.count < order_limit && diff > 0) {
            if (lowest_pair.i != highest_pair.i) {
                /**
                 * make orders ASK
                 */
                console.log(`ASK ORDERS`);
                /**
                 * COIN_X
                 */
                if (lowest_pair.i.split('_')[0] === COIN) {
                    X_USDT = all_tickers.filter(pair => pair.i === lowest_pair.i.split('_')[1] + '_USDT')[0];
                    COIN_X = available_pairs.filter(pair => pair.i === COIN +  '_' + lowest_pair.i.split('_')[1])[0];
                    COIN_USDT = all_tickers.filter(pair => pair.i === COIN + '_USDT')[0];
                    X.i = COIN_X.i.split('_')[1];
                    Y.i = COIN_X.i.split('_')[1];
                    BUY.price = lowest_pair.b;
                    BUY.symbol = lowest_pair.i;
                    let symbol = symbols.filter(symbol => symbol.instrument_name === BUY.symbol)[0];
                    console.log(symbol);
                    BUY.volume = roundNumber(volume / COIN_USDT.k, symbol.quantity_decimals);
                    X.volume = BUY.volume;
                    await cryptoCOM.createOrder(BUY);
                    console.log(`\tBUY ${lowest_pair.i} @ ${lowest_pair.b}`);
                    console.log(`\t${X_USDT.i} @ ${X_USDT.k}`);
                    console.log(`\t${COIN_X.i} @ ${COIN_X.b}`);
                    console.log(`\tBUY ${X.i} with ${COIN} (SELL ${COIN} for ${X.i}) @ ${COIN_X.b}`);
                }
                /**
                 * X_COIN
                 */
                if (lowest_pair.i.split('_')[1] === COIN) {
                    X_USDT = all_tickers.filter(pair => pair.i === lowest_pair.i.split('_')[0] + '_USDT')[0];
                    X_COIN = available_pairs.filter(pair => pair.i === lowest_pair.i.split('_')[0] +  '_' + COIN)[0];
                    X.i = X_COIN.i.split('_')[0];
                    Y.i = X_COIN.i.split('_')[0];
                    SELL.price = lowest_pair.b;
                    SELL.symbol = lowest_pair.i;
                    let symbol = symbols.filter(symbol => symbol.instrument_name === SELL.symbol)[0];
                    SELL.volume = roundNumber(volume / X_USDT.k, symbol.quantity_decimals);
                    Y.volume = SELL.volume;
                    await cryptoCOM.createOrder(SELL);
                    COIN_USDT = all_tickers.filter(pair => pair.i === COIN + '_USDT')[0];
                    console.log(`\tSELL ${lowest_pair.i} @ ${lowest_pair.b}`);
                    console.log(`\t${X_USDT.i} @ ${X_USDT.k}`);
                    console.log(`\t${X_COIN.i} @ ${X_COIN.b}`);
                    console.log(`\tSELL ${X.i} for ${COIN} @ ${X_COIN.b}`);
                }
                /**
                 * make orders BID
                 */
                console.log(`BID ORDERS`);
                /**
                 * COIN_X
                 */
                if (highest_pair.i.split('_')[0] === COIN) {
                    X_USDT = all_tickers.filter(pair => pair.i === highest_pair.i.split('_')[1] + '_USDT')[0];
                    COIN_X = available_pairs.filter(pair => pair.i === COIN +  '_' + highest_pair.i.split('_')[1])[0];
                    COIN_USDT = all_tickers.filter(pair => pair.i === COIN + '_USDT')[0];
                    X.i = COIN_X.i.split('_')[1];
                    BUY.price = highest_pair.k;
                    BUY.symbol = highest_pair.i;
                    let symbol = symbols.filter(symbol => symbol.instrument_name === BUY.symbol)[0];
                    console.log(symbol);
                    BUY.volume = roundNumber(volume / COIN_USDT.k, symbol.quantity_decimals);
                    await cryptoCOM.createOrder(BUY);
                    console.log(`\tBUY ${highest_pair.i} @ ${highest_pair.k}`);
                    console.log(`\tBUY ${X.i} with ${COIN} (SELL ${COIN} for ${X.i}) @ ${COIN_X.k}`);
                    console.log(`\tSELL ${X.i} for USDT @ ${X_USDT.b}`);
                    SELL.price = X_USDT.b;
                    SELL.symbol = X_USDT.i;
                    SELL.volume = BUY.volume;
                    await cryptoCOM.createOrder(SELL);
                    Y_USDT = all_tickers.filter(pair => pair.i === Y + '_USDT')[0];
                    /**
                     * check if there is a X_Y or Y_X
                     */
                    Y_X = all_tickers.filter(pair => pair.i === Y + '_' + X)[0];
                    X_Y = all_tickers.filter(pair => pair.i === X + '_' + Y)[0];
                    if (X_Y != null) {
                        console.log(X_Y);
                        X_Y.Y_USDT_ask = X_Y.b / X_USDT.k;
                        console.log(X_Y.Y_USDT_ask);
                        /**
                         * check if X_Y in USDT price < Y_USDT price
                         * 
                         * SELL X_Y.b
                         * 
                         * else
                         * 
                         * SELL X_USDT.b and BUY Y_USDT.k
                         */
                        if (X_Y.Y_USDT_ask < Y_USDT.k ) {
                            console.log(`\tSELL ${X.i} for ${Y.i} @ ${X_Y.b}`);
                            SELL.price = X_Y.b;
                            SELL.symbol = X_Y.i;
                            SELL.volume = Y.volume;
                            await cryptoCOM.createOrder(SELL);
                        }else {
                            /**
                             * SELL X_USDT.b
                             */
                            console.log(`\tSELL ${X.i} for USDT @ ${X_USDT.b}`);
                            SELL.price = X_USDT.b;
                            SELL.symbol = X_USDT.i;
                            SELL.volume = X.volume;
                            await cryptoCOM.createOrder(SELL);
                            /**
                             * BUY Y_USDT.k
                             */
                            console.log(`\tBUY ${Y.i} for USDT @ ${Y_USDT.k}`);
                            BUY.price = Y_USDT.k;
                            BUY.symbol = Y_USDT.i;
                            BUY.volume = Y.volume;
                            await cryptoCOM.createOrder(BUY);
                        }
                    }else if (Y_X != null) {
                        console.log(Y_X);
                        Y_X.Y_USDT_ask = Y_X.k * X_USDT.k;
                        console.log(Y_X.Y_USDT_ask);
                        /**
                         * check if Y_X in USDT price < Y_USDT price
                         * 
                         * BUY Y_X.b
                         * 
                         * else
                         * 
                         * SELL X_USDT.b and BUY Y_USDT.k
                         */
                        if (Y_X.Y_USDT_ask < Y_USDT.k) {
                            console.log(`\tBUY ${Y.i} for ${X.i} @ ${Y_X.k}`);
                            BUY.price = Y_X.k;
                            BUY.symbol = Y_X.i;
                            BUY.volume = Y.volume;
                            await cryptoCOM.createOrder(BUY);
                        }else {
                            console.log(`\tSELL ${X.i} for USDT @ ${X_USDT.b}`);
                            SELL.price = X_USDT.b;
                            SELL.symbol = X_USDT.i;
                            SELL.volume = X.volume;
                            await cryptoCOM.createOrder(SELL);
                            console.log(`\tBUY ${Y.i} with USDT @ ${Y_USDT.k}`);
                            BUY.price = Y_USDT.k;
                            BUY.symbol = Y_USDT.i;
                            BUY.volume = Y.volume;
                            await cryptoCOM.createOrder(BUY);
                        }
                    }
    
    
                    // if yes compare to Y_USDT
    
                    // if Y_USDT < Y_USDT_bid or ask (Y_X or X_Y) use XY pair
    
                    // else SELL X_USDT.b and then BUY Y_USDT.k
    
    
                    if (COIN_USDT.k < lowest_pair.COIN_USDT_ask) {
                        console.log(`\tBUY ${COIN} with USDT @ ${COIN_USDT.k} because ${COIN} in USDT from ask ${lowest_pair.COIN_USDT_ask}`);
                        BUY.price = COIN_USDT.k;
                        BUY.symbol = COIN_USDT.i;
                        BUY.volume = volume;
                        await cryptoCOM.createOrder(BUY);
                    }                    
                }
                /**
                 * X_COIN
                 */
                if (highest_pair.i.split('_')[1] === COIN) {
                    X_USDT = all_tickers.filter(pair => pair.i === highest_pair.i.split('_')[0] + '_USDT')[0];
                    X_COIN = available_pairs.filter(pair => pair.i === highest_pair.i.split('_')[0] +  '_' + COIN)[0];
                    X.i = X_COIN.i.split('_')[0];
                    COIN_USDT = all_tickers.filter(pair => pair.i === COIN + '_USDT')[0];
                    BUY.price = highest_pair.b;
                    BUY.symbol = highest_pair.i;
                    let symbol = symbols.filter(symbol => symbol.instrument_name === BUY.symbol)[0];
                    BUY.volume = roundNumber(volume / X_USDT.b, symbol.quantity_decimals);
                    X.volume = BUY.volume;
                    await cryptoCOM.createOrder(BUY);
                    console.log(`\tBUY ${X_COIN.i} @ ${X_COIN.b}`);
                    console.log(`\tBUY ${COIN} for ${X.i} @ ${X_COIN.b}`);
                    console.log(`\tBUY ${X.i} for USDT @ ${X_USDT.b}`);
                    Y_USDT = all_tickers.filter(pair => pair.i === Y.i + '_USDT')[0];
                    /**
                     * check if there's an XY pair
                     */
                    Y_X = all_tickers.filter(pair => pair.i === Y.i + '_' + X.i)[0];
                    X_Y = all_tickers.filter(pair => pair.i === X.i + '_' + Y.i)[0];
                    if (X_Y != null) {
                        X_Y.Y_USDT_ask = X_Y.b / X_USDT.k;
                        console.log(X_Y.Y_USDT_ask);
                        /**
                         * check if X_Y in USDT price < Y_USDT price
                         * 
                         * SELL X_Y.b
                         * 
                         * else
                         * 
                         * SELL X_USDT.b and BUY Y_USDT.k
                         */
                        if (X_Y.Y_USDT_ask < Y_USDT.k ) {
                            console.log(`\tSELL ${X.i} for ${Y.i} @ ${X_Y.b}`);
                            SELL.price = X_Y.b;
                            SELL.symbol = X_Y.i;
                            SELL.volume = Y.volume;
                            await cryptoCOM.createOrder(SELL);
                        }else {
                            /**
                             * SELL X_USDT.b
                             */
                            console.log(`\tSELL ${X.i} for USDT @ ${X_USDT.b}`);
                            SELL.price = X_USDT.b;
                            SELL.symbol = X_USDT.i;
                            SELL.volume = X.volume;
                            await cryptoCOM.createOrder(SELL);
                            /**
                             * BUY Y_USDT.k
                             */
                            console.log(`\tBUY ${Y.i} for USDT @ ${Y_USDT.k}`);
                            BUY.price = Y_USDT.k;
                            BUY.symbol = Y_USDT.i;
                            BUY.volume = Y.volume;
                            await cryptoCOM.createOrder(BUY);
                        }
                    }else if (Y_X != null) {
                        Y_X.Y_USDT_ask = Y_X.k * X_USDT.k;
                        /**
                         * check if Y_X in USDT price < Y_USDT price
                         * 
                         * BUY Y_X.b
                         * 
                         * else
                         * 
                         * SELL X_USDT.b and BUY Y_USDT.k
                         */
                        if (Y_X.Y_USDT_ask < Y_USDT.k) {
                            console.log(`\tBUY ${Y.i} for ${X.i} @ ${Y_X.k}`);
                            BUY.price = Y_X.k;
                            BUY.symbol = Y_X.i;
                            BUY.volume = Y.volume;
                            await cryptoCOM.createOrder(BUY);
                        }else {
                            console.log(`\tSELL ${X.i} for USDT @ ${X_USDT.b}`);
                            SELL.price = X_USDT.b;
                            SELL.symbol = X_USDT.i;
                            SELL.volume = X.volume;
                            await cryptoCOM.createOrder(SELL);
                            console.log(`\tBUY ${Y.i} with USDT @ ${Y_USDT.k}`);
                            BUY.price = Y_USDT.k;
                            BUY.symbol = Y_USDT.i;
                            BUY.volume = Y.volume;
                            await cryptoCOM.createOrder(BUY);
                        }
                    }
                }
            }
        }
        end = Date.now();
        console.log(start, end, end - start);
    }
}

async function createOrders(grids, p, volume) {
    let all_tickers = await cryptoCOM.ticker();
    var symbols = await cryptoCOM.getSymbols();
    let symbol = symbols.filter(s => s.instrument_name === p.i)[0];
    let pair = (await cryptoCOM.ticker(p.i))[0];
    let COIN_USDT = all_tickers.filter(t => t.i === ((p.i.split('_')[0]+'_USDT')))[0];
    let open_orders = []
    let order
    
    for (let i = 0; i < grids.length; i++) {
        // second half BUY
        if (i > ((grids.length / 2) - 1)) {
            BUY.price = roundNumber(grids[i], symbol.price_decimals);
            BUY.symbol = pair.i;
            BUY.volume = roundNumber(volume / COIN_USDT.b, symbol.quantity_decimals);
            order = await cryptoCOM.createOrder(BUY);
            open_orders.push(order)
        // first half SELL
        }else {
            SELL.price = roundNumber(grids[i], symbol.price_decimals);
            SELL.symbol = pair.i;
            SELL.volume = roundNumber(volume / COIN_USDT.k, symbol.quantity_decimals);
            order = await cryptoCOM.createOrder(SELL);
            open_orders.push(order)
        }        
    }
    return open_orders
}