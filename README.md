# AI Flashcard Generator 🧠✨

Instantly transform your notes (PDF, TXT, XLSX, images) into interactive flashcards using the Google Gemini API. A smart, modern study tool built for effective learning.

---

![AI Flashcard Generator UI](https://placehold.co/800x500/1e293b/94a3b8/png?text=Your+App+Screenshot+Here)
> _**To add your own screenshot:** Create a `docs` folder, save an image as `app-screenshot.png` inside it, and replace the URL above with `./docs/app-screenshot.png`._

## Features
- **AI-Powered Creation**: Automatically generates flashcards from PDFs, text files, spreadsheets, and images.
- **Multiple Study Modes**: Learn, Test, and a fun, timed matching game.
- **Personalized & Shareable**: Save, edit, and share your flashcard sets with user accounts.
- **Light & Dark Modes**: Switch themes for comfortable studying, day or night.

## Tech Stack
**React** | **TypeScript** | **Tailwind CSS** | **Google Gemini API**

## Running Locally

**1. Clone the Repository**
```bash
git clone https://github.com/YOUR_USERNAME/ai-flashcard-generator.git
cd ai-flashcard-generator
```
> Requires the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) VS Code extension.

**2. Add Your API Key**
- Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
- Open `services/geminiService.ts` and replace `process.env.API_KEY` with your key:
  ```typescript
  // For local testing only. Do NOT commit this to GitHub.
  const API_KEY = "YOUR_GEMINI_API_KEY_HERE";
  ```

**3. Launch the App**
- In VS Code, right-click `index.html`.
- Select **"Open with Live Server"**. The app will open in your browser.
