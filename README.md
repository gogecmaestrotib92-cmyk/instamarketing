# Instagram Marketing Automation Platform

A comprehensive Instagram marketing automation platform built with React and Node.js. This application helps marketers automate their Instagram content posting, manage ad campaigns, and track analytics.

## Features

### 📷 Content Management
- **Posts**: Create, schedule, and publish regular Instagram posts
- **Reels**: Upload and schedule Instagram Reels with cover images
- **Media Library**: Manage all your uploaded media assets

### ⏰ Scheduling
- Schedule posts and reels for optimal posting times
- Calendar view for managing scheduled content
- Automatic publishing at scheduled times

### 📊 Ad Campaign Management
- Create and manage Meta ad campaigns
- Support for different campaign objectives (Awareness, Traffic, Engagement, Leads, Sales)
- A/B testing for ads
- Budget and audience targeting controls

### 📈 Analytics
- Track post and reel performance
- Engagement metrics (likes, comments, shares, saves)
- Reach and impressions tracking
- Campaign performance monitoring

## Tech Stack

### Frontend
- React 18
- React Router v6
- Chart.js for analytics visualization
- Axios for API communication
- React Toastify for notifications
- React Dropzone for file uploads

### Backend
- Node.js with Express
- MongoDB with Mongoose ODM
- JWT authentication
- Node-cron for scheduled tasks
- Multer for file uploads

### External APIs
- Meta Graph API v18.0 (Instagram posting)
- Meta Marketing API (Ad campaigns)

## Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v16 or higher)
2. **MongoDB** (local installation or MongoDB Atlas account)
3. **Meta Developer Account** with:
   - Facebook App created
   - Instagram Graph API enabled
   - Marketing API enabled (for ad campaigns)

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd Instamarketing
```

### 2. Install dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Environment Setup

Copy the example environment file and configure it:

```bash
cd server
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/instamarketing

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Meta/Facebook API
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_PATH=./uploads
```

For the client, create a `.env` file in the client directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_FACEBOOK_APP_ID=your_facebook_app_id
```

### 4. Setting Up Meta Developer App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app or select an existing one
3. Add the following products:
   - Instagram Graph API
   - Marketing API
4. Configure OAuth redirect URIs:
   - `http://localhost:3000/auth/instagram/callback`
5. Request the following permissions:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_show_list`
   - `pages_read_engagement`
   - `ads_management`

## Running the Application

### Development Mode

From the root directory:

```bash
npm run dev
```

This will start both the backend server (port 5000) and frontend (port 3000) concurrently.

Or run them separately:

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm start
```

### Production Mode

```bash
# Build the client
cd client
npm run build

# Start the server
cd ../server
npm start
```

## Project Structure

```
Instamarketing/
├── client/                 # React frontend
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   └── src/
│       ├── components/     # Reusable components
│       │   ├── Layout.js
│       │   └── Layout.css
│       ├── context/        # React context
│       │   └── AuthContext.js
│       ├── pages/          # Page components
│       │   ├── Dashboard.js
│       │   ├── Posts.js
│       │   ├── Reels.js
│       │   ├── Campaigns.js
│       │   ├── Schedule.js
│       │   ├── Analytics.js
│       │   └── Settings.js
│       ├── services/       # API services
│       │   └── api.js
│       ├── App.js
│       └── index.js
│
├── server/                 # Node.js backend
│   └── src/
│       ├── middleware/     # Express middleware
│       │   └── auth.js
│       ├── models/         # Mongoose models
│       │   ├── User.js
│       │   ├── Post.js
│       │   ├── Reel.js
│       │   ├── Campaign.js
│       │   └── ScheduledItem.js
│       ├── routes/         # API routes
│       │   ├── auth.js
│       │   ├── posts.js
│       │   ├── reels.js
│       │   ├── campaigns.js
│       │   ├── analytics.js
│       │   ├── schedule.js
│       │   └── media.js
│       ├── services/       # Business logic
│       │   ├── instagram.js
│       │   ├── metaAds.js
│       │   ├── scheduler.js
│       │   └── upload.js
│       └── index.js        # Server entry point
│
└── package.json            # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get post by ID
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/publish` - Publish post to Instagram

### Reels
- `GET /api/reels` - Get all reels
- `POST /api/reels` - Create new reel
- `GET /api/reels/:id` - Get reel by ID
- `PUT /api/reels/:id` - Update reel
- `DELETE /api/reels/:id` - Delete reel
- `POST /api/reels/:id/publish` - Publish reel to Instagram

### Campaigns
- `GET /api/campaigns` - Get all campaigns
- `POST /api/campaigns` - Create new campaign
- `GET /api/campaigns/:id` - Get campaign by ID
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `POST /api/campaigns/:id/start` - Start campaign
- `POST /api/campaigns/:id/pause` - Pause campaign

### Schedule
- `GET /api/schedule` - Get scheduled items
- `POST /api/schedule` - Schedule new item
- `DELETE /api/schedule/:id` - Cancel scheduled item

### Analytics
- `GET /api/analytics/overview` - Get analytics overview
- `GET /api/analytics/posts` - Get posts analytics
- `GET /api/analytics/reels` - Get reels analytics
- `GET /api/analytics/campaigns` - Get campaigns analytics

### Media
- `POST /api/media/upload` - Upload media file
- `DELETE /api/media/:id` - Delete media file

## Instagram Account Requirements

To use this application, your Instagram account must be:
1. An **Instagram Business** or **Creator** account
2. Connected to a **Facebook Page**
3. You must have **admin access** to the connected Facebook Page

## Troubleshooting

### Common Issues

**MongoDB Connection Error**
- Ensure MongoDB is running
- Check your connection string in `.env`

**Instagram API Errors**
- Verify your access tokens are valid
- Check that all required permissions are granted
- Ensure your Instagram account meets the requirements

**Upload Errors**
- Check file size limits (default 50MB for videos)
- Ensure the uploads directory exists and is writable

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the repository or contact the development team.
#   U p d a t e d   1 1 / 3 0 / 2 0 2 5   2 3 : 3 9 : 1 1  
 