# User Flows

## Flow 1: New Visitor To First Focus Session
1. User lands on `/`
2. User understands premium calm positioning within one screen
3. User clicks primary CTA
4. User enters `/app`
5. User writes or selects a task
6. User starts a focus session
7. User enters `/app/focus/session`
8. User finishes or exits
9. User sees a short session summary
10. User returns to `/app` or `/app/analytics`

## Flow 2: Returning User Quick Start
1. User opens `/app`
2. Last task and preferred ambience are prefilled
3. User presses one button to start focus
4. User enters `/app/focus/session`

## Flow 3: Task Capture To Focus
1. User opens `/app`
2. User types a task or taps a suggested task
3. User confirms session start
4. Focus session opens with task context preserved

## Flow 4: Notes To Flashcards
1. User opens `/app/notes`
2. User uploads or selects notes
3. AI generates summary and candidate flashcards
4. User reviews output
5. User saves deck to `/app/flashcards/:deckId`
6. User studies immediately or later

## Flow 5: Session Complete To Analytics
1. Active timer ends
2. User sees completion summary
3. User can:
   - start another session
   - return to sanctuary
   - open analytics

## Flow 6: Sanctuary To Social Presence
1. User opens `/app`
2. Ambient presence surfaces appear subtly
3. User may ignore them without distraction
4. User can explicitly open `/app/social` for leaderboard and friend details

## Focus Mode Visibility Rules
- Visible:
  - timer
  - task label
  - session state
  - pause/resume
  - exit
  - minimal ambience controls
- Hidden:
  - top navigation
  - analytics widgets
  - companion panels
  - social presence
  - room customization
  - dense settings
