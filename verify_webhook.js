const crypto = require('crypto');
const http = require('http');
const fs = require('fs');

const SECRET = 'mock-secret-for-dev';

function log(message) {
    fs.appendFileSync('verification_results.txt', message + '\n');
    console.log(message);
}

// Clear previous results
fs.writeFileSync('verification_results.txt', '');

function sendWebhook(payload, secretOverride) {
    const data = JSON.stringify(payload);
    const secret = secretOverride !== undefined ? secretOverride : SECRET;

    let signature = '';
    if (secret) {
        signature = crypto.createHmac('sha512', secret).update(data).digest('hex');
    }

    const options = {
        hostname: 'localhost',
        port: 9002,
        path: '/api/webhooks/lenco',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-lenco-signature': signature
        }
    };

    const req = http.request(options, res => {
        let responseBody = '';
        res.on('data', chunk => responseBody += chunk);
        res.on('end', () => {
            log(`Payload Status: ${payload.status}`);
            log(`Sent Signature: ${signature ? signature.substring(0, 10) + '...' : 'None'}`);
            log(`Response Code: ${res.statusCode}`);
            log(`Response Body: ${responseBody}`);
            log('-----------------------------------');
        });
    });

    req.on('error', error => {
        log(`Error: ${error.message}`);
    });

    req.write(data);
    req.end();
}

log('--- STARTING WEBHOOK VERIFICATION ---');

// 1. Success with Valid Signature
sendWebhook({
    transactionId: "TEST-SUCCESS-1",
    status: "successful",
    reference: "test-ref-1"
});

// 2. Failure with Valid Signature
sendWebhook({
    transactionId: "TEST-FAIL-1",
    status: "failed",
    reference: "test-ref-2"
});

// 3. Hold with Valid Signature
sendWebhook({
    transactionId: "TEST-HOLD-1",
    status: "on_hold",
    reference: "test-ref-3"
});

// 4. Invalid Signature
sendWebhook({
    transactionId: "TEST-INVALID-SIG",
    status: "successful",
    reference: "test-ref-4"
}, 'wrong-secret');

// 5. Missing Signature
sendWebhook({
    transactionId: "TEST-NO-SIG",
    status: "successful",
    reference: "test-ref-5"
}, null);
