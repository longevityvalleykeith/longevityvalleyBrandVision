# Frontend Technical Documentation

## Overview

The Longevity Valley frontend is a **React 19** single-page application built with **Vite**, **TypeScript**, and **Tailwind CSS 4**. It communicates with the backend exclusively through **tRPC**, providing type-safe, end-to-end typed API calls without manual contract management.

**Key Principles:**
- Type-safe: All API calls are fully typed from backend to frontend
- Responsive: Mobile-first design with Tailwind CSS
- Accessible: WCAG 2.1 compliant with shadcn/ui components
- Fast: Vite dev server with HMR, optimized production builds

## Project Structure

```
client/
├── public/                    # Static assets (images, icons, fonts)
├── src/
│   ├── _core/                # Core infrastructure (not for direct editing)
│   │   ├── hooks/            # Custom React hooks (useAuth, useTheme)
│   │   └── ...
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # shadcn/ui components (auto-generated)
│   │   ├── ImageUpload.tsx   # Image upload with drag-drop
│   │   ├── AIChatBox.tsx     # Chat interface (pre-built)
│   │   └── ...
│   ├── pages/               # Page-level components (routed)
│   │   ├── Home.tsx         # Landing page
│   │   ├── ContentGenerator.tsx  # Freemium tool form
│   │   ├── Results.tsx      # Content output display
│   │   └── ...
│   ├── contexts/            # React Context providers
│   │   └── ThemeContext.tsx # Dark/light theme management
│   ├── hooks/               # Custom hooks
│   │   └── useAuth.ts       # Authentication state
│   ├── lib/
│   │   └── trpc.ts          # tRPC client configuration
│   ├── App.tsx              # Main router and layout
│   ├── main.tsx             # React DOM entry point
│   ├── index.css            # Global styles (Tailwind)
│   └── const.ts             # App-wide constants
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
└── package.json
```

## Key Components

### Home.tsx (Landing Page)

The landing page serves as the primary entry point, showcasing the value proposition and guiding users to the content generator. It features:

- Hero section with compelling headline: "Go from Western Brand to China-Ready in 3 Minutes"
- Three value propositions addressing key barriers (language, culture, production)
- Three-step process explanation
- Call-to-action button linking to the content generator
- Responsive design optimized for mobile and desktop

**Location:** `client/src/pages/Home.tsx`

### ContentGenerator.tsx (Freemium Tool)

The content generator form collects product information and optional visual assets from users. The component manages form state, image uploads, and API calls to generate content.

**Form Fields:**
- Product Information (required, text input)
- Key Selling Points (required, textarea)
- Target Audience (optional, text input)
- User Pain Points (optional, textarea)
- Applicable Scenarios (optional, textarea)
- Promo Offer / Call to Action (optional, textarea)
- Brand Visual Assets (optional, image upload with drag-drop)

**Key Features:**
- Real-time form validation with React Hook Form
- Image upload with preview and removal
- Loading state during content generation
- Error handling with user-friendly messages
- Automatic redirect to results page on success

**Location:** `client/src/pages/ContentGenerator.tsx`

**Technology:**
- React Hook Form for form state management
- Zod for schema validation
- tRPC mutations for API calls
- Custom ImageUpload component for file handling

### Results.tsx (Content Output)

Displays the five AI-generated Mandarin content pieces with copy-to-clipboard functionality and feedback mechanism.

**Features:**
- Displays all five content pieces in an accordion layout
- Each piece shows:
  - Visual storyboard (Mandarin)
  - Platform-optimized caption (Mandarin)
  - Cultural strategy explanation (English, collapsible)
- Copy-to-clipboard buttons for each section
- Feedback mechanism (helpful/not helpful + optional comment)
- Share buttons for social platforms (future enhancement)

**Location:** `client/src/pages/Results.tsx`

### ImageUpload.tsx (Reusable Component)

A drag-and-drop image upload component with preview, validation, and removal functionality.

**Props:**
```typescript
interface ImageUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;        // Default: 5
  maxSizePerFile?: number;  // Default: 10MB
  acceptedTypes?: string[]; // Default: ['image/jpeg', 'image/png', 'image/webp']
}
```

**Features:**
- Drag-and-drop zone with visual feedback
- Click to browse file system
- File validation (type, size)
- Preview thumbnails
- Remove individual files
- Accessibility: keyboard navigation support

**Location:** `client/src/components/ImageUpload.tsx`

## Routing

The application uses **wouter** for client-side routing. Routes are defined in `App.tsx`:

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Home.tsx | Landing page |
| `/generate` | ContentGenerator.tsx | Freemium tool form |
| `/results` | Results.tsx | Content output display |
| `/pricing` | Pricing.tsx | Subscription plans (optional) |
| `/404` | NotFound.tsx | 404 error page |

**Navigation Flow:**
1. User lands on `/` (Home)
2. Clicks "Generate Content" → navigates to `/generate`
3. Fills form and submits → API call to backend
4. On success → navigates to `/results` with generated content
5. User can provide feedback or generate new content

## Authentication

Authentication is handled through the `useAuth()` hook, which provides:

```typescript
const { user, loading, error, isAuthenticated, logout } = useAuth();
```

**Properties:**
- `user`: Current user object (id, name, email, role)
- `loading`: Boolean indicating auth state is being checked
- `error`: Error object if auth failed
- `isAuthenticated`: Boolean indicating if user is logged in
- `logout()`: Function to clear session and redirect to login

**Login Flow:**
1. User clicks "Login" button
2. Redirected to Manus OAuth portal via `getLoginUrl()`
3. User authenticates with Google or Manus account
4. OAuth callback redirects back to app with session cookie
5. `useAuth()` hook detects session and updates state

**Protected Routes:**
Currently, all routes are public. To protect routes, wrap them with an auth check:

```typescript
{isAuthenticated ? <ProtectedPage /> : <LoginPrompt />}
```

## State Management

The application uses three layers of state management:

### 1. React Query (Server State)

All backend data is managed through tRPC queries and mutations, which use React Query under the hood. This provides automatic caching, refetching, and synchronization with the server.

```typescript
// Query (read)
const { data, isLoading } = trpc.contentGeneration.getHistory.useQuery();

// Mutation (write)
const { mutate, isPending } = trpc.contentGeneration.generateContent.useMutation({
  onSuccess: (data) => {
    // Handle success
  },
  onError: (error) => {
    // Handle error
  }
});
```

### 2. React Context (Global UI State)

Theme state is managed through React Context:

```typescript
const { theme, toggleTheme } = useTheme();
```

### 3. Component State (Local State)

Form state and UI interactions are managed with `useState`:

```typescript
const [formData, setFormData] = useState({...});
const [selectedImages, setSelectedImages] = useState<File[]>([]);
```

## Styling

### Tailwind CSS 4

The application uses **Tailwind CSS 4** with the following customizations:

**Global Styles** (`client/src/index.css`):
- CSS variables for semantic colors (background, foreground, primary, etc.)
- Theme-aware color definitions (light and dark modes)
- Custom utility classes for common patterns
- Typography scale

**Color Palette:**
- Primary: Blue (`#3B82F6`)
- Secondary: Purple (`#A855F7`)
- Success: Green (`#10B981`)
- Warning: Amber (`#F59E0B`)
- Error: Red (`#EF4444`)
- Neutral: Gray (`#6B7280`)

**Responsive Breakpoints:**
- Mobile: 320px - 640px
- Tablet: 641px - 1024px
- Desktop: 1025px+

### shadcn/ui Components

The application uses **shadcn/ui** components for consistent, accessible UI elements:

- Button, Input, Textarea, Select, Checkbox, Radio, Switch
- Card, Dialog, Dropdown Menu, Popover, Tooltip
- Alert, Badge, Progress, Skeleton
- Form (React Hook Form integration)

All components are customized with Tailwind CSS and stored in `client/src/components/ui/`.

## Form Handling

Forms use **React Hook Form** with **Zod** for validation:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  productInfo: z.string().min(1, 'Required'),
  sellingPoints: z.string().min(1, 'Required'),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

**Benefits:**
- Type-safe validation
- Automatic error messages
- Minimal re-renders
- Easy integration with tRPC mutations

## API Integration (tRPC)

All backend calls are made through tRPC, which provides:

1. **Type Safety**: Backend types are automatically available in frontend
2. **No Manual Contracts**: No need to maintain separate API documentation
3. **Automatic Serialization**: Dates, BigInts, and custom types are handled automatically
4. **Error Handling**: Type-safe error objects with codes and messages

**Example Usage:**

```typescript
// Call backend procedure
const { mutate, isPending, error } = trpc.contentGeneration.generateContent.useMutation();

mutate({
  productInfo: 'Russian bee wax',
  sellingPoints: 'Strongest natural product for wound healing',
  // ... other fields
}, {
  onSuccess: (data) => {
    // data is fully typed
    console.log(data.contentPieces);
  }
});
```

## Performance Optimization

### Code Splitting

Routes are lazy-loaded to reduce initial bundle size:

```typescript
const Home = lazy(() => import('./pages/Home'));
const ContentGenerator = lazy(() => import('./pages/ContentGenerator'));
```

### Image Optimization

Images are optimized through:
- Cloudflare R2 CDN for fast delivery
- WebP format for modern browsers
- Responsive images with srcset

### Caching

React Query automatically caches:
- Query results (stale time: 5 minutes)
- Mutation results (cached for immediate UI updates)
- Background refetching when data becomes stale

## Accessibility

The application follows **WCAG 2.1 AA** standards:

- Semantic HTML (proper heading hierarchy, landmarks)
- ARIA labels for interactive elements
- Keyboard navigation support (Tab, Enter, Escape)
- Color contrast ratios (4.5:1 for normal text)
- Focus indicators on interactive elements
- Alt text for images

## Development Workflow

### Running the Dev Server

```bash
pnpm dev
```

The Vite dev server will start at `http://localhost:5173` (frontend) and `http://localhost:3000` (full-stack).

### Hot Module Replacement (HMR)

Changes to React components are instantly reflected in the browser without losing state.

### TypeScript Checking

```bash
pnpm check
```

Validates all TypeScript types without building.

### Code Formatting

```bash
pnpm format
```

Formats code with Prettier according to project standards.

## Common Patterns

### Handling Loading States

```typescript
const { data, isLoading } = trpc.contentGeneration.getHistory.useQuery();

if (isLoading) return <Skeleton />;
if (!data) return <EmptyState />;

return <ContentList items={data} />;
```

### Optimistic Updates

For better UX, update the UI immediately while the request is in flight:

```typescript
const { mutate } = trpc.feedback.submitFeedback.useMutation({
  onMutate: async (newFeedback) => {
    // Cancel ongoing queries
    await trpc.useUtils().feedback.invalidate();
    
    // Update UI optimistically
    setFeedback(newFeedback);
  },
  onError: (error, newFeedback) => {
    // Rollback on error
    setFeedback(previousFeedback);
  }
});
```

### Error Handling

```typescript
const { mutate, error } = trpc.contentGeneration.generateContent.useMutation();

if (error) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  );
}
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Deployment

The frontend is automatically built and deployed with the backend. The build process:

1. Vite builds the React app to `dist/public/`
2. esbuild bundles the Express server to `dist/index.js`
3. The entire `dist/` folder is deployed to production

```bash
pnpm build
```

---

**Last Updated**: November 2025  
**Author**: Manus AI
