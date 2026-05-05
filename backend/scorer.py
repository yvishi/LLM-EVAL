import json
import statistics

import anthropic

QUALITY_PROMPT_TEMPLATE = """\
You are a neutral AI response evaluator. You will be given a user prompt and {n} responses \
labeled {labels}. The model names are intentionally hidden. Rate each response on a scale \
of 1 to 5 for overall quality.

Evaluation criteria:
- Accuracy and factual correctness
- Completeness and relevance to the prompt
- Clarity and readability
- Appropriate depth (not too shallow, not unnecessarily verbose)

User Prompt:
{user_prompt}

{responses_block}

Respond ONLY with valid JSON in exactly this format, no explanation:
{json_format}"""


def _build_quality_prompt(user_prompt: str, responses: dict[str, str]) -> str:
    labels = list(responses.keys())
    responses_block = "\n\n".join(f"Response {lbl}:\n{text}" for lbl, text in responses.items())
    json_format = "{" + ", ".join(f'"{lbl}": <integer 1-5>' for lbl in labels) + "}"
    return QUALITY_PROMPT_TEMPLATE.format(
        n=len(labels),
        labels=", ".join(labels),
        user_prompt=user_prompt,
        responses_block=responses_block,
        json_format=json_format,
    )


async def get_quality_scores(
    user_prompt: str,
    responses: dict[str, str],
    id_map: dict[str, str],
    anthropic_api_key: str,
    anthropic_model: str,
) -> dict[str, float | None]:
    """Returns {model_id: score} for all evaluated models."""
    try:
        client = anthropic.AsyncAnthropic(api_key=anthropic_api_key)
        msg = await client.messages.create(
            model=anthropic_model,
            max_tokens=128,
            temperature=0.0,
            messages=[{"role": "user", "content": _build_quality_prompt(user_prompt, responses)}],
        )
        raw = msg.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw)
        return {id_map[lbl]: float(data[lbl]) for lbl in responses}
    except Exception:
        return {mid: None for mid in id_map.values()}


def _rank(items: list, key_fn, ascending: bool = True) -> dict:
    valid = [(item, key_fn(item)) for item in items if key_fn(item) is not None]
    valid.sort(key=lambda x: x[1], reverse=not ascending)
    return {item.model_id: rank for rank, (item, _) in enumerate(valid, start=1)}


async def compute_scores(
    results: list,
    user_prompt: str,
    anthropic_api_key: str,
    anthropic_model: str,
) -> tuple[dict, dict]:
    from evaluator import ScoreBreakdown

    successful = [r for r in results if r.error is None]

    latency_ranks = _rank(successful, lambda r: r.latency_ms, ascending=True)
    cost_ranks = _rank(successful, lambda r: r.estimated_cost_usd, ascending=True)

    lengths = [len(r.response_text or "") for r in successful]
    median_len = statistics.median(lengths) if lengths else 0
    length_ranks = _rank(successful, lambda r: abs(len(r.response_text or "") - median_len), ascending=True)

    # Quality: blind evaluation — needs Anthropic key and at least 2 responses to compare
    quality_scores: dict[str, float | None] = {r.model_id: None for r in results}
    if anthropic_api_key and len(successful) >= 2:
        labels = ["A", "B", "C"][:len(successful)]
        id_map = {labels[i]: successful[i].model_id for i in range(len(successful))}
        responses = {labels[i]: successful[i].response_text or "" for i in range(len(successful))}
        scored = await get_quality_scores(
            user_prompt, responses, id_map, anthropic_api_key, anthropic_model
        )
        quality_scores.update(scored)

    # Quality ranks (higher = better)
    quality_rank_map: dict[str, int] = {}
    qs_pairs = [(mid, s) for mid, s in quality_scores.items() if s is not None]
    qs_pairs.sort(key=lambda x: x[1], reverse=True)
    for rank, (mid, _) in enumerate(qs_pairs, start=1):
        quality_rank_map[mid] = rank

    scores: dict[str, ScoreBreakdown] = {}
    for r in results:
        mid = r.model_id
        scores[mid] = ScoreBreakdown(
            latency_rank=latency_ranks.get(mid),
            cost_rank=cost_ranks.get(mid),
            length_chars=len(r.response_text or ""),
            length_rank=length_ranks.get(mid),
            quality_score=quality_scores.get(mid),
            quality_rank=quality_rank_map.get(mid),
        )

    winners: dict[str, str] = {}
    for metric, rank_map in [
        ("latency", latency_ranks),
        ("cost", cost_ranks),
        ("length", length_ranks),
        ("quality", quality_rank_map),
    ]:
        winner = next((mid for mid, r in rank_map.items() if r == 1), None)
        if winner:
            winners[metric] = winner

    return scores, winners
