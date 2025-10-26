-- =====================================================
-- Insert Subscription Plans and PayUMoney Configuration
-- =====================================================

-- Clean up existing plans (if any)
DELETE FROM subscription_plans;

-- Insert Free Plan
INSERT INTO subscription_plans (
  id,
  name,
  description,
  monthly_price,
  quarterly_price,
  annual_price,
  currency,
  features,
  limits,
  is_active,
  is_popular,
  sort_order
) VALUES (
  gen_random_uuid(),
  'Free',
  'Perfect for getting started with basic features',
  0.00,
  0.00,
  0.00,
  'INR',
  '["Up to 5 invoices per month", "1 user account", "Basic reporting", "Email support", "Mobile app access"]'::jsonb,
  '{"maxUsers": 1, "maxInvoicesPerMonth": 5, "maxCustomers": 10, "maxWarehouses": 1, "storageGB": 1}'::jsonb,
  true,
  false,
  1
);

-- Insert Basic Plan
INSERT INTO subscription_plans (
  id,
  name,
  description,
  monthly_price,
  quarterly_price,
  annual_price,
  currency,
  features,
  limits,
  is_active,
  is_popular,
  sort_order
) VALUES (
  gen_random_uuid(),
  'Basic',
  'Great for small businesses and startups',
  499.00,
  1347.00,
  4790.00,
  'INR',
  '["Unlimited invoices", "Up to 3 users", "Advanced reporting", "Priority email support", "Inventory management", "Multiple warehouses", "Custom branding", "Export data (CSV, PDF)"]'::jsonb,
  '{"maxUsers": 3, "maxInvoicesPerMonth": -1, "maxCustomers": 100, "maxWarehouses": 3, "storageGB": 5}'::jsonb,
  true,
  true,
  2
);

-- Insert Pro Plan
INSERT INTO subscription_plans (
  id,
  name,
  description,
  monthly_price,
  quarterly_price,
  annual_price,
  currency,
  features,
  limits,
  is_active,
  is_popular,
  sort_order
) VALUES (
  gen_random_uuid(),
  'Pro',
  'Ideal for growing businesses with advanced needs',
  999.00,
  2697.00,
  9590.00,
  'INR',
  '["Everything in Basic", "Up to 10 users", "CRM features (Leads, Deals, Activities)", "Expense management", "Purchase orders & invoices", "Advanced analytics", "API access", "24/7 phone & email support", "Accounting & Journal entries", "Multi-currency support"]'::jsonb,
  '{"maxUsers": 10, "maxInvoicesPerMonth": -1, "maxCustomers": 500, "maxWarehouses": 10, "storageGB": 20}'::jsonb,
  true,
  false,
  3
);

-- Insert Enterprise Plan
INSERT INTO subscription_plans (
  id,
  name,
  description,
  monthly_price,
  quarterly_price,
  annual_price,
  currency,
  features,
  limits,
  is_active,
  is_popular,
  sort_order
) VALUES (
  gen_random_uuid(),
  'Enterprise',
  'For large organizations with complex requirements',
  2499.00,
  6747.00,
  23990.00,
  'INR',
  '["Everything in Pro", "Unlimited users", "Dedicated account manager", "Custom integrations", "Advanced security features", "White-label options", "SLA guarantee", "Training & onboarding", "Custom workflows", "Unlimited storage", "Priority feature requests"]'::jsonb,
  '{"maxUsers": -1, "maxInvoicesPerMonth": -1, "maxCustomers": -1, "maxWarehouses": -1, "storageGB": -1}'::jsonb,
  true,
  false,
  4
);

-- Insert PayUMoney Configuration into platform_settings
INSERT INTO platform_settings (
  id,
  key,
  value,
  description
) VALUES (
  gen_random_uuid(),
  'payumoney_config',
  '{"merchantKey": "your_payumoney_merchant_key", "merchantSalt": "your_payumoney_merchant_salt", "mode": "test"}'::jsonb,
  'PayUMoney payment gateway configuration for subscription payments'
)
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Verify the insertion
SELECT 
  name, 
  monthly_price, 
  quarterly_price, 
  annual_price,
  is_active,
  is_popular,
  sort_order
FROM subscription_plans 
ORDER BY sort_order;

-- Display platform settings
SELECT key, value FROM platform_settings WHERE key = 'payumoney_config';
