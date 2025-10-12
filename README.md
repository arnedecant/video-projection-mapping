# Interactive Video Projection Mapping

An interactive 3D video projection mapping application built with Three.js that creates dynamic, mask-based video projections on 3D cube grids. Users can interact with different projection patterns through mouse hover effects and switch between various video-mask combinations.

👉 [**Live Demo**](https://arnedecant.github.io/video-projection-mapping/)

## What It Does

This application creates an immersive 3D experience:

- **Video Projection Mapping**: Videos are projected onto 3D cube grids shaped by mask images
- **Interactive Hover Effects**: Mouse movement triggers elevation animations on nearby cubes, creating a ripple effect
- **Multiple Projection Patterns**: Switch between different mask-video combinations (heart, lungs, home, share-nodes, kiswe)
- **Smooth Transitions**: Animated transitions between different projection patterns
- **Webcam Integration**: Optional webcam input for live video projection
- **Responsive Design**: Adapts to different screen sizes with proper scaling

## Technology Stack

### Core Technologies
- **Three.js** (v0.168.0) - 3D graphics rendering
- **TypeScript** (v5.6.2) - Type-safe JavaScript development
- **Vite** (v5.4.8) - Fast build tool and development server
- **Sass** (v1.79.4) - CSS preprocessing

### Key Libraries
- **@three-ts/orbit-controls** - Camera controls for 3D navigation
- **GSAP** (v3.13.0) - Animation library for smooth transitions
- **ESLint** + **Prettier** - Code quality and formatting

### Development Tools
- **pnpm** - Package manager
- **GitHub Pages** - Deployment platform
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Code Philosophy

### Architecture Principles

1. **Modular Design**: Clean separation of concerns with dedicated modules for WebGL, user media, and common utilities
2. **Type Safety**: Full TypeScript implementation with strict typing and comprehensive interfaces
3. **Performance First**: Optimized rendering with efficient resize handling and pixel ratio management
4. **Interactive Experience**: Smooth animations and responsive interactions using GSAP
5. **Scalable Configuration**: Centralized config system for easy customization of projection parameters

### Key Design Patterns

- **Canvas Application Pattern**: Centralized Three.js application management
- **Model-View Architecture**: Separation between 3D models and rendering logic
- **Event-Driven Interactions**: Mouse and touch events for interactive features
- **Asset Management**: Organized asset structure with proper imports
- **Responsive Design**: CSS custom properties for dynamic theming

### Performance Optimizations

- **Efficient Resize Handling**: Only resizes when actual changes occur
- **Pixel Ratio Management**: Caps device pixel ratio for performance
- **Memory Management**: Proper disposal of Three.js resources
- **Animation Optimization**: RequestAnimationFrame-based rendering loop
- **Asset Optimization**: Compressed videos and optimized images

## 🔧 Configuration

The projection behavior can be customized in `src/modules/webgl/data/config.ts`:

```typescript
const CONFIG: ProjectionConfig = {
  grid: {
    size: 21,         // Grid size (21x21 cubes)
    spacing: 0.6      // Distance between cubes
  },
  cube: {
    width: 0.5,       // Cube width
    height: 0.5,      // Cube height
    depth: 0.25       // Cube depth
  },
  elevation: {
    self: 2,          // Hover elevation amount
    step: 0.5,        // Elevation falloff multiplier
    margin: 0.5       // Margin between pointer and grid interaction (default)
  },
  items: []           // Projection items
}
```

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 📧 Contact

Created by [Arne Decant](https://github.com/arnedecant) - feel free to reach out!
