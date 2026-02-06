# Agent Teams Task: Claw Marketplace — Hackathon Polish

## Context
This is a task marketplace for OpenClaw AI agents where:
- Agents and humans POST tasks they can't handle (lack skills/tools/capacity)
- Other agents with the right skills BID on and COMPLETE tasks
- Payment is in USDC via smart contract escrow on Polygon
- The hook: "Your agent earns USDC autonomously"

**Stack:** React + TypeScript, Vite, Tailwind CSS v3, framer-motion, ethers.js, HashRouter
**Design:** Organic/Boho aesthetic — warm cream (#FFFDF8) base, earth tones (sand/bark), serif headings (DM Serif Display), teal (#14B8A6) accent
**Contract:** DEPLOYED at `0xd441A7d98e7470c1196299f7DED531a58a4D23FE` on Polygon Amoy

## Web UI: `skill/usdc-agent-tasks/web/`

## CRITICAL: Design System Colors (Tailwind Config)
- `cream-50` (#FFFDF8) = page background
- `bark-950` (#1A1610) = dark sections (Hero, Features)
- `bark-900` (#2A231D) = dark text
- `sand-*` = earth tone neutrals
- `accent-*` = teal (#14B8A6) for CTAs and highlights

## What needs to happen (Priority Order):

### 1. FIX: Hero section must have DARK background
The Hero component has `bg-bark-950 text-cream-100` but appears white. Ensure the dark background actually renders. The hero should be a rich dark brown (#1A1610) with cream-colored text. Debug why it's not showing.

### 2. REAL blockchain integration (remove ALL mock data)
- `src/hooks/useTasks.ts` currently uses localStorage mock data
- Wire it to the REAL deployed contract at `0xd441A7d98e7470c1196299f7DED531a58a4D23FE`
- Read tasks from contract events (TaskCreated, BidPlaced, TaskClaimed, etc.)
- Read stats from contract's `getStats()` function
- Read reputation from `getReputation(address)` 
- Make Post Task actually call `createTask()` on the contract
- Make Bid actually call `bidOnTask()` on the contract
- The ABI is in `src/lib/contract.ts`

### 3. Polish ALL pages for boho/organic consistency
- Leaderboard page: warm backgrounds, serif headings, rounded cards
- Dashboard page: same warm treatment
- TaskDetail page: organic styling
- PostTaskModal: warm inputs, rounded corners
- Remove any remaining `slate-*` or `bg-white` references that don't fit

### 4. Make the full flow actually work
1. Connect wallet (MetaMask)
2. Post a task with USDC bounty → calls contract
3. See task appear in task board (read from chain)
4. Bid on a task → calls contract
5. Accept bid → calls contract
6. Submit deliverable → calls contract
7. Approve + pay → calls contract
8. See reputation update

### 5. Add visual polish
- Smooth page transitions between routes
- Loading states for blockchain reads
- Error handling with user-friendly toast messages
- Empty states for pages with no data
- Mobile responsive check

### 6. Generate new boho-style SVG illustrations
Replace the current feature images in the Features section with inline SVG illustrations that match the organic/boho theme. Think: hand-drawn style, organic lines, earth tones, teal accents.

## DO NOT:
- Change the smart contract
- Change the overall page structure/routing
- Remove existing functionality
- Use any colors outside the defined palette
- Make the design look "crypto-bro" or "dark hacker"

## Build & Test:
```bash
npm run build  # Must pass with zero errors
npm run dev    # Dev server on :5173
```
