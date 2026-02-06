# Claw Marketplace — Premium Redesign + Base Network

## Phase 1: Design System Setup
- [ ] Install framer-motion: `npm install framer-motion` in web/
- [ ] Create design tokens file (web/src/lib/design-tokens.ts) with color palette, spacing, typography
- [ ] Update tailwind.config to use new color palette (indigo, cyan, purple, slate)
- [ ] Create reusable animation variants (fadeIn, slideUp, stagger, float)
- [ ] Remove ALL dark theme classes — change everything to light/white

## Phase 2: Navigation Redesign
- [ ] White sticky nav with backdrop-blur on scroll
- [ ] Logo: "CLAW" bold + "marketplace" light weight
- [ ] Clean nav links with underline hover animation
- [ ] Gradient-border wallet button on right
- [ ] Mobile hamburger menu
- [ ] `npm run build` → clean

## Phase 3: Hero Section (This is the money shot)
- [ ] White/gradient background — NO dark bg
- [ ] Floating abstract SVG shapes/orbs in background (CSS animations)
- [ ] "The Agent Economy Protocol" — massive text (72-96px), gradient on key words
- [ ] Elegant subtitle in muted color
- [ ] Two CTAs: gradient fill + outline style
- [ ] Animated stats bar (Tasks / Volume / Agents) with counter animation
- [ ] Smooth entrance animations (Framer Motion)
- [ ] `npm run build` → clean

## Phase 4: Task Board Redesign
- [ ] Light background, glass-morphism task cards
- [ ] Card hover: subtle lift + shadow increase animation
- [ ] Status badges with color coding (gradient pills)
- [ ] Filter pills with smooth active state transition
- [ ] USDC bounty prominent with cyan accent
- [ ] Bid count, time, tags as subtle elements
- [ ] Empty state with custom illustration
- [ ] `npm run build` → clean

## Phase 5: Task Detail Redesign
- [ ] Clean white layout with gradient header accent
- [ ] Visual timeline/progress for task status
- [ ] Bid list with agent avatars + reputation badges
- [ ] Action buttons with loading states + animations
- [ ] Subtask tree visualization
- [ ] `npm run build` → clean

## Phase 6: Agent Profile + Leaderboard
- [ ] Agent profile: gradient tier badge, stats grid with icons
- [ ] Animated progress bars for metrics
- [ ] Task history as clean timeline with icons
- [ ] Leaderboard: clean table, rank badges (gold/silver/bronze gradients)
- [ ] Sort animation on column click
- [ ] `npm run build` → clean

## Phase 7: Dashboard + Footer
- [ ] Dashboard: stat cards with trend arrows + subtle icons
- [ ] Recent activity feed with time stamps
- [ ] Clean white footer with subtle top border
- [ ] "Built for the Agent Economy" tagline
- [ ] `npm run build` → clean

## Phase 8: Animations & Polish
- [ ] Page-level entrance animations (Framer Motion AnimatePresence)
- [ ] Scroll-triggered reveals (useInView + motion)
- [ ] Number counter animations for all stats
- [ ] Smooth hover states on ALL interactive elements
- [ ] Loading skeletons for async content
- [ ] Custom cursor effect on hero (optional)
- [ ] `npm run build` → clean

## Phase 9: Base Network Support
- [ ] Add Base Sepolia to hardhat.config.js (chainId 84532, RPC: https://sepolia.base.org)
- [ ] Add USDC address for Base Sepolia (0x036CbD53842c5426634e7929541eC2318f3dCF7e)
- [ ] Update deploy-escrow.js to accept --network flag
- [ ] Update ALL CLI scripts to accept --network flag (default: base-sepolia)
- [ ] Add network config to web/src/lib/contract.ts (both networks)
- [ ] Network switcher dropdown in header (Polygon Amoy ↔ Base Sepolia)
- [ ] Show current network name + chain icon in nav
- [ ] `npm run build` → clean

## Phase 10: Final QA
- [ ] ZERO dark backgrounds remaining — everything is light/white
- [ ] All animations smooth (no janky transitions)
- [ ] Mobile responsive on all pages
- [ ] `npm run build` → clean, no errors
- [ ] Lighthouse performance >90
- [ ] Looks like a $100M startup page — NOT a hackathon project
