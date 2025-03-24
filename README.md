# Motorsport Stakes 🏎️

A dynamic Formula 1 fantasy betting platform that provides an immersive virtual racing team management experience with advanced data analytics and interactive engagement features.

![Motorsport Stakes](generated-icon.png)

## 🚀 Features

- **Team Management**: Create and manage two racing teams (Premium and Challenger) with different credits
- **Asset Trading**: Buy and sell drivers, engines, and teams with dynamic valuations
- **Performance Analytics**: Track historical performance and valuation changes 
- **Real-time Updates**: Watch as asset values change based on race results
- **Leaderboards**: Compete with other players in global rankings
- **Admin Dashboard**: Manage race calendar, results, and game settings

## 🏗️ Architecture

The application is built as a full-stack TypeScript application with:

- **Frontend**: React with Vite, TanStack Query, and Shadcn UI components
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Email/Password and Google OAuth

## 📂 Project Structure

```
├── client/                 # Frontend React application
│   ├── public/             # Static assets
│   └── src/                # React source code
│       ├── components/     # UI components
│       ├── hooks/          # Custom React hooks
│       ├── lib/            # Utility functions
│       └── pages/          # Page components
├── server/                 # Backend Express application
│   ├── auth.ts             # Authentication logic
│   ├── db.ts               # Database connection
│   ├── index.ts            # Entry point
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Data storage implementation
│   └── vite.ts             # Vite integration
├── shared/                 # Shared code between frontend and backend
│   └── schema.ts           # Database schema and types
├── scripts/                # Utility scripts
├── drizzle.config.ts       # Drizzle ORM configuration
└── package.json            # Project dependencies
```

## 🎮 Game Mechanics

### Team Management

Users manage two types of teams:
- **Premium Team**: Starts with 1000 credits
- **Challenger Team**: Starts with 700 credits

### Assets

There are three types of assets:
1. **Drivers**: F1 drivers with varying values (100-230 credits)
2. **Engines**: Power units with varying values (145-185 credits)
3. **Teams/Chassis**: F1 teams with varying values

### Valuation System

Asset values are calculated based on performance:
- After each race, asset performance is compared to a 3-race average
- The valuation table maps performance differences to percentage changes
- The first race uses "ghost" results with all drivers at 10th position

### Race Calendar

The admin can:
- Add, edit, and delete races
- Submit race results
- Control when betting is open or closed
- Revert valuation changes (e.g., Chinese GP to Australian GP values)

## 🔌 API Endpoints

### Authentication
- `POST /api/register`: Create a new account
- `POST /api/login`: Login with username/password
- `POST /api/logout`: Logout current user
- `GET /api/user`: Get current user info

### Teams
- `GET /api/my-teams`: Get current user's teams
- `GET /api/user-teams/:id`: Get specific team details
- `PATCH /api/user-teams/:id`: Update a user team

### Market Data
- `GET /api/market`: Get all assets and their values
- `GET /api/betting-status`: Check if betting is open

### Statistics
- `GET /api/standings/drivers`: Get driver standings
- `GET /api/standings/teams`: Get team standings
- `GET /api/standings/engines`: Get engine standings
- `GET /api/asset-value-history/:type/:id`: Get asset value history
- `GET /api/performance-history/:type/:id`: Get performance history

### Races
- `GET /api/races`: Get all races
- `GET /api/races/next`: Get upcoming race
- `GET /api/races/:id`: Get race details
- `GET /api/races/:id/results`: Get race results

### Admin
- `POST /api/admin/races`: Create a new race
- `PATCH /api/admin/races/:id`: Update a race
- `DELETE /api/admin/races/:id`: Delete a race
- `POST /api/admin/race-results`: Submit race results
- `PATCH /api/admin/race-results/:id`: Update race results
- `DELETE /api/admin/race-results/:raceId`: Delete race results
- `POST /api/admin/betting-status`: Update betting status
- `POST /api/admin/drivers`: Create a driver
- `POST /api/admin/teams`: Create a team
- `POST /api/admin/engines`: Create an engine
- `POST /api/admin/revert-chinese-gp-valuations`: Revert Chinese GP valuations to Australian GP values

## 📊 Database Schema

### Users
- id: number (PK)
- username: string
- email: string
- password: string (hashed)
- googleId: string
- isAdmin: boolean

### Drivers
- id: number (PK)
- name: string
- number: number
- teamId: number (FK)
- value: number
- valueUpdatedAt: Date

### Teams
- id: number (PK)
- name: string
- value: number
- valueUpdatedAt: Date
- engineId: number (FK)

### Engines
- id: number (PK)
- name: string
- value: number
- valueUpdatedAt: Date

### Races
- id: number (PK)
- name: string
- location: string
- date: Date
- resultsSubmitted: boolean

### Race Results
- id: number (PK)
- raceId: number (FK)
- driverId: number (FK)
- position: number
- valuation: number

### Performance History
- id: number (PK)
- driverId: number (FK)
- teamId: number (FK)
- engineId: number (FK)
- raceId: number (FK)
- currentPosition: number
- averagePosition: number
- positionDifference: number

### Asset Value History
- id: number (PK)
- entityId: number
- entityType: string
- raceId: number (FK)
- value: number
- createdAt: Date

### User Teams
- id: number (PK)
- userId: number (FK)
- name: string
- initialCredits: number
- currentCredits: number
- unspentCredits: number
- driver1Id: number (FK)
- driver2Id: number (FK)
- engineId: number (FK)
- teamId: number (FK)

### Valuation Table
- difference: number (PK)
- percentage: number

### Game Settings
- key: string (PK)
- value: string
- updatedAt: Date

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables in `.env` file:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/motorsportstakes
   SESSION_SECRET=your_session_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```
4. Push the database schema:
   ```
   npm run db:push
   ```
5. Start the development server:
   ```
   npm run dev
   ```

## 🔑 Authentication

The application supports two authentication methods:
1. **Email/Password**: Traditional username and password authentication
2. **Google OAuth**: Sign in with Google (requires Google API credentials)

## 👥 User Roles

- **Player**: Regular user who manages teams and participates in the game
- **Admin**: User with administrative privileges who can manage game settings, races, and results

## 📸 Screenshots

![Dashboard](attached_assets/image_1742522746998.png)
![Market](attached_assets/image_1742595077931.png)
![Teams](attached_assets/image_1742597463120.png)
![Admin](attached_assets/image_1742602761572.png)
![Leaderboard](attached_assets/image_1742761342731.png)
![Statistics](attached_assets/image_1742783246818.png)

## 📈 Special Features

### Asset Valuation History

The system tracks and visualizes the history of asset values over time, allowing users to analyze performance trends and make informed decisions. When hovering over data points, users can see the exact valuation percentages from the valuation table that were applied after each race.

### Unspent Credits Tracking

The system tracks unspent team credits across races. When users don't spend all their available credits during team selection, these unspent credits are preserved and added back to their budget after race valuations. This encourages strategic planning and saving.

### Chinese GP Valuation Reversion

Due to a special circumstance with the Chinese GP results, admins can revert valuations to Australian GP values while maintaining a historical record of both.

### Dynamic Betting Status

Admins can control when users can make changes to their teams, preventing unfair advantages during race periods. A countdown timer shows users when betting will close.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- Formula 1 for inspiration
- All contributors who have helped shape this project