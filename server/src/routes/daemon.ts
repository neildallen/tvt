import express from 'express';
import { BattleDaemon } from '../services/BattleDaemon';

const router = express.Router();

// Get daemon instance
const daemon = BattleDaemon.getInstance();

/**
 * GET /daemon/status
 * Get current daemon status
 */
router.get('/status', (req, res) => {
  try {
    const status = daemon.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting daemon status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get daemon status'
    });
  }
});

/**
 * POST /daemon/start
 * Start the battle daemon
 */
router.post('/start', (req, res) => {
  try {
    daemon.start();
    const status = daemon.getStatus();
    res.json({
      success: true,
      message: 'Battle daemon started',
      data: status
    });
  } catch (error) {
    console.error('Error starting daemon:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start daemon'
    });
  }
});

/**
 * POST /daemon/stop
 * Stop the battle daemon
 */
router.post('/stop', (req, res) => {
  try {
    daemon.stop();
    const status = daemon.getStatus();
    res.json({
      success: true,
      message: 'Battle daemon stopped',
      data: status
    });
  } catch (error) {
    console.error('Error stopping daemon:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop daemon'
    });
  }
});

/**
 * POST /daemon/check
 * Force check all battles immediately
 */
router.post('/check', async (req, res) => {
  try {
    await daemon.forceCheck();
    res.json({
      success: true,
      message: 'Battle check completed'
    });
  } catch (error) {
    console.error('Error forcing daemon check:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check battles'
    });
  }
});

export default router;
