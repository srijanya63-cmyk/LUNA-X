# LUNA-X AI Architecture & Ollama Integration Guide

## 1. Core Architectural Separation Principle

> **STRICT ARCHITECTURAL REQUIREMENT**: The Scientific and Mission Engines operate 100% deterministically without dependency on LLMs or cloud AI services.

The Natural Language AI Layer in LUNA-X is **strictly optional** and uses **Local AI (Ollama)** running on the user's machine (`http://localhost:11434`).

If Ollama is not installed, unreachable, or disabled, LUNA-X functions completely without loss of scientific, visualization, or pathfinding features.

---

## 2. Role of the Local AI Layer

The local AI layer performs two specific translation functions:

1. **Natural Language Intent Parsing** (`POST /api/v1/ai/parse-intent`):
   - Input: User natural language prompt (e.g. *"I want a high safety mission targeting ice"*).
   - Output: Structured JSON payload for the backend Mission Engine (`MissionConfig`).

2. **Mission Telemetry & Rationale Explanation** (`POST /api/v1/ai/explain`):
   - Input: Deterministic JSON output from `LandingSiteOptimizer` or `RoverPathfinder`.
   - Output: Flight Director style narrative briefing explaining mission parameters.

---

## 3. Ollama Client & Fallback Protocol

- **Endpoint**: `http://localhost:11434/api/generate`
- **Timeout**: **3.0 seconds** enforced via `httpx.AsyncClient`.
- **Fallback Mechanism**: If Ollama times out, returns malformed output, or is offline:
  - System activates `template_fallback` parsing.
  - Returns structured `IntentParseResponse` with `source: "template_fallback"` and `local_ai_available: false`.
  - Zero application errors or HTTP 500 crashes.

---

## 4. Zero Cloud AI Guarantee

- **Zero External API Calls**: No Gemini, OpenAI, Claude, or remote paid LLM APIs.
- **Zero API Keys**: No API key is ever required to run LUNA-X.
- **100% Local Execution**: All prompt processing remains entirely on the local machine.
