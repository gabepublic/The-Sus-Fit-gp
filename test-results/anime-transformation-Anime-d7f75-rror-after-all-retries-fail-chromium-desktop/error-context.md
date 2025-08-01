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
      - /url: blob:http://localhost:3000/a0663341-680c-43fb-a14f-8c1c5358dee4
    - button "Retake"
    - button "Generate anime portrait": Generate Anime
- alert
- button "Open Next.js Dev Tools":
  - img
```