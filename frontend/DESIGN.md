---
name: Kinetic Zest
colors:
  surface: '#faf9ff'
  surface-dim: '#d8d9e4'
  surface-bright: '#faf9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3fe'
  surface-container: '#ecedf8'
  surface-container-high: '#e6e7f2'
  surface-container-highest: '#e1e2ed'
  on-surface: '#191b23'
  on-surface-variant: '#574236'
  inverse-surface: '#2d3038'
  inverse-on-surface: '#eff0fb'
  outline: '#8b7264'
  outline-variant: '#dec1b0'
  surface-tint: '#984800'
  primary: '#984800'
  on-primary: '#ffffff'
  primary-container: '#fc8019'
  on-primary-container: '#5e2a00'
  inverse-primary: '#ffb689'
  secondary: '#5a5d73'
  on-secondary: '#ffffff'
  secondary-container: '#dbdef8'
  on-secondary-container: '#5e6177'
  tertiary: '#1b6d01'
  on-tertiary: '#ffffff'
  tertiary-container: '#63b549'
  on-tertiary-container: '#0c4200'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbc8'
  primary-fixed-dim: '#ffb689'
  on-primary-fixed: '#311300'
  on-primary-fixed-variant: '#733500'
  secondary-fixed: '#dee1fa'
  secondary-fixed-dim: '#c2c5de'
  on-secondary-fixed: '#161b2d'
  on-secondary-fixed-variant: '#42465a'
  tertiary-fixed: '#a1f882'
  tertiary-fixed-dim: '#86db69'
  on-tertiary-fixed: '#032100'
  on-tertiary-fixed-variant: '#115300'
  background: '#faf9ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ed'
  status-success: '#60B246'
  status-error: '#E13D45'
  status-warning: '#DB7C38'
  surface-background: '#FFFFFF'
  surface-dark: '#171A29'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  price-display:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-margin: 16px
  gutter: 16px
  section-gap: 32px
  card-padding: 12px
---

## Brand & Style
The brand personality is energetic, efficient, and reliable. It aims to evoke a sense of appetite and urgency while maintaining a professional, high-trust atmosphere for financial transactions and logistics. 

The design style follows **Modern Corporate** principles with a heavy emphasis on **Minimalism**. It utilizes generous whitespace to prevent "menu fatigue," while employing high-energy color accents to guide the user through the conversion funnel. The aesthetic is production-ready, focusing on functional clarity and systematic consistency found in top-tier delivery interfaces.

## Colors
The palette is anchored by a high-visibility orange, used strategically for primary actions and brand identifiers. The deep charcoal functions as the foundation for typography and structural elements, providing a sophisticated contrast that feels more "premium" than pure black.

- **Primary (#FC8019):** Reserved for Call-to-Actions (CTAs), progress indicators, and active states.
- **Secondary (#282C3F):** Used for primary headings and heavy structural components like sidebars or bottom navigation containers.
- **Tertiary (#60B246):** Specifically designated for "Veg" indicators and positive status updates (e.g., "Order Delivered").
- **Neutral (#93959F):** Utilized for secondary text, borders, and disabled states.

The system supports a **Light Mode** default for daytime browsing and a **Dark Mode** (Surface Dark: #171A29) for evening usage, reducing eye strain during late-night orders.

## Typography
Inter is selected for its exceptional legibility and systematic weight distribution. 

- **Hierarchy:** Use `headline-xl` for major page titles (e.g., Restaurant Name). `headline-md` is the standard for item names in a list.
- **Data Clarity:** `price-display` uses semi-bold weights to ensure price points are immediately scannable.
- **Contextual Scaling:** For mobile screens, large headlines scale down to `headline-lg-mobile` to ensure titles do not wrap awkwardly.
- **Labels:** Use `label-bold` with uppercase styling for categories or small metadata tags (e.g., "BESTSELLER").

## Layout & Spacing
The system utilizes a **8px soft-grid** to maintain vertical rhythm. 

- **Grid Model:** A 12-column fluid grid is used for desktop. On mobile, a single-column layout with 16px side margins is standard.
- **Rhythm:** Elements within a component (like a food item card) use 4px or 8px increments. Gaps between distinct sections (e.g., "Offers for you" vs "Top Brands") use 32px to create clear visual separation.
- **Touch Targets:** All interactive elements maintain a minimum hit area of 44x44px.

## Elevation & Depth
Depth is communicated through **Tonal Layers** and subtle **Ambient Shadows**. 

- **Surface 0:** The main background (Light: #FFFFFF / Dark: #171A29).
- **Surface 1 (Cards):** Uses a very soft shadow (0px 2px 8px rgba(40, 44, 63, 0.08)) to appear slightly raised. 
- **Interactive States:** On hover or press, cards may transition to a slightly higher elevation or gain a 1px border of the primary color.
- **Sticky Elements:** Navigation bars and "View Cart" floating buttons use a more pronounced shadow to indicate they sit above all other content.

## Shapes
The shape language is **Rounded**, reflecting a friendly and modern consumer tech vibe. 

- **Standard Elements:** Buttons and input fields use a 0.5rem (8px) radius.
- **Containers:** Large dashboard widgets and restaurant cards use 1rem (16px) to appear softer and more approachable.
- **System Icons:** Icons should follow a rounded terminal style, avoiding sharp corners to match the UI's geometry.

## Components
- **Buttons:** Primary buttons are solid Orange (#FC8019) with white text. Secondary buttons use a 1px Charcoal border. Both feature 8px corner radii and centered semi-bold text.
- **Input Fields:** Search bars and form inputs use a light gray background (#F2F2F3) in Light Mode with no border, becoming outlined with the primary color only on focus.
- **Cards:** Address cards and restaurant listings use a white base with a 1px light border (#E9E9EB). Content is padded by 12px.
- **Chips:** Used for filters (e.g., "Rating 4.0+", "Fast Delivery"). These are pill-shaped with a light stroke that fills with a primary tint when active.
- **Add-to-Cart:** A specialized component—a white pill-shaped button with a green "ADD" label and a "+" icon, often positioned overlapping the bottom edge of a food image.
- **Status Indicators:** Use a small circular dot next to text labels for "Veg" (Green) and "Non-Veg" (Red/Brown) indicators.