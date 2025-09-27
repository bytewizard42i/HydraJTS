# Slide 2: The Problem

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                    ❌ Current ZK Proof Problem                     │
│                                                                     │
│    Traditional Approach:                                           │
│    ┌──────────────────────────────────────────────┐               │
│    │  User clicks "Generate Proof"                 │               │
│    │              ↓                                │               │
│    │  ⏳ UI FREEZES (5-30 seconds)                │               │
│    │              ↓                                │               │
│    │  😤 User frustrated                          │               │
│    │              ↓                                │               │
│    │  🔄 Page unresponsive                        │               │
│    └──────────────────────────────────────────────┘               │
│                                                                     │
│    Impact on Users:                                                │
│    • Cannot interact with application                              │
│    • No progress feedback                                          │
│    • May think app crashed                                         │
│    • Poor user experience                                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Companion Text:
**Problem:** Zero-knowledge proof generation blocks the entire JavaScript thread

**User Pain Points:**
- Applications freeze for 5-30 seconds during proof generation
- No ability to cancel or track progress
- Users often refresh page thinking app crashed
- Cannot perform other tasks while waiting
