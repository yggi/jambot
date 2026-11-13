# Memory

Persistent facts and a cheatsheet. Start here, and follow the links for depth.
A fact goes next to what it describes: a doc comment in the module, or a line in the module's header.
What doesn't fit there goes to the topic file below, and this page keeps only the cheatsheet and the pointers.
It is read at the start of every session, so it stays small (`tooling/reading-list.ts` caps it and `AGENTS.md`).

## Cheatsheet

```sh
pnpm install
pnpm dev          # web app with hot reload; the prototype is at /prototype.html
pnpm test:watch   # tests, re-run on change
pnpm verify       # lint, format check, typecheck, tests, build: run before pushing
pnpm test:slow    # the six experiments left out of verify: when what the band plays changes (same lock)
pnpm e2e          # the app in Chromium: when what it plays, or when, changes (waits for the heavy runs' lock)
pnpm soak         # a soak of a served build (apps/web/e2e/soak.ts), under the same lock; pnpm heavy --status says who holds it
pnpm lobby        # the lobby server for sessions across machines, on 8787
pnpm lobby:deploy # the lobby server to Fly.io (needs flyctl and FLY_API_TOKEN; the lobby-deploy skill)
pnpm ratchet      # the catalogues over main's history: evidence, rules, aliases
pnpm pages deploy # publish main to GitHub Pages, and check the live site
```

- Claude Code sessions install and fetch at start (`.claude/hooks/session-start.sh`), and every push of a branch runs `pnpm verify` first through git's pre-push hook, blocked if it fails (`pnpm verify --docs` for a diff of `*.md` alone); the hook's stamp, its log, and the GitHub MCP tools that skip it: [repository-and-ci](memory/repository-and-ci.md).
- Two gates that show themselves only by failing: a `Math.pow`, `log`, `exp`, `sin` or similar call in a pure package fails until `tooling/quantized-math.ts`'s audit names it with why it is safe ([testing](memory/testing.md)), and a new experiment takes the next E number after the highest in [`language-experiments.md`](language-experiments.md), where its entry goes.
- To review a pull request, use the `review-pr` skill.

## The family

- [yggi/cell-studio](https://github.com/yggi/cell-studio) started as a spike out of Jambot, to research and define the language: cells, on top of Strudel.
- The direction is to bring the two back together for eternal jam sessions: cells as the score language and its engine as the player, Jambot as the composer, and a shared repository of cell fragments ([brief](briefs/eternal-jam.md)).
- The language becomes a core of its own, [yggi/cells](https://github.com/yggi/cells), which Jambot and Cell studio consume at a tag (D1 on #309).
- The music projects (Cell studio, cells, webmidi, quintenzirkel, play-aeiou, lib-aeiou, flow3r-aeiou, KO-Multitool, ep133-sysex and this one) share a hub, [yggi/music-commons](https://github.com/yggi/music-commons): an atlas, a charter, a glossary and contracts with vectors.
  Jambot runs their vectors (and passes session, meter, swing and feel), each by a `contracts.test.ts` over the package's `fixtures/contracts/`: meter, euclid and notes (`packages/theory`), swing at version 1 and feel at version 3 (`packages/engine`, the reading in `packages/score`, 5 of its 11 lines recorded, #506; `feel` is its performer's own playing, lifted, #474) and session at version 1, minor 9 (`packages/session`).
- The handshake is ruled (#309; yggi/cells decision 037): a new score form (#287, #306, #275, #265) is said in cells, its meaning kept and no spelling of its own grown here.
- Its words and Jambot's part in places (`^`, `_`, `shift`, `cycle=`, Euclid's rotation): read [`cell-studio`](memory/cell-studio.md) before porting a form either way.

## Topics

Read a topic file when you work in its area.
Each is a page of facts, one sentence to a line, and `docs/INDEX.md` lists them.

- [`engine`](memory/engine.md): the levels, the band, the Muse, the style, swing and the clock.
- [`web-app`](memory/web-app.md): the screen, its components and what the end-to-end checks rely on.
- [`session`](memory/session.md): host and client mode, the fault kit, the timing panel.
- [`midi`](memory/midi.md): ports, panic and the drum note maps.
- [`theory`](memory/theory.md): reading names, the helix, Strudel, music21 and tonal.
- [`score-language`](memory/score-language.md): the score's layers, drums, meter and pitch syntax.
- [`analyzer`](memory/analyzer.md): the parser and its ladder.
- [`testing`](memory/testing.md): showing a gate fire, the checks behind the house rules, and running them beside agents.
- [`ratchet`](memory/ratchet.md): the method's catalogues and pawl.
- [`prototype`](memory/prototype.md): running the prototype and what it does.
- [`repository-and-ci`](memory/repository-and-ci.md): CI, Pages, toolchain pins and the license.
- [`terms`](memory/terms.md): root node, rendering node, dough.
- [`cell-studio`](memory/cell-studio.md): the sister project, how to read it, and where its words and Jambot's correspond and part.
- [`hardware`](memory/hardware.md): the live setup.
- [`presets`](memory/presets.md): what a preset decides by hand, what decides by its region of style space, and where each goes (#420).
