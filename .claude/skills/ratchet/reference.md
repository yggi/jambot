# Ratchet: status and decision words

The words a catalogue entry's `Status:` and `Decided:` fields use, and what each means.
`SKILL.md` gives the claim form and the moves.

The status is the evidence: how far a claim has gone through the game.

| Status      | In the game                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| speculative | There is no decidable test yet. An analogy, kept apart                                                              |
| open        | The test is written down, but nothing has run it                                                                    |
| derived     | The witness is composed from other witnesses along dependencies                                                     |
| measured    | The test ran: every case passed (exhaustive for a finite part), or one failed, which is written "measured, failing" |

A status may have parts with scopes, such as `measured (drums); open (compile)`.
The evidence only rises.

Whether the owner took the claim as a rule is a separate question, so it is a
separate field. In the game, a decided claim is an axiom: it holds without a
witness, and whatever evidence it has is still recorded in its status. T1, "the
clock never waits", is a rule of the spirit and measured on the transport:

```
Status: measured (transport); open (compile). Decided: spirit, inherited.
```

`Decided:` says where the rule was taken and how, which makes the field the
ledger of decisions:

| How                   | The rule                                                                    |
| --------------------- | --------------------------------------------------------------------------- |
| inherited             | Came with the spirit, the prototype or the architecture, before the ratchet |
| dissolved             | The evidence left one option (B3), such as P2 after the theory's work       |
| on measured options   | The owner chose between measured options (B3), as in #38                    |
| in the working track  | Was taken while building, under a house rule, such as R4's true name        |
| ahead of the evidence | Was chosen before anything measured it                                      |

A rule is withdrawn only with `Retired: <reason>`, never removed silently.
