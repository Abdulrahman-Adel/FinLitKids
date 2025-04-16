const express = require('express');
const router = express.Router();
const childController = require('../controllers/childController');
const { requireChild } = require('../middleware/authMiddleware'); // Child access required

// Note: The 'protect' middleware should be applied *before* this router is mounted in server.js
// All routes here automatically require child authentication

// --- Child Routes ---

// Dashboard
router.get('/dashboard', requireChild, childController.getDashboardData);

// Chores
router.get('/chores', requireChild, childController.getChildChores);
router.patch('/chores/:choreId/complete', requireChild, childController.markChoreComplete);

// Savings Goals
router.get('/savings-goals', requireChild, childController.getChildSavingsGoals);
router.post('/savings-goals', requireChild, childController.createSavingsGoal);
router.post('/savings-goals/:goalId/contribute', requireChild, childController.contributeToSavingsGoal);
router.delete('/savings-goals/:goalId', requireChild, childController.deleteSavingsGoal);

// Spending / Transactions
router.get('/transactions', requireChild, childController.getChildTransactions);
router.post('/transactions', requireChild, childController.recordSpending);
// DELETE /api/child/transactions/:transactionId - Placeholder (Maybe not allow deletion?)
router.delete('/transactions/:transactionId', requireChild, (req, res) => res.status(501).json({ message: 'Delete Transaction endpoint not implemented yet.' }));

// Learning (Conceptual)
router.get('/learning/modules', requireChild, childController.getLearningModules);
router.post('/learning/modules/:moduleId/complete', requireChild, childController.completeLearningModule);


module.exports = router; 