const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const crypto = require("crypto-js");

// Get API keys from user signed in

// Crypto.com
const {
    CRYPTO_PUB_API_KEY,
    CRYPTO_SEC_API_KEY
} = process.env;
const lucky_number = 1;
var url;

// Connect to exchange

// Crypto.com

/**
 * PUBLIC ENDPOINTS
 * 
 * 
 * public/get-book                      100 requests per second each
 * public/get-ticker                    100 requests per second each
 * public/get-trades	                100 requests per second each
 * 
 * 
 * PRIVATE ENDPOINTS
 * 
 * 
 * private/create-order                 15 requests per 100ms each
 * private/cancel-order                 15 requests per 100ms each
 * private/cancel-all-orders            15 requests per 100ms each
 * private/margin/create-order          15 requests per 100ms each
 * private/margin/cancel-order          15 requests per 100ms each
 * private/margin/cancel-all-orders	    15 requests per 100ms each
 * private/get-order-detail             30 requests per 100ms
 * private/margin/get-order-detail	    30 requests per 100ms
 * private/get-trades                   1 requests per second
 * private/margin/get-trades	        1 requests per second
 * private/get-order-history            1 requests per second
 * private/margin/get-order-history	    1 requests per second
 * All others	                        3 requests per 100ms each
 */

const cryptoCOM_URL = "https://api.crypto.com/v2/";

// TODO: write response example for each endpoint
var cryptoCOM = {
    // PUBLIC ENDPOINTS
    /**
     * public/get-ticker
     * 
     * Response Attributes
     * 
     * i	number	Instrument Name, e.g. BTC_USDT, ETH_CRO, etc.
     * b	number	The current best bid price, null if there aren't any bids
     * k	number	The current best ask price, null if there aren't any asks
     * a	number	The price of the latest trade, null if there weren't any trades
     * t	number	Timestamp of the data
     * v	number	The total 24h traded volume
     * h	number	Price of the 24h highest trade
     * l	number	Price of the 24h lowest trade, null if there weren't any trades
     * c	number	24-hour price change, null if there weren't any trades} coin
     * 
     */
    ticker: (elm) => {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            let endpoint = 'public/get-ticker';
            url = cryptoCOM_URL + endpoint;
            
            xhr.open("GET", url);

            xhr.setRequestHeader('Content-Type', 'application/json');
        
            xhr.send();
        
            xhr.onload = () => {
                if (xhr.status != 200) {
                    console.log(`Error ${xhr.status}: ${xhr.statusText}`);
                    reject({ error: `Error ${xhr.status}`});
                } else {
                    const response = JSON.parse(xhr.responseText);
                    const tickers = response.result.data;
                    // console.log(`Enpoint ${endpoint} of crypto.com api called at ${Date(Date.now())}.`);
                    // console.log('\n\n');
                    if (elm === undefined) {
                        resolve(tickers);
                    } else {
                        const response = JSON.parse(xhr.responseText);
                        const tickers = response.result.data;
                        // console.log(`Enpoint ${endpoint} of crypto.com api called at ${Date(Date.now())}.`);
                        // console.log('\n\n');
                        if (elm === undefined) {
                            resolve(tickers);
                        } else {
                            if (elm.split('_').length === 1) { // only elm like 'BTC'
                                const coin_pairs = tickers.filter(ticker => {
                                    let symbol = ticker.i.toString();
                                    if (symbol.split('_')[0] === elm || symbol.split('_')[1] === elm) {
                                        return symbol.includes(elm);
                                    }                                
                                });
                                resolve(coin_pairs);
                            } else if (elm.split('_').length === 2) { // only elm is a pair like 'BTC_USDT'
                                const pairs = tickers.filter(ticker => {
                                    let symbol = ticker.i.toString();
                                    if (elm === symbol) {
                                        return elm;
                                    }
                                });
                                resolve(pairs);
                            }
                        }
                    }
                }
            }
        })
    },
    candleStick: (pair) => {
        return new Promise ((resolve, reject) => {

            let xhr = new XMLHttpRequest();
            endpoint = 'public/get-candlestick';
            url = cryptoCOM_URL + endpoint;

            const signRequest = (request, apiKey, apiSecret) => {
                const { id, method, params, nonce } = request;
              
                const paramsString =
                  params == null
                    ? ""
                    : Object.keys(params)
                        .sort()
                        .reduce((a, b) => {
                          return a + b + params[b];
                        }, "");
              
                const sigPayload = method + id + apiKey + paramsString + nonce;
              
                request.sig = crypto
                  .HmacSHA256(sigPayload, apiSecret)
                  .toString(crypto.enc.Hex);
              
                return request;
            };
              
            const apiKey = CRYPTO_PUB_API_KEY;
            const apiSecret = CRYPTO_SEC_API_KEY;            
            
            let request = {
                id: lucky_number,
                method: endpoint,
                api_key: CRYPTO_PUB_API_KEY,
                params: {
                    instrument_name: pair
                },
                nonce: new Date().getTime(),
            };

            const requestBody = JSON.stringify(signRequest(request, apiKey, apiSecret));

            xhr.open("GET", url, true);

            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.send(requestBody);
        
            xhr.onload = () => {
                console.log(xhr);
                if (xhr.status != 200) {
                    console.log(`Error ${xhr.status}: ${xhr.statusText}`);
                    reject({ error: `Error ${xhr.status}`});
                } else {
                    const response = JSON.parse(xhr.responseText);
                    // console.log(`Enpoint ${endpoint} of crypto.com api called at ${Date(Date.now())}.`);
                    resolve(response.result.instruments);
                }
            }
        });
    },
    getSymbols: () => {
        return new Promise ((resolve, reject) => {

            let xhr = new XMLHttpRequest();
            endpoint = 'public/get-instruments';
            url = cryptoCOM_URL + endpoint;
            
            xhr.open("GET", url);

            xhr.setRequestHeader('Content-Type', 'application/json');
        
            xhr.send();
        
            xhr.onload = () => {
                if (xhr.status != 200) {
                    console.log(`Error ${xhr.status}: ${xhr.statusText}`);
                    reject({ error: `Error ${xhr.status}`});
                } else {
                    const response = JSON.parse(xhr.responseText);
                    // console.log(`Enpoint ${endpoint} of crypto.com api called at ${Date(Date.now())}.`);
                    resolve(response.result.instruments);
                }
            }
        });
    },
    getBook: (pair, depth) => {
        return new Promise ((resolve, reject) => {

            let xhr = new XMLHttpRequest();
            endpoint = 'public/get-book';
            url = cryptoCOM_URL + endpoint;
            
            const signRequest = (request, apiKey, apiSecret) => {
                const { id, method, params, nonce } = request;
              
                const paramsString =
                  params == null
                    ? ""
                    : Object.keys(params)
                        .sort()
                        .reduce((a, b) => {
                          return a + b + params[b];
                        }, "");
              
                const sigPayload = method + id + apiKey + paramsString + nonce;
              
                request.sig = crypto
                  .HmacSHA256(sigPayload, apiSecret)
                  .toString(crypto.enc.Hex);
              
                return request;
            };
              
            const apiKey = CRYPTO_PUB_API_KEY;
            const apiSecret = CRYPTO_SEC_API_KEY;            
            
            let request = {
                id: lucky_number,
                method: endpoint,
                api_key: CRYPTO_PUB_API_KEY,
                params: {
                    instrument_name: pair
                },
                nonce: new Date().getTime(),
            };

            const requestBody = JSON.stringify(signRequest(request, apiKey, apiSecret));

            xhr.open("GET", url, true);

            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.send(requestBody);
        
            xhr.onload = () => {
                if (xhr.status != 200) {
                    console.log(`Error ${xhr.status}: ${xhr.statusText}`);
                    reject({ error: `Error ${xhr.status}`});
                } else {
                    const response = JSON.parse(xhr.responseText);
                    console.log(response);
                    // console.log(`Enpoint ${endpoint} of crypto.com api called at ${Date(Date.now())}.`);
                    resolve(response.result.instruments);
                }
            }
        });
    },
    // PRIVATE POINTS
    account: (coin) => {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            endpoint = 'private/get-account-summary';
            url = cryptoCOM_URL + endpoint;

            const signRequest = (request, apiKey, apiSecret) => {
                const { id, method, params, nonce } = request;
              
                const paramsString =
                  params == null
                    ? ""
                    : Object.keys(params)
                        .sort()
                        .reduce((a, b) => {
                          return a + b + params[b];
                        }, "");
              
                const sigPayload = method + id + apiKey + paramsString + nonce;
              
                request.sig = crypto
                  .HmacSHA256(sigPayload, apiSecret)
                  .toString(crypto.enc.Hex);
              
                return request;
            };
              
            const apiKey = CRYPTO_PUB_API_KEY;
            const apiSecret = CRYPTO_SEC_API_KEY;

            let request;
            
            if (coin) {
                request = {
                    id: lucky_number,
                    method: endpoint,
                    api_key: CRYPTO_PUB_API_KEY,
                    params: {
                        currency: coin
                    },
                    nonce: new Date().getTime(),
                };
            }else {
                request = {
                    id: lucky_number,
                    method: endpoint,
                    api_key: CRYPTO_PUB_API_KEY,
                    params: {},
                    nonce: new Date().getTime(),
                };
            }            

            const requestBody = JSON.stringify(signRequest(request, apiKey, apiSecret));

            xhr.open("POST", url, true);

            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.send(requestBody);

            xhr.onload = function() {
                if (xhr.status != 200) {
                    console.log(`Error ${xhr.status}: ${xhr.statusText}`);
                    reject({ error: `Error ${xhr.status}`});
                } else {
                    const response = JSON.parse(xhr.responseText);
                    // console.log(`Enpoint ${endpoint} of crypto.com api called at ${Date(Date.now())}.`);
                    const accounts = response.result.accounts;
                    var coins = [];
                    accounts.forEach(account => {
                        if (account.balance != 0 || account.available != 0 || account.order != 0 || account.stake != 0) {
                            coins.push(account);
                        }
                    });
                    setTimeout(() => resolve(coins), 100);
                    // resolve(coins);
                }
            }
        })        
    },
    openOrders: (pair) => {        
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            endpoint = 'private/get-open-orders';
            postUrl = cryptoCOM_URL + endpoint;

            const signRequest = (request, apiKey, apiSecret) => {
                const { id, method, params, nonce } = request;
                
                const paramsString =
                    params == null
                    ? ""
                    : Object.keys(params)
                        .sort()
                        .reduce((a, b) => {
                            return a + b + params[b];
                        }, "");
                
                const sigPayload = method + id + apiKey + paramsString + nonce;
                
                request.sig = crypto
                    .HmacSHA256(sigPayload, apiSecret)
                    .toString(crypto.enc.Hex);
                
                return request;
            };
                
            const apiKey = CRYPTO_PUB_API_KEY;
            const apiSecret = CRYPTO_SEC_API_KEY;

            let request;
            if (pair) {
                request = {
                    id: lucky_number,
                    method: endpoint,
                    api_key: CRYPTO_PUB_API_KEY,
                    params: {
                        instrument_name: pair
                    },
                    nonce: new Date().getTime(),
                };
            } else {
                request = {
                    id: lucky_number,
                    method: endpoint,
                    api_key: CRYPTO_PUB_API_KEY,
                    params: {},
                    nonce: new Date().getTime(),
                };
            }

            const requestBody = JSON.stringify(signRequest(request, apiKey, apiSecret));

            xhr.open("POST", postUrl, true);

            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.send(requestBody);

            xhr.onload = function() {
                if (xhr.status != 200) {
                    console.log(`Error ${xhr.status}: ${xhr.statusText}`);
                    reject({ error: `Error ${xhr.status}`});
                } else {
                    const response = JSON.parse(xhr.responseText);
                    const { count, order_list } = response.result;
                    // console.log(`Enpoint ${endpoint} of crypto.com api called for pair ${pair} at ${Date(Date.now())}.`);
                    if (count === 0) {
                        resolve({msg: 'No open orders.'});
                    }
                    resolve({ count, order_list });
                }
            };
        });
    },
    historyOrders: (pair) => {   
        // LIMIT 1 per 100ms
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            endpoint = 'private/get-order-history';
            postUrl = cryptoCOM_URL + endpoint;

            const signRequest = (request, apiKey, apiSecret) => {
                const { id, method, params, nonce } = request;
                
                const paramsString =
                    params == null
                    ? ""
                    : Object.keys(params)
                        .sort()
                        .reduce((a, b) => {
                            return a + b + params[b];
                        }, "");
                
                const sigPayload = method + id + apiKey + paramsString + nonce;
                
                request.sig = crypto
                    .HmacSHA256(sigPayload, apiSecret)
                    .toString(crypto.enc.Hex);
                
                return request;
            };
                
            const apiKey = CRYPTO_PUB_API_KEY;
            const apiSecret = CRYPTO_SEC_API_KEY;            

            if (pair) {
                request = {
                    id: lucky_number,
                    method: endpoint,
                    api_key: CRYPTO_PUB_API_KEY,
                    params: {
                        instrument_name: pair
                    },
                    nonce: new Date().getTime(),
                };
            } else {
                request = {
                    id: lucky_number,
                    method: endpoint,
                    api_key: CRYPTO_PUB_API_KEY,
                    params: {},
                    nonce: new Date().getTime(),
                };
            }

            const requestBody = JSON.stringify(signRequest(request, apiKey, apiSecret));

            xhr.open("POST", postUrl, true);

            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.send(requestBody);

            xhr.onload = function() {
                if (xhr.status != 200) {
                    console.log(`Error ${xhr.status}: ${xhr.statusText}`);
                    reject({ error: `Error ${xhr.status}`});
                } else {                    
                    const response = JSON.parse(xhr.responseText);
                    // console.log(`Enpoint ${endpoint} of crypto.com api called for pair ${pair} at ${Date(Date.now())}.`);
                    // console.log(response.result);
                    if (response.result.orderList === null) {
                        setTimeout(() => resolve({status: null}), 100);
                    }
                    setTimeout(() => resolve(response.result.order_list), 100);
                }
            };       
        });
    },    
    createOrder: (order) => {
        return new Promise((resolve, reject) => {
            const { price, side, symbol, volume } = order;
            let xhr = new XMLHttpRequest();
            endpoint = 'private/create-order';
            postUrl = cryptoCOM_URL + endpoint;

            const signRequest = (request, apiKey, apiSecret) => {
                const { id, method, params, nonce } = request;
                
                const paramsString =
                    params == null
                    ? ""
                    : Object.keys(params)
                        .sort()
                        .reduce((a, b) => {
                            return a + b + params[b];
                        }, "");
                
                const sigPayload = method + id + apiKey + paramsString + nonce;
                
                request.sig = crypto
                    .HmacSHA256(sigPayload, apiSecret)
                    .toString(crypto.enc.Hex);
                
                return request;
            };
                
            const apiKey = CRYPTO_PUB_API_KEY;
            const apiSecret = CRYPTO_SEC_API_KEY;            

            let request = {
                id: lucky_number,                
                method: endpoint,
                api_key: CRYPTO_PUB_API_KEY,
                params: {
                    instrument_name: symbol,
                    side: side,
                    type: 'LIMIT',
                    price: price,
                    quantity: volume,
                    client_oid: lucky_number
                },
                nonce: new Date().getTime(),
            };

            const requestBody = JSON.stringify(signRequest(request, apiKey, apiSecret));
            
            // resolve(order);
            
            xhr.open("POST", postUrl, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(requestBody);
            xhr.onload = function() {
                if (xhr.status != 200) {
                console.log(`Error ${xhr.status}: ${xhr.statusText}`);
                reject({ msg: `Error ${xhr.status}`, response: xhr.responseText });
                } else {
                    let response = JSON.parse(xhr.responseText);
                    // console.log(`Enpoint ${endpoint} of crypto.com api called at ${Date(Date.now())}.`);
                    const { order_id, client_oid } = response.result;
                    order.id = order_id;
                    resolve(order);
                }
            }
        })
    },
    deleteOrder: (symbol, order_id) => {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            endpoint = 'private/cancel-order';
            postUrl = cryptoCOM_URL + endpoint;

            const signRequest = (request, apiKey, apiSecret) => {
                const { id, method, params, nonce } = request;
                
                const paramsString =
                    params == null
                    ? ""
                    : Object.keys(params)
                        .sort()
                        .reduce((a, b) => {
                            return a + b + params[b];
                        }, "");
                
                const sigPayload = method + id + apiKey + paramsString + nonce;
                
                request.sig = crypto
                    .HmacSHA256(sigPayload, apiSecret)
                    .toString(crypto.enc.Hex);
                
                return request;
            };
                
            const apiKey = CRYPTO_PUB_API_KEY;
            const apiSecret = CRYPTO_SEC_API_KEY;            

            let request = {
                id: lucky_number,
                method: endpoint,
                api_key: CRYPTO_PUB_API_KEY,
                params: {
                    instrument_name: symbol,
                    order_id: order_id
                },
                nonce: new Date().getTime(),
            };

            const requestBody = JSON.stringify(signRequest(request, apiKey, apiSecret));

            xhr.open("POST", postUrl, true);

            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.send(requestBody);

            xhr.onload = function() {
                if (xhr.status != 200) {
                    console.log(`Error ${xhr.status}: ${xhr.statusText}`);
                    reject({ msg: `Error ${xhr.status}`});
                } else {
                    let response = JSON.parse(xhr.responseText);
                    // console.log(`Enpoint ${endpoint} of crypto.com api called at ${Date(Date.now())}.`);
                    resolve(response);
                }
            }
        })
    },
    deleteAllOrders: (symbol) => {
        return new Promise((resolve, reject) => {
            let xhr = new XMLHttpRequest();
            endpoint = 'private/cancel-all-orders';
            postUrl = cryptoCOM_URL + endpoint;

            const signRequest = (request, apiKey, apiSecret) => {
                const { id, method, params, nonce } = request;
                
                const paramsString =
                    params == null
                    ? ""
                    : Object.keys(params)
                        .sort()
                        .reduce((a, b) => {
                            return a + b + params[b];
                        }, "");
                
                const sigPayload = method + id + apiKey + paramsString + nonce;
                
                request.sig = crypto
                    .HmacSHA256(sigPayload, apiSecret)
                    .toString(crypto.enc.Hex);
                
                return request;
            };
                
            const apiKey = CRYPTO_PUB_API_KEY;
            const apiSecret = CRYPTO_SEC_API_KEY;            

            let request = {
                id: lucky_number,
                method: endpoint,
                api_key: CRYPTO_PUB_API_KEY,
                params: {
                    instrument_name: symbol
                },
                nonce: new Date().getTime(),
            };

            const requestBody = JSON.stringify(signRequest(request, apiKey, apiSecret));

            xhr.open("POST", postUrl, true);

            xhr.setRequestHeader('Content-Type', 'application/json');

            xhr.send(requestBody);

            xhr.onload = function() {
                if (xhr.status != 200) {
                    console.log(`Error ${xhr.status}: ${xhr.statusText}`);
                    reject({ msg: `Error ${xhr.status}`});
                } else {
                    let response = JSON.parse(xhr.responseText);
                    // console.log(`Enpoint ${endpoint} of crypto.com api called at ${Date(Date.now())}.`);
                    setTimeout(() => resolve(response), 100);
                }
            }
        })
    }
};

module.exports = cryptoCOM;