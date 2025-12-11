const express = require('express');
const { Pool } = require('pg');
const router = express.Router();

// NOTE: The 'pool' object is now initialized in server.js and attached to req.pool
// The lines below are left as notes but are commented out because we use req.pool

// Middleware to parse JSON bodies
router.use(express.json());

// ==========================================
// Subscriptions Endpoints (/api/subscriptions)
// ==========================================

// POST /api/subscriptions: Create a new subscription
router.post('/subscriptions', async (req, res) => {
    const { name, category, default_price, is_variable, billing_cycle, start_date, renewal_price, trial_end_date } = req.body;

    try {
        const query = `
            INSERT INTO subscriptions (name, category, default_price, is_variable, billing_cycle, start_date, renewal_price, trial_end_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;
        const values = [name, category, default_price, is_variable, billing_cycle, start_date, renewal_price, trial_end_date];

        // *** FIX APPLIED: pool.query -> req.pool.query ***
        const result = await req.pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error creating subscription' });
    }
});

// GET /api/subscriptions: Retrieve all active subscriptions
router.get('/subscriptions', async (req, res) => {
    try {
        const query = 'SELECT * FROM subscriptions ORDER BY name ASC';
        // *** FIX APPLIED: pool.query -> req.pool.query ***
        const result = await req.pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error fetching subscriptions' });
    }
});

// PUT /api/subscriptions/:id: Update subscription details
router.put('/subscriptions/:id', async (req, res) => {
    const { id } = req.params;
    const { name, category, default_price, is_variable, billing_cycle, start_date, renewal_price, trial_end_date } = req.body;

    try {
        const query = `
            UPDATE subscriptions
            SET name = $1, category = $2, default_price = $3, is_variable = $4, billing_cycle = $5, start_date = $6, renewal_price = $7, trial_end_date = $8
            WHERE subscription_id = $9
            RETURNING *;
        `;
        const values = [name, category, default_price, is_variable, billing_cycle, start_date, renewal_price, trial_end_date, id];

        // *** FIX APPLIED: pool.query -> req.pool.query ***
        const result = await req.pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error updating subscription' });
    }
});

// DELETE /api/subscriptions/:id: Delete a subscription
router.delete('/subscriptions/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const query = 'DELETE FROM subscriptions WHERE subscription_id = $1 RETURNING *';
        // *** FIX APPLIED: pool.query -> req.pool.query ***
        const result = await req.pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Subscription not found' });
        }

        res.json({ message: 'Subscription deleted successfully', deletedSubscription: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error deleting subscription' });
    }
});

// ==========================================
// Monthly Payments Endpoints (/api/payments)
// ==========================================

// GET /api/payments/month/:year/:month: Retrieve payments due in a specific month
router.get('/payments/month/:year/:month', async (req, res) => {
    const { year, month } = req.params;

    try {
        const query = `
            SELECT mp.*, s.name as subscription_name, s.category, s.trial_end_date, s.renewal_price
            FROM monthly_payments mp
            JOIN subscriptions s ON mp.subscription_id = s.subscription_id
            WHERE EXTRACT(YEAR FROM mp.due_date) = $1
            AND EXTRACT(MONTH FROM mp.due_date) = $2
            ORDER BY mp.due_date ASC;
        `;

        // *** FIX APPLIED: pool.query -> req.pool.query ***
        const result = await req.pool.query(query, [year, month]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error fetching payments' });
    }
});

// POST /api/payments: Create a new monthly payment record
router.post('/payments', async (req, res) => {
    const { subscription_id, due_date, amount_due, is_paid, paid_date } = req.body;

    try {
        const query = `
            INSERT INTO monthly_payments (subscription_id, due_date, amount_due, is_paid, paid_date)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        // Default is_paid to false if not provided
        const values = [subscription_id, due_date, amount_due, is_paid || false, paid_date || null];

        // *** FIX APPLIED: pool.query -> req.pool.query ***
        const result = await req.pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error creating payment' });
    }
});

// POST /api/payments/generate: Generate recurring payments
router.post('/payments/generate', async (req, res) => {
    try {
        // 1. Fetch all active subscriptions
        // *** FIX APPLIED: pool.query -> req.pool.query ***
        const subscriptionsResult = await req.pool.query('SELECT * FROM subscriptions');
        const subscriptions = subscriptionsResult.rows;
        let generatedCount = 0;

        for (const sub of subscriptions) {
            // 2. Get the latest payment for this subscription
            // *** FIX APPLIED: pool.query -> req.pool.query ***
            const paymentsResult = await req.pool.query(
                'SELECT due_date FROM monthly_payments WHERE subscription_id = $1 ORDER BY due_date DESC LIMIT 1',
                [sub.subscription_id]
            );

            let nextDueDate;
            if (paymentsResult.rows.length === 0) {
                // No payments yet, start from start_date
                // Ensure we work with Date objects
                nextDueDate = new Date(sub.start_date);
            } else {
                // Calculate next date based on last payment
                const lastDueDate = new Date(paymentsResult.rows[0].due_date);
                nextDueDate = new Date(lastDueDate);

                if (sub.billing_cycle === 'Monthly') {
                    nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                } else if (sub.billing_cycle === 'Quarterly') {
                    nextDueDate.setMonth(nextDueDate.getMonth() + 3);
                } else if (sub.billing_cycle === 'Annually') {
                    nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
                }
            }

            // 3. Check if a payment already exists for this specific date
            // *** FIX APPLIED: pool.query -> req.pool.query ***
            const existingPayment = await req.pool.query(
                'SELECT payment_id FROM monthly_payments WHERE subscription_id = $1 AND due_date = $2',
                [sub.subscription_id, nextDueDate]
            );

            if (existingPayment.rows.length === 0) {
                // Insert new payment
                // Use default_price, or 0 if null
                const amountDue = sub.default_price || 0;

                // *** FIX APPLIED: pool.query -> req.pool.query ***
                await req.pool.query(
                    'INSERT INTO monthly_payments (subscription_id, due_date, amount_due, is_paid) VALUES ($1, $2, $3, $4)',
                    [sub.subscription_id, nextDueDate, amountDue, false]
                );
                generatedCount++;
            }
        }

        res.json({ message: 'Payment generation complete', generated: generatedCount });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error generating payments' });
    }
});

// PUT /api/payments/:id/amount: Update amount_due for a specific payment
router.put('/payments/:id/amount', async (req, res) => {
    const { id } = req.params;
    const { amount_due } = req.body;

    if (amount_due === undefined) {
        return res.status(400).json({ error: 'amount_due is required' });
    }

    try {
        const query = `
            UPDATE monthly_payments
            SET amount_due = $1
            WHERE payment_id = $2
            RETURNING *;
        `;
        // *** FIX APPLIED: pool.query -> req.pool.query ***
        const result = await req.pool.query(query, [amount_due, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Payment record not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error updating payment amount' });
    }
});

// PUT /api/payments/:id/paid: Toggle is_paid status
router.put('/payments/:id/paid', async (req, res) => {
    const { id } = req.params;
    const { is_paid } = req.body;

    if (is_paid === undefined) {
        return res.status(400).json({ error: 'is_paid status is required' });
    }

    try {
        let query;
        let values;

        if (is_paid) {
            // If marking as paid, set paid_date to current date (now())
            query = `
                UPDATE monthly_payments
                SET is_paid = $1, paid_date = CURRENT_DATE
                WHERE payment_id = $2
                RETURNING *;
            `;
            values = [true, id];
        } else {
            // If marking as unpaid, clear paid_date
            query = `
                UPDATE monthly_payments
                SET is_paid = $1, paid_date = NULL
                WHERE payment_id = $2
                RETURNING *;
            `;
            values = [false, id];
        }

        // *** FIX APPLIED: pool.query -> req.pool.query ***
        const result = await req.pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Payment record not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error updating payment status' });
    }
});

module.exports = router;