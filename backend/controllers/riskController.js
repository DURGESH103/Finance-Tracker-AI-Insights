const { detectRisks } = require('../services/riskService');
const { asyncHandler } = require('../middleware/errorHandler');

exports.getRisks = asyncHandler(async (req, res) => {
  const risks = await detectRisks(req.user._id);
  res.json({ success: true, data: risks });
});
