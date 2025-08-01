# Page snapshot

```yaml
- main:
  - group "Selfie comparison":
    - figure "Preview":
      - img "Captured selfie preview"
      - text: Preview
    - figure "Original":
      - button "Original captured selfie"
      - text: Original
    - figure "Anime":
      - button "Anime portrait generated from selfie"
      - text: Anime
    - button "Take photo" [disabled]: Take
    - link "Download":
      - /url: blob:http://localhost:3000/d7571e00-a4cf-4f02-90c6-49998299501b
    - button "Retake"
    - button "Generate anime portrait": Generate Anime
- alert
- button "Open Next.js Dev Tools":
  - img
```