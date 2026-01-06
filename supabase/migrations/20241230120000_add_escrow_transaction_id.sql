-- Add escrow_transaction_id to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS escrow_transaction_id TEXT;
