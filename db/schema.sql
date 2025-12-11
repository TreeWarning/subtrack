-- Create subscriptions table
CREATE TABLE subscriptions (
    subscription_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    default_price NUMERIC(10, 2),
    is_variable BOOLEAN NOT NULL DEFAULT FALSE,
    billing_cycle VARCHAR(50),
    start_date DATE NOT NULL,
    renewal_price NUMERIC(10, 2),
    trial_end_date DATE
);

-- Create monthly_payments table
CREATE TABLE monthly_payments (
    payment_id SERIAL PRIMARY KEY,
    subscription_id INTEGER NOT NULL,
    due_date DATE NOT NULL,
    amount_due NUMERIC(10, 2) NOT NULL,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    paid_date DATE,
    CONSTRAINT fk_subscription
        FOREIGN KEY (subscription_id)
        REFERENCES subscriptions (subscription_id)
        ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_monthly_payments_subscription_id ON monthly_payments(subscription_id);
CREATE INDEX idx_monthly_payments_due_date ON monthly_payments(due_date);
