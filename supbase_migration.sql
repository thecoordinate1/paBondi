-- Rename tracking_number to delivery_code
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='tracking_number') THEN
        ALTER TABLE public.orders RENAME COLUMN tracking_number TO delivery_code;
    END IF;
END $$;

-- Rename shipping_method to delivery_tier
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='shipping_method') THEN
        ALTER TABLE public.orders RENAME COLUMN shipping_method TO delivery_tier;
    END IF;
END $$;

-- 1. Add escrow_transaction_id column
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS escrow_transaction_id text;

-- 2. Add service_fees column if it doesn't exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS service_fees numeric(10, 2) DEFAULT 0;

-- 3. DROP the auto-generation trigger for delivery_code
DROP TRIGGER IF EXISTS trg_set_delivery_code ON public.orders;
DROP FUNCTION IF EXISTS set_delivery_code_trigger_func();

-- 4. Enable Row Level Security (Recommended)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies for Anonymous/Guest Users
DROP POLICY IF EXISTS "Allow public insert" ON public.orders;
DROP POLICY IF EXISTS "Allow public select" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;

CREATE POLICY "Allow public insert" ON public.orders
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow public select" ON public.orders
    FOR SELECT
    TO public
    USING (true);



