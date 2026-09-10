# Plain English output style — wording test, 2026-09-10

One fixed prompt (an Express middleware ordering bug with the code pasted in), three replies through `claude -p --model opus` with no style set, three with `output-styles/plain-english.md` selected via `outputStyle`. The control is not guidance-free: the i-have-adhd plugin is enabled in user settings and applies to `claude -p`, so this compares the new style against the style it replaces. Scored by `score.py` (sentence splits on `.!?` outside code blocks; banned words: simply, just, it's easy, please note, utilize, leverage, robust, seamless, hope this helps, let me know, feel free).

| Rep | Words | Avg words per sentence | Longest | Over 25 | Banned words | First line |
|---|---|---|---|---|---|---|
| control-1 | 170 | 14.8 | 27 | 2 | 0 | Swap the order — `verifyToken` runs before `readAuthHeader` ever sets `req.token`. |
| control-2 | 119 | 13.8 | 21 | 0 | 0 | **Swap the middleware order — `verifyToken` runs before `readAuthHeader` sets `req.token`. |
| control-3 | 85 | 16.4 | 27 | 1 | 1 | Swap the order — `verifyToken` is registered before `readAuthHeader`, so `req.token` is al |
| style-1 | 94 | 13.0 | 27 | 1 | 0 | Move `readAuthHeader` above `verifyToken`. Express runs middleware in the order you regist |
| style-2 | 95 | 12.4 | 19 | 0 | 0 | Move `readAuthHeader` above `verifyToken`. Express runs middleware in the order you regist |
| style-3 | 111 | 11.8 | 22 | 0 | 0 | Swap the order: `verifyToken` runs before `readAuthHeader`, so `req.token` is always undef |

## Reading

- Average sentence length fell from 15.0 to 12.4 words across the three reps. The style reps also converge: two of three open with the same seven-word instruction, which is the low variance writing-skills asks for.
- Sentences over 25 words: three in the control, one with the style (a 27-word sentence in style-1).
- Banned words: one in the control, none with the style. Em-dashes: every control reply, no style reply.
- Structure carried over intact: first line is the fix, a command to try, the second issue offered in one line at the end.
- Verbatim replies are in the session scratchpad under `style-test/`; not committed.

## Verdict

Ship. The style keeps everything i-have-adhd did and tightens the words. It replaces that plugin for this user: set `"outputStyle": "Plain English"` in user settings and disable `i-have-adhd@i-have-adhd`.
