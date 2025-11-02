import mongoose from 'mongoose';

const sponsorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  tier: {
    type: String,
    enum: ['gold', 'silver', 'partner'],
    required: true,
    default: 'partner'
  },
  logo: {
    type: String,
    required: true
  },
  cloudinaryPublicId: {
    type: String,
    required: false
  },
  website: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: false
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient querying
sponsorSchema.index({ tier: 1, displayOrder: 1 });
sponsorSchema.index({ isActive: 1 });

const Sponsor = mongoose.model('Sponsor', sponsorSchema);

export default Sponsor;
