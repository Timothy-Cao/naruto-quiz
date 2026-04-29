# Naruto Quiz

A static-friendly Next.js quiz site for Naruto and Naruto: Shippuden trivia.

See [QUESTION_PHILOSOPHY.md](QUESTION_PHILOSOPHY.md) for what we believe about quiz design and how we author questions.

## Development

```bash
npm install
npm run dev
```

## Test

```bash
npm test
```

## Adding a quiz

Drop a JSON file into `data/quizzes/`. It must conform to the zod schema in `lib/quiz-schema.ts`. The build will fail with a clear error if any field is invalid.

## Regenerating the character list

```bash
npx tsx scripts/scrape-characters.ts
```

This rewrites `data/characters.json` from Wikipedia's character list articles. The autocomplete in name-select questions reads from this file.

## Deployment

Pushed to `main` triggers an automatic Vercel deploy.
