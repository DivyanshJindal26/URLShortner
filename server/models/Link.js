const { mongoose } = require('../db');

const linkSchema = new mongoose.Schema(
  {
    code:           { type: String, required: true, unique: true, index: true, trim: true },
    originalUrl:    { type: String, required: true },
    title:          { type: String, default: null },
    ogDescription:  { type: String, default: null },
    ogImage:        { type: String, default: null },
    visits:         { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Link', linkSchema);
