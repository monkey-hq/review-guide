# Add distributed token-bucket rate limiting middleware with an automatic in-memory fallback when Redis is unreachable, protecting public API endpoints from traffic spikes.

4 file(s) · 4 step(s) · 0 understood · 0 needs review

> Drag this file into the Review Guide reader for the interactive walkthrough. The block below is machine-readable data, not meant to be read directly.

<!-- monkey-review-guide:v1 -->
```json
{
  "review": {
    "id": "review-rate-limiter",
    "projectId": "fastapi-demo",
    "cwd": "/fastapi",
    "baseCommit": "main",
    "headCommit": "feat/rate-limiting",
    "branch": "feat/rate-limiting",
    "repoUrl": "https://github.com/tiangolo/fastapi",
    "goal": "Add distributed token-bucket rate limiting middleware with an automatic in-memory fallback when Redis is unreachable, protecting public API endpoints from traffic spikes.",
    "steps": [
      {
        "id": "token-bucket-limiter",
        "semanticKey": "token-bucket-limiter",
        "title": "Implement Redis token-bucket rate limiter",
        "summary": "Core rate limiter tracking request quotas per client IP using an atomic Redis Lua script to prevent race conditions.",
        "before": "Endpoints were unprotected, allowing unrestricted request volume and susceptibility to traffic spikes.",
        "after": "Client requests consume tokens from a sliding 60-second window in Redis. Exceeded quotas return HTTP 429 Too Many Requests.",
        "reason": "Token bucket algorithm ensures burst tolerance while maintaining a strict sustained request rate across distributed workers.",
        "risks": [
          "Redis connection latency adds a small overhead to each request (mitigated by pipelined atomic Lua execution)."
        ],
        "certainty": "certain",
        "status": "unreviewed",
        "anchors": [
          {
            "kind": "lines",
            "filePath": "src/limiter/redis.py",
            "startLine": 4,
            "endLine": 25,
            "note": "Defines atomic token acquisition via Lua script with sliding window TTL."
          }
        ]
      },
      {
        "id": "resilient-memory-fallback",
        "semanticKey": "resilient-memory-fallback",
        "title": "Add graceful in-memory fallback on Redis failure",
        "summary": "Wrap Redis calls with a circuit-breaker fallback to local memory cache so service availability is never compromised by cache downtime.",
        "before": "If Redis became unavailable, requests would raise unhandled connection errors and fail with HTTP 500.",
        "after": "Catches ConnectionError and temporarily degrades to a local in-memory token bucket while logging a warning.",
        "reason": "Rate limiting is a protective layer; a cache failure should never take down the primary application.",
        "risks": [
          "Under failover, individual workers track quotas independently rather than globally."
        ],
        "certainty": "certain",
        "status": "unreviewed",
        "anchors": [
          {
            "kind": "lines",
            "filePath": "src/limiter/fallback.py",
            "startLine": 4,
            "endLine": 20,
            "note": "Implements local thread-safe memory fallback bucket."
          }
        ]
      },
      {
        "id": "fastapi-middleware-hook",
        "semanticKey": "fastapi-middleware-hook",
        "title": "Mount rate limiter as HTTP middleware with custom headers",
        "summary": "Register the limiter into FastAPI's request pipeline and inject standard RateLimit-* response headers.",
        "before": "No rate limiting headers or request interception existed in the HTTP pipeline.",
        "after": "Extracts client IP, queries limiter, and adds X-RateLimit-Limit, X-RateLimit-Remaining, and Retry-After headers to responses.",
        "reason": "Exposes clear quota visibility to API consumers complying with standard rate-limit practices.",
        "risks": [
          "Reverse proxy setups must forward X-Forwarded-For headers reliably to identify client IPs accurately."
        ],
        "certainty": "certain",
        "status": "unreviewed",
        "anchors": [
          {
            "kind": "lines",
            "filePath": "src/middleware/rate_limit.py",
            "startLine": 6,
            "endLine": 30,
            "note": "Middleware dispatch hook injecting quota headers and returning 429 response on quota breach."
          }
        ]
      },
      {
        "id": "integration-tests",
        "semanticKey": "integration-tests",
        "title": "Add concurrency and failover test suites",
        "summary": "Validate token replenishment, burst limits, and zero-downtime failover under simulated Redis outages.",
        "before": "No automated test coverage for traffic throttling.",
        "after": "Simulates 100 concurrent requests asserting exactly 60 succeed and 40 receive HTTP 429, plus a test verifying graceful recovery when Redis disconnects.",
        "reason": "Guarantees race-free behavior and verifies failover reliability before production deployment.",
        "risks": [],
        "certainty": "certain",
        "status": "unreviewed",
        "anchors": [
          {
            "kind": "lines",
            "filePath": "tests/test_rate_limiter.py",
            "startLine": 5,
            "endLine": 30,
            "note": "Async test cases asserting burst limits and fallback behavior."
          }
        ]
      }
    ],
    "questions": [],
    "flow": {
      "title": "Request passes through rate limiter with Redis or memory fallback",
      "nodes": [
        {
          "id": "client",
          "label": "Client Request",
          "change": "unchanged",
          "step": null
        },
        {
          "id": "mw",
          "label": "RateLimitMiddleware",
          "change": "added",
          "step": "fastapi-middleware-hook"
        },
        {
          "id": "redis",
          "label": "RedisTokenBucket",
          "change": "added",
          "step": "token-bucket-limiter"
        },
        {
          "id": "fallback",
          "label": "MemoryFallback",
          "change": "added",
          "step": "resilient-memory-fallback"
        },
        {
          "id": "router",
          "label": "FastAPI Route Handler",
          "change": "unchanged",
          "step": null
        }
      ],
      "edges": [
        {
          "from": "client",
          "to": "mw",
          "label": "HTTP request"
        },
        {
          "from": "mw",
          "to": "redis",
          "label": "check quota"
        },
        {
          "from": "redis",
          "to": "fallback",
          "label": "on connection error"
        },
        {
          "from": "redis",
          "to": "router",
          "label": "token granted"
        },
        {
          "from": "fallback",
          "to": "router",
          "label": "fallback token"
        }
      ]
    }
  },
  "files": [
    {
      "path": "src/middleware/rate_limit.py",
      "oldPath": null,
      "change": "Added",
      "hunks": [
        {
          "header": "class RateLimitMiddleware(BaseHTTPMiddleware):",
          "oldStart": 0,
          "oldLines": 0,
          "newStart": 1,
          "newLines": 30,
          "lines": [
            {
              "kind": "Added",
              "content": "from starlette.middleware.base import BaseHTTPMiddleware",
              "oldLine": null,
              "newLine": 1
            },
            {
              "kind": "Added",
              "content": "from starlette.responses import JSONResponse",
              "oldLine": null,
              "newLine": 2
            },
            {
              "kind": "Added",
              "content": "from src.limiter.redis import RedisLimiter",
              "oldLine": null,
              "newLine": 3
            },
            {
              "kind": "Added",
              "content": "from src.limiter.fallback import MemoryLimiter",
              "oldLine": null,
              "newLine": 4
            },
            {
              "kind": "Added",
              "content": "",
              "oldLine": null,
              "newLine": 5
            },
            {
              "kind": "Added",
              "content": "class RateLimitMiddleware(BaseHTTPMiddleware):",
              "oldLine": null,
              "newLine": 6
            },
            {
              "kind": "Added",
              "content": "    def __init__(self, app, rate_limit: int = 60, window_secs: int = 60):",
              "oldLine": null,
              "newLine": 7
            },
            {
              "kind": "Added",
              "content": "        super().__init__(app)",
              "oldLine": null,
              "newLine": 8
            },
            {
              "kind": "Added",
              "content": "        self.rate_limit = rate_limit",
              "oldLine": null,
              "newLine": 9
            },
            {
              "kind": "Added",
              "content": "        self.redis_limiter = RedisLimiter(limit=rate_limit, window=window_secs)",
              "oldLine": null,
              "newLine": 10
            },
            {
              "kind": "Added",
              "content": "        self.memory_limiter = MemoryLimiter(limit=rate_limit, window=window_secs)",
              "oldLine": null,
              "newLine": 11
            },
            {
              "kind": "Added",
              "content": "",
              "oldLine": null,
              "newLine": 12
            },
            {
              "kind": "Added",
              "content": "    async def dispatch(self, request, call_next):",
              "oldLine": null,
              "newLine": 13
            },
            {
              "kind": "Added",
              "content": "        client_ip = request.client.host or 'anonymous'",
              "oldLine": null,
              "newLine": 14
            },
            {
              "kind": "Added",
              "content": "        try:",
              "oldLine": null,
              "newLine": 15
            },
            {
              "kind": "Added",
              "content": "            allowed, remaining = await self.redis_limiter.consume(client_ip)",
              "oldLine": null,
              "newLine": 16
            },
            {
              "kind": "Added",
              "content": "        except ConnectionError:",
              "oldLine": null,
              "newLine": 17
            },
            {
              "kind": "Added",
              "content": "            allowed, remaining = self.memory_limiter.consume(client_ip)",
              "oldLine": null,
              "newLine": 18
            },
            {
              "kind": "Added",
              "content": "",
              "oldLine": null,
              "newLine": 19
            },
            {
              "kind": "Added",
              "content": "        if not allowed:",
              "oldLine": null,
              "newLine": 20
            },
            {
              "kind": "Added",
              "content": "            return JSONResponse(",
              "oldLine": null,
              "newLine": 21
            },
            {
              "kind": "Added",
              "content": "                status_code=429,",
              "oldLine": null,
              "newLine": 22
            },
            {
              "kind": "Added",
              "content": "                content={'detail': 'Rate limit exceeded. Try again later.'},",
              "oldLine": null,
              "newLine": 23
            },
            {
              "kind": "Added",
              "content": "                headers={'Retry-After': '60', 'X-RateLimit-Limit': str(self.rate_limit)}",
              "oldLine": null,
              "newLine": 24
            },
            {
              "kind": "Added",
              "content": "            )",
              "oldLine": null,
              "newLine": 25
            },
            {
              "kind": "Added",
              "content": "",
              "oldLine": null,
              "newLine": 26
            },
            {
              "kind": "Added",
              "content": "        response = await call_next(request)",
              "oldLine": null,
              "newLine": 27
            },
            {
              "kind": "Added",
              "content": "        response.headers['X-RateLimit-Limit'] = str(self.rate_limit)",
              "oldLine": null,
              "newLine": 28
            },
            {
              "kind": "Added",
              "content": "        response.headers['X-RateLimit-Remaining'] = str(remaining)",
              "oldLine": null,
              "newLine": 29
            },
            {
              "kind": "Added",
              "content": "        return response",
              "oldLine": null,
              "newLine": 30
            }
          ]
        }
      ]
    },
    {
      "path": "src/limiter/redis.py",
      "oldPath": null,
      "change": "Added",
      "hunks": [
        {
          "header": "class RedisLimiter:",
          "oldStart": 0,
          "oldLines": 0,
          "newStart": 1,
          "newLines": 25,
          "lines": [
            {
              "kind": "Added",
              "content": "import redis.asyncio as redis",
              "oldLine": null,
              "newLine": 1
            },
            {
              "kind": "Added",
              "content": "",
              "oldLine": null,
              "newLine": 2
            },
            {
              "kind": "Added",
              "content": "class RedisLimiter:",
              "oldLine": null,
              "newLine": 3
            },
            {
              "kind": "Added",
              "content": "    LUA_SCRIPT = '''",
              "oldLine": null,
              "newLine": 4
            },
            {
              "kind": "Added",
              "content": "    local current = redis.call('INCR', KEYS[1])",
              "oldLine": null,
              "newLine": 5
            },
            {
              "kind": "Added",
              "content": "    if current == 1 then",
              "oldLine": null,
              "newLine": 6
            },
            {
              "kind": "Added",
              "content": "        redis.call('EXPIRE', KEYS[1], ARGV[2])",
              "oldLine": null,
              "newLine": 7
            },
            {
              "kind": "Added",
              "content": "    end",
              "oldLine": null,
              "newLine": 8
            },
            {
              "kind": "Added",
              "content": "    return current",
              "oldLine": null,
              "newLine": 9
            },
            {
              "kind": "Added",
              "content": "    '''",
              "oldLine": null,
              "newLine": 10
            },
            {
              "kind": "Added",
              "content": "",
              "oldLine": null,
              "newLine": 11
            },
            {
              "kind": "Added",
              "content": "    def __init__(self, limit: int = 60, window: int = 60):",
              "oldLine": null,
              "newLine": 12
            },
            {
              "kind": "Added",
              "content": "        self.limit = limit",
              "oldLine": null,
              "newLine": 13
            },
            {
              "kind": "Added",
              "content": "        self.window = window",
              "oldLine": null,
              "newLine": 14
            },
            {
              "kind": "Added",
              "content": "        self.client = redis.Redis(host='localhost', port=6379, decode_responses=True)",
              "oldLine": null,
              "newLine": 15
            },
            {
              "kind": "Added",
              "content": "",
              "oldLine": null,
              "newLine": 16
            },
            {
              "kind": "Added",
              "content": "    async def consume(self, client_ip: str):",
              "oldLine": null,
              "newLine": 17
            },
            {
              "kind": "Added",
              "content": "        key = f'rate:{client_ip}'",
              "oldLine": null,
              "newLine": 18
            },
            {
              "kind": "Added",
              "content": "        count = await self.client.eval(self.LUA_SCRIPT, 1, key, self.limit, self.window)",
              "oldLine": null,
              "newLine": 19
            },
            {
              "kind": "Added",
              "content": "        allowed = count <= self.limit",
              "oldLine": null,
              "newLine": 20
            },
            {
              "kind": "Added",
              "content": "        return allowed, max(0, self.limit - count)",
              "oldLine": null,
              "newLine": 21
            }
          ]
        }
      ]
    },
    {
      "path": "src/limiter/fallback.py",
      "oldPath": null,
      "change": "Added",
      "hunks": [
        {
          "header": "class MemoryLimiter:",
          "oldStart": 0,
          "oldLines": 0,
          "newStart": 1,
          "newLines": 20,
          "lines": [
            {
              "kind": "Added",
              "content": "import time",
              "oldLine": null,
              "newLine": 1
            },
            {
              "kind": "Added",
              "content": "from collections import defaultdict",
              "oldLine": null,
              "newLine": 2
            },
            {
              "kind": "Added",
              "content": "",
              "oldLine": null,
              "newLine": 3
            },
            {
              "kind": "Added",
              "content": "class MemoryLimiter:",
              "oldLine": null,
              "newLine": 4
            },
            {
              "kind": "Added",
              "content": "    def __init__(self, limit: int = 60, window: int = 60):",
              "oldLine": null,
              "newLine": 5
            },
            {
              "kind": "Added",
              "content": "        self.limit = limit",
              "oldLine": null,
              "newLine": 6
            },
            {
              "kind": "Added",
              "content": "        self.window = window",
              "oldLine": null,
              "newLine": 7
            },
            {
              "kind": "Added",
              "content": "        self.storage = defaultdict(list)",
              "oldLine": null,
              "newLine": 8
            },
            {
              "kind": "Added",
              "content": "",
              "oldLine": null,
              "newLine": 9
            },
            {
              "kind": "Added",
              "content": "    def consume(self, client_ip: str):",
              "oldLine": null,
              "newLine": 10
            },
            {
              "kind": "Added",
              "content": "        now = time.time()",
              "oldLine": null,
              "newLine": 11
            },
            {
              "kind": "Added",
              "content": "        cutoff = now - self.window",
              "oldLine": null,
              "newLine": 12
            },
            {
              "kind": "Added",
              "content": "        self.storage[client_ip] = [t for t in self.storage[client_ip] if t > cutoff]",
              "oldLine": null,
              "newLine": 13
            },
            {
              "kind": "Added",
              "content": "        if len(self.storage[client_ip]) < self.limit:",
              "oldLine": null,
              "newLine": 14
            },
            {
              "kind": "Added",
              "content": "            self.storage[client_ip].append(now)",
              "oldLine": null,
              "newLine": 15
            },
            {
              "kind": "Added",
              "content": "            return True, self.limit - len(self.storage[client_ip])",
              "oldLine": null,
              "newLine": 16
            },
            {
              "kind": "Added",
              "content": "        return False, 0",
              "oldLine": null,
              "newLine": 17
            }
          ]
        }
      ]
    },
    {
      "path": "tests/test_rate_limiter.py",
      "oldPath": null,
      "change": "Added",
      "hunks": [
        {
          "header": "async def test_rate_limit_burst():",
          "oldStart": 0,
          "oldLines": 0,
          "newStart": 1,
          "newLines": 25,
          "lines": [
            {
              "kind": "Added",
              "content": "import pytest",
              "oldLine": null,
              "newLine": 1
            },
            {
              "kind": "Added",
              "content": "from httpx import AsyncClient",
              "oldLine": null,
              "newLine": 2
            },
            {
              "kind": "Added",
              "content": "",
              "oldLine": null,
              "newLine": 3
            },
            {
              "kind": "Added",
              "content": "@pytest.mark.asyncio",
              "oldLine": null,
              "newLine": 4
            },
            {
              "kind": "Added",
              "content": "async def test_rate_limit_burst(app):",
              "oldLine": null,
              "newLine": 5
            },
            {
              "kind": "Added",
              "content": "    async with AsyncClient(app=app, base_url='http://test') as client:",
              "oldLine": null,
              "newLine": 6
            },
            {
              "kind": "Added",
              "content": "        responses = [await client.get('/api/items') for _ in range(65)]",
              "oldLine": null,
              "newLine": 7
            },
            {
              "kind": "Added",
              "content": "        successes = [r for r in responses if r.status_code == 200]",
              "oldLine": null,
              "newLine": 8
            },
            {
              "kind": "Added",
              "content": "        throttled = [r for r in responses if r.status_code == 429]",
              "oldLine": null,
              "newLine": 9
            },
            {
              "kind": "Added",
              "content": "        assert len(successes) == 60",
              "oldLine": null,
              "newLine": 10
            },
            {
              "kind": "Added",
              "content": "        assert len(throttled) == 5",
              "oldLine": null,
              "newLine": 11
            },
            {
              "kind": "Added",
              "content": "        assert 'Retry-After' in throttled[0].headers",
              "oldLine": null,
              "newLine": 12
            }
          ]
        }
      ]
    }
  ],
  "branch": "feat/rate-limiting",
  "repoUrl": "https://github.com/tiangolo/fastapi"
}
```
