# The band on a phone

The owner's brief for #327, kept verbatim.
The mocks that answer it are in [`mobile-ui/`](mobile-ui/), each one HTML file with no dependencies, and the screenshots the issue shows:

- `layouts.html`, the first round: five options, live (`?only=a&tab=song&footer=chords` shows one frame).
- `stage.html`, the direction chosen from them: the transport on top, a drawer hanging from it (Sound, Session, Style, Time, Key, Muse), and a stage below with four views (Song, Melody, Rhythm, Mix); the lobby and the extras in the same frame. `?only=portrait&view=rhythm&rmode=rec`, `?only=lobby&lview=tune` and `?only=landscape&view=mix` show one frame each.

The owner's reply to the first round, also verbatim:

> B and C are out.
> I tend toward a mix of A and D (with E on the side)
> - the drawer sits at the top, hanging down from the transport
> - top drawer holds sound(with midi), session, style, time, key, muse
>
> - bottom switches between 3 views on the stage
> 'Song' - a merge of plan and chords under this sessions play-along perspective
> 'Melody' - the keyboard and a large Piano-Roll
> 'Rhythm' - the drum-pads and a drum-pattern/sequencer view
> 'Mix' - the multi-tracker/mixer from band

## The brief

UI reorganization with several goals
- avoid scrolling and fat-fingering sliders
- show what's relevant at all times
- mobile: resolve limited space with tabs instead of a long ribbon
- avoid any jerks in the ui due to dynamic resizing
- improve playability for actual jamming and improvising.

Goal: on mobile, UI the main interface should appear like a proper app, UX should be robust and avoid frustration and friction.

concepts:
# transport header
get play/stop, stepped bar as background for immediate visual beat-syncing; shows counting and lead-out. detail: lead-out can be aborted (hard-stop) by clicking stop again.
it also gets a 'loop' toggle which keeps playing the current section.

# tabs
most of our current stack of cards condenses to tabbed sections, glyphs and name as rider, details below.

an footer can be toggled at the bottom for playing along: none or one of
a) keyboard
b) drums (kit)
c) chords (show the chord progression with preview, optimized for reading while playing with an acoustic instrument)

desktop is secondary, jambot is clearly Mobile-First.
investigate and plan first, use frontend design capabilities. open an issue, resolve questions with screenshots and mockups
re-use and sharpen what we have, generalize and strengthen the ui architecture. don't be shy to suggest tools and libraries that we could benefit from, but be picky, I want to keep our dependencies slim.

throw a wide net and show me different fundamental options as mock layouts first, so we can get a feel for what works and what does not before we invest further.

The owner's answers to round 2, verbatim:

> yes, mix is a fourth view. do not rebuild it, use the existing band card
> leave loop unwired, we just provide the ui. it is not fully figured out yet.
> scale lock as a toggle
> rhythm grid should be editable. you can edit or record a pattern, and play it locally
> chord shapes would be great, but bonus.
> lobby and extras should follow this layout, mock it first.

The owner's answers to round 3, verbatim:

> rhythm patterns go to the muse
> extras stay in the lobby
