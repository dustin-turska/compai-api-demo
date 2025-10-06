# Comp AI Tasks API Demo

A modern frontend demo application showcasing the [Comp AI Tasks API](https://trycomp.ai/docs/api-reference/tasks/get-all-tasks). Built with Next.js 15, TypeScript, and Tailwind CSS.

## Features

- 🚀 **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🔄 **Real-time Updates**: Refresh tasks with a single click
- 🎯 **Status Filtering**: Filter tasks by status (To Do, In Progress, Done, Blocked)
- ⚡ **Fast Loading**: Optimized with Next.js and TypeScript
- 🎨 **Clean Interface**: Intuitive task cards with status badges and timestamps
- 🛠️ **Error Handling**: Comprehensive error states and retry functionality

## API Integration

This demo integrates with the Comp AI Tasks API endpoints:

- **GET /v1/tasks** - Retrieve all tasks for the authenticated organization
- **GET /v1/tasks/{id}** - Get a specific task by ID (future enhancement)

### Task Object Structure

```typescript
interface Task {
  id: string;                    // Unique identifier (e.g., "tsk_abc123def456")
  title: string;                 // Task title
  description?: string;          // Optional task description
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  createdAt: string;            // ISO 8601 timestamp
  updatedAt: string;            // ISO 8601 timestamp
}
```

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- A Comp AI API key from [trycomp.ai](https://trycomp.ai)

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd compai-api-demo
   pnpm install
   ```

2. **Set up environment variables:**
   
   Create a `.env.local` file in the root directory:
   ```bash
   # Comp AI API Configuration
   NEXT_PUBLIC_COMPAI_API_URL=https://api.trycomp.ai/v1
   COMPAI_API_KEY=your_api_key_here
   NEXT_PUBLIC_COMPAI_ORGANIZATION_ID=your_organization_id_here
   ```

   **Important:** Replace `your_api_key_here` with your actual Comp AI API key.

3. **Run the development server:**
   ```bash
   pnpm dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `COMPAI_API_KEY` | Your Comp AI API key for authentication | ✅ Yes |
| `NEXT_PUBLIC_COMPAI_API_URL` | Base URL for the Comp AI API | No (defaults to https://api.trycomp.ai/v1) |
| `NEXT_PUBLIC_COMPAI_ORGANIZATION_ID` | Organization ID for session auth | No (optional for API key auth) |

## Project Structure

```
compai-api-demo/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main page component
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   └── alert.tsx
│   ├── task-card.tsx       # Individual task card component
│   └── tasks-list.tsx      # Main tasks list with filtering
├── lib/
│   ├── api.ts              # Comp AI API client
│   ├── types.ts            # TypeScript type definitions
│   └── utils.ts            # Utility functions
└── README.md
```

## API Client Features

The `CompAIClient` class provides:

- **Authentication**: Automatic API key and organization ID headers
- **Error Handling**: Comprehensive error parsing and user-friendly messages
- **Type Safety**: Full TypeScript support with proper interfaces
- **Flexibility**: Support for custom API URLs and headers

### Example Usage

```typescript
import { compAIClient } from '@/lib/api';

// Get all tasks
const response = await compAIClient.getTasks();
if (response.data) {
  console.log('Tasks:', response.data);
} else if (response.error) {
  console.error('Error:', response.error);
}

// Get specific task
const taskResponse = await compAIClient.getTask('tsk_abc123');
```

## UI Components

### TaskCard
Displays individual tasks with:
- Task title and description
- Status badge with color coding
- Creation and update timestamps
- Task ID for reference

### TasksList
Main component featuring:
- Loading states with spinner
- Error handling with retry button
- Status filtering (All, To Do, In Progress, Done, Blocked)
- Responsive grid layout
- Empty states for filtered views

## Customization

### Styling
- Built with Tailwind CSS for easy customization
- Uses CSS custom properties for theming
- shadcn/ui components can be easily modified

### Adding Features
The modular structure makes it easy to add:
- Task creation/editing forms
- Task detail views
- Additional API endpoints
- Real-time updates with WebSockets

## Deployment

### Vercel (Recommended)
```bash
pnpm build
# Deploy to Vercel
```

### Other Platforms
The app builds to static files and can be deployed to any hosting platform that supports Node.js applications.

## Troubleshooting

### Common Issues

1. **"Network error occurred"**
   - Check your internet connection
   - Verify the API URL is correct
   - Ensure CORS is properly configured

2. **"HTTP 401: Unauthorized"**
   - Verify your API key is correct
   - Check that the API key has proper permissions
   - Ensure the organization ID is valid (if required)

3. **"Failed to parse response JSON"**
   - The API might be returning non-JSON content
   - Check the API endpoint URL
   - Verify the API is responding correctly

### Debug Mode

To enable detailed logging, you can modify the API client to log requests:

```typescript
// In lib/api.ts, add console.log statements
console.log('Making request to:', `${this.baseUrl}/tasks`);
console.log('Headers:', this.getHeaders());
```

## API Documentation

For complete API documentation, visit:
- [Comp AI Tasks API Documentation](https://trycomp.ai/docs/api-reference/tasks/get-all-tasks)
- [Comp AI API Reference](https://trycomp.ai/docs)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This demo application is provided as-is for educational and demonstration purposes.

---

Built with ❤️ using [Next.js](https://nextjs.org), [TypeScript](https://typescriptlang.org), and [Tailwind CSS](https://tailwindcss.com).