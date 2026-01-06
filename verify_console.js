const crypto = require('crypto');
const http = require('http');

const SECRET = 'mock-secret-for-dev';

function log(message) {
    console.log(message);
}

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
            // Summarize body if too long/html
            if (responseBody.startsWith('<')) {
                log(`Response Body: HTML/Error (Length: ${responseBody.length})`);
            } else {
                log(`Response Body: ${responseBody}`);
            }
            log('-----------------------------------');
        });
    });

    req.on('error', error => {
        log(`Error: ${error.message}`);
    });

    req.write(data);
    req.end();
}

log('--- STARTING WEBHOOK VERIFICATION (CONSOLE) ---');

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

// 5. Missing Signature
sendWebhook({
    transactionId: "TEST-NO-SIG",
    status: "successful",
    reference: "test-ref-5"
}, null);
