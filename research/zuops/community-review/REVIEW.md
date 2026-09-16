# Zuops Feed and Classroom walkthrough

September 15, 2026 · Signed-in Chrome UI review · Read-only inspection

Opened the [dashboard](https://zuops.com/dashboard) and used the visible Feed and Classroom navigation. Current Classroom route observed: [Classroom](https://zuops.com/dashboard?tab=classroom). Saved DOM snapshots and viewport screenshots in this directory. No posts, replies, votes, reactions, invitations or messages were submitted.

## Feed: observed

- Left Community navigation, breadcrumb, central stream and independent right rail. Composer precedes category controls; posts are grouped by recency/date.
- Categories: Home, Intros, Feedback, Requests, Templates, Wins, News; More reveals Tutorials and Chat.
- Expanding the composer reveals title and body, mention hint, bold/italic/heading, bulleted/numbered lists, quote, image/video attachments, poll, category selector, Cancel and Post. Poll has a question, two initial options and Add Option. Inspected and canceled without publishing.
- Cards show author/profile, timestamp, edited marker where applicable, category, title, body, media, likes, comment count, thanks and a bell icon. Reaction and bell mutation behavior was not exercised.
- A comment count opens a dialog with expand/close, full post, comments, replies, mentions, comment media, reactions, Jump to latest and a comment composer.
- Right rail: Community member count, View members, Invite Friends; Upcoming Events and View All Events; Recent Published Ads and View Ad Library.
- Events destination shows viewer timezone, a truthful empty upcoming-events state, recent recordings and Browse All Recordings.
- Members: searchable directory, sort selector, All Members / Online Now / Top Contributors / New This Week filters, profile links and Message controls. No direct message was sent.
- Leaderboard: contributor / ad creator / referral tabs, time selector and an explained contribution formula. Its displayed formula is thanks received ×5 + ads published ×3 + comments ×1 + likes ×1. No backend verification of scoring or referral behavior was performed.

## Classroom: observed

- Heading and short introduction; broad search input; category chips; three-column tutorial grid at desktop width.
- Categories observed: All, AI Tools, Ad Copying, Agency, Facebook Ads, Google Ads, Integrations, Lead Quality, Websites.
- Tutorial cards: thumbnail, Tutorial badge, title, category, truncated description, full-width Watch Tutorial button.
- Ad Copying filter returned two related tutorials. Searching `remix` returned one matching tutorial. Clear filters appears while filtering; the coaching archive is absent in those filtered results.
- Tutorial detail: return/breadcrumb, updated date, title/category, embedded YouTube player and About this tutorial text. No course-completion tracker, quiz, certification or mandatory learning gate was visible in the inspected tutorial.
- Unfiltered catalog ends with Live coaching archive: Past Events and Random Help tiles.
- Past Events: Event Recordings heading, search, thumbnail/date/title/description, plan-access badges and Watch Recording buttons.
- Recording detail: embedded Loom player, date/title/description, access badges and Other Event Recordings links.
- Random Help: separate searchable help-session recording collection with the same card conventions.

## Boundaries of this review

Inspected representative detail views and controls, not every video in full. No tutorial or recording was downloaded. Source community posts and instructor videos remain research references, not our production lesson or post content. Controls for posting, reactions, invitation delivery, direct messages and entitlement enforcement were observed rather than end-to-end tested. No admin CMS was accessible or audited.

## Evidence index

| File | Evidence |
|---|---|
| 01-feed.txt / 01-feed.png | Feed structure and visible cards |
| 02-composer.txt / 03-poll-composer.txt | Post and poll controls |
| 04-thread.txt | Post detail, comments and replies |
| 05-feed-more.txt | Extra categories |
| 06-events.txt | Events destination |
| 07-classroom.txt / 07-classroom.png | Catalog and archive entries |
| 08-lesson.txt / 08-lesson.png | Tutorial detail/player |
| 09-past-events.txt / 10-recording.txt | Archive and recording detail |
| 11-help-archive.txt | Help recording collection |
| 12-classroom-search.txt | Working search |
| 13-members.txt / 14-leaderboard.txt | Member directory and leaderboard |

Our mapping and implementation requirements are in [Community and Classroom](../../../product/COMMUNITY-AND-CLASSROOM.md).
