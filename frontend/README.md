# YOLO Trainer Platform - Frontend

Modern, responsive frontend for the YOLO Trainer Platform built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

### ✅ Complete Implementation

- **Authentication**: Login, registration, and JWT token management
- **Dashboard**: Overview statistics and quick actions
- **Dataset Management**: Create, view, upload images, and manage datasets
- **Labeling Interface**: Interactive canvas-based annotation tool
- **Training Management**: Create and monitor training jobs with real-time progress
- **Model Management**: Upload, deploy, and manage trained models
- **Testing/Inference**: Test models with visual prediction results

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Canvas**: React Konva (for labeling)
- **Icons**: Lucide React
- **File Upload**: React Dropzone
- **Charts**: Recharts
- **Date**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The application will be available at `http://localhost:3000`

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── dashboard/          # Dashboard page
│   │   ├── datasets/           # Dataset management
│   │   ├── labeling/           # Annotation tool
│   │   ├── training/           # Training management
│   │   ├── models/             # Model management
│   │   ├── testing/            # Inference interface
│   │   ├── login/              # Login page
│   │   ├── register/           # Registration page
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/             # React components
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Modal.tsx
│   │   └── Navigation.tsx      # Main navigation
│   ├── contexts/               # React contexts
│   │   └── AuthContext.tsx     # Authentication context
│   ├── lib/                    # Utilities
│   │   └── api.ts              # API client
│   └── types/                  # TypeScript types
│       └── index.ts
├── public/                     # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## Key Features

### Authentication
- JWT token-based authentication
- Automatic token refresh
- Protected routes
- Logout functionality

### Dashboard
- Real-time statistics
- Quick action cards
- Navigation to all features

### Dataset Management
- Create datasets with class names
- Upload images via drag-and-drop
- View image gallery
- Filter by split (train/val/test)
- Dataset statistics

### Labeling Interface
- Canvas-based drawing tool
- Draw bounding boxes
- Select classes
- Navigate between images
- Save annotations
- Visual feedback with colored boxes

### Training Management
- Create training jobs with custom parameters
- Monitor training progress
- View training logs
- Real-time status updates
- Cancel running jobs

### Model Management
- List all models
- Upload model files (.pt, .pth)
- Deploy/undeploy models
- Download models
- View model details

### Testing/Inference
- Upload test images
- Select deployed models
- Adjust confidence threshold
- View predictions with bounding boxes
- Export results as JSON

## Development

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

## API Integration

The frontend communicates with the backend API through the `src/lib/api.ts` client. All API calls include JWT authentication headers automatically.

## Contributing

See the main [CONTRIBUTING.md](../CONTRIBUTING.md) in the root directory.

## License

MIT License - see [LICENSE](../LICENSE)
