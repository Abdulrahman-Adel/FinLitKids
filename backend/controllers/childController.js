const db = require('../config/db');

// --- Child Controller Functions ---

// GET /api/child/dashboard
exports.getDashboardData = async (req, res, next) => {
    const childId = req.user.id; // Populated by 'protect' middleware

    try {
        // Use Promise.all to fetch data concurrently
        const [balanceResult, choresCountResult, goalsCountResult] = await Promise.all([
            // Fetch current balance
            db.query('SELECT balance FROM children WHERE id = $1', [childId]),
            // Fetch count of chores assigned to the child that are not yet Approved
            db.query("SELECT COUNT(*) FROM chores WHERE assigned_child_id = $1 AND status != 'Approved'", [childId]),
            // Fetch count of active savings goals (current_amount < target_amount)
            db.query('SELECT COUNT(*) FROM savings_goals WHERE child_id = $1 AND current_amount < target_amount', [childId])
        ]);

        // Basic check if child exists based on balance query
        if (balanceResult.rows.length === 0) {
            return res.status(404).json({ message: 'Child data not found.' });
        }

        const dashboardData = {
            balance: parseFloat(balanceResult.rows[0].balance).toFixed(2),
            pendingChoresCount: parseInt(choresCountResult.rows[0].count, 10),
            activeGoalsCount: parseInt(goalsCountResult.rows[0].count, 10),
            // Can add more data points here later (e.g., recent transactions)
        };

        res.status(200).json(dashboardData);

    } catch (err) {
        console.error('Get Child Dashboard Error:', err);
        next(err);
    }
};

// GET /api/child/chores
exports.getChildChores = async (req, res, next) => {
    const childId = req.user.id;
    const { status } = req.query; // Optional filter by status (e.g., 'Pending', 'Completed')

    let queryText = `
        SELECT
            id, title, description, points, status, created_at, updated_at
        FROM chores
        WHERE assigned_child_id = $1
    `;
    const queryParams = [childId];
    let paramIndex = 2;

    if (status) {
        // Validate status if necessary
        queryText += ` AND status = $${paramIndex++}`;
        queryParams.push(status);
    }

    queryText += ` ORDER BY created_at DESC`; // Show newest first

    try {
        const result = await db.query(queryText, queryParams);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Get Child Chores Error:', err);
        next(err);
    }
};

// PATCH /api/child/chores/:choreId/complete
exports.markChoreComplete = async (req, res, next) => {
    const childId = req.user.id;
    const { choreId } = req.params;

    try {
        // 1. Find the chore, ensure it's assigned to this child and is 'Pending'
        const findChoreQuery = `
            SELECT id, status
            FROM chores
            WHERE id = $1 AND assigned_child_id = $2`;
        const choreResult = await db.query(findChoreQuery, [choreId, childId]);

        if (choreResult.rows.length === 0) {
            return res.status(404).json({ message: 'Chore not found or not assigned to you.' });
        }

        const chore = choreResult.rows[0];

        if (chore.status !== 'Pending') {
            // Prevent marking already completed or approved chores as complete again
            return res.status(400).json({ message: `Chore is already ${chore.status}.` });
        }

        // 2. Update the chore status to 'Completed'
        const updateQuery = `
            UPDATE chores
            SET status = 'Completed', updated_at = NOW()
            WHERE id = $1
            RETURNING id, title, description, points, status, updated_at`; // Return updated chore details
        const updateResult = await db.query(updateQuery, [choreId]);

        res.status(200).json({
            message: 'Chore marked as completed. Awaiting parent approval.',
            chore: updateResult.rows[0]
        });

    } catch (err) {
        console.error('Mark Chore Complete Error:', err);
        next(err);
    }
};

// GET /api/child/savings-goals
exports.getChildSavingsGoals = async (req, res, next) => {
    const childId = req.user.id;

    try {
        const queryText = `
            SELECT id, name, target_amount, current_amount, created_at, updated_at
            FROM savings_goals
            WHERE child_id = $1
            ORDER BY created_at DESC`; // Show newest first

        const result = await db.query(queryText, [childId]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Get Child Savings Goals Error:', err);
        next(err);
    }
};

// POST /api/child/savings-goals
exports.createSavingsGoal = async (req, res, next) => {
    const childId = req.user.id;
    const { name, targetAmount } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Goal name is required.' });
    }
    if (targetAmount === undefined || targetAmount === null || typeof targetAmount !== 'number' || isNaN(targetAmount) || targetAmount <= 0) {
        return res.status(400).json({ message: 'Valid positive target amount is required.' });
    }
    const targetAmountNum = Number(targetAmount.toFixed(2));
    const goalName = name.trim();

    try {
        // Optional: Check for duplicate goal names for the same child?

        const queryText = `
            INSERT INTO savings_goals (child_id, name, target_amount)
            VALUES ($1, $2, $3)
            RETURNING id, name, target_amount, current_amount, created_at`;
        const queryParams = [childId, goalName, targetAmountNum];

        const result = await db.query(queryText, queryParams);
        const newGoal = result.rows[0];

        res.status(201).json({
            message: 'Savings goal created successfully.',
            goal: newGoal
        });
    } catch (err) {
        console.error('Create Child Savings Goal Error:', err);
        next(err);
    }
};

// POST /api/child/savings-goals/:goalId/contribute
exports.contributeToSavingsGoal = async (req, res, next) => {
    const childId = req.user.id;
    const { goalId } = req.params;
    let { amount } = req.body;

    // --- Validation ---
    if (amount === undefined || amount === null || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Invalid or non-positive contribution amount provided.' });
    }
    amount = Number(amount.toFixed(2)); // Ensure 2 decimal places

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Lock and get child's current balance
        const balanceQuery = 'SELECT balance FROM children WHERE id = $1 FOR UPDATE';
        const balanceResult = await client.query(balanceQuery, [childId]);
        if (balanceResult.rows.length === 0) {
            throw new Error('Child not found'); // Should not happen if authenticated
        }
        const currentBalance = parseFloat(balanceResult.rows[0].balance);

        // Check for sufficient funds
        if (currentBalance < amount) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(400).json({ message: 'Insufficient balance to make this contribution.' });
        }

        // 2. Lock and get goal details, verify ownership
        const goalQuery = `
            SELECT id, name, current_amount, target_amount
            FROM savings_goals
            WHERE id = $1 AND child_id = $2
            FOR UPDATE`;
        const goalResult = await client.query(goalQuery, [goalId, childId]);
        if (goalResult.rows.length === 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(404).json({ message: 'Savings goal not found or does not belong to you.' });
        }
        const goal = goalResult.rows[0];
        const currentGoalAmount = parseFloat(goal.current_amount);
        const targetGoalAmount = parseFloat(goal.target_amount);

        // 3. Check if goal is already met and cap contribution
        if (currentGoalAmount >= targetGoalAmount) {
             await client.query('ROLLBACK');
             client.release();
             return res.status(400).json({ message: 'This savings goal has already been met.' });
        }

        let effectiveAmount = amount;
        if (currentGoalAmount + amount > targetGoalAmount) {
            effectiveAmount = targetGoalAmount - currentGoalAmount;
            // Check if the capped amount is still affordable
            if (currentBalance < effectiveAmount) {
                await client.query('ROLLBACK');
                client.release();
                // This case is unlikely if initial check passed, but good to have
                return res.status(400).json({ message: 'Insufficient balance to contribute the remaining amount to meet the goal.' });
            }
        }
         effectiveAmount = Number(effectiveAmount.toFixed(2));

        // 4. Update child's balance (deduct)
        const newBalance = currentBalance - effectiveAmount;
        const updateBalanceQuery = 'UPDATE children SET balance = $1, updated_at = NOW() WHERE id = $2';
        await client.query(updateBalanceQuery, [newBalance.toFixed(2), childId]);

        // 5. Update savings goal current_amount (add)
        const newGoalAmount = currentGoalAmount + effectiveAmount;
        const updateGoalQuery = 'UPDATE savings_goals SET current_amount = $1, updated_at = NOW() WHERE id = $2';
        await client.query(updateGoalQuery, [newGoalAmount.toFixed(2), goalId]);

        // 6. Create transaction record
        const transactionDescription = `Contribution to goal: ${goal.name}`;
        const transactionType = 'GoalContribution';
        const insertTransactionQuery = `
            INSERT INTO transactions (child_id, type, description, amount, related_goal_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id`; // Amount is negative from child's perspective
        await client.query(insertTransactionQuery, [
            childId,
            transactionType,
            transactionDescription,
            -effectiveAmount, // Negative amount representing money moving out of main balance
            goalId
        ]);

        // Commit transaction
        await client.query('COMMIT');

        // 7. Fetch updated goal and child balance to return
        const finalGoalResult = await db.query('SELECT * FROM savings_goals WHERE id = $1', [goalId]);
        const finalBalanceResult = await db.query('SELECT balance FROM children WHERE id = $1', [childId]);

        res.status(200).json({
            message: `Successfully contributed ${effectiveAmount.toFixed(2)} to the goal.`, // Reflect potentially capped amount
            goal: finalGoalResult.rows[0],
            newBalance: parseFloat(finalBalanceResult.rows[0].balance).toFixed(2)
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Child Contribute to Goal Transaction Error:', err);
        next(err);
    } finally {
        client.release();
    }
};

// DELETE /api/child/savings-goals/:goalId
exports.deleteSavingsGoal = async (req, res, next) => {
    const childId = req.user.id;
    const { goalId } = req.params;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Find goal, verify ownership, get current amount, and lock rows
        const goalQuery = `
            SELECT id, name, current_amount
            FROM savings_goals
            WHERE id = $1 AND child_id = $2
            FOR UPDATE`;
        const goalResult = await client.query(goalQuery, [goalId, childId]);

        if (goalResult.rows.length === 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(404).json({ message: 'Savings goal not found or does not belong to you.' });
        }
        const goal = goalResult.rows[0];
        const refundAmount = parseFloat(goal.current_amount);

        // 2. If there is money in the goal, refund it to the child's main balance
        let newBalance = null;
        if (refundAmount > 0) {
            const balanceQuery = 'SELECT balance FROM children WHERE id = $1 FOR UPDATE';
            const balanceResult = await client.query(balanceQuery, [childId]);
            const currentBalance = parseFloat(balanceResult.rows[0].balance);
            newBalance = currentBalance + refundAmount;

            const updateBalanceQuery = 'UPDATE children SET balance = $1, updated_at = NOW() WHERE id = $2';
            await client.query(updateBalanceQuery, [newBalance.toFixed(2), childId]);

            // Create a transaction record for the refund
            const transactionDescription = `Refund from deleted goal: ${goal.name}`;
            const transactionType = 'GoalRefund';
            const insertTransactionQuery = `
                INSERT INTO transactions (child_id, type, description, amount, related_goal_id)
                VALUES ($1, $2, $3, $4, $5)`; // Amount is positive (income)
            await client.query(insertTransactionQuery, [
                childId,
                transactionType,
                transactionDescription,
                refundAmount,
                goalId
            ]);
        }

        // 3. Delete the savings goal
        const deleteGoalQuery = 'DELETE FROM savings_goals WHERE id = $1';
        await client.query(deleteGoalQuery, [goalId]);

        // Commit transaction
        await client.query('COMMIT');

        // Fetch the final balance if it was updated
        if (newBalance === null) {
            const finalBalanceResult = await db.query('SELECT balance FROM children WHERE id = $1', [childId]);
            newBalance = parseFloat(finalBalanceResult.rows[0].balance);
        }

        res.status(200).json({
            message: 'Savings goal deleted successfully.' + (refundAmount > 0 ? ` ${refundAmount.toFixed(2)} refunded to main balance.` : ''),
            newBalance: newBalance.toFixed(2)
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Delete Child Savings Goal Transaction Error:', err);
        next(err);
    } finally {
        client.release();
    }
};

// GET /api/child/transactions
exports.getChildTransactions = async (req, res, next) => {
    const childId = req.user.id;
    const { type, limit = 50, offset = 0 } = req.query; // Optional filter and pagination

    let queryText = `
        SELECT
            t.id, t.type, t.description, t.amount,
            t.related_chore_id, c.title as related_chore_title,
            t.related_goal_id, sg.name as related_goal_name,
            t.date
        FROM transactions t
        LEFT JOIN chores c ON t.related_chore_id = c.id
        LEFT JOIN savings_goals sg ON t.related_goal_id = sg.id
        WHERE t.child_id = $1
    `;
    const queryParams = [childId];
    let paramIndex = 2;

    if (type) {
        // Add validation for type if needed
        queryText += ` AND t.type = $${paramIndex++}`;
        queryParams.push(type);
    }

    queryText += ` ORDER BY t.date DESC`; // Order by most recent transaction first

    // Add pagination
    queryText += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(parseInt(limit, 10) || 50);
    queryParams.push(parseInt(offset, 10) || 0);

    try {
        const result = await db.query(queryText, queryParams);
        // Enhancement: Could add total count for better pagination
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Get Child Transactions Error:', err);
        next(err);
    }
};

// POST /api/child/transactions (Record Spending)
exports.recordSpending = async (req, res, next) => {
    const childId = req.user.id;
    let { description, amount } = req.body;

    // --- Validation ---
    if (!description || typeof description !== 'string' || description.trim() === '') {
        return res.status(400).json({ message: 'A description for the spending is required.' });
    }
    if (amount === undefined || amount === null || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Invalid or non-positive spending amount provided.' });
    }
    amount = Number(amount.toFixed(2)); // Ensure 2 decimal places, treat as positive for checks
    description = description.trim();

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Lock and get child's details (balance, limits)
        const childQuery = `
            SELECT balance, spending_limit, spending_limit_frequency
            FROM children
            WHERE id = $1
            FOR UPDATE`;
        const childResult = await client.query(childQuery, [childId]);
        if (childResult.rows.length === 0) {
            throw new Error('Child not found');
        }
        const child = childResult.rows[0];
        const currentBalance = parseFloat(child.balance);
        const spendingLimit = child.spending_limit ? parseFloat(child.spending_limit) : null;
        const limitFrequency = child.spending_limit_frequency; // 'Weekly' or 'Monthly'

        // 2. Check sufficient balance
        if (currentBalance < amount) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(400).json({ message: 'Insufficient balance for this spending.' });
        }

        // 3. Check spending limit if enabled
        if (spendingLimit !== null && limitFrequency) {
            let startDate;
            const now = new Date();
            if (limitFrequency === 'Weekly') {
                // Calculate the start of the current week (assuming week starts on Sunday)
                const dayOfWeek = now.getDay(); // 0 (Sun) to 6 (Sat)
                startDate = new Date(now);
                startDate.setDate(now.getDate() - dayOfWeek);
                startDate.setHours(0, 0, 0, 0);
            } else if (limitFrequency === 'Monthly') {
                // Calculate the start of the current month
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            }

            if (startDate) {
                const spendingQuery = `
                    SELECT COALESCE(SUM(ABS(amount)), 0) as total_spent
                    FROM transactions
                    WHERE child_id = $1
                      AND type = 'Spending'
                      AND date >= $2`; // Sum absolute spending since start date
                const spendingResult = await client.query(spendingQuery, [childId, startDate]);
                const totalSpentInPeriod = parseFloat(spendingResult.rows[0].total_spent);

                if (totalSpentInPeriod + amount > spendingLimit) {
                    await client.query('ROLLBACK');
                    client.release();
                    const remainingLimit = (spendingLimit - totalSpentInPeriod).toFixed(2);
                    return res.status(400).json({
                        message: `Spending limit exceeded. You can spend ${remainingLimit} more this ${limitFrequency.toLowerCase()}.`,
                        limit: spendingLimit.toFixed(2),
                        spent: totalSpentInPeriod.toFixed(2),
                        remaining: remainingLimit
                    });
                }
            }
        }

        // 4. Update child's balance
        const newBalance = currentBalance - amount;
        const updateBalanceQuery = 'UPDATE children SET balance = $1, updated_at = NOW() WHERE id = $2';
        await client.query(updateBalanceQuery, [newBalance.toFixed(2), childId]);

        // 5. Create transaction record
        const transactionType = 'Spending';
        const insertTransactionQuery = `
            INSERT INTO transactions (child_id, type, description, amount)
            VALUES ($1, $2, $3, $4)
            RETURNING id, type, description, amount, date`; // Store amount as negative
        const transactionResult = await client.query(insertTransactionQuery, [
            childId,
            transactionType,
            description,
            -amount // Store spending as a negative value
        ]);

        // Commit transaction
        await client.query('COMMIT');

        res.status(201).json({
            message: 'Spending recorded successfully.',
            transaction: transactionResult.rows[0],
            newBalance: newBalance.toFixed(2)
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Record Spending Transaction Error:', err);
        next(err);
    } finally {
        client.release();
    }
};

// --- Learning Modules (Conceptual Placeholders) ---

// GET /api/child/learning/modules
exports.getLearningModules = async (req, res, next) => {
    const childId = req.user.id;
    console.log(`Child ${childId} requested learning modules.`);
    // TODO: Implement actual logic to fetch modules based on child's profile/age?
    res.status(501).json({ message: 'Learning modules feature not implemented yet.', modules: [] });
};

// POST /api/child/learning/modules/:moduleId/complete
exports.completeLearningModule = async (req, res, next) => {
    const childId = req.user.id;
    const { moduleId } = req.params;
    console.log(`Child ${childId} attempting to complete learning module ${moduleId}.`);
    // TODO: Implement logic:
    // 1. Verify module exists.
    // 2. Check if child already completed it.
    // 3. Record completion in child_learning_progress table.
    // 4. Potentially award points/update balance (requires transaction).
    res.status(501).json({ message: `Completing learning module ${moduleId} not implemented yet.` });
};

// Add other child controller functions here... 