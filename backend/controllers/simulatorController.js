const { runSimulation } = require('../services/simulatorService');
const { asyncHandler } = require('../middleware/errorHandler');

exports.simulate = asyncHandler(async (req, res) => {
  const result = await runSimulation(req.user._id, req.body);
  res.json({ success: true, data: result });
});
