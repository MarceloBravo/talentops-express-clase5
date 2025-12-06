const path = require('path');
const { posts } = require('./postsController');
const { comments } = require('./commentsController');

const getDashboardPage = (req, res) => {
    res.sendFile(path.join(__dirname, '../views/admin.html'));
};

const getDashboardStats = (req, res) => {
    try {
        const totalPosts = posts.length;
        const totalComments = comments.length;

        const postsByStatus = posts.reduce((acc, post) => {
            acc[post.status] = (acc[post.status] || 0) + 1;
            return acc;
        }, {});

        const commentsByStatus = comments.reduce((acc, comment) => {
            acc[comment.status] = (acc[comment.status] || 0) + 1;
            return acc;
        }, {});

        const latestPosts = posts.slice(-5).reverse();
        const latestComments = comments.slice(-5).reverse();

        res.json({
            totalPosts,
            totalComments,
            postsByStatus,
            commentsByStatus,
            latestPosts,
            latestComments
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
    }
};

module.exports = {
    getDashboardPage,
    getDashboardStats
};
