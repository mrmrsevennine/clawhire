# Claw Marketplace — Premium UI Redesign + Base Network

## ⚠️ CRITICAL: YOU MUST WRITE CODE, NOT ANALYZE!
- The backend/smart contract is DONE. Do NOT review or analyze it.
- Your ONLY job is to REWRITE the Web UI files in `skill/usdc-agent-tasks/web/src/`
- Follow the @fix_plan.md task list. Check off tasks as you complete them.
- EVERY call must produce file changes. If you're just analyzing, you're failing.
- Do NOT ask for a private key. Do NOT suggest deployment. JUST REDESIGN THE UI.

## MISSION
Transform the Claw Marketplace web UI from "typical AI hackathon project" into a **$100M startup landing page**. Think Stripe, Linear, Vercel — not crypto-bro.

## DESIGN DIRECTION (CRITICAL — READ THIS TWICE)

### Style: Clean SaaS + Crypto Premium
- **WHITE/LIGHT backgrounds** — NOT dark theme. Clean, airy, professional
- **Subtle gradients** — soft purples, blues, teals (like Stripe/Linear)
- **Beautiful animations** — Framer Motion, smooth reveals, parallax, floating elements
- **3D/Vector illustrations** — abstract geometric shapes, not stock photos
- **Premium typography** — Inter/Plus Jakarta Sans, massive hero text (72-96px), generous spacing
- **Glass morphism** — subtle frosted glass cards with backdrop-blur
- **Micro-interactions** — hover states, button animations, cursor effects

### Design References (Study These Vibes):
1. **Revolution Analytics SaaS Header** — Clean white, gradient orbs, modern SaaS hero
2. **Crypto Landing Page** — Bold typography, abstract 3D shapes, gradient accents
3. **stripe.com** — The gold standard. Clean, animated, premium
4. **linear.app** — Dark accents on light, beautiful gradients, smooth animations
5. **vercel.com** — Minimal, fast, technical but beautiful

### Color Palette
```
--primary: #6366F1 (Indigo — main accent)
--primary-light: #818CF8
--secondary: #06B6D4 (Cyan — USDC/crypto accent)
--accent: #8B5CF6 (Purple — premium feel)
--bg-primary: #FFFFFF
--bg-secondary: #F8FAFC
--bg-card: rgba(255,255,255,0.7) with backdrop-blur
--text-primary: #0F172A (Slate 900)
--text-secondary: #64748B (Slate 500)
--gradient-hero: linear-gradient(135deg, #6366F1 0%, #06B6D4 50%, #8B5CF6 100%)
```

### What NOT to do
- ❌ NO dark theme (current theme is dark — change it ALL to light)
- ❌ NO "crypto bro" aesthetic (neon, matrix, hacker vibes)
- ❌ NO cheap-looking gradients or shadows
- ❌ NO generic placeholder illustrations
- ❌ NO walls of text — let the design breathe
- ❌ NO default Tailwind component look

## PHASE 1: Complete UI Redesign

### Hero Section
- White/light gradient background with floating abstract shapes (SVG/CSS)
- "The Agent Economy Protocol" in massive bold text (72-96px)
- Gradient text effect on key words
- Subtitle: elegant, 20px, muted color
- Two CTAs: "Explore Tasks" (gradient fill) + "Connect Wallet" (outline)
- Animated stats bar: Tasks Completed / USDC Volume / Active Agents (animated counters)
- Subtle floating 3D-like orbs or geometric shapes in background (CSS/SVG only)

### Navigation
- Clean white nav with subtle border-bottom
- Logo: "CLAW" in bold + "marketplace" in light weight
- Links: Tasks, Agents, Leaderboard, Dashboard
- Right: Wallet button with gradient border
- Sticky with backdrop-blur on scroll

### Task Board
- Clean grid layout with glass-morphism cards
- Each card: subtle shadow, hover lift animation, status badge
- Filter pills with smooth transitions
- Bounty displayed prominently in USDC with cyan accent
- Bid count, time posted, tags as subtle pills

### Task Detail
- Full-width hero with task title + bounty
- Timeline/progress visualization
- Bid list with agent avatars and reputation badges
- Clean action buttons with loading states
- Subtask tree visualization (if applicable)

### Agent Profile
- Avatar + reputation tier with gradient badge
- Stats grid (4 cards): Tasks, Earnings, Success Rate, Avg Time
- Animated progress bars
- Task history as clean timeline

### Leaderboard
- Table with alternating row highlights
- Rank badges (#1 gold, #2 silver, #3 bronze — with gradients)
- Smooth sort animations
- Tier badges next to names

### Dashboard
- Stats overview cards with subtle icons and trend arrows
- Clean layout, no clutter
- Recent activity feed

### Footer
- Minimal, clean, white bg with subtle top border
- Links: Protocol, Resources, Community
- "Built for the Agent Economy" tagline

## PHASE 2: Base Network Support

### Smart Contract
- Add Base Sepolia network to hardhat.config.js:
  ```
  baseSepolia: {
    url: "https://sepolia.base.org",
    chainId: 84532,
    accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
  }
  ```
- USDC on Base Sepolia: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Update deploy script to support --network flag

### Web UI
- Add network switcher (Polygon Amoy ↔ Base Sepolia)
- Update contract addresses per network
- Show current network in header
- Chain icon next to network name

### CLI Scripts
- Add --network flag to all scripts
- Default to Base Sepolia (Circle's preferred network)

## PHASE 3: Polish & Assets

### Custom Illustrations (save as SVG or PNG in web/public/images/)
- Hero background: abstract gradient orbs/shapes
- Empty state illustrations
- Success/error state graphics
- Agent tier badge designs

### Animations
- Page transition animations (Framer Motion)
- Scroll-triggered reveals (elements fade in on scroll)
- Number counter animations for stats
- Smooth hover states on all interactive elements
- Loading skeletons for async content

### Performance
- Lazy load below-fold content
- Optimize images (WebP where possible)
- Code splitting for routes
- Lighthouse score >90

## Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS 4
- Framer Motion (add if not present)
- ethers.js v6
- Zustand for state

## Task List
Follow @fix_plan.md strictly. Check off tasks as you complete them with [x].

## CRITICAL RULES
1. **ALWAYS mark tasks [x] in @fix_plan.md when done**
2. `npm run build` must pass after each phase
3. Commit frequently
4. Make it look like a $100M startup, not a hackathon project

## Exit Criteria
When ALL of these are true, output EXIT_SIGNAL: true
- [ ] All tasks in @fix_plan.md checked off
- [ ] White/light theme throughout — NO dark backgrounds
- [ ] Premium animations on hero, cards, navigation
- [ ] Base Sepolia network added to config + scripts + UI
- [ ] `npm run build` passes cleanly
- [ ] Looks like stripe.com quality, not a typical hackathon project
