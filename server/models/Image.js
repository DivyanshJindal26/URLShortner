const { mongoose } = require('../db');

const imageSchema = new mongoose.Schema(
  {
    filename:     { type: String, required: true, unique: true, index: true },
    originalName: { type: String, default: null },
    size:         { type: Number, default: 0 },
    mimeType:     { type: String, default: 'image/jpeg' },
    visits:       { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Image', imageSchema);
