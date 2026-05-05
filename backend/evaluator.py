import asyncio
import time
from typing import Optional

import anthropic
import google.generativeai as genai
import openai
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from scorer import compute_scores

router = APIRouter()

# Pricing per 1K tokens — update if providers change their rates
PRICING = {
    # model_id -> {input_per_1k, output_per_1k}
    "claude":  {"input_per_1k": 0.003,    "output_per_1k": 0.015},
    "gpt4o":   {"input_per_1k": 0.0025,   "output_per_1k": 0.010},
    "gemini":  {"input_per_1k": 0.000075, "output_per_1k": 0.0003},
}


class EvaluateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=8000)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=512, ge=64, le=4096)
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    google_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-20250514"
    openai_model: str = "gpt-4o"
    google_model: str = "gemini-1.5-flash"


class ModelResult(BaseModel):
    model_id: str
    model_name: str
    response_text: Optional[str] = None
    latency_ms: float
    input_tokens: int
    output_tokens: int
    total_tokens: int
    estimated_cost_usd: float
    error: Optional[str] = None


class ScoreBreakdown(BaseModel):
    latency_rank: Optional[int] = None
    cost_rank: Optional[int] = None
    length_chars: int
    length_rank: Optional[int] = None
    quality_score: Optional[float] = None
    quality_rank: Optional[int] = None


class EvaluateResponse(BaseModel):
    results: list[ModelResult]
    scores: dict[str, ScoreBreakdown]
    winner_by_metric: dict[str, str]
    prompt_echo: str


def _calc_cost(model_id: str, input_tokens: int, output_tokens: int) -> float:
    p = PRICING[model_id]
    return round(
        input_tokens / 1000 * p["input_per_1k"] + output_tokens / 1000 * p["output_per_1k"],
        6,
    )


async def call_claude(
    prompt: str, temperature: float, max_tokens: int, api_key: str, model: str
) -> ModelResult:
    start = time.perf_counter()
    try:
        client = anthropic.AsyncAnthropic(api_key=api_key)
        msg = await client.messages.create(
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
            messages=[{"role": "user", "content": prompt}],
        )
        latency_ms = (time.perf_counter() - start) * 1000
        in_tok = msg.usage.input_tokens
        out_tok = msg.usage.output_tokens
        return ModelResult(
            model_id="claude",
            model_name=model,
            response_text=msg.content[0].text,
            latency_ms=round(latency_ms, 1),
            input_tokens=in_tok,
            output_tokens=out_tok,
            total_tokens=in_tok + out_tok,
            estimated_cost_usd=_calc_cost("claude", in_tok, out_tok),
        )
    except Exception as e:
        latency_ms = (time.perf_counter() - start) * 1000
        return ModelResult(
            model_id="claude",
            model_name=model,
            latency_ms=round(latency_ms, 1),
            input_tokens=0,
            output_tokens=0,
            total_tokens=0,
            estimated_cost_usd=0.0,
            error=str(e),
        )


async def call_gpt4o(
    prompt: str, temperature: float, max_tokens: int, api_key: str, model: str
) -> ModelResult:
    start = time.perf_counter()
    try:
        client = openai.AsyncOpenAI(api_key=api_key)
        resp = await client.chat.completions.create(
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
            messages=[{"role": "user", "content": prompt}],
        )
        latency_ms = (time.perf_counter() - start) * 1000
        in_tok = resp.usage.prompt_tokens
        out_tok = resp.usage.completion_tokens
        return ModelResult(
            model_id="gpt4o",
            model_name=model,
            response_text=resp.choices[0].message.content,
            latency_ms=round(latency_ms, 1),
            input_tokens=in_tok,
            output_tokens=out_tok,
            total_tokens=in_tok + out_tok,
            estimated_cost_usd=_calc_cost("gpt4o", in_tok, out_tok),
        )
    except Exception as e:
        latency_ms = (time.perf_counter() - start) * 1000
        return ModelResult(
            model_id="gpt4o",
            model_name=model,
            latency_ms=round(latency_ms, 1),
            input_tokens=0,
            output_tokens=0,
            total_tokens=0,
            estimated_cost_usd=0.0,
            error=str(e),
        )


async def call_gemini(
    prompt: str, temperature: float, max_tokens: int, api_key: str, model: str
) -> ModelResult:
    start = time.perf_counter()
    try:
        genai.configure(api_key=api_key)
        gmodel = genai.GenerativeModel(
            model,
            generation_config=genai.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
            ),
        )
        resp = await gmodel.generate_content_async(prompt)
        latency_ms = (time.perf_counter() - start) * 1000
        in_tok = resp.usage_metadata.prompt_token_count
        out_tok = resp.usage_metadata.candidates_token_count
        return ModelResult(
            model_id="gemini",
            model_name=model,
            response_text=resp.text,
            latency_ms=round(latency_ms, 1),
            input_tokens=in_tok,
            output_tokens=out_tok,
            total_tokens=in_tok + out_tok,
            estimated_cost_usd=_calc_cost("gemini", in_tok, out_tok),
        )
    except Exception as e:
        latency_ms = (time.perf_counter() - start) * 1000
        return ModelResult(
            model_id="gemini",
            model_name=model,
            latency_ms=round(latency_ms, 1),
            input_tokens=0,
            output_tokens=0,
            total_tokens=0,
            estimated_cost_usd=0.0,
            error=str(e),
        )


@router.post("/evaluate", response_model=EvaluateResponse)
async def evaluate(req: EvaluateRequest):
    from fastapi import HTTPException

    tasks = []
    if req.anthropic_api_key.strip():
        tasks.append(call_claude(req.prompt, req.temperature, req.max_tokens, req.anthropic_api_key, req.anthropic_model))
    if req.openai_api_key.strip():
        tasks.append(call_gpt4o(req.prompt, req.temperature, req.max_tokens, req.openai_api_key, req.openai_model))
    if req.google_api_key.strip():
        tasks.append(call_gemini(req.prompt, req.temperature, req.max_tokens, req.google_api_key, req.google_model))

    if not tasks:
        raise HTTPException(status_code=400, detail="At least one API key is required.")

    results = list(await asyncio.gather(*tasks))

    # Use the Anthropic key for quality scoring if available, otherwise skip quality scoring
    judge_key = req.anthropic_api_key.strip() or ""
    scores, winners = await compute_scores(results, req.prompt, judge_key, req.anthropic_model)
    return EvaluateResponse(
        results=results,
        scores=scores,
        winner_by_metric=winners,
        prompt_echo=req.prompt,
    )
