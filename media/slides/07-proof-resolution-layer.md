# Slide 7: Proof Resolution Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│              🔧 Proof Resolution Layer (New!)                      │
│                                                                     │
│    ┌─────────────────────────────────────────────────────┐        │
│    │                State Machine                        │        │
│    │                                                     │        │
│    │  QUEUED → PROVING → VERIFYING → RESOLVED ✅        │        │
│    │     ↓        ↓          ↓          ↓               │        │
│    │     └────────┴──────────┴───→ FAILED ❌            │        │
│    │                           └──→ CANCELLED 🚫        │        │
│    └─────────────────────────────────────────────────────┘        │
│                                                                     │
│    Reliability Features:                                           │
│    • ⏱️ 30s configurable timeouts                                  │
│    • 🔄 Exponential backoff retry (3 attempts)                    │
│    • 🆔 Correlation IDs for tracking                              │
│    • 🚦 MAX_CONCURRENCY semaphore (3-5)                           │
│    • 📊 Metrics: avg/p95 latency, success rate                    │
│    • ❌ Cancellation with proper cleanup                          │
│                                                                     │
│    Error Handling: TIMEOUT|NETWORK|SERVER|INVALID|RATE_LIMITED    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Companion Text:
**Enterprise-Grade Reliability:** Built following Cassie's recommendations

**Key Improvements:**
- Deterministic state transitions
- Structured error codes with correlation IDs
- Request timeout protection
- Smart retry logic with backoff
- Proper resource cleanup on cancellation
