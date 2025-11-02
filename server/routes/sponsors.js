import express from 'express';
import Sponsor from '../models/Sponsor.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/sponsors
 * @desc    Get all active sponsors grouped by tier
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const sponsors = await Sponsor.find({ isActive: true })
      .sort({ tier: 1, displayOrder: 1, name: 1 })
      .select('-__v');

    // Group sponsors by tier
    const groupedSponsors = {
      gold: sponsors.filter(s => s.tier === 'gold'),
      silver: sponsors.filter(s => s.tier === 'silver'),
      partner: sponsors.filter(s => s.tier === 'partner')
    };

    res.json({
      success: true,
      data: groupedSponsors,
      all: sponsors
    });
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sponsors',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/sponsors/:id
 * @desc    Get single sponsor by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const sponsor = await Sponsor.findById(req.params.id);
    
    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: 'Sponsor not found'
      });
    }

    res.json({
      success: true,
      data: sponsor
    });
  } catch (error) {
    console.error('Error fetching sponsor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sponsor',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/sponsors
 * @desc    Create a new sponsor
 * @access  Admin only
 */
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, tier, logo, cloudinaryPublicId, website, description, displayOrder } = req.body;

    // Validate required fields
    if (!name || !tier || !logo) {
      return res.status(400).json({
        success: false,
        message: 'Name, tier, and logo are required'
      });
    }

    const sponsor = new Sponsor({
      name,
      tier,
      logo,
      cloudinaryPublicId,
      website,
      description,
      displayOrder: displayOrder || 0
    });

    await sponsor.save();

    res.status(201).json({
      success: true,
      message: 'Sponsor created successfully',
      data: sponsor
    });
  } catch (error) {
    console.error('Error creating sponsor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create sponsor',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/sponsors/:id
 * @desc    Update a sponsor
 * @access  Admin only
 */
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, tier, logo, cloudinaryPublicId, website, description, displayOrder, isActive } = req.body;

    const sponsor = await Sponsor.findById(req.params.id);
    
    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: 'Sponsor not found'
      });
    }

    // Update fields
    if (name !== undefined) sponsor.name = name;
    if (tier !== undefined) sponsor.tier = tier;
    if (logo !== undefined) sponsor.logo = logo;
    if (cloudinaryPublicId !== undefined) sponsor.cloudinaryPublicId = cloudinaryPublicId;
    if (website !== undefined) sponsor.website = website;
    if (description !== undefined) sponsor.description = description;
    if (displayOrder !== undefined) sponsor.displayOrder = displayOrder;
    if (isActive !== undefined) sponsor.isActive = isActive;

    await sponsor.save();

    res.json({
      success: true,
      message: 'Sponsor updated successfully',
      data: sponsor
    });
  } catch (error) {
    console.error('Error updating sponsor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update sponsor',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/sponsors/:id
 * @desc    Delete a sponsor (soft delete by setting isActive to false)
 * @access  Admin only
 */
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const sponsor = await Sponsor.findById(req.params.id);
    
    if (!sponsor) {
      return res.status(404).json({
        success: false,
        message: 'Sponsor not found'
      });
    }

    // Soft delete
    sponsor.isActive = false;
    await sponsor.save();

    res.json({
      success: true,
      message: 'Sponsor deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sponsor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete sponsor',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/sponsors/bulk
 * @desc    Bulk create sponsors
 * @access  Admin only
 */
router.post('/bulk', protect, authorize('admin'), async (req, res) => {
  try {
    const { sponsors } = req.body;

    if (!Array.isArray(sponsors) || sponsors.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Sponsors array is required'
      });
    }

    const createdSponsors = await Sponsor.insertMany(sponsors);

    res.status(201).json({
      success: true,
      message: `${createdSponsors.length} sponsors created successfully`,
      data: createdSponsors
    });
  } catch (error) {
    console.error('Error bulk creating sponsors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk create sponsors',
      error: error.message
    });
  }
});

export default router;
