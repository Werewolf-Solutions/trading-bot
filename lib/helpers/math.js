const roundNumber = (number, decimals) => {
    return Math.round((number)*Math.pow(10, decimals)) / Math.pow(10, decimals);
}

const valueFromTo = (value, from, to) => {
    if (from != to) {
        for (let i = 0; i < all_tickers.length; i++) {
            if (to === 'USDT') {
                let str = from + '_' + to;
                let coin_usdt = all_tickers.filter(ticker => ticker.i === str)[0];
                return value * coin_usdt.b;
            };
        };
    };
};

module.exports = {
    roundNumber,
    valueFromTo
}