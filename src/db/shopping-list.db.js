const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Item sub-schema
const itemSchema = new mongoose.Schema({
  itemId: {
    type: String,
    default: () => new ObjectId().toString(),
    required: true
  },
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['SOLVED', 'UNSOLVED'],
    required: true
  }
}, { _id: false });

// List schema
const listSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 30
  },
  ownerUserId: {
    type: String,
    required: true
  },
  members: {
    type: [String],
    default: []
  },
  items: {
    type: [itemSchema],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('List', listSchema);