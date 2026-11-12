# Image library

Approved, reusable backgrounds shared by all channels. Images go in `images/`, records in `index.json`.

Record shape (written by `library.ts`, step 5):
```json
{ "id": "img_0001", "file": "library/images/img_0001.webp", "description": "...",
  "tags": [], "mood": "", "style": "", "text_space": "top-half|center|bottom-half",
  "source": "muse|stock|screenshot", "uses": [{ "post": "", "account": "", "date": "" }] }
```

Reuse rules: never twice in one post, not on the same account within 14 days, retire after about 5 uses, and apply a light crop, flip or tint on each reuse.
