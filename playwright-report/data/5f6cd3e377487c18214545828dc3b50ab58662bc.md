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
      - /url: blob:http://localhost:3000/b0fe159b-23b9-4509-8ada-0a155d2bc128
    - button "Retake"
    - button "Generate anime portrait": Generate Anime
- alert
- button "Open Next.js Dev Tools":
  - img
```