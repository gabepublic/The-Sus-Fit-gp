# Page snapshot

```yaml
- main:
  - group "Selfie comparison":
    - alert: Failed to generate anime portrait
    - figure "Preview":
      - img "Captured selfie preview"
      - text: Preview
    - figure "Original":
      - button "Original captured selfie"
      - text: Original
    - figure:
      - button "Anime portrait not yet generated"
    - button "Take photo" [disabled]: Take
    - link "Download":
      - /url: blob:http://localhost:3000/a9a0a183-53bf-47de-b866-75553bb56247
    - button "Retake"
    - button "Generate anime portrait": Generate Anime
- alert
- button "Open Next.js Dev Tools":
  - img
```