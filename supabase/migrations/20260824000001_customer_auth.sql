-- A. Add user_id
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS user_id uuid NULL;

-- B. customers FK
ALTER TABLE public.customers
ADD CONSTRAINT customers_user_id_fk
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE SET NULL;

-- C. customers UNIQUE
ALTER TABLE public.customers
ADD CONSTRAINT customers_user_id_key
UNIQUE(user_id);

-- D. customers index
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);

-- E. customers customer policies
DROP POLICY IF EXISTS "Customers can view their own profile" ON public.customers;
DROP POLICY IF EXISTS "Customers can update their own profile" ON public.customers;

CREATE POLICY "Customers can view their own profile"
ON public.customers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Customers can update their own profile"
ON public.customers
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- F. orders customer policies
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can create their own orders" ON public.orders;

CREATE POLICY "Customers can view their own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = orders.customer_id
          AND c.user_id = auth.uid()
    )
);

CREATE POLICY "Customers can create their own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.customers c
        WHERE c.id = customer_id
          AND c.user_id = auth.uid()
    )
);

-- G. order_items customer policies
DROP POLICY IF EXISTS "Customers can view their own order items" ON public.order_items;
DROP POLICY IF EXISTS "Customers can create their own order items" ON public.order_items;

CREATE POLICY "Customers can view their own order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.orders o
        JOIN public.customers c
          ON c.id = o.customer_id
        WHERE o.id = order_items.order_id
          AND c.user_id = auth.uid()
    )
);

CREATE POLICY "Customers can create their own order items"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.orders o
        JOIN public.customers c
          ON c.id = o.customer_id
        WHERE o.id = order_id
          AND c.user_id = auth.uid()
    )
);
