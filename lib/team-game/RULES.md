# Team game rules

One continuous game. The reader mostly watches. Numbers live in `T` and `LEVELS` in `sim.ts`. No tests: nothing here is shared with other articles.

## The team

Five devs with generated names. Each is secretly exceptional at one area (front end, back end, data, infra, legacy). They work tickets, ship features, chat, and drink coffee on their own.

## The ladder

Cumulative levels. The current level sets the whole team's speed. At least 8 s at each level before the next. Levels built on rapport fall back, one at a time, when rapport drains below what holds them; a fallen 10x needs rallying again.

| Level | Speed | Unlocked by |
| --- | --- | --- |
| A slow start | 1x | — |
| In the flow | 2x | 12 s of calm: no pushing, no measuring, nobody stuck |
| Friends-ish | 3x | rapport 0.4 |
| Friendly competition | 5x | rapport 0.7 |
| Right people, right work | 7x | all five strengths revealed |
| Shared direction | 10x | the rally button |

## Stuck

Devs hit something confusing now and then, labeled by area ("a legacy system bug", "a weird infra issue"). Less often at higher levels. Two kinds, identical from the outside:

- **Ordinary**: resolves itself in 10–18 s. Solving it alone gives more rapport than being helped, and reveals their strength when it was their own area.
- **Permanent**: never resolves without help. Chance starts at 45% and falls with level.

Waiting is the judgment call. Stuck past 10 s, morale drains fast; it recovers at a fraction of that rate, and low morale slows that dev for a long while. Their own specialty always self-solves in 3–6 s.

## Reader actions

- **Click a working dev**: chat. Rapport up. 8 s cooldown per dev.
- **Click a stuck dev**: unblock. Under 1.5 s teaches nothing; later gives rapport.
- **Move ticket** (on a stuck dev): hands the ticket off. If another dev is the expert for that area, it pays: rapport for both, and one proof toward that expert's reveal. Otherwise it does nothing an unblock would not.
- **Push the team** (toggle): current speed × 1.1 while on, × 0.8 for twice as long after.
- **Measure the team** (toggle): no instant slowdown. The velocity stat fills in, and estimates inflate the longer the dashboard stays up (2× at first, and they keep growing), so velocity climbs and climbs. Meanwhile the room talks less: rapport and morale drain, morale cannot recover, and rapport-built levels slip back down one at a time. Fewer real features ship, so customer happiness falls the whole time.
- **Rally the team**: appears at 7x. Sets 10x.

While pushing, recovering, or measuring, nothing improves: no calm, no rapport, no reveals.

## Expertise

Expertise is demonstrated, never granted. A strength reveals after two proofs plus three shipped tickets. Proofs: self-solving a stuck in their own area (45% of stucks land there), solving a ticket routed to them, or helping a teammate with a problem in their own area. Being helped through your own area counts half a proof. Chats and unblocks no longer reveal anything.

## Meters

- **Features shipped** and **story points**: each ticket carries a true value and an estimate; the estimate inflates progressively while measuring.
- **Sprint velocity**: "?" until measured. While the dashboard is up it reads points per rolling day; switched off, the last reading goes stale.
- **Customer happiness**: bar. Tracks the true value shipped, never the estimates, and drains steadily on its own. It only climbs once the team is fast, and measuring makes velocity rise while happiness falls.

## On their own

- Ambient rapport (self-solves, peer help, small talk) only counts while the reader has chatted, helped, or moved a ticket in the last 30 s. An absent manager grows nothing, and someone left stuck past 15 s erodes rapport.
- From friends-ish: teammates help a stuck dev after 4 s, and desk small talk adds a little rapport.
- From friendly competition: occasional show-off bursts.
- Speech bubbles pull from randomized pools: small talk, stuck grumbles, solves, thanks, shop talk.
- The insight feed prints one line per notable moment.
