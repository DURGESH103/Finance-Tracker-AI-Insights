const mongoose = require('mongoose');
const Goal = require('../models/Goal');
const Gamification = require('../models/Gamification');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

exports.getAll = asyncHandler(async (req, res) => {
  const goals = await Goal.find({ userId: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, data: goals });
});

exports.create = asyncHandler(async (req, res) => {
  const goal = await Goal.create({ ...req.body, userId: req.user._id });
  logger.audit(req.user._id, 'GOAL_CREATED', { goalId: goal._id, title: goal.title });
  res.status(201).json({ success: true, data: goal });
});

// ── Atomic: goal update + gamification badge ─────────────────────────────────
exports.contribute = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const io = req.app.get('io');
  const userId = req.user._id;

  const session = await mongoose.startSession();
  let goal;

  try {
    await session.withTransaction(async () => {
      goal = await Goal.findOne({ _id: req.params.id, userId }).session(session);
      if (!goal) throw new AppError('Goal not found', 404);
      if (goal.completed) throw new AppError('Goal already completed', 400);

      // Update streak
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const last = goal.lastContribution ? new Date(goal.lastContribution) : null;
      if (last) last.setHours(0, 0, 0, 0);
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      goal.streak = (last && last.getTime() === yesterday.getTime()) ? goal.streak + 1 : 1;

      goal.savedAmount = Math.min(goal.savedAmount + amount, goal.targetAmount);
      goal.lastContribution = new Date();

      const wasCompleted = goal.savedAmount >= goal.targetAmount;
      if (wasCompleted) goal.completed = true;

      await goal.save({ session });

      // Award gamification points + badge atomically
      const gamUpdate = { $inc: { points: wasCompleted ? 100 : 15 } };
      if (wasCompleted) {
        const gam = await Gamification.findOne({ userId }).session(session);
        if (!gam?.earnedBadges.find((b) => b.badgeId === 'goal_complete')) {
          gamUpdate.$push = { earnedBadges: { badgeId: 'goal_complete', earnedAt: new Date() } };
        }
      }
      await Gamification.findOneAndUpdate({ userId }, gamUpdate, { upsert: true, session });

      if (wasCompleted && io) {
        io.to(userId.toString()).emit('goal:completed', {
          message: `🏆 Goal "${goal.title}" completed!`,
          goalId: goal._id,
          title: goal.title,
        });
      }
    });
  } finally {
    session.endSession();
  }

  logger.audit(userId, 'GOAL_CONTRIBUTION', { goalId: goal._id, amount, completed: goal.completed });
  res.json({ success: true, data: goal });
});

exports.update = asyncHandler(async (req, res) => {
  const goal = await Goal.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body, { new: true }
  );
  if (!goal) throw new AppError('Goal not found', 404);
  res.json({ success: true, data: goal });
});

exports.remove = asyncHandler(async (req, res) => {
  const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!goal) throw new AppError('Goal not found', 404);
  logger.audit(req.user._id, 'GOAL_DELETED', { goalId: goal._id });
  res.json({ success: true, message: 'Deleted' });
});
