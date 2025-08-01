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
      - /url: blob:http://localhost:3000/7edd8b2c-1aa2-4b0e-b10f-1cf386af43d8
    - button "Retake"
    - button "Generate anime portrait": Generate Anime
- alert
- button "Open Next.js Dev Tools":
  - img
```