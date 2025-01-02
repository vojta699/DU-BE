const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    minlength: 3, 
    maxlength: 30 
  },
  userName: {
    type: String, 
    required: true, 
    unique: true, 
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  },
  password: { 
    type: String, 
    required: true, 
    minlength: 6, 
    maxlength: 50 
  },
  isAdmin: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

// Hashování hesla před uložením
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
  }
  next();
});
// Metoda pro porovnání hesla při přihlášení
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);