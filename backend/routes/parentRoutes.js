const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');
const { requireParent } = require('../middleware/authMiddleware'); // Parent access required for all these routes

// Note: The 'protect' middleware should be applied *before* this router is mounted in server.js
// All routes here automatically require parent authentication

// Children Management
router.get('/children', requireParent, parentController.getChildren);
router.post('/children', requireParent, parentController.createChild);
router.get('/children/:childId', requireParent, parentController.getChildById);
router.put('/children/:childId', requireParent, parentController.updateChild);
router.delete('/children/:childId', requireParent, parentController.deleteChild);
router.post('/children/:childId/balance', requireParent, parentController.adjustChildBalance); // Manual balance adjustment

// Chore Management (Parent manages all aspects)
router.get('/chores', requireParent, parentController.getChores); // Get list of chores (can filter by child, status)
router.post('/chores', requireParent, parentController.createChore);
router.get('/chores/:choreId', requireParent, parentController.getChoreById);
router.put('/chores/:choreId', requireParent, parentController.updateChore);
router.patch('/chores/:choreId/approve', requireParent, parentController.approveChore); // Mark as approved, award points/money
router.delete('/chores/:choreId', requireParent, parentController.deleteChore);

// Savings Goals (Parent View/Management)
router.get('/savings-goals', requireParent, parentController.getParentSavingsGoals); // View goals (optionally filter by child)
router.post('/savings-goals/:goalId/contribute', requireParent, parentController.parentContributeToGoal); // Parent contributes to a specific goal

// Transaction Management (Parent View)
router.get('/transactions', requireParent, parentController.getParentTransactions); // View transactions (filter by child, type)

// TODO: Add routes for Transactions (Parent view/management)

module.exports = router;