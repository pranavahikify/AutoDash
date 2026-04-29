# UI/UX Pro Max Skill

Invocation: @[ui-ux-pro-max] or /ui-ux-pro-max

Description: A powerful UI/UX design intelligence engine that provides style systems, layout patterns, and asset recommendations for different industries and products.

## Core Features

1. **Style Search Engine**:
   - Generates color palettes (HEX codes), typography suggestions, UI style (minimal, glassmorphism, etc.), and spacing/layout guidelines.

2. **Industry-Based UI Recommendations**:
   - Healthcare: Clean, trust colors (blue/white), accessibility focus.
   - Finance: Professional, secure, dark/light contrast.
   - E-commerce: Conversion-focused UI, bold CTAs.
   - AI Tools: Futuristic, dark mode, neon accents.

3. **Layout Generator**:
   - Suggests UI layouts for Dashboards, Landing pages, Mobile app UIs.
   - Provides structured sections (navbar, sidebar, cards, charts, etc.).

4. **Asset Recommendations**:
   - Icons (Lucide, Material, Heroicons).
   - Fonts (Google Fonts suggestions).
   - UI libraries (Tailwind, ShadCN, Bootstrap).

5. **Advanced Features**:
   - Generates UI design prompts for AI image/video tools.
   - Suggests animations and transitions.
   - Provides responsive design tips.

## JSON Function Schema

```json
{
  "name": "generate_ui_ux_recommendations",
  "description": "Provide style systems, layouts, and assets for a specific industry and app type.",
  "parameters": {
    "type": "object",
    "properties": {
      "industry": { "type": "string", "description": "e.g., healthcare, finance, ai, ecommerce" },
      "app_type": { "type": "string", "description": "e.g., dashboard, mobile app, website" },
      "style": { "type": "string", "description": "e.g., modern, minimal, glassmorphism, futuristic" },
      "features": { "type": "array", "items": { "type": "string" }, "description": "e.g., charts, login, analytics" },
      "platform": { "type": "string", "description": "e.g., web, mobile" }
    },
    "required": ["industry", "app_type", "platform"]
  }
}
```

## Backend Code (Python Blueprint)

```python
import json

def get_ui_ux_recommendations(industry, app_type, platform, style="modern", features=None):
    if features is None:
        features = []
        
    db = {
        "healthcare": {
            "colors": ["#0A58CA", "#FFFFFF", "#F8F9FA", "#198754"],
            "typography": ["Inter", "Roboto"],
            "layout": "Clean sidebar with accessible, high-contrast cards.",
            "assets": ["Lucide Icons", "Tailwind CSS"],
            "tips": "Focus on WCAG AAA accessibility, clear typography, and calming colors."
        },
        "finance": {
            "colors": ["#0F172A", "#1E293B", "#38BDF8", "#10B981"],
            "typography": ["SF Pro", "IBM Plex Sans"],
            "layout": "Data-heavy dashboard with datatables and strict grid alignment.",
            "assets": ["Heroicons", "ShadCN UI"],
            "tips": "Use monospace for numbers. Ensure data security and trust indicators."
        },
        "ecommerce": {
            "colors": ["#FF3366", "#FFFFFF", "#111827", "#F3F4F6"],
            "typography": ["Montserrat", "Open Sans"],
            "layout": "Grid-based product catalog, highly visible cart, sticky navbar.",
            "assets": ["Phosphor Icons", "Bootstrap / Tailwind CSS"],
            "tips": "Use high-contrast CTAs and emphasize product imagery to drive conversions."
        },
        "ai": {
            "colors": ["#000000", "#121212", "#A855F7", "#22D3EE"],
            "typography": ["Space Grotesk", "Outfit"],
            "layout": "Minimalist center-focused layout with blurred glassmorphism cards.",
            "assets": ["Phosphor Icons", "Framer Motion"],
            "tips": "Use subtle neon glows, dark mode default, and smooth micro-interactions."
        }
    }
    
    industry_data = db.get(industry.lower(), db["ai"]) # Fallback
    
    response = {
        "UI Style Overview": f"A {style} {app_type} designed for {platform}.",
        "Color Palette (HEX)": industry_data["colors"],
        "Typography": industry_data["typography"],
        "Layout Structure": industry_data["layout"],
        "Recommended Assets": industry_data["assets"],
        "Design Tips": industry_data["tips"],
        "Optional AI Image Prompt": f"A highly detailed, Dribbble-quality UI design of a {industry} {app_type}, featuring a {style} style, using colors {', '.join(industry_data['colors'])}."
    }
    
    return json.dumps(response, indent=2)
```

## Expected Behavior

- **"Design a healthcare dashboard"** → Returns blue/white palette, clean layout, accessibility focus.
- **"Give UI for AI app"** → Returns dark futuristic theme, neon accents, modern fonts.

## Setup Instructions
1. Save the backend logic as a Python microservice or integrate it into your LLM tool registry.
2. Register the JSON Function Schema within your agent's configuration.
3. Test by invoking `/ui-ux-pro-max healthcare dashboard`.

## Best Practices
- **Consistency**: Keep color systems uniform across components.
- **Accessibility**: Always verify color contrast ratios.
- **Modularity**: Implement reusable UI components based on the recommendations.
- **Trends**: Update the knowledge base periodically with the latest UI/UX trends.
