const { sendTokens } = require('send-tokens');
const csv = require('csv-parser')
const fs = require('fs')
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const csvWriter = createCsvWriter({
    path: 'output.csv',
    header: [
        { id: 'name', title: 'name' },
        { id: 'wallet_address', title: 'wallet_address' },
        { id: 'amount', title: 'amount' },
        { id: 'decimals', title: 'decimals' },
        { id: 'gas_price', title: 'gas_price' },
        { id: 'token_address', title: 'token_address' },
        { id: 'txid', title: 'txid' },
    ]
});

const PRIVATE_KEY = process.env.PRIVATE_KEY;

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

function send(TOKEN_ADDRESS, RECIPIENT, amount, options = {}) {
    return new Promise(resolve => {
        sendTokens(TOKEN_ADDRESS, RECIPIENT, amount, {
            ...options,
            onTxId: resolve
        });
    })

}

const results = [];

fs.createReadStream('data.csv')
    .pipe(csv({ separator: ' ' }))
    .on('data', (data) => results.push(data))
    .on('end', async () => {

        const ouput = []
        for (let i = 0; i < results.length; i++) {
            try {
                const RECIPIENT = results[i].wallet_address;
                const TOKEN_ADDRESS = results[i].token_address;
                const decimals = results[i].decimals;
                const amount = results[i].amount;
                const gasPrice = results[i].gas_price;
                let receipt = await sendTokens(TOKEN_ADDRESS, RECIPIENT, amount,
                    {
                        key: PRIVATE_KEY,
                        decimals,
                        gasPrice,
                        //network: 'rinkeby',
                        log: 'log.txt'
                    });

                ouput.push({
                    ...results[i],
                    txid: receipt.transactionHash
                })
            } catch (e) {
                console.log(e)
                ouput.push({
                    ...results[i],
                    txid: e.message
                })
            }
        }

        csvWriter
            .writeRecords(ouput)
            .then(() => console.log('The CSV file was written successfully'));

    });