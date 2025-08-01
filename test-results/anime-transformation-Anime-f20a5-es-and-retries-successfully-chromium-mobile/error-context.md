# Page snapshot

```yaml
- main:
  - group "Selfie comparison":
    - alert: Internal server error
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
      - /url: blob:http://localhost:3000/4292fca3-6ce3-49eb-a50e-e9fa3edd715a
    - button "Retake"
    - button "Generate anime portrait": Generate Anime
- alert
- button "Open Next.js Dev Tools":
  - img
```