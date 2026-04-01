# Personal README

This file is for future-you.

You built a React app with TypeScript, Vite, Tailwind, and shadcn/ui. Even if parts of it felt like magic while you were building, the overall structure is actually pretty small and understandable.

## What this app does

The game shows:

- a current city with its real temperature
- a next city with its temperature hidden
- two buttons: `Higher` and `Lower`

When the player guesses:

1. the app compares the hidden city's temperature to the current city's temperature
2. if the guess is correct, score goes up by 1
3. the hidden city becomes the new current city
4. a fresh hidden city is fetched
5. if the guess is wrong, the game-over dialog opens

That is the whole game loop.

## The big picture

The app is split into two layers:

- `src/App.tsx` = game brain
- `src/components/game/*` = visual pieces for the screen

The `ui` folder is different:

- `src/components/ui/*` = reusable shadcn-style building blocks like `Button`, `Card`, and `Dialog`

So the mental model is:

1. `App.tsx` holds the state and logic
2. `App.tsx` passes data and callbacks down as props
3. small components render the UI
4. user clicks flow back up into `App.tsx`

## Startup flow

### `src/main.tsx`

This is the real entry point.

It does three simple things:

1. imports global CSS from `src/index.css`
2. imports the main `App` component
3. renders `<App />` into the DOM element with id `root`

So when the browser opens your app, `main.tsx` is where React starts.

## The brain: `src/App.tsx`

This file controls almost everything.

### State in plain English

These lines:

```ts
const [currentCity, setCurrentCity] = useState<City | null>(null);
const [nextCity, setNextCity] = useState<City | null>(null);
const [score, setScore] = useState(0);
```

mean:

- `currentCity` = the city you can see now
- `nextCity` = the city you are guessing about
- `score` = current streak

Other state values track loading, errors, dialogs, and the last score after losing.

### Why `City | null`?

This is a TypeScript union type.

It means:

- sometimes this value is a `City`
- sometimes it is `null`

Why? Because before the API finishes loading, there is no city yet.

So this is TypeScript protecting you from pretending data exists when it does not.

## The `City` type

In `src/components/game/types.ts`:

```ts
export type City = {
  name: string;
  country: string;
  temp: number;
  img: string;
};
```

This does not create runtime code. It is just a shape description for TypeScript.

It tells the editor and compiler:

"a city object in this app should look like this."

That makes autocompletion better and catches mistakes earlier.

## Where the data comes from

Your app uses two APIs:

### 1. Random city API

`fetchCityName()` calls:

```ts
https://random-city-api.vercel.app/api/random-city
```

That gives a city name string.

### 2. Weather API

`fetchWeather(city)` calls WeatherAPI with that city name and asks for current weather.

It then converts the API response into your own `City` shape:

```ts
return {
  name,
  country,
  temp,
  img: normalizedIcon,
};
```

This is a really important pattern:

- external API data comes in messy
- your app transforms it into one clean internal format
- the rest of the app works with your format, not the raw API response

That is good code, not accidental code.

## Leaderboard scores table

Your backend already exposes a leaderboard endpoint:

```txt
GET http://localhost:3000/leaderboard
```

That route lives in `weatherhigherorlowerbackend/index.js`.

It returns up to 10 score rows, sorted from highest score to lowest score.

The response shape is basically:

```ts
type LeaderboardEntry = {
  id: number;
  name: string;
  score: number;
  createdAt: string;
};
```

Example response:

```json
[
  {
    "id": 1,
    "name": "Sam",
    "score": 8,
    "createdAt": "2026-03-30T11:25:00.000Z"
  }
]
```

If future-you wants to render that as a table in React, the flow is:

1. create state for the leaderboard rows
2. fetch `/leaderboard` inside `useEffect`
3. store the JSON in state
4. map over the rows inside a `<table>`

Minimal example:

```tsx
import { useEffect, useState } from "react";

type LeaderboardEntry = {
  id: number;
  name: string;
  score: number;
  createdAt: string;
};

function LeaderboardTable() {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setIsLoading(true);
        setError("");

        const res = await fetch("http://localhost:3000/leaderboard");

        if (!res.ok) {
          throw new Error("Failed to fetch leaderboard.");
        }

        const data = (await res.json()) as LeaderboardEntry[];
        setRows(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadLeaderboard();
  }, []);

  if (isLoading) {
    return <p>Loading leaderboard...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Name</th>
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={row.id}>
            <td>{index + 1}</td>
            <td>{row.name}</td>
            <td>{row.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

Important detail:

- Use `row.id` as the React key.
- Use `index + 1` only for display rank, not as the key.
- If your frontend and backend run on different ports, use the full backend URL like `http://localhost:3000/leaderboard`.
- Because the backend already has `cors()` enabled, the frontend can fetch it from the browser.

If you want the table styled with your current UI stack, wrap it in one of your card components and add Tailwind classes to the table elements.

## Why there are two fetch functions

### `fetchCityName()`

Gets only the city name.

### `fetchWeather(city)`

Takes a city name and tries to turn it into a full playable city object.

If the weather API says the city is invalid or missing, the function returns `null`.

That is why `buildCity()` exists.

## `buildCity()` is your retry machine

This is one of the most important functions in the app.

It:

1. fetches a random city
2. tries to fetch weather for it
3. skips bad results
4. skips duplicate cities
5. retries up to `MAX_CITY_ATTEMPTS`

So instead of crashing when an API gives bad data, the app quietly keeps trying until it gets something usable.

This is the function that turns two flaky APIs into a playable game.

## How a new game loads

`loadGame()`:

1. checks that your API key exists
2. clears old errors
3. fetches city A
4. fetches city B, making sure it is not the same city
5. stores both in state
6. resets score to `0`

This is used when:

- the app first starts
- the player presses restart

## Why there are two `useEffect`s

If `useEffect` feels weird, think of it as:

"run this after React renders"

### First `useEffect`

Checks `localStorage` to see whether the instructions modal has already been seen.

If not, it opens the instructions dialog.

### Second `useEffect`

Starts the game data loading on app startup.

It also uses:

```ts
let isMounted = true;
```

This is a safety guard so the app does not try to update React state after the component has unmounted.

In plain English:

"only set state if this component still exists."

## The main game action: `handleGuess()`

This function runs when the player clicks `Higher` or `Lower`.

It does this:

1. stops immediately if the app is busy or missing data
2. compares `nextCity.temp` to `currentCity.temp`
3. checks whether the guess was correct
4. if wrong, opens the game-over dialog
5. if correct, moves `nextCity` into `currentCity`
6. increases score
7. fetches another next city

This is the single most important event handler in the app.

If you understand this function, you understand the game's behavior.

## How data moves through the UI

Example:

```tsx
<GuessControls
  disabled={!currentCity || !nextCity || isBusy}
  isBusy={isBusy}
  onGuess={(guess) => void handleGuess(guess)}
/>
```

This means:

- `App.tsx` gives `GuessControls` some data
- `GuessControls` does not know the game logic
- when a button is clicked, it calls `onGuess`
- that sends control back up to `App.tsx`

This is standard React:

- state lives high up
- UI components stay dumb/simple

That is a good pattern for beginners because it is easier to reason about.

## Component map

### `src/components/game/CityCard.tsx`

Displays one city card.

Props tell it:

- which city to show
- whether the label says `Current` or `Next`
- what temperature text to display
- what fallback text to show if no city exists yet

It does not fetch anything and does not manage state. It just renders.

### `src/components/game/GuessControls.tsx`

Renders the `Higher` and `Lower` buttons and a loading message.

When clicked, it sends `"higher"` or `"lower"` back to the parent.

### `src/components/game/GameHeader.tsx`

Shows the score and renders an instructions button.

### `src/components/game/StatusBanner.tsx`

Shows status or error text if a message exists.

### `src/components/game/InstructionsDialog.tsx`

Shows the rules modal.

This is a wrapper around your reusable dialog UI component.

### `src/components/game/GameOverDialog.tsx`

Shows final score and a `Play Again` button after losing.

## TypeScript syntax you are seeing

### `type Something = { ... }`

Defines a custom type shape.

### `city: City | null`

Means the variable can be either a `City` or `null`.

### `async (): Promise<string> =>`

Means:

- this is an async function
- it eventually resolves to a `string`

### `type Props = { ... }`

This is how React component props are typed.

Example:

```ts
type GameHeaderProps = {
  score: number;
};
```

This means `GameHeader` must receive a numeric `score`.

### `import type { City } from "./types"`

This imports only the type, not runtime code.

It is a nice TypeScript-only import.

### `as { city?: unknown }`

This is a type assertion.

You are telling TypeScript:

"treat this JSON as an object that might have a `city` field."

Then the code safely checks whether it is actually a string before using it.

That is much safer than blindly trusting API responses.

### `city?.img`

This is optional chaining.

It means:

"if `city` exists, read `img`; otherwise return `undefined` instead of crashing."

### `!currentCity || !nextCity || isBusy`

This is just boolean logic.

It disables buttons when the required state is missing or still loading.

## What shadcn/ui is in this project

Important: shadcn is not a normal component library where everything stays hidden in `node_modules`.

In your project, shadcn mostly means:

- you used a generator/tool to copy component code into your repo
- those components are now yours to edit
- they are built on top of Radix primitives + Tailwind classes

So these files:

- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/dialog.tsx`

are not magical black boxes. They are local source files.

You can read them, edit them, and treat them like your own components.

## What Radix is doing

Radix provides accessible low-level behavior.

For example in `dialog.tsx`, this import:

```ts
import * as DialogPrimitive from "@radix-ui/react-dialog";
```

means:

- Radix handles dialog behavior like focus management and accessibility
- your file wraps it with your own styling and nicer component names

So your `Dialog` component is basically:

"Radix behavior + your Tailwind classes + your project API"

## What `cn()` does

In `src/lib/utils.ts`:

```ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

This helper combines class names.

Why both libraries?

- `clsx` helps conditionally join class strings
- `tailwind-merge` removes conflicting Tailwind classes intelligently

So if two classes clash, `twMerge` tries to keep the correct one.

This helper is extremely common in shadcn-based projects.

## Why the UI files look more intimidating

The shadcn UI files look denser because they use:

- generic React prop types like `React.ComponentProps<"button">`
- Radix primitives
- utility functions like `cva()` and `cn()`
- lots of Tailwind classes in one string

That does not mean your app logic is complicated.

It mostly means the reusable design-system layer is compressed into a few flexible files.

You do not need to master those files first.

Focus order:

1. `src/main.tsx`
2. `src/App.tsx`
3. `src/components/game/types.ts`
4. `src/components/game/*`
5. `src/components/ui/*`

That will feel much less overwhelming.

## Tailwind in this project

Tailwind is the styling system.

When you see classes like:

```tsx
className="min-h-screen bg-gray-100 px-4 py-10"
```

that is just CSS through utility classes.

Rough translation:

- `min-h-screen` = minimum height is full screen
- `bg-gray-100` = light gray background
- `px-4` = horizontal padding
- `py-10` = vertical padding

## `src/index.css`

This file sets up global styling:

- imports Tailwind
- imports shadcn Tailwind styles
- imports the Geist font
- defines design tokens with CSS variables
- applies base styles to `body`, `html`, and all elements

You do not need to memorize it. Just know it establishes your app-wide design foundation.

## Things you did well without realizing it

- You separated stateful logic from presentational components.
- You created a reusable internal `City` type.
- You normalize API data before using it.
- You handle missing/invalid API results instead of assuming perfect data.
- You prevent duplicate city matchups.
- You persist "instructions seen" using `localStorage`.

That is real application structure, not just random vibes.

## Things that are slightly awkward but normal for a first pass

- `App.tsx` is carrying a lot of responsibility right now.
- Fetching logic and game logic are mixed together in one file.
- The app currently depends on two external APIs directly from the client.

None of that is bad for a small project. It is just the natural next refactor point if you keep growing it.

## If you want to learn this codebase in the right order

Read in this order:

1. [src/main.tsx](/d:/weather/weatherhigherorlower/src/main.tsx)
2. [src/App.tsx](/d:/weather/weatherhigherorlower/src/App.tsx)
3. [src/components/game/types.ts](/d:/weather/weatherhigherorlower/src/components/game/types.ts)
4. [src/components/game/CityCard.tsx](/d:/weather/weatherhigherorlower/src/components/game/CityCard.tsx)
5. [src/components/game/GuessControls.tsx](/d:/weather/weatherhigherorlower/src/components/game/GuessControls.tsx)
6. [src/components/game/GameHeader.tsx](/d:/weather/weatherhigherorlower/src/components/game/GameHeader.tsx)
7. [src/components/game/StatusBanner.tsx](/d:/weather/weatherhigherorlower/src/components/game/StatusBanner.tsx)
8. [src/components/game/InstructionsDialog.tsx](/d:/weather/weatherhigherorlower/src/components/game/InstructionsDialog.tsx)
9. [src/components/game/GameOverDialog.tsx](/d:/weather/weatherhigherorlower/src/components/game/GameOverDialog.tsx)
10. [src/components/ui/button.tsx](/d:/weather/weatherhigherorlower/src/components/ui/button.tsx)
11. [src/components/ui/card.tsx](/d:/weather/weatherhigherorlower/src/components/ui/card.tsx)
12. [src/components/ui/dialog.tsx](/d:/weather/weatherhigherorlower/src/components/ui/dialog.tsx)
13. [src/lib/utils.ts](/d:/weather/weatherhigherorlower/src/lib/utils.ts)
14. [src/index.css](/d:/weather/weatherhigherorlower/src/index.css)

## Cheat sheet: one-sentence file summary

- [src/main.tsx](/d:/weather/weatherhigherorlower/src/main.tsx): starts React
- [src/App.tsx](/d:/weather/weatherhigherorlower/src/App.tsx): holds game state, fetches data, decides what happens
- [src/components/game/types.ts](/d:/weather/weatherhigherorlower/src/components/game/types.ts): defines TypeScript shapes
- [src/components/game/CityCard.tsx](/d:/weather/weatherhigherorlower/src/components/game/CityCard.tsx): renders one city card
- [src/components/game/GuessControls.tsx](/d:/weather/weatherhigherorlower/src/components/game/GuessControls.tsx): renders guess buttons
- [src/components/game/GameHeader.tsx](/d:/weather/weatherhigherorlower/src/components/game/GameHeader.tsx): shows score and instructions button
- [src/components/game/StatusBanner.tsx](/d:/weather/weatherhigherorlower/src/components/game/StatusBanner.tsx): shows messages
- [src/components/game/InstructionsDialog.tsx](/d:/weather/weatherhigherorlower/src/components/game/InstructionsDialog.tsx): shows instructions modal
- [src/components/game/GameOverDialog.tsx](/d:/weather/weatherhigherorlower/src/components/game/GameOverDialog.tsx): shows game-over modal
- [src/components/ui/button.tsx](/d:/weather/weatherhigherorlower/src/components/ui/button.tsx): reusable styled button
- [src/components/ui/card.tsx](/d:/weather/weatherhigherorlower/src/components/ui/card.tsx): reusable card container
- [src/components/ui/dialog.tsx](/d:/weather/weatherhigherorlower/src/components/ui/dialog.tsx): reusable modal/dialog wrapper
- [src/lib/utils.ts](/d:/weather/weatherhigherorlower/src/lib/utils.ts): class-name helper
- [src/index.css](/d:/weather/weatherhigherorlower/src/index.css): global styles and theme tokens

## Best next step if you want to learn, not just ship

Open [src/App.tsx](/d:/weather/weatherhigherorlower/src/App.tsx) and trace only this path:

1. where state is declared
2. where `loadGame()` sets the initial cities
3. where `handleGuess()` changes the state
4. where that state gets passed into JSX

If you can explain those four things out loud, you understand the app.

## If I were teaching this codebase live

I would rename the learning stages like this:

- Stage 1: React state and props
- Stage 2: async fetching
- Stage 3: TypeScript types
- Stage 4: shadcn/Radix reusable UI wrappers
- Stage 5: styling polish

That order matters. Do not start by trying to fully understand `button.tsx`.

## One last honest note

You are not "bad at TypeScript". You are just early.

Most of what you need for this app is:

- object types
- union types like `City | null`
- typed props
- async return types like `Promise<City | null>`

That is a very manageable subset, and you are already using it.
