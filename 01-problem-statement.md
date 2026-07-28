# Problem Statement & Understanding

## Problem Statement [Provided]

https://github.com/TeamShiksha/assignments/blob/prod/streak-tracker-app/README.md

**Summary:**: A webapp needs to be developed where a user can log, track as well share their daily learnings.

## Problem Understanding - First Thoughts | Product Decisions [V1]

*Auth:*
- A user can sign up and sign in using Email + OTP (no password).
- A user must sign up before they can add logs or generate their public link.

*Entity - Goal:*
- A user can create a Goal (a learning topic/objective) that logs are attached to.
- A user can edit/delete a goal.

*Entity - Log:*
- A user after signin, can select an existing goal and log an entry against it.
- A log entry must be linked to a goal. It contains these fields - description (required), a start time, and an end time.
- A user can backdate a log entry up to 30 days in the past; future-dated logs are not allowed.
- A user CANNOT create two logs with overlapping time ranges.
- A user can edit/delete a log.

*Frontend - Pages:*
- After SignIn, the user will land on his dashboard page.
- The DashBoard page will contain 3 sections. 1st Section will contain an option to add a new Log. 2nd Section will contain the heatmap. 3rd Section Section will contain the user's logs list.
- The log list, will be shown for current month by default. There will be a dropdown of years. Then a radiobutton sort of functionality for 12 months of the year. Only 1 button will be selected at one time. And only those buttons will be enabled where the user's logs are present.
- HeatMap: A user can view a full-year heatmap (365/366 cells) where cell color intensity reflects hours logged that day (gray = 0h, scaling to darkest green at >12h).

*Sharing / Public Link:*
- A user after logging atleast one entry is allowed to share a public link to showcase their daily progress/logs. (anyone can view this page)
- A user's logs are private by default; the user can toggle their entire log history to public, which controls whether their `/u/[handle]` page is viewable by others.
- A user's public link is a username-based slug chosen at sign-up (`/u/johndoe`), not a random token or user-editable vanity slug.

*Platform:*
- The system must include a frontend, a backend/API layer, and a real database (SQL or NoSQL).
- The app must be deployed to a live, publicly reachable URL.

## Future features Bucket List
1. Traffic/analytics on a user's public page.
2. Theming (light/dark/custom).
