const getHealth = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "HireTrack API is running",
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  getHealth,
};
