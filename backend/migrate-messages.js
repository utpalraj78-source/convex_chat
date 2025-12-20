
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: './.env' });

// Get the MongoDB connection string from environment or use default
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chat-app';

// Define a flexible schema for messages (accepts any fields)
const messageSchema = new mongoose.Schema({}, { strict: false });
const Message = mongoose.model('Message', messageSchema, 'messages');

// Main migration function
async function migrate() {
  // Connect to MongoDB
  await mongoose.connect(MONGO_URI);

  // Find all private messages where 'to' is a string (not a group)
  const messages = await Message.find({
    $and: [
      { type: { $in: [null, 'text', 'file', 'voice'] } },
      { to: { $type: 'string', $not: /^group:/ } }
    ]
  });

  let updated = 0;


  for (const msg of messages) {
    if (/^[a-fA-F0-9]{24}$/.test(msg.to)) {
      msg.to = new mongoose.Types.ObjectId(msg.to);
      await msg.save();
      updated++;
    }
  }

  // Log how many messages were migrated
  console.log(`Migrated ${updated} private messages.`);

  // Disconnect from MongoDB
  await mongoose.disconnect();
}

// Run the migration and handle any errors
migrate().catch(e => { 
  console.error(e); 
  process.exit(1); 
});
