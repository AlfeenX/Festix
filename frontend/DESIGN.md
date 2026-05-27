---
name: Festix Design System
colors:
  surface: '#f8f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f8f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#edeef0'
  surface-container-high: '#e7e8ea'
  surface-container-highest: '#e1e2e4'
  on-surface: '#191c1e'
  on-surface-variant: '#5b403a'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f3'
  outline: '#8f7069'
  outline-variant: '#e3beb6'
  surface-tint: '#b52603'
  primary: '#b52603'
  on-primary: '#ffffff'
  primary-container: '#ff5a36'
  on-primary-container: '#5a0c00'
  inverse-primary: '#ffb4a3'
  secondary: '#805600'
  on-secondary: '#ffffff'
  secondary-container: '#fdb32c'
  on-secondary-container: '#6b4800'
  tertiary: '#555c81'
  on-tertiary: '#ffffff'
  tertiary-container: '#8990b8'
  on-tertiary-container: '#21294a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad2'
  primary-fixed-dim: '#ffb4a3'
  on-primary-fixed: '#3d0600'
  on-primary-fixed-variant: '#8c1900'
  secondary-fixed: '#ffddaf'
  secondary-fixed-dim: '#ffba43'
  on-secondary-fixed: '#281800'
  on-secondary-fixed-variant: '#614000'
  tertiary-fixed: '#dde1ff'
  tertiary-fixed-dim: '#bdc4ef'
  on-tertiary-fixed: '#11193a'
  on-tertiary-fixed-variant: '#3e4568'
  background: '#f8f9fb'
  on-background: '#191c1e'
  surface-variant: '#e1e2e4'
typography:
  display:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Sora
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The design system is engineered for a high-energy, premium SaaS ticketing platform. It balances the vibrant, kinetic energy of live festivals with the rigorous, high-performance utility of modern developer tools. The aesthetic is **Corporate / Modern** with a **Futuristic** edge, characterized by hyper-clean layouts, sophisticated depth, and high-impact color accents.

The interface should evoke a sense of professional reliability while maintaining an underlying pulse of excitement. It draws heavy inspiration from the precision of Linear and the approachable premium feel of Stripe, utilizing significant whitespace, refined typography, and intentional motion to guide the user experience.

## Colors

The palette is anchored by the "Festix Orange" and "Festix Gold" gradient, used specifically for primary actions and brand-heavy elements. The foundation relies on "Midnight Navy" for high-contrast text and surfaces, ensuring the "SaaS" side of the product feels grounded and authoritative.

In light mode, surfaces use a clean, layered approach with "Soft White" and "Surface Gray." For dark mode, the system shifts to a deep navy ecosystem, avoiding pure black to maintain depth and sophisticated shadow rendering. Semantic colors are saturated and clear to provide immediate feedback within complex dashboard environments.

## Typography

Typography is a primary differentiator in this design system. **Sora** is utilized for all headlines to provide a geometric, futuristic character. It should always be used with a slight negative letter-spacing at larger sizes to create a "tight," premium editorial look.

**Inter** serves as the workhorse for body copy and UI elements, chosen for its exceptional legibility in data-heavy SaaS dashboards. Hierarchy is established through aggressive weight scaling—ensure labels and headers are distinctly heavier than the body text they introduce.

## Layout & Spacing

The design system utilizes a **12-column fluid grid** for dashboard views and a **fixed-center grid** (max-width 1280px) for marketing and transactional pages. 

The spacing rhythm is based on a **4px baseline**, with 16px (md) and 24px (lg) being the primary containers for padding and margins. For dashboard layouts, gutters are kept at a consistent 24px to allow for high-density information without visual clutter. On mobile devices, margins should compress to 16px, and complex multi-column grids should reflow into a single-column stack.

## Elevation & Depth

This design system uses **Tonal Layers** combined with **Ambient Shadows** to create a sophisticated hierarchy. 

1. **Surface Level (0dp):** Background color (`#F7F8FA` or `#081028`).
2. **Card Level (1dp):** White or `#101935` surfaces with a very soft, large-radius shadow (Blur: 20px, Spread: -5px, Opacity: 4% Navy).
3. **Floating Level (2dp):** Modals and dropdowns. These feature a more pronounced shadow and a subtle 1px border (`Border Gray` or a semi-transparent navy in dark mode) to define edges against similar backgrounds.

Use backdrop blurs (20px) on navigation bars and overlays to maintain a sense of context and "glass-like" transparency, particularly in the dark mode variant.

## Shapes

The shape language is modern and approachable. A **Rounded (0.5rem)** base is used for standard components like input fields and small buttons. 

For high-level containers, such as dashboard cards and main ticket elements, use **rounded-xl (1.5rem)** to emphasize the "friendly startup" feel. Interactive elements like tags or "View Ticket" CTAs can utilize a full **pill-shape** to distinguish them from structural layout elements.

## Components

### Buttons
Primary buttons use the **Festix Vibe Gradient**. They should feature a `box-shadow` that mimics the primary color's glow on hover. Secondary buttons use a subtle ghost style with a `Border Gray` stroke and `Midnight Navy` text.

### Cards
Dashboard cards are the centerpiece. Use `rounded-xl` corners, white backgrounds, and a subtle 1px border. For "Ticket" specific cards, incorporate a decorative "perforation" detail or a vertical gradient strip on the left edge to reinforce the brand's core product.

### Inputs
Search bars and text fields should be clean with `Surface Gray` backgrounds and no border in their default state, moving to a 1px `Primary Orange` border on focus. Icons (via Raycast style) should be used within inputs to aid quick recognition.

### Navigation
The navbar is minimal. Use a clear blurred background with `label-md` typography for links. The active state should be indicated by a small orange dot below the label rather than a heavy underline or background change.

### Chips & Badges
Use high-contrast semantic colors with 10% opacity backgrounds for status indicators (e.g., "Sold Out" using Error Red, "Live" using Success Green).