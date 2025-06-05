
-- Ensure Row Level Security is enabled on the customers table
-- It might already be enabled if you've previously set policies,
-- but this ensures it if it's not.
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- ---
-- Policies for public.customers table for anonymous users
-- ---

-- Drop existing policies if they exist (optional, for a clean re-application)
DROP POLICY IF EXISTS "Allow anon select on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow anon insert on customers" ON public.customers;
DROP POLICY IF EXISTS "Allow anon update on customers" ON public.customers;

-- Policy: Allow anonymous users to SELECT customer records.
-- This is necessary for the `findCustomerByEmail` function used during checkout
-- to check if a customer already exists. The function itself performs the
-- specific filtering by email.
CREATE POLICY "Allow anon select on customers"
ON public.customers
FOR SELECT
TO anon
USING (true);

-- Policy: Allow anonymous users to INSERT new customer records.
-- This is necessary when a new user places an order and a customer
-- record needs to be created for them.
-- The `WITH CHECK (true)` clause means any insert attempt by 'anon' will be allowed
-- as long as it meets table constraints. Data validation should occur in server actions.
CREATE POLICY "Allow anon insert on customers"
ON public.customers
FOR INSERT
TO anon
WITH CHECK (true);

-- Policy: Allow anonymous users to UPDATE existing customer records.
-- This is necessary when an existing customer (identified by email, then ID)
-- places a new order, and their details (e.g., total_spent, last_order_date, address)
-- need to be updated.
-- The `USING (true)` clause allows updating any row if the specific customer_id is targeted
-- by the server action. The `WITH CHECK (true)` implies data validation happens server-side.
CREATE POLICY "Allow anon update on customers"
ON public.customers
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

COMMENT ON POLICY "Allow anon select on customers" ON public.customers IS 'Allows anonymous users to read customer data, typically for email lookups during checkout.';
COMMENT ON POLICY "Allow anon insert on customers" ON public.customers IS 'Allows anonymous users to create new customer records during checkout.';
COMMENT ON POLICY "Allow anon update on customers" ON public.customers IS 'Allows anonymous users to update customer records, e.g., when an existing customer places a new order.';
