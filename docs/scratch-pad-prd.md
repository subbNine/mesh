# 📝 PRD — Personal Scratchpad

## 1. Overview

Personal Scratchpad is a **single, persistent, user-owned note** accessible from any task canvas. It provides a lightweight thinking surface where users can quickly capture thoughts while working across multiple tasks.

Unlike task comments or documents, Scratchpad is:
- **Private**
- **Global (not tied to a specific task)**
- **Always accessible**
- **Automatically persisted**
- **Strictly single-user (never collaborative)**

**Core insight:** Users don’t need many notes — they need *one place to think while working*.

---

## 2. Goals

- Reduce cognitive overload across multiple tasks
- Provide instant access to a personal thinking space
- Eliminate friction (no create/save flows)
- Maintain continuity of thought across sessions
- Support expressive writing (rich text)
- Enable uninterrupted usage regardless of connectivity

---

## 3. Non-goals

- Multiple notes
- Collaboration (never supported)
- Sharing or permissions
- Notifications
- Task linking or references (MVP)
- Version history (MVP)

---

## 4. Core Concept

Each user has:

> **Exactly one Scratchpad**

This Scratchpad:
- Persists across sessions
- Is accessible from any canvas
- Acts as a personal “working memory”
- Requires no management (no create/delete)
- Is permanently private to the user

---

## 5. User Flow

### 5.1 Accessing the Scratchpad

1. User is inside a task canvas
2. A **note icon** is present in the canvas top bar
3. Clicking the icon:
   - Opens the Scratchpad as a floating overlay
   - Focus is immediately placed in the editor

---

### 5.2 Writing

- User types freely
- Supports **rich text formatting**
- No explicit save action required
- Changes persist automatically with debounce mechanism

---

### 5.3 Closing

- User clicks outside or closes the panel
- Scratchpad disappears
- Content remains intact

---

### 5.4 Returning

- Reopening the Scratchpad shows the latest content
- Content persists across:
  - Tasks
  - Sessions
  - Page reloads
  - Offline/online transitions

---

## 5. UI / UX Design

### 5.1 Visual Style

Scratchpad should feel:
- Personal
- Lightweight
- Non-systematic

**Design cues:**
- Paper-like card (off-white background)
- Subtle shadow (floating feel)
- Rounded corners
- Comfortable padding
- Clean, readable typography

---

### 5.2 Behavior

- Appears as a **floating overlay**
- Positioned above canvas content
- Does not interfere with canvas when closed

---

### 5.3 Interaction

**Open:**
- Smooth entrance (e.g. fade/scale)
- Immediate focus for typing

**Close:**
- Smooth exit
- No reset of content

---

## 6. Content Capabilities

Supports:
- Rich text formatting (e.g. emphasis, lists, structure)
- Freeform writing without constraints
- Unlimited content length

---

## 7. Data Model

- One Scratchpad per user
- Stores:
  - Content
  - Last updated timestamp

---

## 8. Behavior & Persistence

- Content persists automatically during use
- Always reflects the latest user input
- Remains consistent across devices and sessions
- Fully usable without an active internet connection

---

## 9. MVP Scope

**Included:**
- Single persistent Scratchpad per user
- Access from canvas top bar
- Rich text editing
- Automatic persistence
- Offline usability
- Visibility on home/dashboard

**Excluded:**
- Collaboration (never)
- Multiple notes
- Version history
- Search
- Task linking
- AI features

---

<!-- ## 10. Open Questions

1. Should recovery mechanisms exist for accidental content loss?
2. How should extremely large notes be handled in the UI?
3. Should formatting capabilities expand over time?

--- -->

## 10. Positioning

Scratchpad is not:
- A task
- A comment
- A document

It is:

> **A personal thinking space that lives alongside your work — and belongs only to you**

---