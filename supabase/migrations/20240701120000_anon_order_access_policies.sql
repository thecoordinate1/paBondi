
-- Ensure RLS is enabled for the orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous users to read orders
-- The server-side 'findOrdersBySearchTerm' function is responsible
-- for ensuring only relevant orders are fetched based on user input.
CREATE POLICY "Anon users can select orders"
ON public.orders
FOR SELECT
TO anon
USING (true);

-- Policy: Allow anonymous users to insert new orders
-- This is necessary for the checkout process when users are not logged in.
CREATE POLICY "Anon users can insert orders"
ON public.orders
FOR INSERT
TO anon
WITH CHECK (true);

-- Ensure RLS is enabled for the order_items table
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous users to read order_items
-- The server-side 'getOrderDetailsById' function fetches items for specific orders.
CREATE POLICY "Anon users can select order_items"
ON public.order_items
FOR SELECT
TO anon
USING (true);

-- Policy: Allow anonymous users to insert new order_items
-- This is necessary for the checkout process.
CREATE POLICY "Anon users can insert order_items"
ON public.order_items
FOR INSERT
TO anon
WITH CHECK (true);

-- Note: You may also need to review/add RLS policies for 'customers' and 'products'
-- tables if anonymous users interact with them via server actions for SELECT, INSERT, or UPDATE.
-- For example, product stock updates and customer creation/updates during checkout.
-- The policies above specifically address viewing and creating orders/order_items.
