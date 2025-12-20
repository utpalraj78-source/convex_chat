import express from 'express';
const router = express.Router();
import Group from '../models/Group.js';
import User from '../models/User.js';

// Create a group
router.post('/', async (req, res) => {
	try {
	       const { name, members } = req.body;
	       if (!name) {
		       return res.status(400).json({ error: 'Group name required' });
	       }
		let groupMembers = Array.isArray(members) && members.length > 0 ? members : [];
		let creatorId = req.user?.id || req.body.createdBy;
		if (!creatorId && groupMembers.length > 0) creatorId = groupMembers[0];
		if (!creatorId) return res.status(400).json({ error: 'Creator ID required' });
		if (!groupMembers.includes(creatorId)) groupMembers.push(creatorId);
	       // Check for duplicate group name
	       const existing = await Group.findOne({ name });
	       if (existing) {
		       return res.status(409).json({ error: 'Group name already exists. Please choose another name.' });
	       }
	       const group = await Group.create({ name, members: groupMembers, createdBy: creatorId });
	       res.status(201).json({
		       id: group._id,
		       name: group.name,
		       members: group.members,
		       createdBy: group.createdBy,
		       createdAt: group.createdAt
	       });
	} catch (err) {
	       // Handle duplicate key error (unique group name)
	       if (err.code === 11000 && err.keyPattern && err.keyPattern.name) {
		       return res.status(409).json({ error: 'Group name already exists. Please choose another name.' });
	       }
	       res.status(500).json({ error: err.message });
	}
});

// List all groups for a user
router.get('/', async (req, res) => {
	try {
	       const userId = req.user?.id || req.query.userId;
	       if (!userId) return res.status(400).json({ error: 'User ID required' });
	       const groups = await Group.find({ members: userId }).populate('members', 'username email avatar');
	       res.json(groups.map(g => ({
		       id: g._id,
		       name: g.name,
		       members: g.members.map(m => ({ id: m._id, username: m.username, email: m.email, avatar: m.avatar })),
		       createdBy: g.createdBy,
		       createdAt: g.createdAt
	       })));
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// Get group by id
router.get('/:id', async (req, res) => {
	try {
		const group = await Group.findById(req.params.id).populate('members', 'username email');
		if (!group) return res.status(404).json({ error: 'Group not found' });
		res.json(group);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

export default router;
