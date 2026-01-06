
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Helper to get a robust delivery code
function generateDeliveryCode(storeId: string) {
    const storePrefix = storeId.substring(0, 4).toUpperCase();
    const timestamp = Date.now().toString().substring(8); // last few digits
    const random = Math.floor(1000 + Math.random() * 9000); // 4 digit random
    return `DLV-${storePrefix}-${timestamp}-${random}`;
}

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const signature = req.headers.get('x-lenco-signature');
        const webhookSecret = process.env.LENCO_WEBHOOK_SECRET || 'mock-secret-for-dev';

        // 1. Signature Verification
        // Only verify if we are not in a purely local dev environment without the secret set,
        // OR enforce it strictly. For this user, let's allow bypassing if specific header 'x-mock-bypass' is present
        // just in case they want to continue manual testing easily.
        // But the plan says "Implement verification".

        if (process.env.NODE_ENV === 'production' || process.env.LENCO_WEBHOOK_SECRET) {
            if (!signature) {
                return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
            }
            const expectedSignature = crypto
                .createHmac('sha512', webhookSecret)
                .update(rawBody)
                .digest('hex');

            if (signature !== expectedSignature) {
                console.warn('[Lenco Webhook] Invalid signature. Got:', signature, 'Expected:', expectedSignature);
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
        }

        const body = JSON.parse(rawBody);

        // Normalize payload: support both flat structure and event-wrapped structure
        // Lenco often sends { event: '...', data: { ... } }
        let status = body.status;
        let transactionId = body.transactionId;
        let reference = body.reference;
        let eventType = body.event;

        if (body.data) {
            status = body.data.status || status;
            transactionId = body.data.transactionId || transactionId;
            reference = body.data.reference || reference;
        }

        // Map event types to status if status is missing
        if (!status && eventType) {
            if (eventType === 'transaction.successful') status = 'successful';
            if (eventType === 'transaction.failed') status = 'failed';
            // etc
        }

        console.log(`[Lenco Webhook] Processing: Ref=${reference}, Status=${status}, Event=${eventType}`);

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

        // Find the order
        const lookupValue = transactionId || reference;
        if (!lookupValue) {
            return NextResponse.json({ error: 'Missing identifying info' }, { status: 400 });
        }

        const { data: orders, error: findError } = await supabaseAdmin
            .from('orders')
            .select('id, store_id, status')
            .eq('escrow_transaction_id', lookupValue);

        if (findError) {
            console.error('[Lenco Webhook] DB Error:', findError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        if (!orders || orders.length === 0) {
            console.warn(`[Lenco Webhook] Order not found for: ${lookupValue}`);
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // 2. Handle Statuses
        const updates = orders.map(async (order: any) => {
            let updateData: any = { updated_at: new Date().toISOString() };
            let shouldUpdate = false;

            if (status === 'successful') {
                if (order.status !== 'paid_pending_delivery') {
                    updateData.status = 'paid_pending_delivery';
                    updateData.delivery_code = generateDeliveryCode(order.store_id);
                    shouldUpdate = true;
                    console.log(`[Lenco Webhook] Order ${order.id} marked PAID.`);
                }
            } else if (status === 'failed') {
                if (order.status !== 'payment_failed') {
                    updateData.status = 'payment_failed';
                    shouldUpdate = true;
                    console.log(`[Lenco Webhook] Order ${order.id} marked FAILED.`);
                }
            } else if (status === 'on_hold' || status === 'fraud_alert') {
                if (order.status !== 'on_hold') {
                    updateData.status = 'on_hold';
                    shouldUpdate = true;
                    console.log(`[Lenco Webhook] Order ${order.id} marked ON HOLD.`);
                }
            }

            if (shouldUpdate) {
                const { error: updateError } = await supabaseAdmin
                    .from('orders')
                    .update(updateData)
                    .eq('id', order.id);

                if (updateError) throw updateError;
            }
        });

        await Promise.all(updates);

        return NextResponse.json({ success: true, message: 'Processed' });

    } catch (error: any) {
        console.error('[Lenco Webhook] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
