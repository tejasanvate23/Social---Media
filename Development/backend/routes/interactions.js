const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/interactions/like/:postId
// @desc    Like or unlike a post
// @access  Private
router.post('/like/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isLiked = post.likes.includes(req.user._id);
    let message;

    if (isLiked) {
      // Unlike
      await post.removeLike(req.user._id);
      message = 'Post unliked successfully';
      
      // Remove from user's likedPosts
      await User.findByIdAndUpdate(
        req.user._id,
        { $pull: { likedPosts: post._id } }
      );
    } else {
      // Like
      await post.addLike(req.user._id);
      message = 'Post liked successfully';
      
      // Add to user's likedPosts
      await User.findByIdAndUpdate(
        req.user._id,
        { $push: { likedPosts: post._id } }
      );

      // Create notification for post author (if not liking own post)
      if (post.author.toString() !== req.user._id.toString()) {
        await User.findByIdAndUpdate(
          post.author,
          {
            $push: {
              notifications: {
                type: 'like',
                from: req.user._id,
                post: post._id
              }
            }
          }
        );
      }
    }

    // Get updated post
    const updatedPost = await Post.findById(req.params.postId)
      .populate('author', 'username firstName lastName profilePicture')
      .populate('likes', 'username firstName lastName')
      .populate('comments.user', 'username firstName lastName profilePicture');

    res.json({ 
      message, 
      post: updatedPost,
      isLiked: !isLiked 
    });

  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/interactions/comment/:postId
// @desc    Add a comment to a post
// @access  Private
router.post('/comment/:postId', auth, [
  body('content')
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 1000 })
    .withMessage('Comment content cannot exceed 1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const { content } = req.body;

    // Add comment to post
    await post.addComment(req.user._id, content);

    // Create notification for post author (if not commenting on own post)
    if (post.author.toString() !== req.user._id.toString()) {
      await User.findByIdAndUpdate(
        post.author,
        {
          $push: {
            notifications: {
              type: 'comment',
              from: req.user._id,
              post: post._id,
              content: content.substring(0, 100) // Store first 100 chars of comment
            }
          }
        }
      );
    }

    // Get updated post
    const updatedPost = await Post.findById(req.params.postId)
      .populate('author', 'username firstName lastName profilePicture')
      .populate('likes', 'username firstName lastName')
      .populate('comments.user', 'username firstName lastName profilePicture');

    res.json({ 
      message: 'Comment added successfully',
      post: updatedPost
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/interactions/comment/:postId/:commentId
// @desc    Delete a comment from a post
// @access  Private
router.delete('/comment/:postId/:commentId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user owns the comment or the post
    if (comment.user.toString() !== req.user._id.toString() && 
        post.author.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this comment' });
    }

    // Remove comment
    comment.remove();
    await post.save();

    // Get updated post
    const updatedPost = await Post.findById(req.params.postId)
      .populate('author', 'username firstName lastName profilePicture')
      .populate('likes', 'username firstName lastName')
      .populate('comments.user', 'username firstName lastName profilePicture');

    res.json({ 
      message: 'Comment deleted successfully',
      post: updatedPost
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/interactions/notifications
// @desc    Get user notifications
// @access  Private
router.get('/notifications', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id)
      .populate({
        path: 'notifications',
        populate: [
          { path: 'from', select: 'username firstName lastName profilePicture' },
          { path: 'post', select: 'content' }
        ],
        options: {
          sort: { createdAt: -1 },
          skip: skip,
          limit: limit
        }
      });

    const total = user.notifications.length;

    res.json({
      notifications: user.notifications,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalNotifications: total
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/interactions/notifications/read
// @desc    Mark notifications as read
// @access  Private
router.put('/notifications/read', auth, async (req, res) => {
  try {
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ message: 'Notification IDs array is required' });
    }

    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          'notifications.$[elem].read': true
        }
      },
      {
        arrayFilters: [{ 'elem._id': { $in: notificationIds } }]
      }
    );

    res.json({ message: 'Notifications marked as read' });

  } catch (error) {
    console.error('Mark notifications read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/interactions/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/notifications/read-all', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          'notifications.$[].read': true
        }
      }
    );

    res.json({ message: 'All notifications marked as read' });

  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
