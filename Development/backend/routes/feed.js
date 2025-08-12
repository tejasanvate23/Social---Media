const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/feed
// @desc    Get personalized feed for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get user's following list
    const user = await User.findById(req.user._id).populate('following');
    const followingIds = user.following.map(f => f._id);

    // Get posts from users the current user follows (70% of feed)
    const followingPostsCount = Math.floor(limit * 0.7);
    const followingPosts = await Post.find({
      author: { $in: followingIds },
      isPublic: true
    })
    .sort({ createdAt: -1 })
    .limit(followingPostsCount)
    .populate('author', 'username firstName lastName profilePicture')
    .populate('likes', 'username firstName lastName')
    .populate('comments.user', 'username firstName lastName profilePicture');

    // Get recommended posts based on user's interests (30% of feed)
    const recommendedPostsCount = limit - followingPosts.length;
    let recommendedPosts = [];

    if (recommendedPostsCount > 0) {
      // Get posts liked by people the user follows
      const postsLikedByFollowing = await Post.aggregate([
        {
          $match: {
            _id: { $nin: followingPosts.map(p => p._id) },
            author: { $nin: [req.user._id, ...followingIds] },
            isPublic: true
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'likes',
            foreignField: '_id',
            as: 'likedByUsers'
          }
        },
        {
          $addFields: {
            likedByFollowing: {
              $size: {
                $setIntersection: ['$likedByUsers._id', followingIds]
              }
            }
          }
        },
        {
          $match: {
            likedByFollowing: { $gt: 0 }
          }
        },
        {
          $sort: { likedByFollowing: -1, createdAt: -1 }
        },
        {
          $limit: recommendedPostsCount
        }
      ]);

      // Populate the recommended posts
      if (postsLikedByFollowing.length > 0) {
        recommendedPosts = await Post.populate(postsLikedByFollowing, [
          { path: 'author', select: 'username firstName lastName profilePicture' },
          { path: 'likes', select: 'username firstName lastName' },
          { path: 'comments.user', select: 'username firstName lastName profilePicture' }
        ]);
      }

      // If we still need more posts, get popular posts
      if (recommendedPosts.length < recommendedPostsCount) {
        const remainingCount = recommendedPostsCount - recommendedPosts.length;
        const popularPosts = await Post.aggregate([
          {
            $match: {
              _id: { $nin: [...followingPosts.map(p => p._id), ...recommendedPosts.map(p => p._id)] },
              author: { $nin: [req.user._id, ...followingIds] },
              isPublic: true
            }
          },
          {
            $addFields: {
              engagementScore: {
                $add: [
                  { $size: '$likes' },
                  { $multiply: [{ $size: '$comments' }, 2] } // Comments worth 2x likes
                ]
              }
            }
          },
          {
            $sort: { engagementScore: -1, createdAt: -1 }
          },
          {
            $limit: remainingCount
          }
        ]);

        if (popularPosts.length > 0) {
          const populatedPopularPosts = await Post.populate(popularPosts, [
            { path: 'author', select: 'username firstName lastName profilePicture' },
            { path: 'likes', select: 'username firstName lastName' },
            { path: 'comments.user', select: 'username firstName lastName profilePicture' }
          ]);
          recommendedPosts = [...recommendedPosts, ...populatedPopularPosts];
        }
      }
    }

    // Combine and sort posts by engagement and recency
    const allPosts = [...followingPosts, ...recommendedPosts];
    
    // Sort by a combination of engagement and recency
    allPosts.sort((a, b) => {
      const aScore = (a.likes.length + a.comments.length * 2) * 0.3 + 
                     (new Date(a.createdAt).getTime() / 1000000) * 0.7;
      const bScore = (b.likes.length + b.comments.length * 2) * 0.3 + 
                     (new Date(b.createdAt).getTime() / 1000000) * 0.7;
      return bScore - aScore;
    });

    // Apply pagination
    const paginatedPosts = allPosts.slice(skip, skip + limit);
    const total = allPosts.length;

    res.json({
      posts: paginatedPosts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
      feedType: 'personalized'
    });

  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/feed/trending
// @desc    Get trending posts (most engaged with)
// @access  Private
router.get('/trending', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const trendingPosts = await Post.aggregate([
      {
        $match: { isPublic: true }
      },
      {
        $addFields: {
          engagementScore: {
            $add: [
              { $size: '$likes' },
              { $multiply: [{ $size: '$comments' }, 2] }
            ]
          },
          // Boost recent posts slightly
          recencyBoost: {
            $divide: [
              { $subtract: [new Date(), '$createdAt'] },
              1000 * 60 * 60 * 24 // Days since creation
            ]
          }
        }
      },
      {
        $addFields: {
          finalScore: {
            $add: [
              { $multiply: ['$engagementScore', 0.8] },
              { $multiply: ['$recencyBoost', 0.2] }
            ]
          }
        }
      },
      {
        $sort: { finalScore: -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      }
    ]);

    // Populate the posts
    const populatedPosts = await Post.populate(trendingPosts, [
      { path: 'author', select: 'username firstName lastName profilePicture' },
      { path: 'likes', select: 'username firstName lastName' },
      { path: 'comments.user', select: 'username firstName lastName profilePicture' }
    ]);

    const total = await Post.countDocuments({ isPublic: true });

    res.json({
      posts: populatedPosts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
      feedType: 'trending'
    });

  } catch (error) {
    console.error('Get trending posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/feed/discover
// @desc    Get discovery feed (posts from users not followed)
// @access  Private
router.get('/discover', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get user's following list
    const user = await User.findById(req.user._id);
    const followingIds = user.following;

    const discoverPosts = await Post.aggregate([
      {
        $match: {
          author: { $nin: [req.user._id, ...followingIds] },
          isPublic: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'authorData'
        }
      },
      {
        $addFields: {
          authorFollowers: { $arrayElemAt: ['$authorData.followers', 0] }
        }
      },
      {
        $addFields: {
          // Score based on author popularity and post engagement
          discoveryScore: {
            $add: [
              { $multiply: [{ $size: '$likes' }, 0.4] },
              { $multiply: [{ $size: '$comments' }, 0.3] },
              { $multiply: [{ $size: '$authorFollowers' }, 0.3] }
            ]
          }
        }
      },
      {
        $sort: { discoveryScore: -1, createdAt: -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      }
    ]);

    // Populate the posts
    const populatedPosts = await Post.populate(discoverPosts, [
      { path: 'author', select: 'username firstName lastName profilePicture' },
      { path: 'likes', select: 'username firstName lastName' },
      { path: 'comments.user', select: 'username firstName lastName profilePicture' }
    ]);

    const total = await Post.countDocuments({
      author: { $nin: [req.user._id, ...followingIds] },
      isPublic: true
    });

    res.json({
      posts: populatedPosts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
      feedType: 'discover'
    });

  } catch (error) {
    console.error('Get discover posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
