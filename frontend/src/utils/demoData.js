// Pre-computed evaluation results for demo mode.
// These are realistic outputs so any visitor sees a working product instantly.

export const DEMO_DATASETS = [
  {
    id: 'demo-code',
    prompt_echo: 'Write a Python function that finds all prime numbers up to n using the Sieve of Eratosthenes. Include docstring and type hints.',
    results: [
      {
        model_id: 'claude',
        model_name: 'claude-sonnet-4-20250514',
        response_text: `def sieve_of_eratosthenes(n: int) -> list[int]:
    """
    Return a list of all prime numbers up to and including n.

    Uses the Sieve of Eratosthenes algorithm: mark multiples of each
    prime as composite, starting from 2. Time complexity O(n log log n).

    Args:
        n: Upper bound (inclusive). Must be >= 2.

    Returns:
        Sorted list of primes in range [2, n].

    Raises:
        ValueError: If n < 2.
    """
    if n < 2:
        raise ValueError(f"n must be >= 2, got {n}")

    is_prime = [True] * (n + 1)
    is_prime[0] = is_prime[1] = False

    for i in range(2, int(n**0.5) + 1):
        if is_prime[i]:
            for j in range(i * i, n + 1, i):
                is_prime[j] = False

    return [i for i, prime in enumerate(is_prime) if prime]`,
        latency_ms: 1823.4,
        input_tokens: 42,
        output_tokens: 198,
        total_tokens: 240,
        estimated_cost_usd: 0.003096,
        error: null,
      },
      {
        model_id: 'gpt4o',
        model_name: 'gpt-4o',
        response_text: `def sieve_of_eratosthenes(n: int) -> list[int]:
    """
    Find all prime numbers up to n using the Sieve of Eratosthenes.

    Args:
        n: The upper limit (inclusive) for finding primes.

    Returns:
        A list of prime numbers from 2 to n.
    """
    if n < 2:
        return []

    sieve = [True] * (n + 1)
    sieve[0] = sieve[1] = False

    for start in range(2, int(n**0.5) + 1):
        if sieve[start]:
            for multiple in range(start * start, n + 1, start):
                sieve[multiple] = False

    return [num for num, is_prime in enumerate(sieve) if is_prime]`,
        latency_ms: 2341.7,
        input_tokens: 42,
        output_tokens: 155,
        total_tokens: 197,
        estimated_cost_usd: 0.001655,
        error: null,
      },
      {
        model_id: 'gemini',
        model_name: 'gemini-1.5-flash',
        response_text: `def sieve_of_eratosthenes(n: int) -> list[int]:
  """
  Finds all prime numbers up to n using the Sieve of Eratosthenes.

  Args:
    n: The upper limit (inclusive) for finding primes.

  Returns:
    A list of prime numbers up to n.
  """
  if n < 2:
    return []
  primes = [True] * (n + 1)
  primes[0] = primes[1] = False
  for i in range(2, int(n**0.5) + 1):
    if primes[i]:
      for j in range(i * i, n + 1, i):
        primes[j] = False
  return [i for i in range(2, n + 1) if primes[i]]`,
        latency_ms: 987.2,
        input_tokens: 42,
        output_tokens: 138,
        total_tokens: 180,
        estimated_cost_usd: 0.0000148,
        error: null,
      },
    ],
    scores: {
      claude: { latency_rank: 2, cost_rank: 3, length_chars: 842, length_rank: 2, quality_score: 5, quality_rank: 1 },
      gpt4o:  { latency_rank: 3, cost_rank: 2, length_chars: 693, length_rank: 1, quality_score: 4, quality_rank: 2 },
      gemini: { latency_rank: 1, cost_rank: 1, length_chars: 596, length_rank: 3, quality_score: 3, quality_rank: 3 },
    },
    winner_by_metric: {
      latency: 'gemini',
      cost: 'gemini',
      length: 'gpt4o',
      quality: 'claude',
    },
  },

  {
    id: 'demo-qa',
    prompt_echo: 'What is the difference between TCP and UDP? When would you prefer one over the other? Give a practical example for each.',
    results: [
      {
        model_id: 'claude',
        model_name: 'claude-sonnet-4-20250514',
        response_text: `**TCP (Transmission Control Protocol)** and **UDP (User Datagram Protocol)** are the two main transport-layer protocols:

**TCP** establishes a connection before sending data (three-way handshake), guarantees delivery and ordering, handles retransmission of lost packets, and includes flow/congestion control. This reliability comes at the cost of higher latency and overhead.

**UDP** is connectionless — it fires packets and doesn't check if they arrive. No handshake, no acknowledgments, no retransmission. Much faster and lower overhead, but unreliable.

**Choose TCP when** data integrity matters:
- *Example:* Loading a web page (HTTP/HTTPS). Every byte of HTML, CSS, and JavaScript must arrive correctly. A missing packet would corrupt the page, so TCP retransmits it.

**Choose UDP when** speed matters more than completeness:
- *Example:* Live video calls (Zoom, FaceTime). If a packet drops mid-sentence, retransmitting it would arrive too late to be useful — it's better to skip the lost audio and keep the call real-time. A brief glitch beats a multi-second freeze.

**Rule of thumb:** TCP = reliability, UDP = speed. Many modern protocols (like QUIC, used in HTTP/3) implement their own reliability on top of UDP to get the best of both.`,
        latency_ms: 2104.6,
        input_tokens: 38,
        output_tokens: 256,
        total_tokens: 294,
        estimated_cost_usd: 0.003954,
        error: null,
      },
      {
        model_id: 'gpt4o',
        model_name: 'gpt-4o',
        response_text: `**TCP vs UDP**

**TCP (Transmission Control Protocol)**
- Connection-oriented (requires handshake before data transfer)
- Guarantees delivery, order, and error checking
- Slower due to overhead but highly reliable

**UDP (User Datagram Protocol)**
- Connectionless — just sends packets without setup
- No delivery guarantee or ordering
- Faster, lower latency, minimal overhead

**When to use TCP:**
Email or file transfers. If you're downloading a file, every byte must arrive intact. TCP ensures the file isn't corrupted by retransmitting lost packets automatically.

**When to use UDP:**
Online gaming. In fast-paced multiplayer games, sending your player's position 60 times per second is more important than ensuring every update arrives. A dropped packet is simply skipped — using TCP would cause input lag from retransmissions.`,
        latency_ms: 1876.3,
        input_tokens: 38,
        output_tokens: 177,
        total_tokens: 215,
        estimated_cost_usd: 0.001865,
        error: null,
      },
      {
        model_id: 'gemini',
        model_name: 'gemini-1.5-flash',
        response_text: `TCP and UDP are both transport-layer protocols, but they differ significantly in reliability and speed.

TCP is connection-oriented, meaning it establishes a connection before data transfer via a three-way handshake. It guarantees data delivery, maintains packet order, and retransmits lost packets. This makes it reliable but slower.

UDP is connectionless. It sends datagrams without establishing a connection first and doesn't guarantee delivery or order. This makes it faster but unreliable.

Prefer TCP for: web browsing, email, file transfers – any scenario where complete and accurate data delivery is critical. Example: Sending an email. Every character must arrive correctly, so TCP's reliability is essential.

Prefer UDP for: video streaming, online gaming, VoIP – scenarios where speed is paramount and some data loss is acceptable. Example: A live video stream. Dropping a few packets results in minor glitches, but the low latency of UDP keeps the stream smooth. Retransmitting lost packets would cause noticeable delays.`,
        latency_ms: 1123.8,
        input_tokens: 38,
        output_tokens: 186,
        total_tokens: 224,
        estimated_cost_usd: 0.0000183,
        error: null,
      },
    ],
    scores: {
      claude: { latency_rank: 3, cost_rank: 3, length_chars: 1089, length_rank: 3, quality_score: 5, quality_rank: 1 },
      gpt4o:  { latency_rank: 2, cost_rank: 2, length_chars: 729, length_rank: 1, quality_score: 4, quality_rank: 2 },
      gemini: { latency_rank: 1, cost_rank: 1, length_chars: 786, length_rank: 2, quality_score: 4, quality_rank: 2 },
    },
    winner_by_metric: {
      latency: 'gemini',
      cost: 'gemini',
      length: 'gpt4o',
      quality: 'claude',
    },
  },

  {
    id: 'demo-creative',
    prompt_echo: 'Write a short poem (8-12 lines) about the feeling of watching a city wake up at dawn, in the style of Pablo Neruda.',
    results: [
      {
        model_id: 'claude',
        model_name: 'claude-sonnet-4-20250514',
        response_text: `Before the merchants unlock their iron gates,
before the buses swallow their first crowds,
I have loved you, city, in your naked hour—
gray and trembling, smelling of wet stone.

The light comes like a slow confession
across your rooftops, staining them with amber.
A pigeon lifts. A baker's window glows.
Someone coughs behind a curtain, and begins.

This is how I know you love me back:
you undress yourself in front of no one,
and I, the only witness to your softness,
hold your waking like a thing that burns.`,
        latency_ms: 1654.2,
        input_tokens: 36,
        output_tokens: 119,
        total_tokens: 155,
        estimated_cost_usd: 0.001893,
        error: null,
      },
      {
        model_id: 'gpt4o',
        model_name: 'gpt-4o',
        response_text: `I want to do with you what spring does with the cherry trees—
to pull you open, street by street, in the pale first light.
The city sleeps in pieces: shuttered cafés, silent rails,
a janitor's mop tracing circles on the marble floor.

Then slowly, like a tide that has forgotten how to rush,
the day arrives. A bus exhales. A child cries once and stops.
I have loved this hour, the in-between, the held breath
before the city becomes what everyone needs it to be.

Come, let us be the only ones who know its real name—
this city of damp air and half-lit faces, just beginning.`,
        latency_ms: 2198.5,
        input_tokens: 36,
        output_tokens: 142,
        total_tokens: 178,
        estimated_cost_usd: 0.001510,
        error: null,
      },
      {
        model_id: 'gemini',
        model_name: 'gemini-1.5-flash',
        response_text: `Before the sun, a grey breath,
the city stirs, a sleeper half-awake.
Shadows lengthen into light,
the streets are wet with forgotten dreams.

A pigeon lifts from a ledge,
the first bus groans like a lover turning.
Coffee rises from somewhere unseen,
and I, I watch it all becoming.

Oh city, dressed in your own beginning,
how you emerge, reluctant and magnificent,
into this first, uncertain gold.`,
        latency_ms: 891.3,
        input_tokens: 36,
        output_tokens: 97,
        total_tokens: 133,
        estimated_cost_usd: 0.0000119,
        error: null,
      },
    ],
    scores: {
      claude: { latency_rank: 2, cost_rank: 3, length_chars: 468, length_rank: 2, quality_score: 5, quality_rank: 1 },
      gpt4o:  { latency_rank: 3, cost_rank: 2, length_chars: 519, length_rank: 3, quality_score: 4, quality_rank: 2 },
      gemini: { latency_rank: 1, cost_rank: 1, length_chars: 389, length_rank: 1, quality_score: 3, quality_rank: 3 },
    },
    winner_by_metric: {
      latency: 'gemini',
      cost: 'gemini',
      length: 'gemini',
      quality: 'claude',
    },
  },
]
