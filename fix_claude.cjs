const fs = require('fs');
let content = fs.readFileSync('CLAUDE.md', 'utf8');

// Strip out the broken encoded section
content = content.replace(/===================================================================[\s\S]*?regardless of intent\./g, '');
content = content.replace(/===================================================================[\s\S]*?NO STUBS, NO MOCKS[\s\S]*?regardless of intent\./g, '');

content = content.trim() + '\n\n' + `===================================================================
NO STUBS, NO MOCKS — ABSOLUTE RULE
===================================================================

Every feature that gets built must be the real, working implementation — connected to the real database, the real AI pipeline, the real Replicate/Anthropic calls, real file storage. This applies with no exceptions, regardless of framing:
- Never write a function that fakes success, returns hardcoded placeholder data, or shows a fake confirmation instead of actually performing the real operation.
- Never simulate an AI response, an API call, or a calculation result "for now" with the intention of replacing it later — if the real integration can't be completed in this pass, say so explicitly and leave the feature visibly unfinished (e.g., don't render the button at all, or show it disabled with a clear note), rather than wiring up something that LOOKS functional but isn't.
- This applies to every layer: UI stubs, fake API responses, hardcoded calculation results standing in for real math, placeholder data pretending to be real database rows.
- If a stub or mock is already present anywhere in the existing codebase, flag it explicitly the moment it's found — don't leave it silently in place assuming someone else will catch it later.
- The test for whether something qualifies: would the user, testing this feature in the live app, reasonably believe it's doing the real thing? If yes, and it isn't, that's a violation regardless of intent.
`;

fs.writeFileSync('CLAUDE.md', content);
