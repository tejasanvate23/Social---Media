# Social Media Application

A full-stack social media application built with the MERN stack (MongoDB, Express.js, React.js, Node.js) that allows users to create posts, interact with others, and get personalized feeds.

## Features

### Core MVP Features
- **User Authentication**: Secure sign-up and login with JWT tokens
- **Create and View Posts**: Users can write posts and see posts from others
- **Interact with Posts**: Like and comment on posts
- **Follow Other Users**: Follow/unfollow people to customize your feed
- **Personalized Feed**: Shows posts from followed users plus recommended content
- **Notifications**: Real-time notifications for likes, comments, and follows
- **Friend Suggestions**: Based on network connections and mutual followers

### Additional Features
- **Profile Management**: Edit profile information and view user profiles
- **Search Functionality**: Search for users and posts
- **Post Privacy**: Public and private post options
- **Location Tags**: Add location to posts
- **Responsive Design**: Mobile-first responsive UI
- **Real-time Updates**: Instant feedback on interactions

## Technology Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **multer** - File upload handling

### Frontend
- **React.js** - User interface library
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Icons** - Icon library
- **React Hot Toast** - Toast notifications
- **date-fns** - Date formatting utilities

## Project Structure

```
social-media-app/
├── backend/                 # Backend server
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   └── .env                # Environment variables
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── App.js          # Main app component
│   │   └── index.js        # Entry point
│   └── package.json        # Frontend dependencies
├── package.json            # Root package.json
└── README.md               # This file
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd social-media-app
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Configure MongoDB**
   - Update `MONGODB_URI` in `backend/.env`
   - Default: `mongodb://localhost:27017/social-media-app`

5. **Start the development servers**
   ```bash
   npm run dev
   ```

This will start both the backend server (port 5000) and frontend development server (port 3000).

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
MONGODB_URI=mongodb://localhost:27017/social-media-app
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=development
PORT=5000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/profile/:username` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/follow/:userId` - Follow a user
- `DELETE /api/users/follow/:userId` - Unfollow a user
- `GET /api/users/suggestions` - Get friend suggestions
- `GET /api/users/search` - Search users

### Posts
- `POST /api/posts` - Create a new post
- `GET /api/posts` - Get all posts (paginated)
- `GET /api/posts/:id` - Get specific post
- `PUT /api/posts/:id` - Update a post
- `DELETE /api/posts/:id` - Delete a post
- `GET /api/posts/user/:userId` - Get posts by user

### Interactions
- `POST /api/interactions/like/:postId` - Like/unlike a post
- `POST /api/interactions/comment/:postId` - Add a comment
- `DELETE /api/interactions/comment/:postId/:commentId` - Delete a comment
- `GET /api/interactions/notifications` - Get user notifications
- `PUT /api/interactions/notifications/read` - Mark notifications as read

### Feed
- `GET /api/feed` - Get personalized feed
- `GET /api/feed/trending` - Get trending posts
- `GET /api/feed/discover` - Get discovery feed

## Features in Detail

### Personalized Feed Algorithm
The application uses a smart algorithm to curate personalized feeds:

1. **70% from followed users** - Posts from people you follow
2. **30% recommended content** - Based on:
   - Posts liked by people you follow
   - Popular posts with high engagement
   - Content from users with similar interests

### User Experience Features
- **Real-time interactions** - Instant feedback on likes, comments, follows
- **Smart notifications** - Contextual notifications with relevant information
- **Responsive design** - Optimized for all device sizes
- **Intuitive navigation** - Easy-to-use interface with clear visual hierarchy

### Security Features
- **JWT authentication** - Secure token-based authentication
- **Password hashing** - bcryptjs for secure password storage
- **Input validation** - Server-side validation for all inputs
- **Protected routes** - Authentication middleware for sensitive endpoints

## Development

### Available Scripts

**Root directory:**
- `npm run dev` - Start both frontend and backend
- `npm run server` - Start only backend server
- `npm run client` - Start only frontend
- `npm run install-all` - Install dependencies for both
- `npm run build` - Build frontend for production
- `npm start` - Start production server

**Backend:**
- `npm run dev` - Start with nodemon (development)
- `npm start` - Start production server

**Frontend:**
- `npm start` - Start development server
- `npm run build` - Build for production

### Database Models

#### User Model
- Basic info: username, email, password, firstName, lastName, bio
- Social connections: followers, following
- Content: posts, likedPosts
- Notifications: real-time activity updates

#### Post Model
- Content: text, images, tags, location
- Engagement: likes, comments
- Metadata: author, timestamps, privacy settings
- Virtual fields: likeCount, commentCount

### Frontend Architecture

#### Component Structure
- **Layout Components**: Navbar, App wrapper
- **Page Components**: Home, Profile, Search, Notifications, PostDetail
- **Reusable Components**: PostCard, CreatePost, FeedTabs
- **Context Providers**: AuthContext for global state management

#### State Management
- **React Context API** - Global authentication state
- **Local State** - Component-specific state
- **Props** - Data flow between components

## Deployment

### Production Build
1. Build the frontend:
   ```bash
   npm run build
   ```

2. Set environment variables for production:
   ```env
   NODE_ENV=production
   MONGODB_URI=your-production-mongodb-uri
   JWT_SECRET=your-production-jwt-secret
   PORT=5000
   ```

3. Start the production server:
   ```bash
   npm start
   ```

### Deployment Options
- **Heroku** - Easy deployment with MongoDB Atlas
- **Vercel** - Frontend deployment with backend API
- **DigitalOcean** - Full-stack deployment
- **AWS** - Scalable cloud deployment

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Enhancements

- **Real-time messaging** - Direct messaging between users
- **Image uploads** - Cloud storage for post images
- **Advanced search** - Full-text search with filters
- **Push notifications** - Browser and mobile notifications
- **Analytics dashboard** - User engagement metrics
- **Content moderation** - Automated content filtering
- **API rate limiting** - Prevent abuse and ensure performance

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code examples

## Acknowledgments

- Built with modern web technologies
- Inspired by popular social media platforms
- Designed for learning and development purposes
"# Social---Media" 
