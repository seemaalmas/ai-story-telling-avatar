# @katha/api

NestJS backend API for the Katha AI storytelling platform.

## Structure

```
src/
├── modules/
│   ├── auth/       # Authentication (email, Google, Apple)
│   ├── users/      # User management
│   ├── stories/    # Story CRUD & generation
│   ├── avatars/    # Avatar management
│   └── health/     # Health check endpoint
├── common/
│   ├── decorators/ # Custom decorators
│   ├── filters/    # Exception filters
│   ├── guards/     # Auth & role guards
│   ├── interceptors/
│   └── pipes/
├── config/         # App configuration
├── prisma/         # Prisma service
└── main.ts         # App bootstrap
prisma/
├── schema.prisma   # Database schema
└── seed.ts         # Database seeding
```

## Development

```bash
npm run dev          # Start with hot reload
```

## API Docs

Swagger UI available at `http://localhost:3000/api/docs` when running.

## Database

```bash
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:seed      # Seed default data
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset database
```

## Testing

```bash
npm run test         # Unit tests
npm run test:e2e     # E2E tests
```

## Key Endpoints

| Method | Path                 | Description          |
| ------ | -------------------- | -------------------- |
| POST   | /api/v1/auth/register | Register new user   |
| POST   | /api/v1/auth/login    | Login               |
| POST   | /api/v1/auth/refresh  | Refresh token       |
| GET    | /api/v1/users/me      | Get profile         |
| GET    | /api/v1/stories       | List stories        |
| POST   | /api/v1/stories       | Create story        |
| GET    | /api/v1/avatars       | List avatars        |
| GET    | /api/v1/health        | Health check        |
