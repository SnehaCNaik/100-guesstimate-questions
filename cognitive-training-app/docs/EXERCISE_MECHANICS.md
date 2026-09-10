# Exercise Mechanics

Every exercise takes a `difficulty: 1–10` and must return
`{ score: 0-100, accuracy: 0-1, timeMs, metadata? }` via `onComplete`.
Below: full logic for the three implemented MVP exercises, plus mechanics
sketches for the Phase-2 exercises so the domain coverage in the spec is
concretely buildable later.

---

## 1. Sequence Recall — domain: `memory`

**What the user sees:** a 3×3 (or up to 4×4 at high difficulty) grid of tiles.
Tiles light up one at a time in a sequence; then the user must tap them back
*in the same order*.

**Difficulty → parameters**
```
gridSize     = difficulty >= 7 ? 4 : 3                  // 3x3 up to d=6, 4x4 from d=7
sequenceLen  = 3 + floor(difficulty / 2)                // d=1 → 3, d=10 → 8
flashMs      = clamp(700 - difficulty * 40, 250, 700)   // faster flashes at high difficulty
```

**Pseudocode**
```
function start(difficulty):
    tiles = grid(gridSize)
    sequence = pickRandomDistinct(tiles, sequenceLen)
    playbackPhase()

function playbackPhase():
    for tileIndex in sequence:
        highlight(tileIndex) for flashMs
        pause(150ms)
    beginInputPhase(startTime = now())

function onTileTapped(tileIndex):
    expected = sequence[inputCursor]
    if tileIndex == expected:
        inputCursor += 1
        if inputCursor == sequence.length:
            finish(success = true)
    else:
        finish(success = false, failedAt = inputCursor)

function finish(success, failedAt?):
    timeMs = now() - startTime
    accuracy = success ? 1.0 : failedAt / sequence.length
    score = round(accuracy * 70 + (success ? 30 : 0))   // completion bonus
    onComplete({ score, accuracy, timeMs, metadata: { sequenceLen, gridSize } })
```

**Progressive difficulty signal fed back:** longer correct sequences and
faster completion push `current_difficulty` up (see `difficultyEngine.ts`).

---

## 2. Pattern Matrix — domain: `logic` / `reasoning`

**What the user sees:** a simplified Raven's-matrix-style 3×3 grid of shapes
where one cell is blank; four candidate shapes are offered below; the user
taps the one that completes the pattern.

**Generation rule (kept simple & explainable, unlike opaque IQ-test items):**
Each cell's shape/color pair is derived from a deterministic rule over its
`(row, col)`, so there is always exactly one logically-correct answer, and
the game can *generate* the correct choice rather than needing hand-authored
puzzles.

```
SHAPES = [circle, square, triangle, star, hexagon, ...]   // pool size grows with difficulty
COLORS = [c1, c2, c3, ...]

numShapes = clamp(3 + floor(difficulty / 3), 3, 6)
rule = pickOne(["row-cycle", "col-cycle", "diagonal-cycle"])   // harder rules unlock at difficulty >= 5

function shapeAt(row, col):
    switch rule:
        case "row-cycle":      idx = (row + col) % numShapes
        case "col-cycle":      idx = (col * 2 + row) % numShapes
        case "diagonal-cycle": idx = (row + col * 2) % numShapes
    return SHAPES[idx]

blankCell = randomCell()
correctAnswer = shapeAt(blankCell.row, blankCell.col)
distractors = 3 shapes from SHAPES excluding correctAnswer, no duplicates
options = shuffle([correctAnswer, ...distractors])
```

**Pseudocode**
```
function onOptionSelected(choice):
    timeMs = now() - startTime
    correct = (choice == correctAnswer)
    accuracy = correct ? 1 : 0
    // partial credit for speed even on a miss is intentionally NOT given —
    // logic puzzles are right/wrong, unlike recall
    score = correct ? clamp(100 - floor(timeMs / 200), 40, 100) : 0
    onComplete({ score, accuracy, timeMs, metadata: { rule, numShapes } })
```

**Difficulty → parameters:** `numShapes` (more distractor shapes to
discriminate between) and which `rule`s are eligible — harder rules
(diagonal-cycle) only appear at difficulty ≥ 5.

---

## 3. Color Match (Stroop-style) — domain: `focus`

**What the user sees:** a word naming a color (e.g. "BLUE"), rendered in an
ink color that may or may not match the word. Below it, two buttons:
**"MATCH"** / **"NO MATCH"**. The user has a shrinking time window per round;
`roundsPerGame` rounds are played back-to-back with no pause between —
this is the attention/distraction-resistance drill.

**Difficulty → parameters**
```
rounds        = 8 + difficulty                       // more rounds = more sustained attention
timeLimitMs   = clamp(1600 - difficulty * 90, 550, 1600)
matchRate     = 0.5                                  // 50% of rounds are true matches, always
```

**Pseudocode**
```
function generateRound():
    word = pickRandom(COLOR_NAMES)
    isMatch = random() < matchRate
    inkColor = isMatch ? colorFor(word) : pickRandom(COLOR_NAMES excluding word)
    return { word, inkColor, isMatch, deadline: now() + timeLimitMs }

function onAnswer(round, userSaidMatch):
    correct = (userSaidMatch == round.isMatch)
    reactionMs = now() - round.shownAt
    timedOut = reactionMs > round.timeLimitMs
    recordRound({ correct: correct && !timedOut, reactionMs })
    if roundsPlayed < rounds:
        nextRound()
    else:
        finishGame()

function finishGame():
    accuracy = correctRounds / rounds
    avgReactionMs = mean(reactionTimes)
    // score rewards both accuracy and speed — this is the whole point of a focus drill
    score = round(accuracy * 70 + clamp(30 - avgReactionMs / 40, 0, 30))
    onComplete({ score, accuracy, timeMs: totalElapsed, metadata: { rounds, avgReactionMs } })
```

Accessibility note: the word text is always present alongside color — a
color-vision-deficient user can still read "BLUE" even if they can't
distinguish the ink color, and is scored on the same task via the text/ink
*name* mismatch logic, not raw hue discrimination.

---

## 4. Phase-2 exercise sketches (domain coverage roadmap)

These aren't implemented in the MVP scaffold but follow the same
`ExerciseProps` contract, so adding them is additive, not architectural:

- **Mini Sudoku (problemSolving/logic):** 4×4 or 6×6 board, remove cells based
  on difficulty (more removed = harder), validate on submit against the
  unique solution generated via backtracking at board-creation time. Score =
  accuracy of filled cells minus a small time penalty.
- **Maze Navigation (problemSolving):** procedurally generated maze
  (recursive backtracker algorithm), grid size scales with difficulty,
  score = optimal-path-length / actual-moves-taken × 100, time-boxed.
- **Analogies (reasoning):** `A is to B as C is to ___`, generated from a
  curated relation bank (opposites, category-member, part-whole) with
  difficulty controlling relation abstractness and distractor similarity.
- **Riddles/lateral-thinking (problemSolving):** short prompt + multiple
  choice from a curated bank tagged by difficulty; score = correct/incorrect
  + time bonus, same as Pattern Matrix.
- **Spot-the-Difference (focus):** two near-identical images/icon-grids,
  tap the differing cells before a timer expires; difficulty scales grid
  size and number of differences.
