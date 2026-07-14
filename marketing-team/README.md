# 🧢 Marketing Team — Trucking Life with Shawn

Your AI marketing department, built on Claude Code subagents. One folder,
six specialists, all pre-loaded with your brand, products, links, prices,
and discount codes — so you never have to re-explain the business.

## How to run it

```bash
cd GUARD-SHACK/marketing-team
claude
```

That's it. Claude reads `CLAUDE.md` (the team brief) automatically and the
agents in `.claude/agents/` become available. If you're on Claude Code on
the web, just start a session in this repo and mention the folder.

## The team

| Agent | What they do | Ask them for |
|---|---|---|
| `content-writer` | YouTube scripts, video descriptions, blog posts | "Write a script about winter pre-trips" |
| `seo-specialist` | Keywords, titles, metadata, search traffic | "Find keywords for the truck stop directory" |
| `social-media-manager` | Posts for FB/IG/TikTok/X, Shorts hooks, calendars | "Give me a week of posts promoting the store" |
| `email-marketer` | Welcome sequences, launch emails, newsletters | "Write the follow-up sequence for the free DOT guide" |
| `copywriter` | Landing pages, product descriptions, offers, CTAs | "Punch up the Reg Deck Pro sales copy" |
| `growth-strategist` | Funnel audits, campaign plans, monetization ideas | "Plan the next 30 days of marketing" |

## How to use them

Just ask naturally — Claude routes to the right specialist:

- *"I'm filming a video about getting a level 1 inspection tomorrow — write
  the script outline, the description, and 3 Shorts hooks from it."*
- *"Black Friday is coming. Plan a promo across email, social, and the
  store, using SHAWN10."*
- *"Audit the free-guide funnel and tell me the one thing to fix first."*

Or call an agent directly: *"Use the email-marketer to write a 3-email
launch sequence for Reg Deck Pro."*

For big jobs, ask for the whole team: *"Run a full campaign plan for the
4-Book Bundle — strategy, emails, posts, and video ideas."* Claude will
fan the work out to multiple agents and hand you back one package.

## Keeping the brief current

Everything the team knows lives in [`CLAUDE.md`](CLAUDE.md). When a price
changes, a product launches, or a link moves — edit that one file and the
whole team is updated. Finished work goes in [`output/`](output/) so you
can find it later.
