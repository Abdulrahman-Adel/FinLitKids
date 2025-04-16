const db = require('../config/db');
const bcrypt = require('bcrypt');

// --- Children Management ---

// GET /api/parent/children
exports.getChildren = async (req, res, next) => {
    // req.user is populated by protect middleware and verified by requireParent
    const parentId = req.user.id;
    try {
        const queryText = `
            SELECT
                id, name, balance, avatar_url, allowance_enabled, allowance_amount,
                allowance_frequency, spending_limit, spending_limit_frequency,
                created_at, updated_at
            FROM children
            WHERE parent_id = $1
            ORDER BY name ASC`; // Order alphabetically by name
        const result = await db.query(queryText, [parentId]);
        res.status(200).json(result.rows); // Send the array of children
    } catch (err) {
        console.error('Get Children Error:', err);
        next(err);
    }
};

// POST /api/parent/children
exports.createChild = async (req, res, next) => {
    const parentId = req.user.id;
    const { name, password } = req.body; // Child's username and initial password/PIN

    // Basic validation
    if (!name || !password) {
        return res.status(400).json({ message: 'Child name and password are required.' });
    }
    // Add more validation if needed (e.g., password complexity, name length)

    try {
        // Check if child name already exists for this parent
        const existingChild = await db.query(
            'SELECT id FROM children WHERE parent_id = $1 AND name = $2',
            [parentId, name]
        );
        if (existingChild.rows.length > 0) {
            return res.status(409).json({ message: `A child with the name "${name}" already exists.` });
        }

        // Hash the child's password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert new child record
        const queryText = `
            INSERT INTO children(parent_id, name, password_hash)
            VALUES($1, $2, $3)
            RETURNING id, name, parent_id, balance, avatar_url, created_at`; // Return relevant fields
        const queryParams = [parentId, name, passwordHash];
        const result = await db.query(queryText, queryParams);
        const newChild = result.rows[0];

        res.status(201).json({
            message: 'Child profile created successfully.',
            child: newChild
        });

    } catch (err) {
        console.error('Create Child Error:', err);
        next(err);
    }
};

// GET /api/parent/children/:childId
exports.getChildById = async (req, res, next) => {
    const parentId = req.user.id;
    const { childId } = req.params;
    try {
        const queryText = `
            SELECT
                id, name, balance, avatar_url, allowance_enabled, allowance_amount,
                allowance_frequency, spending_limit, spending_limit_frequency,
                created_at, updated_at
            FROM children
            WHERE id = $1 AND parent_id = $2`; // Ensure child belongs to the requesting parent
        const queryParams = [childId, parentId];
        const result = await db.query(queryText, queryParams);

        if (result.rows.length === 0) {
            // Child not found or does not belong to this parent
            return res.status(404).json({ message: 'Child not found.' });
        }

        res.status(200).json(result.rows[0]); // Send the child object
    } catch (err) {
        console.error('Get Child By ID Error:', err);
        next(err);
    }
};

// PUT /api/parent/children/:childId
exports.updateChild = async (req, res, next) => {
    const parentId = req.user.id;
    const { childId } = req.params;
    const updates = req.body;
    // Separate password update as it needs hashing
    const { password, ...otherUpdates } = updates;

    // Basic validation: Ensure at least one field is being updated
    if (Object.keys(otherUpdates).length === 0 && !password) {
        return res.status(400).json({ message: 'No update data provided.' });
    }

    // Fields allowed to be updated directly (match DB columns)
    const allowedFields = [
        'name', 'avatar_url', 'allowance_enabled', 'allowance_amount',
        'allowance_frequency', 'spending_limit', 'spending_limit_frequency'
    ];

    const fieldsToUpdate = [];
    const values = [];
    let paramIndex = 1;

    // Build the SET part of the query dynamically for non-password fields
    for (const field of allowedFields) {
        if (otherUpdates.hasOwnProperty(field)) {
            fieldsToUpdate.push(`${field} = $${paramIndex++}`);
            values.push(otherUpdates[field]);
        }
    }

    // Handle password update separately
    let passwordHash = null;
    if (password) {
        try {
            const saltRounds = 10;
            passwordHash = await bcrypt.hash(password, saltRounds);
            fieldsToUpdate.push(`password_hash = $${paramIndex++}`);
            values.push(passwordHash);
        } catch (hashError) {
            console.error('Password Hashing Error:', hashError);
            return next(hashError); // Pass hashing error to error handler
        }
    }

    // Add updated_at timestamp
    fieldsToUpdate.push(`updated_at = NOW()`);

    // Add childId and parentId to the values array for the WHERE clause
    values.push(childId); // $${paramIndex++}
    values.push(parentId); // $${paramIndex++}

    if (fieldsToUpdate.length <= 1) { // Only updated_at was added if no fields provided
         return res.status(400).json({ message: 'No valid update fields provided.' });
    }

    try {
        // Construct the final query
        const queryText = `
            UPDATE children
            SET ${fieldsToUpdate.join(', ')}
            WHERE id = $${paramIndex - 1} AND parent_id = $${paramIndex}
            RETURNING id, name, balance, avatar_url, allowance_enabled, allowance_amount,
                      allowance_frequency, spending_limit, spending_limit_frequency,
                      created_at, updated_at`; // Return updated data

        const result = await db.query(queryText, values);

        if (result.rows.length === 0) {
            // Child not found or does not belong to this parent
            return res.status(404).json({ message: 'Child not found or update failed.' });
        }

        res.status(200).json({
            message: 'Child profile updated successfully.',
            child: result.rows[0]
        });

    } catch (err) {
        console.error('Update Child Error:', err);
        next(err);
    }
};

// DELETE /api/parent/children/:childId
exports.deleteChild = async (req, res, next) => {
    const parentId = req.user.id;
    const { childId } = req.params;
    try {
        // Ensure the child belongs to the requesting parent before deleting
        const queryText = 'DELETE FROM children WHERE id = $1 AND parent_id = $2';
        const queryParams = [childId, parentId];
        const result = await db.query(queryText, queryParams);

        if (result.rowCount === 0) {
            // Child not found or does not belong to this parent
            return res.status(404).json({ message: 'Child not found or you do not have permission to delete.' });
        }

        // Deletion successful (rowCount === 1)
        // Database constraints (ON DELETE CASCADE/SET NULL) handle related data
        res.status(200).json({ message: 'Child profile deleted successfully.' });

    } catch (err) {
        console.error('Delete Child Error:', err);
        next(err);
    }
};

// POST /api/parent/children/:childId/balance
exports.adjustChildBalance = async (req, res, next) => {
    const parentId = req.user.id;
    const { childId } = req.params;
    let { amount, description } = req.body; // Amount can be positive or negative

    // --- Validation ---
    if (amount === undefined || amount === null || typeof amount !== 'number' || isNaN(amount)) {
        return res.status(400).json({ message: 'Invalid amount provided. Must be a number.' });
    }
    if (!description || typeof description !== 'string' || description.trim() === '') {
        return res.status(400).json({ message: 'A description is required for the adjustment.' });
    }
    amount = Number(amount.toFixed(2)); // Ensure 2 decimal places
    description = description.trim();

    // Get a client from the pool for transaction
    const client = await db.pool.connect();

    try {
        // Start transaction
        await client.query('BEGIN');

        // 1. Verify child belongs to parent and get current balance
        const childCheckQuery = 'SELECT balance FROM children WHERE id = $1 AND parent_id = $2 FOR UPDATE';
        // Use FOR UPDATE to lock the row during the transaction
        const childCheckResult = await client.query(childCheckQuery, [childId, parentId]);

        if (childCheckResult.rows.length === 0) {
            await client.query('ROLLBACK'); // Rollback before sending error
            client.release();
            return res.status(404).json({ message: 'Child not found or does not belong to this parent.' });
        }

        const currentBalance = parseFloat(childCheckResult.rows[0].balance);
        const newBalance = currentBalance + amount;

        // Optional: Check if spending adjustment would result in negative balance if needed
        // if (newBalance < 0) {
        //     await client.query('ROLLBACK');
        //     client.release();
        //     return res.status(400).json({ message: 'Adjustment results in negative balance.' });
        // }

        // 2. Update child's balance
        const updateBalanceQuery = 'UPDATE children SET balance = $1, updated_at = NOW() WHERE id = $2';
        await client.query(updateBalanceQuery, [newBalance.toFixed(2), childId]);

        // 3. Create transaction record
        const transactionType = 'ManualAdjustment';
        const insertTransactionQuery = `
            INSERT INTO transactions (child_id, type, description, amount)
            VALUES ($1, $2, $3, $4)
            RETURNING id, date`;
        const transactionResult = await client.query(insertTransactionQuery, [childId, transactionType, description, amount]);

        // Commit transaction
        await client.query('COMMIT');

        // Respond with success
        res.status(200).json({
            message: 'Balance adjusted successfully.',
            newBalance: newBalance.toFixed(2),
            transactionId: transactionResult.rows[0].id,
            transactionDate: transactionResult.rows[0].date
        });

    } catch (err) {
        // Rollback transaction in case of error
        await client.query('ROLLBACK');
        console.error('Adjust Child Balance Transaction Error:', err);
        next(err); // Pass error to the generic error handler
    } finally {
        // Release the client back to the pool
        client.release();
    }
};

// --- Chore Management Controllers ---

// GET /api/parent/chores
exports.getChores = async (req, res, next) => {
    const parentId = req.user.id;
    const { assignedChildId, status } = req.query; // Optional filters

    let queryText = `
        SELECT
            c.id, c.title, c.description, c.points, c.status,
            c.assigned_child_id, ch.name as assigned_child_name,
            c.created_at, c.updated_at
        FROM chores c
        LEFT JOIN children ch ON c.assigned_child_id = ch.id
        WHERE c.parent_id = $1
    `;
    const queryParams = [parentId];
    let paramIndex = 2;

    if (assignedChildId) {
        queryText += ` AND c.assigned_child_id = $${paramIndex++}`;
        queryParams.push(assignedChildId);
    }
    if (status) {
        // Add validation for status if needed (e.g., check if it's one of the allowed ENUMs)
        queryText += ` AND c.status = $${paramIndex++}`;
        queryParams.push(status);
    }

    queryText += ` ORDER BY c.created_at DESC`; // Order by most recent

    try {
        const result = await db.query(queryText, queryParams);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Get Chores Error:', err);
        next(err);
    }
};

// POST /api/parent/chores
exports.createChore = async (req, res, next) => {
    const parentId = req.user.id;
    const { title, points, assignedChildId, description } = req.body;

    // Basic validation
    if (!title || points === undefined || points === null || typeof points !== 'number' || points < 0) {
        return res.status(400).json({ message: 'Chore title and non-negative points are required.' });
    }
    // Optional: Validate assignedChildId exists and belongs to parent if provided

    try {
        const queryText = `
            INSERT INTO chores(parent_id, title, points, assigned_child_id, description)
            VALUES($1, $2, $3, $4, $5)
            RETURNING id, title, points, assigned_child_id, description, status, created_at`;
        const queryParams = [parentId, title, Math.round(points), assignedChildId || null, description || null];
        const result = await db.query(queryText, queryParams);
        const newChore = result.rows[0];

        res.status(201).json({
            message: 'Chore created successfully.',
            chore: newChore
        });

    } catch (err) {
        console.error('Create Chore Error:', err);
        next(err);
    }
};

// GET /api/parent/chores/:choreId
exports.getChoreById = async (req, res, next) => {
    const parentId = req.user.id;
    const { choreId } = req.params;

    try {
        const queryText = `
            SELECT
                c.id, c.title, c.description, c.points, c.status,
                c.assigned_child_id, ch.name as assigned_child_name,
                c.created_at, c.updated_at
            FROM chores c
            LEFT JOIN children ch ON c.assigned_child_id = ch.id
            WHERE c.id = $1 AND c.parent_id = $2`; // Ensure chore belongs to parent
        const queryParams = [choreId, parentId];
        const result = await db.query(queryText, queryParams);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Chore not found.' });
        }

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Get Chore By ID Error:', err);
        next(err);
    }
};

// PUT /api/parent/chores/:choreId
exports.updateChore = async (req, res, next) => {
    const parentId = req.user.id;
    const { choreId } = req.params;
    const { title, description, points, assignedChildId, status } = req.body; // Include status if parent can change it directly

    // Fields allowed to be updated by parent
    const allowedFields = ['title', 'description', 'points', 'assigned_child_id', 'status'];
    const fieldsToUpdate = [];
    const values = [];
    let paramIndex = 1;

    const updates = { title, description, points, assigned_child_id: assignedChildId, status }; // Map keys

    for (const field of allowedFields) {
        if (updates[field] !== undefined) { // Check if field is present in request body
             if (field === 'points' && (typeof updates[field] !== 'number' || updates[field] < 0)) {
                return res.status(400).json({ message: 'Points must be a non-negative number.' });
            }
             if (field === 'status' && !['Pending', 'Completed', 'Approved'].includes(updates[field])) {
                 // Parent probably should only change between Pending or maybe back from Approved?
                 // For now, allow any valid status via PUT. Approve has its own endpoint.
                return res.status(400).json({ message: 'Invalid status provided.' });
             }
            fieldsToUpdate.push(`${field} = $${paramIndex++}`);
            // Handle potential null assignment for assigned_child_id
            values.push(field === 'assigned_child_id' && updates[field] === null ? null : updates[field]);
        }
    }

    if (fieldsToUpdate.length === 0) {
        return res.status(400).json({ message: 'No update data provided.' });
    }

    // Add updated_at timestamp
    fieldsToUpdate.push(`updated_at = NOW()`);

    // Add choreId and parentId for WHERE clause
    values.push(choreId); // $${paramIndex++}
    values.push(parentId); // $${paramIndex++}

    try {
        const queryText = `
            UPDATE chores
            SET ${fieldsToUpdate.join(', ')}
            WHERE id = $${paramIndex - 1} AND parent_id = $${paramIndex}
            RETURNING *`; // Return all fields of the updated chore

        const result = await db.query(queryText, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Chore not found or update failed.' });
        }

        res.status(200).json({
            message: 'Chore updated successfully.',
            chore: result.rows[0]
        });

    } catch (err) {
        console.error('Update Chore Error:', err);
        next(err);
    }
};

// PATCH /api/parent/chores/:choreId/approve
exports.approveChore = async (req, res, next) => {
    const parentId = req.user.id;
    const { choreId } = req.params;
    const POINTS_TO_CURRENCY_RATE = 0.01; // Example: 1 point = $0.01

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Get chore details, ensure it belongs to parent, is assigned, and is 'Completed'
        const choreQuery = `
            SELECT id, points, assigned_child_id, status
            FROM chores
            WHERE id = $1 AND parent_id = $2
            FOR UPDATE`; // Lock the chore row
        const choreResult = await client.query(choreQuery, [choreId, parentId]);

        if (choreResult.rows.length === 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(404).json({ message: 'Chore not found or does not belong to you.' });
        }

        const chore = choreResult.rows[0];

        if (!chore.assigned_child_id) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(400).json({ message: 'Chore must be assigned to a child before approval.' });
        }

        if (chore.status !== 'Completed') {
             // Allow approving 'Pending' chores too? Or only 'Completed'? Let's stick to 'Completed'.
            await client.query('ROLLBACK');
            client.release();
            return res.status(400).json({ message: 'Chore must be marked as Completed by the child first.' });
        }

        // 2. Update chore status to 'Approved'
        const updateChoreQuery = `
            UPDATE chores
            SET status = 'Approved', updated_at = NOW()
            WHERE id = $1
            RETURNING *`; // Return the updated chore
       const updatedChoreResult = await client.query(updateChoreQuery, [choreId]);
       const updatedChore = updatedChoreResult.rows[0];


        // 3. Calculate reward amount
        const rewardAmount = (chore.points * POINTS_TO_CURRENCY_RATE).toFixed(2);

        // 4. Update child's balance (ensure child row is locked if concurrent updates are possible)
        // Adding FOR UPDATE to the child balance check within the transaction
         const childBalanceQuery = 'SELECT balance FROM children WHERE id = $1 FOR UPDATE';
         const childBalanceResult = await client.query(childBalanceQuery, [chore.assigned_child_id]);
         // Check if child exists (should exist if assigned_child_id is valid, but good practice)
         if (childBalanceResult.rows.length === 0) {
             throw new Error('Assigned child not found during approval process.'); // Should trigger rollback
         }
         const currentBalance = parseFloat(childBalanceResult.rows[0].balance);
         const newBalance = currentBalance + parseFloat(rewardAmount);

        const updateBalanceQuery = 'UPDATE children SET balance = $1, updated_at = NOW() WHERE id = $2';
        await client.query(updateBalanceQuery, [newBalance.toFixed(2), chore.assigned_child_id]);

        // 5. Create 'ChoreReward' transaction
        const transactionDescription = `Reward for chore: ${updatedChore.title}`; // Use updated title
        const insertTransactionQuery = `
            INSERT INTO transactions (child_id, type, description, amount, related_chore_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, date`;
        await client.query(insertTransactionQuery, [
            chore.assigned_child_id,
            'ChoreReward',
            transactionDescription,
            rewardAmount,
            choreId
        ]);

        // Commit transaction
        await client.query('COMMIT');

        res.status(200).json({
            message: 'Chore approved and reward processed.',
            chore: updatedChore, // Send back the updated chore
            newChildBalance: newBalance.toFixed(2) // Optionally send back the new balance
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Approve Chore Transaction Error:', err);
        next(err);
    } finally {
        client.release();
    }
};

// DELETE /api/parent/chores/:choreId
exports.deleteChore = async (req, res, next) => {
    const parentId = req.user.id;
    const { choreId } = req.params;

    try {
        // Ensure chore belongs to parent before deleting
        const queryText = 'DELETE FROM chores WHERE id = $1 AND parent_id = $2';
        const queryParams = [choreId, parentId];
        const result = await db.query(queryText, queryParams);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Chore not found or you do not have permission to delete.' });
        }

        // Deletion successful
        res.status(200).json({ message: 'Chore deleted successfully.' });

    } catch (err) {
        console.error('Delete Chore Error:', err);
        next(err);
    }
};

// --- Savings Goal Management Controllers (Parent View) ---

// GET /api/parent/savings-goals
exports.getParentSavingsGoals = async (req, res, next) => {
    const parentId = req.user.id;
    const { childId } = req.query; // Optional filter by childId

    let queryText = `
        SELECT
            sg.id, sg.name, sg.target_amount, sg.current_amount,
            sg.child_id, ch.name as child_name,
            sg.created_at, sg.updated_at
        FROM savings_goals sg
        JOIN children ch ON sg.child_id = ch.id
        WHERE ch.parent_id = $1
    `;
    const queryParams = [parentId];
    let paramIndex = 2;

    if (childId) {
        // Ensure the childId provided belongs to the parent
        queryText += ` AND sg.child_id = $${paramIndex++}`;
        queryParams.push(childId);
    }

    queryText += ` ORDER BY ch.name ASC, sg.name ASC`; // Order by child name, then goal name

    try {
        const result = await db.query(queryText, queryParams);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Get Parent Savings Goals Error:', err);
        next(err);
    }
};

// POST /api/parent/savings-goals/:goalId/contribute
exports.parentContributeToGoal = async (req, res, next) => {
    const parentId = req.user.id;
    const { goalId } = req.params;
    let { amount, description } = req.body;

    // --- Validation ---
    if (amount === undefined || amount === null || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Invalid or non-positive amount provided. Must be a positive number.' });
    }
    amount = Number(amount.toFixed(2)); // Ensure 2 decimal places
    description = description ? description.trim() : null;

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Get goal details, verify it belongs to a child of the parent, and lock row
        const goalQuery = `
            SELECT
                sg.id, sg.name, sg.child_id, sg.current_amount, sg.target_amount
            FROM savings_goals sg
            JOIN children ch ON sg.child_id = ch.id
            WHERE sg.id = $1 AND ch.parent_id = $2
            FOR UPDATE`; // Lock the savings_goals row
        const goalResult = await client.query(goalQuery, [goalId, parentId]);

        if (goalResult.rows.length === 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(404).json({ message: 'Savings goal not found or does not belong to one of your children.' });
        }

        const goal = goalResult.rows[0];
        const currentAmount = parseFloat(goal.current_amount);
        const targetAmount = parseFloat(goal.target_amount);

        // 2. Check if goal is already met and cap contribution if necessary
        if (currentAmount >= targetAmount) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(400).json({ message: 'This savings goal has already been met.' });
        }

        let effectiveAmount = amount;
        if (currentAmount + amount > targetAmount) {
            effectiveAmount = targetAmount - currentAmount; // Cap contribution at the remaining amount
            console.log(`Contribution capped at ${effectiveAmount} to meet target.`);
        }
        effectiveAmount = Number(effectiveAmount.toFixed(2));

        const newGoalAmount = currentAmount + effectiveAmount;

        // 3. Update savings goal current_amount
        const updateGoalQuery = 'UPDATE savings_goals SET current_amount = $1, updated_at = NOW() WHERE id = $2';
        await client.query(updateGoalQuery, [newGoalAmount.toFixed(2), goalId]);

        // 4. Create transaction record for the parent contribution
        const transactionDescription = description || `Parent contribution to goal: ${goal.name}`;
        const transactionType = 'ParentTransfer'; // Or potentially a more specific type like 'ParentGoalContribution'
        const insertTransactionQuery = `
            INSERT INTO transactions (child_id, type, description, amount, related_goal_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id`;
        await client.query(insertTransactionQuery, [
            goal.child_id,
            transactionType,
            transactionDescription,
            effectiveAmount, // Positive amount, represents transfer TO child goal
            goalId
        ]);

        // Commit transaction
        await client.query('COMMIT');

        // 5. Fetch the updated goal state to return
         const finalGoalResult = await db.query('SELECT * FROM savings_goals WHERE id = $1', [goalId]);

        res.status(200).json({
            message: `Successfully contributed ${effectiveAmount.toFixed(2)} to the goal.`, // Reflect potentially capped amount
            goal: finalGoalResult.rows[0]
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Parent Contribute to Goal Transaction Error:', err);
        next(err);
    } finally {
        client.release();
    }
};

// --- Transaction Management Controllers (Parent View) ---

// GET /api/parent/transactions
exports.getParentTransactions = async (req, res, next) => {
    const parentId = req.user.id;
    const { childId, type, limit = 50, offset = 0 } = req.query; // Optional filters and pagination

    let queryText = `
        SELECT
            t.id, t.child_id, ch.name as child_name,
            t.type, t.description, t.amount,
            t.related_chore_id, c.title as related_chore_title,
            t.related_goal_id, sg.name as related_goal_name,
            t.date
        FROM transactions t
        JOIN children ch ON t.child_id = ch.id
        LEFT JOIN chores c ON t.related_chore_id = c.id
        LEFT JOIN savings_goals sg ON t.related_goal_id = sg.id
        WHERE ch.parent_id = $1
    `;
    const queryParams = [parentId];
    let paramIndex = 2;

    if (childId) {
        // Ensure childId belongs to the parent (implicitly handled by the main WHERE clause)
        queryText += ` AND t.child_id = $${paramIndex++}`;
        queryParams.push(childId);
    }
    if (type) {
        // Add validation for type if needed
        queryText += ` AND t.type = $${paramIndex++}`;
        queryParams.push(type);
    }

    queryText += ` ORDER BY t.date DESC`; // Order by most recent transaction first

    // Add pagination
    queryText += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(parseInt(limit, 10) || 50); // Default limit 50
    queryParams.push(parseInt(offset, 10) || 0);  // Default offset 0


    try {
        const result = await db.query(queryText, queryParams);
        // Potential enhancement: Add total count for pagination info
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Get Parent Transactions Error:', err);
        next(err);
    }
};