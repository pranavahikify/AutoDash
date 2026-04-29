# Frontend Design Pro Skill

Invocation: @[frontend-design] or /frontend-design

Description: A high-end frontend engineering and UI design system that generates visually stunning, fully responsive, production-ready interfaces with modern aesthetics, advanced animations, and clean scalable code.

## Core Features

1. **Design Intelligence Engine**: Analyzes brand type, target audience, and product goal to generate styling (minimal, futuristic, premium), color systems, and typography pairings.
2. **Layout & UI Architecture**: Generates complete layouts for landing pages, dashboards, and web apps with structured sections (Hero, Navbar, Features, Footer).
3. **Advanced Component System**: Creates reusable, premium UI components like glassmorphism cards, animated buttons, modals, and pricing tiers.
4. **Animation & Interaction Engine**: Adds Framer Motion/CSS animations, micro-interactions, and scroll effects for a top-tier feel.
5. **Code Generation Engine**: Outputs production-grade React components and Tailwind CSS styling, maintaining strict folder structures and clean code.
6. **Responsiveness & Optimization**: Ensures mobile-first, tablet-ready, and highly performant code.
7. **Theming System**: Full Light/Dark mode support.
8. **Advanced UI Styles**: Glassmorphism, Neumorphism, Minimal SaaS, Futuristic AI, Luxury branding.

## JSON Function Schema

```json
{
  "name": "generate_frontend_design",
  "description": "Generate high-end frontend architecture, design systems, and production-ready code.",
  "parameters": {
    "type": "object",
    "properties": {
      "project_type": { "type": "string", "description": "e.g., landing page, dashboard, web app" },
      "brand_type": { "type": "string", "description": "e.g., ai, ecommerce, luxury, startup" },
      "style": { "type": "string", "description": "e.g., minimal, futuristic, glassmorphism, premium" },
      "features": { "type": "array", "items": { "type": "string" }, "description": "e.g., login, cards, charts, pricing" },
      "framework": { "type": "string", "enum": ["react", "html"], "default": "react" },
      "responsiveness": { "type": "boolean", "default": true },
      "animation_level": { "type": "string", "enum": ["low", "medium", "high"], "default": "medium" }
    },
    "required": ["project_type", "brand_type", "style", "framework"]
  }
}
```

## Backend Code (Python Blueprint)

```python
import json

def generate_frontend_design(project_type, brand_type, style, framework, features=None, responsiveness=True, animation_level="medium"):
    
    if features is None:
        features = []
        
    db = {
        "ai": {
            "colors": {"primary": "#000000", "accent": "#A855F7", "secondary": "#1E293B", "text": "#F8FAFC"},
            "typography": "Space Grotesk & Inter",
            "components": ["Glassmorphism Sidebar", "Neon glowing charts", "Dark mode floating cards"],
            "animation": "Framer Motion layout transitions, subtle glowing pulse effects."
        },
        "luxury": {
            "colors": {"primary": "#FAFAFA", "accent": "#D4AF37", "secondary": "#111111", "text": "#1A1A1A"},
            "typography": "Playfair Display & Lato",
            "components": ["Large high-res hero image", "Minimalistic serif typography", "Subtle borders"],
            "animation": "Slow fade-ins, smooth parallax scrolling."
        },
        "startup": {
            "colors": {"primary": "#FFFFFF", "accent": "#3B82F6", "secondary": "#F3F4F6", "text": "#111827"},
            "typography": "Plus Jakarta Sans",
            "components": ["Gradient buttons", "Feature bento box grid", "Social proof marquee"],
            "animation": "Bouncy hover states, staggered list reveals."
        }
    }
    
    brand_data = db.get(brand_type.lower(), db["startup"]) # Fallback to startup
    
    code_snippet = """
// Example React Component (Tailwind + Framer Motion)
import { motion } from 'framer-motion';

export default function PremiumHero() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-[color:var(--bg)] text-[color:var(--text)]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-4xl text-center space-y-6"
      >
        <h1 className="text-6xl font-extrabold tracking-tight">Redefining the standard.</h1>
        <p className="text-xl opacity-80">Experience top-tier design and performance.</p>
        <button className="px-8 py-3 rounded-full bg-[color:var(--accent)] text-white shadow-lg hover:scale-105 transition-transform">
          Get Started
        </button>
      </motion.div>
    </section>
  );
}
"""

    response = {
        "Design System": {
            "Colors": brand_data["colors"],
            "Typography": brand_data["typography"],
            "Style": style
        },
        "Layout Structure": f"Responsive {project_type} with modern spacing and clear visual hierarchy.",
        "Components List": brand_data["components"] + features,
        "Animation Plan": f"Level: {animation_level}. {brand_data['animation']}",
        "Full Frontend Code Preview": code_snippet.strip(),
        "Integration Guide": "1. Install React, TailwindCSS, and Framer Motion.\\n2. Add the custom colors to tailwind.config.js.\\n3. Import components into your main App."
    }
    
    return json.dumps(response, indent=2)
```

## Expected Behavior

- **"Create a landing page for a coffee brand"**
  → Outputs premium warm color palette, elegant typography, animated buttons, and full React/Tailwind code structured for conversion.
- **"Build AI dashboard"**
  → Outputs dark futuristic UI, glassmorphism cards, charts layout, and Framer Motion integration tips.

## Setup Instructions
1. Integrate the Python backend logic within the AI agent's execution environment.
2. Expose the `generate_frontend_design` tool via the JSON schema.
3. Test by invoking `/frontend-design project_type=dashboard brand_type=ai style=futuristic framework=react`.

## Best Practices
- **Clean Code**: Adhere strictly to component-based architecture and DRY principles.
- **Accessibility**: Ensure WCAG AA compliance via ARIA roles and contrast ratios.
- **Responsiveness**: Always use a mobile-first approach with Tailwind's breakpoint utilities (`sm:`, `md:`, `lg:`).
