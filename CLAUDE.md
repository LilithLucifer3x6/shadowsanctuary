# Shadow & Sanctuary — Project Specification

> **How to use this file.** This is the standing spec. Point your assistant at it at the start of
> every session. If it is not read automatically, paste the RULES block below into the first message.

---

## RULES — read before writing any code

1. **Stack is fixed.** Vite + React. Supabase (Postgres). Vercel for web. Capacitor for Android.
   **Not Next.js with SSR** — Capacitor cannot wrap a server-rendered app.
2. **Never hardcode a list.** Product categories, sub-classes, routine order, intake options,
   reaction checkboxes, and moods are derived at runtime by AI. Every list in this document is an
   example, never a permitted set. **Exception, stated explicitly:** the physiological Risk Ward
   trigger sets (melanin caution, 4C hair buildup, intimate-area caution, depilatory caution) are
   intentionally hardcoded, curated categories, not swappable ingredient data — this is a deliberate
   deviation from this rule, distinct from ingredient-level Codex bans and conflict rules, which
   remain fully dynamic and database-driven.
3. **Routines read all on-hand inventory.** Stocked, Ebbing, and Enshrined all appear. Only Banished
   and Hollow are excluded. Enshrined is a verdict earned at the end of a product's life, not a gate.
4. **Conflicts reschedule, they do not forbid.** Move a product to a slot where it works. Only a
   Codex match or a real hazard removes something.
5. **Conflicts are checked by application zone.** Two products only clash if their zones overlap or
   sit adjacent. Underarm astringent does not conflict with a facial retinoid.
6. **The safety layer is deterministic code.** AI maintains the reference data. AI never makes the
   pass/fail call.
7. **Seed nothing, and survive being empty.** The app starts with no products, no history, no
   profile. Every screen must render with nothing to show. Never use `.single()` where zero rows is
   possible — use `.maybeSingle()` and treat null as valid. This is the most likely crash in the
   entire application.
8. **Every text input takes voice.** Every transcription is reviewable before commit.
9. **Every visible string is in voice.** Amend not Edit. Strike from the record not Delete. Product
   categories stay plain because they must stay scannable.
10. **Never show spec vocabulary.** load-bearing, requires-rinse, layering weight, partner-assisted
    are internal terms. Translate before display.
11. **Use `design-tokens.css` and `custom-icons.js` verbatim.** They are committed from the approved
    mockup. Do not restyle, reinterpret, or improve them. A screen with no mockup equivalent copies
    the nearest one that has. Inventing new visual treatment is a defect.
12. **Icons are drawn, never emoji.** Phosphor for functional marks, game-icons for ritual marks, AI
    draws an inline SVG when neither is exact. Resemblance to the real object is the standard.
13. **Health Connect is the wearable broker on Android.** The web build has no direct wearable
    connection — browsers cannot reach Android's Health Connect API. Instead, the web build reads
    the most recently synced snapshot from the shared Supabase database, written by the Android app
    whenever it syncs fresh Health Connect data. This is an intentional, permanent architectural
    split, not a bug or a stopgap. The web build always shows a visible timestamp of when its data
    was last synced, so staleness is never presented as live.
14. **Everything degrades cleanly.** No wearable connected, or no synced snapshot yet available,
    means those features simply do not appear.
15. **Prescriptions are always named with strength.** Never a generic label.
16. **No streaks, no guilt, no notifications** except the two restock nudges.
17. **No gendered language anywhere**, including the avatar. Their complexion, their crown, the
    Keeper stands ready. Never she/her/he/his. Physiology is accounted for accurately where it
    matters medically, but nothing in the interface assumes a gender. Gendered wording is a defect.
18. **Guided conversations stay purposeful.** Every AI-led conversation
    (intake, The Reading, banishing) must ask purposeful questions, follow
    up meaningfully on the user's actual responses, gently redirect genuine
    tangents, and steer toward its defined end goal rather than drifting.

## BUILD ORDER — finish each phase before starting the next

1. Scaffold, Supabase schema, persistence. Nothing visual.
2. Rootwork: item model, lifecycle states, manual entry. Usable with typed input alone.
3. Routine engine and deterministic safety layer. Still no AI.
4. Screens, voice, icons, ornament.
5. AI layer: intake conversation, photo intake, the Scrying Pool.
6. Wearables, calendar, polish.

## VERIFY BEFORE CALLING ANYTHING DONE

- Render the DOM and assert: no duplicate icon values, no icon name resolving to neither library nor
  the custom set, no invalid font names, no raw icon name appearing as text.
- Grep rendered output for generic UI words (Save, Delete, Edit, Submit, Options, Filter, Sort).
  Any hit is unfinished copy.
- Grep for gendered pronouns. Any hit is a defect.
- Confirm no product name, category list, or routine order appears as a literal in engine code.
- Load the app with an empty database and confirm every screen renders.

---


## 1. Overview

Shadow & Sanctuary is a personal skin, hair, and body care companion for a single user. Two goals carry equal weight: healing and relaxation. Healing covers the skin barrier, active acne, acne scarring, body scarring, scalp sebopsoriasis, and hair moisture. Relaxation means the routine should feel like ritual rather than obligation. The user has ADHD and memory-recall difficulty, so every design decision favors low friction and zero guilt. Everything the app does is cosmetic. It never diagnoses and never replaces a provider. Platform: one codebase serving a web app and an Android build. Single user, no multi-tenancy, no public release.

## 2. Principles

These constrain every decision below. One. Nothing is hardcoded, with the single stated exception of the physiological Risk Ward categories noted in Rule 2. Every routine is generated from current inventory. No product names appear in engine code. Two. One connected system. Where two parts need to share data, they share it. Three. Zero pressure. No streaks, no guilt, no forced completion. Notifications are limited to the two restock cases in section 7. Four. Cosmetic only. The app observes, suggests, and organizes. It does not diagnose. Five. Melanated skin is the default assumption. Hyperpigmentation risk and photosensitivity are checked on every product. Six. Prescriptions are named explicitly everywhere. Never a generic label. Seven. Every domain is equal. Hair, eyes, mouth, face, and body receive identical depth of tracking and evaluation.

## 3. Accessibility and assistance

The user has fibromyalgia, spondyloarthritis, rheumatoid arthritis, and osteoarthritis alongside ADHD, works forty hours a week, and is starting a master's program. Some days involve genuine physical incapacity, not only low executive function. This shapes three requirements. Voice-to-text is mandatory on every text input in the application without exception. Not primary, not preferred — required. Every field, quiz response, search, journal entry, note, and log accepts voice input. A text input without voice capability is a defect, because typing is painful during flares. The reduced routine is presented as a legitimate routine, not a fallback. Choosing it must not read as failure. It is triggered by pain and mobility as often as by executive function. Steps carry a partner-assisted flag. Steps routinely performed by the user's partner: drying off after showering, body acne extractions, lotion application, oil application, operating the RevAir, and dressing assistance including pajamas and socks. Flagged steps display an assist indicator and are understood by the system as requiring another person's availability, not merely the user's energy.
- Text-to-speech is available throughout, not only on documents. Any block of readable content carries a small, unobtrusive speaker control at its right edge: routine steps, weekly wheel entries, calendar days, appointments, altar contents, inventory rows, and Scrying Pool output. Navigation labels and tab titles do not.
- Text-to-speech is toggleable in settings and off does not degrade anything else.
- Font size and typeface are user-adjustable in settings. Every screen reflows to accommodate the chosen size; text may wrap but layout must not break, overlap, or clip at any supported size.
- Elsie is the deliberately chosen sitewide font, including body and functional text, applied by explicit user decision rather than as an oversight. This trades away some at-a-glance legibility in favor of the intended aesthetic; text-to-speech, already available throughout the application per this section, is the accepted accessibility mitigation for that tradeoff.

## 4. The avatar and the room

A one-time builder runs before The First Inscription. Its title is phrased as a question. All wording within it uses the application's own vocabulary — the hair controls belong to The Crown and are named accordingly, never as generic loc colour or loc style.
- The figure renders with visible microlocs at every setting. Locs are the default and only texture; no European textures are offered.
- Hairstyles are visually distinct from one another at a glance. No two options may render alike. Twin buns is a confirmed keeper.
- Every builder choice persists into the room and everywhere else the figure appears. A selection that reverts to default on the following screen is a defect.
- The avatar and familiar are editable later from Settings without repeating intake.

The room is the landing screen: a static illustrated interior, generously sized, richly dressed rather than sparse.
- It contains a hearth with cauldron, an alchemy station with vessels and apparatus, an apothecary bench, a sleeping area, a ritual space, and a working circle marked on the floor.
- Candles are plentiful and lit throughout.
- The figure holds a grimoire, marking them as the one who does the work.
- The familiar shares the room.
- Garment colour and the room's textiles harmonise.
- Hoodoo and rootwork imagery is drawn on respectfully and never as caricature.
- Nothing animates in version one. The scene is built as the foundation the version two companion will inhabit, not as a placeholder to discard.
- The avatar carries no gender. Every label, option, and button in the builder and everywhere the figure appears uses neutral language — their complexion, their crown, their familiar, the Keeper stands ready. No pronoun that assumes a gender appears anywhere in the application, including here. This is not a preference to be weighed against phrasing that reads more naturally; it is a requirement, and gendered wording is a defect.

## 5. Architecture

Rootwork is the single source of truth. It holds all inventory. Rootwork feeds the routine engine. The engine generates every routine surface: Mortal Rites, The Altars, and The Grimoire. These surfaces hold no product data of their own. User activity flows back. Completed steps write to history. Reactions write to The Scrying Pool. The Scrying Pool evaluates that activity and writes conclusions back to Rootwork as state changes and suggestions. The next day's routines read the updated Rootwork. Shadow Tome is deliberately isolated from this loop. It is a private journal and feeds nothing.

## 6. Item data model

Fields on every item. Name: the product's real identity with marketing and accessory language removed. Waterpik, not Waterpik brand wireless water flosser with attachments. Never truncated to a single word. Domain: Crown, Gaze, Grin, Visage, or Vessel. Primary category, derived by AI rather than chosen from a fixed list. Cleanser, toner, serum, moisturizer, sunscreen, mask, oil, exfoliant, and spot treatment are illustrations only. Sub-class, likewise derived. Gel, foaming, sheet, clay, sleep, wash-off, astringent, and gentle are illustrations only. Application zone, required: scalp, hairline and edges, orbital and eyelid, face-upper, face-mid, face-lower, full-face, underarms, chest and back, general body, intimate, oral, lips. Ingredients: structured, manually correctable. Behavior flags: requires-rinse, timer duration in minutes, layering weight one to ten where one is thinnest. Risk flags: melanin caution, photosensitizer, comedogenic, buildup risk, fragrance, retinoid, acid, vitamin C, benzoyl peroxide, exfoliant. Lifecycle state. Opened date, editable and backdatable. Period after opening in months. Storage location: mini fridge, bathroom, vanity, basket, cabinet. Displayed on routine steps so the user knows where to retrieve an item. Price, optional. Scheduling mode: scheduled or anytime. Partner-assisted flag. Glyph. Two independent expiry clocks are held per item. Period after opening runs from Break the Seal. Unopened shelf life runs from manufacture or purchase and applies whether or not the seal is ever broken; a product left unopened for years is not safe by virtue of being sealed. Whichever expires first governs. Both surface through the Scrying Pool's expiry watch. Every field on every item is editable after creation, reachable from the item itself rather than only at entry. Voice-captured input is shown as editable text for correction before it is committed; nothing dictated is written without the chance to amend it. Arsenal items do not carry period-after-opening or opened dates, which are meaningless for durable tools; they carry maintenance and cleaning cadence instead, and may optionally carry an expected service life where a manufacturer states one. Durable tools in The Arsenal carry neither period-after-opening nor an opened date; those fields apply to consumables only. Tools instead track cleaning and maintenance cadence, and where manufacturer data supports it, expected service life by use count. Storage location is user-set and editable on every item, chosen from a list the user extends, never a fixed set.

## 7. Classification rules

Categories and sub-classes are not a fixed enumeration. The system derives them from what a product actually is.
- No category list is hardcoded. AI determines both primary category and sub-class from the label, ingredients, and form, and may create a category or sub-class that has not been seen before.
- Any category named anywhere in this specification is an illustration, not a permitted value.
- The user confirms or corrects the derived classification; the correction becomes the record.
- Bar soaps default to the Vessel domain, with a face-or-body toggle shown at entry. A shampoo bar routes to Crown. Bars marketed for facial acne are frequently used on the body, so marketing copy is not a classification signal.
- Glyphs follow what a product functionally is, never words in its name. Primary category sets the default; a sub-class overrides it when physical nature genuinely differs. Manual override with alternatives is always available. People glyphs use dark-skinned variants.
- Glyphs are globally unique. No two categories, sub-classes, tasks, appointments, altars, or arsenal entries share a glyph. A registry enforces this: on collision AI selects the next best semantic fit rather than duplicating.
- A glyph must depict what the thing is or does, never a word in its name. A thermal cap is not a baseball cap. A lotion warmer is not a plant. Extractions are not a sewing needle. Where no adequate symbol exists, an abstract mark from the application's own ornament set is preferred over a poor literal match.
- Every glyph depicting a person uses a dark-skinned variant. Where a whole-body figure is meant, a single whole-body figure is used rather than a composite of parts.

## 8. Icons

Every icon is unique across the entire application. No two categories, sub-classes, tools, tasks, routines, or rituals share one. Uniqueness is enforced against a live registry at assignment time; when the obvious choice is taken, AI selects the next most functionally apt symbol rather than reusing.
- Glyphs must be legible at small size and must map to function, not to a word in the name. A tool called a cap does not receive a baseball cap. A lotion warmer does not receive a plant. Extractions receive tweezers, not a sewing needle.
- Glyphs are a custom icon set, not Unicode emoji. Emoji is a closed vocabulary of roughly three thousand seven hundred characters containing no tweezers, no skipping rope, no contact lens, no bonnet, and no dropper, so a system requiring a unique apt mark for every category cannot be built on it. Emoji also renders differently on every platform and reads bright and cartoonish, working against the intended aesthetic.
- Two sets are combined. Phosphor or Tabler supplies interface chrome — settings, confirmation, navigation, arrows — at several thousand icons under permissive licence. A fantasy set such as game-icons.net supplies the ritual and product marks: cauldrons, vessels, mortar and pestle, herbs, scrolls, tweezers, droppers, and the silver coin the Silver Toll wants and Unicode does not have. Icons are inline SVG, so every mark is recoloured to the palette, follows the chosen line weight, and scales with the user's text size. This is what makes them more legible than emoji rather than merely more numerous: a drawn mark can be made to mean one thing clearly, at the size and colour the rest of the interface uses.
- Any emoji appearing in a mockup is a stand-in for a drawn icon, never the specification.
- Confirmed libraries. Phosphor Icons supplies 1,512 icons in six weights under MIT licence, delivered as a web font or inline SVG, and covers the functional vocabulary: eyedropper, flask, test tube, syringe, jar, spray bottle, hand soap, towel, tooth, bathtub, shower, hair dryer, shield, crown, hourglass, coins, scroll, cooking pot. Verified names only — an unrecognised name renders as nothing, so every icon is checked against the package before use. Phosphor lacks razor, mirror, candle, tweezers, herb, potion, and contact lens. A fantasy set — game-icons.net under CC BY, or Shikashi's pack — supplies those along with cauldrons, mortar and pestle, tied and open scrolls, and bronze, silver, and gold coin stacks, the last of which resolves the Silver Toll where neither Unicode nor Phosphor can. Where a concept exists in neither, it is commissioned rather than approximated.
- Verified integration details. The package is @phosphor-icons/web, version 2.1.2. Stylesheets live at src/duotone/style.css and src/regular/style.css within the package. The class convention is two classes together — the weight class and the icon class, as in ph-duotone ph-flask. In a bundled build this is an npm install rather than a CDN link.
- All icon rendering passes through a single helper that takes a name and returns markup. Nothing constructs icon markup inline, and nothing interpolates a bare icon name into output. This is not a style preference: it is the only way to guarantee a name cannot escape unrendered.
- Two distinct failure modes, both silent, both caught by rendering rather than by reading code. An unknown icon name renders as an empty space. A name that reaches output without being wrapped in markup renders as its own text, so the interface displays the literal words hand-soap or eyedropper where a mark belongs. The second is more common when names are passed through variables, arrays, or object properties rather than written directly. 
- Verification is by rendering, not inspection: assemble the interface, extract every icon class from the output, check each against the installed package, and check that no raw icon name appears as text. A build that passes a name check but has never been rendered has verified nothing. Uniqueness is checked against rendered output, not against the registry alone. An icon written inline at a call site never enters the registry and so passes a registry-only check while still colliding on screen. Every icon must come from the registry, and the verification pass must confirm that no icon appears in output that the registry does not contain. Concepts Phosphor lacks entirely, requiring the fantasy set or commissioned artwork: toothbrush, tweezers, razor, mirror, candle, contact lens, herb, potion, clay or mud vessel, and a silver coin. Approximation is not acceptable where the concept has a recognisable form. Any mark that requires explanation is drawn instead: a small inline SVG on the icon set's grid and stroke weight, taking its colour from the surrounding text so it inherits the palette and the user's chosen size like every other mark. Roughly half the set is drawn on this basis — cleanser tube, toner bottle, cream jar, prescription tube, ointment tube, roll-on, contact lens, tweezers, heated eye mask, dropper bottle, satin bonnet, spot patch, skipping rope, locs, lacquered nail, depilatory tube, razor, hand mirror, mortar and pestle, urn, steamer, altar, scrying bowl, grimoire, water glass, face, toothbrush, and mask jar. Drawn marks sit in the same registry under the same uniqueness rule, and the general set is used wherever it genuinely fits. 
- Icon assignment for a new product is AI-assisted selection, not AI generation. The model chooses the best mark from the existing set and, where nothing fits, says so and proposes what a new mark should depict rather than inventing one. Generated vector art is unreliable at icon scale and produces shapes that do not read; selection from a curated set is both accurate and effectively free. A proposed new mark is drawn once and added to the set, so the vocabulary grows deliberately. Icon generation is an AI responsibility at the moment a product is added, not a design task performed once. When an item enters Rootwork, the system first seeks an exact match in the installed libraries. Where no apt mark exists — and for most cosmetic objects none does — AI generates a simple line drawing as inline SVG on the same twenty-four unit grid and stroke weight as the rest, using currentColor so it inherits palette and text size. The generated mark is stored with the item, entered in the registry, and checked for uniqueness like any other. The standard is resemblance to the object itself. A cleanser is a pump bottle, an ointment is a squeezed tube, a nail lacquer is a lacquer bottle with its brush. An unrelated object that shares a word or a vague shape is not acceptable — a paint brush is not a toothbrush and a paint bucket is not a mask. Where an existing library icon is genuinely exact, it is used unchanged.

## 9. Composite items

Some items are blends the user compounds. Two exist today: a bath soak of whole milk powder, orange peel powder, rose petals powder, and epsom salts, ground together and dispensed by the scoop; and a scalp oil of olive, black castor, rosemary, and rose oils.
- Entry is through a dedicated action beside photograph and search, labelled in the application's voice rather than as DIY.
- The flow collects: a name; two ingredient fields with an option to add more; the batch creation date; and the form of the blend — oil, liquid, powder, balm, or other.
- Ingredients and form together determine shelf life. Dry goods degrade too, and food-grade components such as milk powder carry real limits. AI estimates viable life from composition and form; the estimate is shown with its reasoning and is editable.
- A composite stores its component items and proportions. A Compound action deducts from components and creates or refills the composite.
- Components and composite deplete on separate clocks: components empty when a batch is made, the composite empties as it is used.
- The ingredient list is the union of components. All safety checks run against that union, and the composite inherits any component's flags.
- A composite carries its own application zone and can be added to any Altar.
- Composites are evaluated by the Scrying Pool at both levels: the blend as a ritual, and components individually.

## 10. Lifecycle states

Every item holds one state. States describe availability and verdict, never quality of the routine.
- Stocked
  - Default for anything on hand, including new items in trial.
  - Included in routines.
- Ebbing
  - Nearing empty. Set manually at first.
  - After roughly two usage cycles the system learns the item's consumption rate and sets this itself. It never prompts the user to set it manually.
  - Included in routines.
- Hollow
  - Ran out. Dropped from routines automatically, retained in inventory.
  - Restocking returns it to Stocked. It re-enters at the position current layering logic dictates, not its former slot.
- Enshrined
  - A verdict, set only after a full container has been used and the product judged worth repurchasing.
  - Not an entry requirement. A product added today is as eligible for the routine as a proven staple.
  - Included in routines.
- Banished
  - Permanent removal for any reason a product leaves for good: adverse reaction, ineffectiveness, changed preference, cost, unavailability, or discontinuation by a provider.
  - Reason is captured through an AI-led conversation rather than a form.
  - Provider-directed discontinuation is its own reason, distinguishing a clinical decision from a product failure.
  - Excluded from routines immediately.
  - Available on every item at any time, presented as a plain three-dot menu once an item is Enshrined.
- Break the Seal
  - Separate from state. A distinct, visible toggle on any unopened item, not a hidden action.
  - Records the opened date and starts the period-after-opening countdown.
  - The opened date is editable and backdatable, which is required: much of the existing inventory was opened before the app existed.
  - Where a purchase date is known, it bounds the earliest possible open date and is offered as an estimate.

## 11. Restock behavior

The Summoning Scroll is the restock list and lives on Rootwork. Essential items surface immediately when Ebbing. Non-essential items batch silently until five accumulate, then surface together. Two notifications exist in the entire application, both restock-related: the batch-of-five prompt, and a per-item prompt once that item has enough usage history to predict depletion. The system sets Ebbing itself once predictive; it never prompts the user to set it manually. Item actions surface directly on the item rather than hiding behind a menu. Enshrine, Banish, Ebbing, Hollow, Break the Seal, Replenish, and Edit are all reachable without opening an overflow. Only destructive or rare actions belong in the overflow. Action labels carry no scaffolding words such as Mark. Every item is editable after creation, and every entry the user makes can be deleted.

## 12. Routine engine

Every routine surface calls this engine. It decides order dynamically. Nothing about placement is hardcoded.
- Input: all Rootwork items whose state is Stocked, Ebbing, or Enshrined, filtered by domain and time of day. Excluded: Banished always, Hollow while out of stock.
- Ordering is derived, never fixed. The engine weighs: function; formulation weight and texture, thinnest to thickest; ingredient behaviour, including pH dependence, occlusivity, penetration, and what must reach skin unimpeded; documented layering convention for the domain; and interactions among everything else scheduled that day.
- Prescriptions are ordered by the same logic as anything else. A topical medication is still a formulation with a weight, a pH, and an ingredient profile. It holds no fixed position.
- Masks hold no fixed position. Placement is derived per day from what else is scheduled.
- Optional items, including masks and anytime items, are placed in their correct position in the sequence and presented with a toggle. They are shown where they belong and never required.
- Rinse-off items are weighted toward days with more time available rather than pinned to fixed days.
- A rinse-and-dry step follows any requires-rinse item. A timer attaches to any item carrying a duration.
- Empty steps do not render. The engine is identical across all five Altars.
- Layering knowledge is sourced from the reference data described in the safety section and applied by the AI layer, not from rules written into application code. As inventory changes, prescriptions change, or products are discontinued, order is recomputed rather than migrated.

## 13. Safety layer

Deterministic checks run on reference data. No AI participates in a pass or fail decision, though AI maintains and expands the reference data it checks against.
- The Codex: a block list of ingredients. Any match prevents a product entering a routine. Lavender is a permanent, non-removable entry, enforced at the database level so it cannot be renamed or deleted through any UI action or direct API call, regardless of what the database row itself might otherwise allow. Others are added at intake or when a product is banished for an ingredient reason.
- Conflict checking is exhaustive, not a fixed shortlist. Every ingredient of every item is checked against a reference set of known interactions, which is queried and expanded through the AI layer rather than enumerated in code. Any conflicts named in this document are examples, not the complete set.
- Checks run continuously across the whole inventory, not only at the moment a product is added.
- Risk flags are domain-specific and equally exhaustive for each. The trigger sets below are intentionally hardcoded, curated, physiological categories per the exception stated in Rule 2 — distinct from ingredient-level Codex bans and conflict rules, which remain dynamic and database-driven.
  - Melanated skin: post-inflammatory hyperpigmentation triggers, photosensitizers, and anything documented to worsen pigmentation. Presence-based rather than concentration-based, since brands do not reliably disclose concentrations. Matches require active acknowledgment and prompt their mitigation.
  - 4C hair in microlocs: buildup from heavy waxes, thick creams, and non-water-soluble silicones; ingredients documented to dry or embrittle 4C hair; ingredients that leave locs gummy or breakage-prone; protein and moisture imbalance.
  - Sensitive skin: depilatory and high-pH formulations, documented irritants, and anything associated with chemical burn or contact rash. Depilatories are flagged specifically, having caused burns and rash for this user.
  - Intimate care: ingredients documented as disruptive to vaginal microbiome or pH. The user is non-binary and female at birth; gendered language is excluded everywhere, and physiology is accounted for accurately.
- Hair removal entries automatically attach pre-care and post-care steps. Post-care for depilatories includes a low-pH cleanse to neutralise residual alkalinity, since thioglycolate formulations leave skin strongly alkaline and a soap wash compounds it.
- Sun protection is treated as load-bearing rather than routine, and includes reapplication guidance where daytime exposure is known. Window glass transmits UVA, which drives pigmentation, so indoor exposure to direct sunlight counts.

## 14. Conflict resolution by zone

Conflicts are evaluated by application zone, not by co-presence in the routine. Two products conflict only when their zones overlap or are directly adjacent. Alcohol-based witch hazel on the underarms does not conflict with a facial retinoid. Salicylic acid bars on chest and back do not conflict with facial actives. A retinal eye serum in the orbital zone and a facial retinoid applied nose-down do not directly layer; that pairing produces an advisory about total retinoid load rather than a block. Adjacent zones produce a migration advisory. A conflict reschedules rather than forbids. The engine moves one product to a slot where it works. Vitamin C conflicting with a nightly retinoid moves to the Morning Rite, its conventional placement. Exfoliating acids move to nights the retinoid is skipped. Buffering is supported, applying moisturizer before a prescription to reduce irritation. Only a Codex match or a genuine hazard removes a product outright. Where nothing can be safely scheduled, the app says so and explains why. Warnings are overridable. The user may proceed after acknowledgment, since a provider may have approved a combination the engine flags. Hardcoded zone rule: Drysol is never scheduled on the same day as the bath ritual or as underarm witch hazel, because aluminum chloride on freshly exfoliated or astringent-treated skin causes burning.

## 15. Master Invocations

Prescriptions. Cannot be Banished by ordinary means; provider-directed discontinuation is the exception and is recorded as such. May be marked Hollow. Zones are editable. Named explicitly wherever they appear.
- Isotretinoin, oral. Alternates 40mg and 80mg. The dose for any given day is derived strictly from the last CONFIRMED dose, never from the calendar. A missed day does not advance the sequence — the next real dose taken picks up from whatever was last confirmed, not from how many calendar days have passed. Confirmation happens only in the Morning Rite, via explicit "Took [dose]mg" or "Missed" actions, never inferred from silence. The Grimoire calendar displays a predicted dose per day for reference only; it is read-only and never the place a dose is confirmed.
- Tacrolimus 0.1% ointment. Zone: orbital and eyelid. Eyelid eczema.
- Drysol, aluminium chloride. Zone: underarms. Hyperhidrosis. Bedtime, dry skin only, never on freshly shaved or irritated skin.
- Zoryve 0.3% foam. Insurance denied refill. Runs out with the current bottle, then Banished as unobtainable.

## 16. The Scrying Pool

The evaluation engine. It reads from everywhere in the system and assesses how well the routine serves the user's stated goals. Inputs: every Rootwork item and state; every Enshrine and Banish with reasons; every logged reaction with zone and severity; completion history including which steps are skipped; intake answers; every Reading check-in. Reaction logging is always available and never gated behind banishing. The Pool lists every product in inventory. Beside each, it renders checkboxes for reactions associated with that product's category and ingredient classes. Retinoid: peeling, redness, purging, dryness, photosensitivity. Acid: stinging, burning, peeling. Fragrance: itching, redness, rash. Hyperpigmentation appears wherever the ingredient class warrants it. Checkboxes derive from ingredient class, not per-product authoring. Each reaction records zone and severity one to five. Outputs: ingredient patterns across banished products; whether the routine is moving toward current goals; replacement suggestions drawn first from owned items, then from the external product database; recommendations to remove a step where the routine does not need it; suggestions for unowned products that would work synergistically; and observed correlations such as which steps are skipped and whether reactions cluster around ingredients or application frequency. Banish reasons are weighted. Availability and cost banishes carry no signal about formulation and are excluded from ingredient pattern analysis. Composites are evaluated at two levels: the blend as a ritual, and its components individually. When two blends share a component and reactions follow the component rather than the blend, that is a strong attribution signal. All five domains receive identical evaluation depth. The Pool contains the Crypt of Ashes, the archive of banished products. All output is cosmetic and observational. Three additional queries. The Waning: items whose period-after-opening countdown is nearing its end are surfaced proactively, before a product degrades. The Echo: before a purchase, the Pool reports whether the user already owns multiple active items built around the same primary active, guarding against redundant spending. The Silver Toll: total monthly cost of the current routine, derived from per-item price and usage frequency, surfaced alongside the Summoning Scroll so restock decisions carry visible cost context.

## 17. The Echo and adaptive suggestions

The Echo accepts prospective items. A photograph or screenshot of something under consideration — in a shop, on a listing, anywhere — is submitted without adding it to inventory. The Pool reports whether its primary actives duplicate what is already owned, whether it conflicts with anything in rotation, whether it trips any domain risk flag, and how it would fit the current routine. Prospective items are held separately from inventory and can be promoted to Rootwork or discarded. Sleep and activity data, where a wearable is connected, informs optional suggestions: poor sleep may surface a de-puffing step for the eye area, and heavy sweat may surface a gentle body cleanse. Suggestions appear only when a suitable product is in inventory, and are always optional.

## 18. Settings

Reached by a gear control in the header, present on every screen.
- Typography: font size and typeface selection, applied globally with full reflow.
- Text-to-speech, defaulting to off. When off, no speaker control appears anywhere in the application — the controls are not merely inactive, they are absent, and the interface must be free of them. When switched on, a small unobtrusive speaker appears at the right of every readable element: routine steps, weekly entries, calendar days, appointed days, altar contents, inventory rows, and Pool findings. Titles and tab labels never carry one.
- Voice selection offers several feminine voices rather than a single default, drawn from those the device provides, with rate and pitch adjustable. The chosen voice persists.
- Integrations: Health Connect authorisation and per-source selection, covering the ring, the watch, and any other connected wellness source. Only data the application actually uses is requested — sleep, readiness, activity, and heavy-sweat signals. Google Calendar authorisation lives here too.
- Resets, at three levels: an individual entry may be deleted anywhere it was entered; a single tab or the routine alone may be reset without touching anything else; and a full reset returns the application to first launch. Destructive resets confirm before acting and name exactly what will be lost.
- Avatar and familiar may be edited here at any time without repeating intake.

## 19. Wearables and health data

Data originates through Android Health Connect, which acts as the single live broker. The application never talks to a manufacturer's service directly.
- On the ANDROID build: Health Connect remains the sole live data source. Whenever the Android app syncs, it writes a fresh snapshot of the relevant readings to the shared Supabase database.
- On the WEB build: there is no direct wearable connection of any kind — browsers cannot reach Android's Health Connect API. Instead, the web build reads the most recently synced snapshot from that same shared database. This is an intentional, permanent architectural split, not a bug or a temporary stopgap: it exists because there is no way for a browser to reach Health Connect directly. The web build always displays a visible timestamp showing when its data was last synced, so the person using it always knows how current the reading is rather than mistaking it for live.
- Sources the user connects: the RingConn companion application for the Gen 3 ring; Samsung Health for the Galaxy watch; and the Renpho application for its devices. Each is toggled independently and states plainly what it contributes.
- Setup is guided rather than a permission wall. The app names each source, explains in one line what it will draw and why, and lets the user decline any single stream while keeping the rest.
- Data drawn, and what each is for:
  - Sleep duration and stages — a poor night raises a de-puffing suggestion for the eye area, and offers the Lesser Rite before the full one.
  - Heart rate variability and resting heart rate — a readiness signal. Low readiness softens the routine and surfaces the breathing space rather than adding steps.
  - Skin temperature — a rising baseline is recorded alongside logged reactions, since inflammation and flare often precede what the user notices.
  - Exercise sessions and active energy — heavy sweat surfaces a gentle body cleanse, guarding against body breakouts, and never schedules an astringent onto freshly worked skin.
  - Steps and general activity — context for how demanding a day was, informing which routine is offered first.
  - Hydration, where logged — context for dryness and barrier concerns.
  - Cycle and hormonal-adjacent data, where the user chooses to share it — feeds the correlation already described in the Scrying Pool. Framed neutrally, with no assumption of a bleeding cycle.
- Weight and body composition are not drawn. They serve no cosmetic purpose here and are outside scope.
- Every incoming stream is read-only. The application writes nothing back to Health Connect.
- All wearable-derived suggestions are optional and appear only when a suitable product is already in inventory. Nothing arrives as an instruction.
- The system degrades cleanly. With no wearable connected, or no synced snapshot yet available on web, every feature above simply does not appear, and no routine depends on data that may be absent.
- Third-party paid wearable-aggregation APIs are explicitly forbidden, to keep the application strictly free to operate.

## 20. Screens

Six tabs across the top, horizontally scrollable on narrow screens. A landing screen (an illustrated exterior cottage view) precedes them, serving as the immediate and only entry point before The First Inscription. First launch routes to intake before anything else. Mortal Rites. Morning Rite and Evening Rite, both present. Generic category labels for ordinary products, real names for prescriptions. Each step is an independent checkbox logging on check. No button requires all steps to be complete. Optional steps use a toggle rather than a checkbox and gate nothing. The Grimoire. Weekly Wheel at top, showing everything scheduled for each day rather than a token entry or two. The month view is sized so day numbers and marks are legible without strain. Below it a real calendar month with the correct day count for the current month and year. Below that, completion history. Salon appointments live here with a Mark Done action that recalculates the next date from actual completion: nails roughly two weeks, retie roughly eight (this is powered by a dedicated `appointments` table and is fully decoupled from external calendar integrations). Veet and shaving are tracked as two separate independently-learned cadences, both permanently optional. The Altars. Five sub-views, always ordered head to toe and never alphabetically or by any other arrangement: The Crown for hair and scalp, with distinct daily-maintenance and wash-day layers; The Gaze for eye care; The Grin for oral care; The Visage for face; The Vessel for body, personal hygiene, and the bath ritual. The Gaze and The Grin do not appear on the calendar; their steps appear in the Rites. Rootwork. The Summoning Scroll at top. Below it The Apothecary for consumables and The Arsenal for durable tools, each grouped by category then sub-category. Add by photo; search is the fallback. The Scrying Pool. Per section 12. The Shadow Tome. A private journal, isolated from all routine logic. Mood is chosen from named feelings, never a numeric scale, and more than one may be true at once. The vocabulary of feeling is AI-generated and broad rather than a fixed handful. A guided breathing and meditation space lives here, drawing on readiness data where a wearable is connected. Voice-to-text throughout, with a visible microphone. Each Altar shows its complete routine in executable order, not an unordered list of the products it draws on. Where an Altar holds more than one rhythm, such as The Crown's daily maintenance and wash day, each is shown whole and in order. Steps name the action, not the product category alone: a toothbrush step reads as brushing teeth so the system and the user share the same meaning.

**Occasional Altars and Surface Augmentation (The Veil):**
Makeup and pure color cosmetics exist outside the therapeutic baseline of The Crown, Gaze, Grin, Visage, and Vessel. They are housed in an occasional-use domain called **The Veil**. Makeup items are strictly classified as `anytime` items and are invoked manually (often grouped as Composite Items like "Date Night Routine"). 
- **Safety Parity:** Makeup items undergo the exact same deterministic Codex, Melanin Ward, and Synergy Engine checks as skincare, as they contain comedogenic and sensitizing ingredients.
- **Mandatory Removal Mechanism:** 
  - **The Trigger:** If the user taps a makeup item in their inventory to log it as "Applied", or if they invoke a Composite Item (like "Date Night") that contains *any* item categorized under The Veil, the application deterministically sets a local/database flag: `makeup_worn_today = true`.
  - **The Consequence:** During evening routine generation, the Synergy Engine checks this flag. If true, it dynamically prepends a Double Cleanse/Oil Cleanse step to the top of The Visage routine.
  - **The Reset:** The `makeup_worn_today` flag auto-resets to `false` the moment the user taps "Complete" on their evening Visage routine, or automatically at 4:00 AM local time (when the new day's Morning Rite generates) to ensure un-cleared flags do not permanently force double-cleansing on subsequent days.

## 21. Fixed sequences

Two routines do not vary by product and are sequenced rather than generated. The Grin: floss picks, water pick, mouthwash, brush. The evening wind-down: shower, dry off, extractions running sequentially with the heated eye mask, lotion, oil. (Note: The instruction to submerge extraction tools in alcohol lives in equipment rules / Master Invocations rather than injected directly here). Extractions precede all oils. The bath ritual sits in The Vessel at roughly a two-week cadence, adjustable and invitational. The soak is a composite per section 5. Its milk powder contributes lactic acid, so it carries the exfoliant flag, which triggers the Drysol separation in section 10 and prevents same-day stacking with salicylic acid body bars.
- Devices that time themselves are not given app timers, and their durations are not restated in the step.

## 22. Equipment rules

Tools in The Arsenal carry usage rules that are not ingredient-based and cannot be derived from a label. These are stored per tool and surfaced on the step that uses them. Hooded steamer: no plastic cap underneath. Direct steam is the purpose, and a cap blocks it. Thermal or silver-lined heat cap: plastic cap goes underneath. This is the inverse of the steamer rule, and the two are easily confused. Extraction tools: hands washed with antibacterial soap before starting; tools submerged in seventy percent isopropyl alcohol for five to ten minutes before and after use. RevAir: flagged partner-assisted, being heavy and difficult to maneuver. Hand washing is an ordinary routine step following any prescription application. It gates nothing and blocks nothing; it appears in sequence like any other step.

## 23. Onboarding and check-ins

Both intake and check-in are AI-led conversations rather than forms. The user speaks; AI asks, follows up, and structures the answers. Form and checkbox paths remain available as the fast route.
- The First Inscription runs once, before any other screen. It gathers known allergies and sensitivities, seeding the Codex; active prescriptions, becoming Master Invocations; conditions to protect; current concerns, setting routine priority; oral medications as cosmetic-evaluation context; and product philosophy preference across traditions, which shapes what the Scrying Pool suggests, limited to what ships to the US.
- The Reading runs every thirty days. It asks what currently weighs on the user and what the goals are, then re-sorts the entire routine across all domains. It re-asks medications, pre-filled with the previous answer.
- Banishing a product opens a conversation that captures the reason.
- Any data entry that can be conducted as a conversation is conducted as one. Manual entry is a fallback, never the primary path.
- The conditions question, the current-concerns question, and the opening skin question are required. The opening question offers a relaxation-only answer for when nothing is actively wrong.
- Every option list in intake is AI-generated and open-ended, never a fixed menu. Conditions, concerns, and product traditions are drawn from reference data and expand as the field does; the user may add anything absent. Any list shown in this document is illustrative.
- Product traditions extend to every market whose products can be shipped to the US, not a short list of five.
- Intake copy never explains the system to itself. Cadence, re-prompting, and internal mechanics are not narrated to the user.
- Nothing is pre-populated into inventory at intake except prescriptions the user confirms. Products discussed during design are not seeded.
- Option pools are broad by default, not minimal. Every question presents a wide, recognisable set — dozens of conditions, concerns, and traditions — because the user cannot name an affliction they have not heard of. Recognition, not recall.
- **5-Domain Intake Requirement:** Intake must evaluate all five domains (Crown, Gaze, Grin, Visage, Vessel) with identical evaluation depth. It cannot simply ask for "general concerns." The AI or fast-path flow must specifically gather concerns for the scalp/hair, under-eyes/lashes, gums/teeth, facial skin, and body skin using domain-specific, AI-generated, open-ended pools. This follows the Guided Conversation Guardrails (Rule 18), ensuring meaningful follow-up for each domain before considering the intake section complete.
- An add-your-own control is a supplement to a rich pool, never a substitute for one. A short list with an other button is a failure of the requirement.
- AI widens each pool at presentation time, drawing adjacent and related conditions the user has not named, and refines what it offers as it learns what is relevant.

## 24. Oral medications

Oral medications are recorded at intake as cosmetic-evaluation context. The app flags three classes with direct cosmetic relevance. Photosensitizers, including tetracycline-class antibiotics commonly prescribed for acne, compound topical retinoid sun sensitivity and raise hyperpigmentation risk on melanated skin. The app reinforces sun protection prompts accordingly. Systemically drying medications increase the barrier support the routine should provide. Immunosuppressants, standard treatment for rheumatoid arthritis and spondyloarthritis, raise infection risk during skin-breaking procedures. Where one is recorded, the app surfaces a caution on the extraction step and on its sanitization protocol rather than scheduling extractions without comment. The app performs no drug interaction checking. That is a pharmacist function with purpose-built tools, and anything beyond the three cosmetic classes above is routed to the user's pharmacist. Recorded medications: methotrexate and etanercept, both for inflammatory arthritis. Both are immunosuppressant, activating the extraction caution described above against a routine that currently schedules extractions every shower. Methotrexate is additionally photosensitizing, which compounds topical retinoid sun sensitivity and raises hyperpigmentation risk on melanated skin; sun protection prompts are weighted accordingly and are treated as load-bearing rather than routine.

## 25. AI scope

AI never touches the safety layer. The Codex, Melanin Ward, Synergy Engine, zone rules, and Master Invocation handling are deterministic code, because a safety rule that occasionally hallucinates is not a safety rule. Everywhere else, AI carries the manual burden. The design goal is that the user photographs, speaks, or taps, and never types structured data. Natural language capture. Speech-to-text transcription runs on-device through the browser speech API at no cost; AI parses the resulting transcript into structured records. Adding a product, logging a reaction, marking something Hollow, or noting a purchase can all be done by speaking a sentence. Checkbox and form paths remain as the fast route; voice is the low-effort route. The Reading is conducted conversationally rather than as a form. AI asks, the user talks, AI structures the answers. Evaluation. Replacement suggestions on banish, drawn from owned items and the external database and screened through the full safety layer before display. The judgment that a step should be removed rather than replaced. Failure summarization. Ingredient patterns across the banished set. The Echo redundancy check. The whole-routine assessment. Proactive suggestions for unowned products, weighted toward hyperpigmentation and photosensitivity risk on melanated skin. Composite blend analysis across component ingredients. Price estimation where no receipt exists, stored and displayed as an estimate. All AI-generated text displayed in the interface is written in the application's voice per section 22. Suggestions, summaries, assessments, and empty states read as ritual language, not as generic assistant prose. This is a hard constraint on every prompt, not a stylistic preference: the input may be casual speech, but nothing rendered on screen breaks the voice. All AI output is cosmetic and advisory. It suggests products; it does not name conditions. Note: All Anthropic AI proxy responses must strip `thinking` content blocks before returning to ensure compatibility with client-side index-based text access.

**Anti-Eurocentric Standing Principle:** No assumption anywhere in the app — concern lists, condition suggestions, avatar aesthetic defaults, product recommendation logic — should default to Eurocentric standards. The system is explicitly built for a Black, plus-size, non-Eurocentric user. All AI prompts generating UI text, diagnosing conditions, or suggesting products MUST explicitly prioritize global representation and conditions presenting in melanated skin (e.g., PIH, keloiding). Skin type, texture preferences, and hyperpigmentation tracking must follow rigorous clinical standards (e.g. Baumann frameworks) but remain fully AI-generated and open-ended.

## 26. Data capture and import

Product intake. Multiple photos per product are captured in one session and submitted together: front for name and brand, back for the ingredient list and period-after-opening symbol, and a separate close shot of any embossed or stamped code, which typically sits on the crimp or base and needs its own angle. From that set AI returns name, brand, category, sub-class, full ingredient list, period-after-opening, container size, and inferred application zone, layering weight, texture, risk flags, and glyph. The user confirms or corrects rather than authoring. Embossed codes are frequently batch codes rather than dates, and decoding conventions vary by manufacturer, so any uncertain read is surfaced as unconfirmed rather than written silently into a countdown the user then relies on. Where a product is absent from the external ingredient database, AI supplies the ingredient list from its own knowledge, marked unverified. Bulk import is source-agnostic. Any uploaded image may contribute any field, and no source is restricted to a fixed set of data. Ingredients are not reliably printed on the container: they frequently appear only on outer packaging that gets discarded, or only on a retailer listing. Valid sources include the product front and back, the outer carton, an embossed code close-up, a retailer product page screenshot, and an order-history screenshot. AI extracts whatever each image actually contains rather than what its category is expected to contain. Images for many products are uploaded in a single operation. AI groups them by product, matching front, back, carton, and listing shots of the same item, and proposes the grouping for review. Nothing commits until the user confirms the grouped sets, because an incorrectly merged pair of products is more costly to untangle afterward than to correct before writing. Where multiple sources describe the same field, they merge by precedence rather than by arrival order. The physical container ranks highest, since it is authoritative for the item actually owned. Outer packaging ranks next. Retailer listings rank below both, because listings go stale when a product is reformulated. The external ingredient database ranks next, and AI knowledge last. Disagreements between sources are surfaced to the user with both values shown rather than silently resolved, since an ingredient list is the input to every safety check. Fields present in only one source are taken from it and flagged as single-sourced.

## 27. Product identification

Products are added by photo. Optical character recognition extracts label text, matched against an external database — Open Beauty Facts and the INCI ingredient dictionary — returning a structured ingredient list that feeds the Melanin Ward and Synergy Engine. A search bar is the fallback when a photo cannot be identified, searching that same external database. It does not search the user's own inventory. Manual correction of any scanned result is always available, since every safety check depends on ingredient accuracy.

## 28. Visual and voice

Palette: obsidian ground, plum accents throughout, silver and platinum metals. Plum is the dominant, consistent accent color, used for text and interactive elements across the application. Green is excluded. Gold is permitted sparingly.
- Elsie is the deliberately chosen sitewide typeface, including body and functional text, per the explicit decision recorded in section 3. This is a chosen tradeoff, not an oversight; legibility at a glance is intentionally traded for the aesthetic, with text-to-speech as the accepted mitigation.
- Texture references aged parchment and ink, not wood, leather, or clay.
- Theme is Virgin Islander and Hoodoo heritage blended with cottagecore goth, handled with respect and never as caricature.
- Display names are consistent. Every tab and section heading carries the definite article: The Mortal Rites, The Grimoire, The Altars, The Rootwork, The Scrying Pool, The Shadow Tome. Running prose follows ordinary grammar.
- Voice applies to all interface copy, including anything AI generates for display. Consecrate the Morning Rite, not Mark Complete. Replenish, not Mark as Restocked. Invoke and Banish for accepting or dismissing. Empty states speak in the same voice. Backend vocabulary never surfaces.
- The landing screen is a static illustrated exterior view of a small, richly-appointed manor deep in an ancient forest, isolated by choice not by need, preceding the avatar builder, by explicit decision. The avatar and a single familiar appear within the application after the builder, not on this initial exterior screen. Nothing animates.
- An avatar builder runs before The First Inscription, on first launch only. Defaults: melanated skin, red cat eyes, shoulder-length microlocs. Options lean goth and cat-girl. Every hairstyle offered is 4C-textured and loc-compatible; no European hair textures are offered.
- A familiar is chosen alongside the avatar and appears in the same scene.
- The avatar and familiar are editable later without repeating intake.
- Navigation is by tabs across the top.
- Every recurring ritual, section heading, and button carries a name in the application's voice, with the definite article where its siblings have one. Product brand names such as Veet appear only as inventory items, never as the name of a ritual. Depilation and shaving are separate rituals with separate names and separate glyphs — a foam or cream mark for one, a blade for the other.
- Interface copy that instructs or prompts is written in voice throughout. Labels such as show me the thing, name it instead, what the pool sees, or what the rite costs each month are placeholders, not finished copy.
- Every tab carries a glyph, including Rootwork.
- A single figure glyph represents a whole person where one is needed; composed or clustered figures are not used. All figure glyphs use dark skin tones.
- Prescription strength is displayed wherever a prescription is named.
- Voice applies to routine step labels themselves, not only to headings and buttons. Product categories stay plain because they must remain scannable and durable — cleanser, toner, serum, moisturiser — but everything describing an action is written in voice. The Visage cleansed rather than face wiped clean. The Drawing Out rather than extractions. Hands cleansed rather than hands washed. A draught of water rather than water.
- Specification vocabulary never surfaces. Terms such as load-bearing, requires-rinse, layering weight, and partner-assisted describe the system to its builders and are translated before display.
- Destructive and administrative actions are voiced like everything else: Amend rather than Edit, Strike from the record rather than Delete, Let it rest rather than Close.
- The approved mockup is the visual source of truth, and its stylesheet ships as design-tokens.css committed to the repository. Palette, typography, spacing, borders, card treatment, ornament, and component styling are taken from that file verbatim rather than reinterpreted from description. Prose in this document explains intent; the stylesheet defines appearance, and where they appear to differ the stylesheet governs.
- The drawn icon set ships alongside it as custom-icons.js and is likewise used unchanged.
- A screen that has no equivalent in the mockup takes its styling from the nearest one that does. Inventing a new visual treatment is a defect, not a contribution.

## 29. Interface and ornament

The interface carries the theme visually, not only in wording. Flat panels of black and grey are a failure state.
- Ornament: swirl and flourish borders, calligraphic rules and dividers, moons, stars, and alchemical marks framing sections. Cards carry decorated corners and edges rather than plain strokes.
- Palette extends beyond obsidian and crimson into a full cottagecore-goth range: aged parchment, tarnished silver, deep plum, moss shadow, candle gold, ink black. Rose and pink tones are excluded entirely from the interface, per section 34. Green as a dominant remains excluded; muted shadow tones are permitted within the palette.
- Tabs are centred, sized for touch, and distinguished by colour rather than grey alone. The application title outranks tab labels in size.
- The reduced-effort routine is offered in the application's voice and given prominence — a clearly sized, clearly worded entry, not a small aside. The current date is legible at a glance.
- Routine steps name the action plainly and briefly. Composite sequences appear as one named step rather than their component parts spelled out. Durations belonging to a device are not restated in the step.

## 30. Stack, build, and cost

The stack, stated concretely so nothing is inferred.
- Framework: Vite with React. Not Next.js with server-side rendering. Capacitor requires a static client bundle, and an SSR application cannot be wrapped. Vercel will host SSR happily, so this conflict stays invisible until the Android build fails. If the project already uses Next.js, it must be configured for static export.
- Database, auth, and storage: Supabase, which is Postgres.
- Web hosting: Vercel, serving the same bundle Capacitor packages.
- Android: Capacitor wrapping that bundle, sideloaded rather than published.
- AI calls: a serverless function, either Vercel or a Supabase edge function. The API key lives server-side only and is never present in the client bundle.
- Icons: @phosphor-icons/web installed locally, plus the custom SVG set. No CDN in the shipped build.

Division of labour. The AI assistant writes the application code: schema and migrations, the routine engine, deterministic safety rules, screens and components, the AI integration layer and its prompts, state management, and tests. The partner does what cannot be automated: creating the Supabase project and holding its credentials, the Capacitor Android build and signing, installing on the device, testing on real hardware, OAuth setup, and judging whether it looks right.

Build in this order. Each phase should run before the next begins.
- One: project scaffold, Supabase schema, and persistence. Nothing visual.
- Two: Rootwork — item model, lifecycle states, manual entry. The app should be usable with typed input alone.
- Three: the routine engine and the deterministic safety layer. Still no AI.
- Four: screens and voice, icons and ornament.
- Five: the AI layer — intake conversation, photo intake, the Scrying Pool.
- Six: wearables, calendar, and polish.

Cost. Everything except AI is free at this scale: Supabase free tier, Vercel free tier, and a sideloaded Android build. AI is pay-per-use with no subscription. The application currently runs on Claude Sonnet 5 across all text, extraction, reasoning, and vision tasks, per section 34, which carries meaningfully higher per-call cost than the original Haiku-based estimate this section once assumed; actual monthly cost should be monitored against actual usage rather than assumed from the original lower-cost-model projection.

## 31. The Steeping

- Status: specified, not built, deferred.
- Purpose: the ritual that precedes journaling. Brew, settle, then open The Shadow Tome. The Steeping lives inside The Shadow Tome rather than as its own tab, because it belongs to that ritual rather than being a separate errand.
- Herbal Elixirs is the inventory within it. It borrows Rootwork's shape, not its contents. Rootwork governs what goes on the body; this governs what is drunk, and most of Rootwork's machinery is meaningless here.

What carries over from Rootwork:
- Lifecycle states, unchanged: Stocked, Ebbing, Hollow, Enshrined, Banished. A tea that disappoints is Banished with a reason like anything else.
- Photograph-first entry — the box, or loose leaf directly — with AI identifying what it can from leaf shape, cut, colour, and visible packaging. Uncertainty is stated plainly rather than guessed at, and every field it fills stays editable.
- A search fallback for when the photograph fails, accepting voice as every input in the application does.
- Composites, for blends the user mixes.
- Period after opening, because leaf goes stale. The Waning watches it alongside everything else.
- Storage location, which here means pantry, tin, or shelf.
- The Summoning Scroll, for restocking.
- The Codex. This one genuinely applies: a banned ingredient is banned whether it touches skin or is swallowed, and herbal allergies are real. A tea containing a Codex ingredient is blocked exactly as a cream would be.

What does not carry over, and must not appear here:
- Application zone. Nothing is applied to a body region.
- The Melanin Ward. Hyperpigmentation and photosensitivity are properties of topical products.
- The Synergy Engine's layering conflicts. Retinoids, acids, and vitamin C have no bearing on a cup of tea.
- Layering weight, requires-rinse, and timer duration as the routine engine uses them.
- Comedogenic, buildup risk, and every other topical risk flag.
- Partner-assisted marking.
- Evaluation by The Scrying Pool for skin or hair outcomes. What is logged here belongs to the journaling ritual, not to the routine engine, and no inference is drawn about complexion from what was drunk.

What is specific to this inventory and exists nowhere else:
- Steeping temperature and duration per tea, so the ritual is repeatable.
- Caffeine content, or its absence, which matters for something taken before sleep.
- Form: loose leaf, bagged, or compressed.

Infused honey. The strength of the honey is arithmetic anchored to one measured value, and the specification follows the user's actual process rather than a generic one.
- The chain, recorded as a batch:
  - Raw flower is weighed on a precision scale and tested for total cannabinoid percentage. The tester requires the Flower and Concentrate Expansion Kit for this; the base unit cannot do it.
  - Flower is decarboxylated in the infuser. Temperature and duration are recorded.
  - Decarbed flower is tested again, and both readings are kept, since the difference across decarboxylation is itself worth seeing over time.
  - Flower is infused into a carrier oil in the machine — roughly one ounce of flower to sixteen ounces of oil in this user's practice. Carrier type, quantities, temperature, and duration are recorded.
  - The finished oil is tested, giving milligrams per millilitre. This reading is the anchor for everything downstream. Every figure the application reports traces back to it.
  - Oil is combined with honey over gentle heat, sunflower lecithin is added as an emulsifier, and an immersion blender brings it together. Volumes of oil, honey, and lecithin are recorded, along with the method.
- The honey itself cannot be tested. The tester supports oils, butter, tinctures, flower, and concentrates; honey is not a supported base, and no reading of the finished honey is possible. The application must never suggest testing it.
- Consequently the honey's strength is calculated, not measured: total milligrams carried in by the oil, divided across the total volume of the blend. It is labelled as calculated from a measured oil reading, which is materially different from an estimate derived from flower percentage, and the interface says which.
- Two sources of drift are stated rather than hidden. The tester's repeatability is about fifteen percent, so the anchor reading is close rather than exact. And the calculation assumes even distribution through the honey — reasonable given lecithin and an immersion blender, which is why the emulsification method is recorded, but an assumption nonetheless.
- Readings may be entered by hand or read from a screenshot of the testing application. Every field stays editable. Batch notes are voice-enabled like everything else.
- Where a reading exceeds the tester's maximum of roughly fifteen milligrams per millilitre, the sample must be diluted before testing and the dilution factor recorded, or the figure is wrong.

Vessels. The amount of honey actually taken is the last unknown, and spoons vary enough to matter.
- Spoons are registered once rather than judged each time. Photograph the spoon beside a coin or ruler for scale; AI identifies the type and estimates capacity, and the user may correct it by filling the spoon with water and recording the volume. The result is saved as a named vessel.
- Thereafter a cup is prepared by choosing a saved vessel and a count, which is one tap rather than a photograph and a guess.
- Estimating volume from a photograph alone, with no scale reference and no calibration, is not reliable enough to base a figure on. Registration exists so the estimate is made once, carefully, rather than repeatedly and loosely.
- Weighing the honey remains the most accurate path and is offered wherever the user prefers it.

What the application does and does not do with this.
- It performs arithmetic on values the user supplies. It does not recommend an amount, does not suggest raising or lowering one, and makes no claim about effect.
- What is logged passes to the rest of the system as ordinary context beside sleep and mood, so patterns are visible as any other pattern is. It is not treated as a health metric and nothing is inferred from it clinically.
- Naming follows the application's voice. Nothing here is called a dosage calculator on screen.

## 32. Out of scope for version one

Version one carries everything in this document, including Google Calendar synchronisation and wearable integration through Health Connect on Android, with the web build reading synced snapshots per section 19.
- Contact lens steps ship in version one. Menicon Z rigid gas-permeable lenses, removed nightly. Insertion is a normal, ungated step with no product-related waiting period.
- Deferred to version two: gamification. A Tamagotchi-style companion occupying the landing scene, animating the avatar and familiar already established there and responding to completed routine steps. The version one scene is built as its foundation, not as a placeholder to be discarded. Design proceeds during version one use; construction follows at an unhurried pace.
- Deferred: multi-user support and public release.
- The Steeping, described above, is specified and deliberately deferred. It is a nice-to-have that should sit behind a feature flag until the core is stable.

## 33. Open decisions

State names and domain names are settled. Ebbing and Hollow are confirmed. The Gaze and The Grin are confirmed. Isotretinoin's sequence-based dosing logic, described in section 15, is settled. The landing screen is the illustrated exterior of a small, richly-appointed manor deep in an ancient forest, isolated by choice not by need, preceding the avatar builder on first launch, per section 28. No open decisions remain.

## 34. Final Build Updates (August 2026)

**AI Engine**:
- `claude-sonnet-5` is locked as the universal intelligence engine across the entire application for all text, extraction, reasoning, and vision capabilities.
- Image generation uses Replicate, via a dedicated REPLICATE_API_TOKEN configured on the Supabase edge function, using a full-quality (non-turbo, non-lightning) SDXL-family model to construct a hand-painted, animated dark-fantasy illustration style for the Avatar and dynamic backgrounds — never a distilled/speed-optimized model variant, which measurably sacrifices detail and prompt adherence.

**Avatar & Room**:
- **Avatar Builder**: The UI incorporates plus-size body types, ultra-skinny microlocs (shoulder length / high updo), and 10 robe styles. Avatar previews are generated live using the image model rather than SVG line drawings.
- **Robe Color Restriction**: Robes may never be predominantly green, blue, or pink — this is an absolute ban, not a "muted tones permitted" exception. This applies both to the selectable robe color swatches and to what the image model actually renders; a generated robe drifting toward one of these colors fails review regardless of what was requested in the prompt.
- **Swatch Rendering**: Hair color and robe color swatches must show the color applied to actual texture — a sample of locks for hair colors, a sample of draped fabric for robe colors — not flat color chips. Implement this efficiently: generate ONE neutral reference photo of loose microlocs and ONE neutral reference photo of draped fabric, then apply CSS-based hue/color tinting per swatch value rather than running separate paid AI generations per color.
- **Room Backgrounds**: Upon onboarding completion, the app uses `generate-room-bg` to permanently embed the generated Avatar into the dynamic backgrounds of the 6 rooms. The aesthetic remains explicitly cottagecore goth.

**AppSpeak Glossary**:
- Wording replaces mundane terms entirely: "Ethereal Echoes & Conduits" (Integrations), "Herbal Pantry" (Consumables), "The Apothecary" (Inventory), "Inner Sanctum" (Journaling).
- "Pink" (`var(--rose)`) has been banished entirely from the UI, replaced with `var(--plum)`.
- All cards, headers, and UI elements are explicitly center-justified.

**Mortal Rites**:
- Glyphs have been semantically tightened (moon, sun, food, shower, teacup).
- Wait timers, brushing, and flossing have been migrated to their proper Invocation slots.

**Navigation & Icon Styling**:
- The top bar is restructured into six enlarged tabs replacing the previous separate brand row.
- The Settings gear and "Return to Sanctuary" house icons are bare, unbordered, background-free clickable glyphs, deliberately excluded from the standard button treatment described elsewhere in this section.

**Safety Layer**:
- The permanent Lavender Codex block is enforced at the database level via Postgres triggers on the `codex_entries` table, blocking both deletion and rename-based removal, independent of any application-layer check.

===================================================================
SECRET HANDLING — ABSOLUTE RULES (violating any of these is a critical failure)
===================================================================

The core rule: assume EVERYTHING you print — every "Ran command" line, every console.log, every error message, every raw API response you show — gets copy-pasted directly into an external chat by the user, verbatim, without them reading it first. If a real secret value could ever appear in that text, the rule below applies regardless of the reason, the urgency, or how small/partial the exposure would be.

NEVER, under any circumstances:
1. Run `cat .env`, `Get-Content .env`, `type .env`, or any command that dumps a secrets file's contents to visible output — not even to "check if a key exists," not even filtered to one line.
2. Write a real secret value as a literal string inside a command you run — this includes PowerShell/node/curl commands with a key typed directly into headers, URLs, or request bodies. If a command's TEXT contains the actual secret, it WILL be visible in the output regardless of what the command does.
3. Print any portion of a secret value, including "just the first 4 characters to confirm it loaded" — no partial exposure is acceptable.
4. Extract a credential from any credential store, cache, or keychain (git credential manager, Windows Credential Manager, npm auth tokens, gh CLI stored tokens, browser-saved values, etc.) and use it inline in a way that could print it — this includes `git credential fill`, `gh auth token`, or reading OS keychains programmatically.
5. Build a database connection string, API header, or URL with a real password/token/key embedded, and then run, log, or echo that string anywhere.
6. Include a secret value in a git commit, even temporarily, even if you plan to remove it in a later commit — git history retains it permanently regardless of later changes.

INSTEAD, always do this:
- If a script needs a secret, the secret must already exist as an environment variable SET IN THE SHELL SESSION BEFORE the script runs (e.g. via the user's own .env being loaded by dotenv inside the script, or a CI platform's own secrets injection) — never pass it as a literal on a command line you then display.
- When writing Node/Deno/Python scripts that need a key, read it via `process.env.KEY_NAME` (or equivalent) INSIDE the script file, and never print that value anywhere in the script's own output — not even for debugging.
- If you need to confirm a secret is set without exposing it, check only whether it's present/non-empty (e.g. `if (!process.env.KEY_NAME) throw new Error('missing')`) — never log the value itself, not even partially.
- If a task genuinely requires a new credential (API token, access token, connection string) that isn't already available as an env var, STOP and tell the user exactly what's needed and why, and ask them to add it directly to their local .env file themselves, outside of chat, the same way it's been done tonight. Never ask them to paste a secret value into chat, and never try to programmatically extract one from a credential store as a workaround.
- Before running any command, silently check it against this test: "does the literal text of this command, or anything it will print, contain a real secret value?" If yes, rewrite the approach before running it — don't run it and hope the output looks fine.
- For deploy/CLI tools that need auth (supabase CLI, gh CLI, etc.), rely on their own standard environment-variable-based auth (SUPABASE_ACCESS_TOKEN, GH_TOKEN, etc., already set in the shell environment) rather than fetching/printing a token through any other mechanism.

If you ever catch yourself about to run a command that would violate any of the above, stop, explain to the user what you need and why, and let them add it directly — do not find a workaround that technically avoids printing the exact string while still exposing it through some other channel (e.g., writing it to a file you then read and print, which is the same exposure with extra steps).
