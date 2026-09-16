# Community Feed and Classroom

September 15, 2026 · Confirmed core sections · Zuops parity with company branding

## Direction

Add **Community → Feed / Classroom** near the top of the sidebar beneath Home. Preserve the simple assistant Home. Use the observed Zuops layout and interaction patterns inside our existing company-themed shell. Renewal is the reference theme; company configuration supplies the identity and accents.

This is design and implementation scope. The visual concepts are not a running community backend or recorded training library. See the [signed-in review](../research/zuops/community-review/REVIEW.md) for observed behavior and inspection limits.

## 1. Parity map

| Zuops observed pattern | Our app |
|---|---|
| Central Feed, top composer, category strip, dated post groups | Same arrangement and familiar behavior |
| Rich posts, media, polls, comments/replies, mentions, likes/thanks | Same community capabilities, with our members and original posts |
| Member/events/recent-ad right rail | Shared home-service community, training events and published Winning Ads |
| Searchable Classroom with chips and three-column cards | Same catalog structure with platform and company-specific lessons |
| Large embedded lesson player and About section | Same lesson anatomy, plus a contextual link into the relevant app tool |
| Past Events / Random Help recordings | Past Events / Help Sessions, preserving the two archive destinations |
| Member directory and leaderboard | Accessible community profiles, contribution recognition and explainable scoring |

The sidebar reference includes Chat. This addition implements Feed and Classroom as requested. The existing personal assistant remains distinct from community messaging; a separate real-time Chat/DM module is not silently included or simulated by a fake unread badge.

## 2. Feed layout and behavior

### Main stream

Preserve Zuops's broad center column and narrower right rail. The collapsed composer says **Share something with the community…** and shows **Shared community** before any publishing action. Category controls follow: Home, Intros, Feedback, Requests, Templates, Wins, News, More → Tutorials / General discussion. Home includes all applicable categories. Preserve return position and filters when closing a thread.

Posts show author identity, company/public community affiliation where chosen, timestamp, edited marker, category, title, rich body, attachments and actions. Date groups include Today, Yesterday, Earlier this week and older periods. Support pagination, empty categories, failed loads and accessible loading states. Do not invent activity to fill an empty community.

### Composer

Expand inline to a title, rich-text body, category selector, images, video/link attachments and poll. Match observed formatting: bold, italic, heading, lists and quote. Support mentions and a poll question with at least two distinct choices. Preserve drafts across accidental close/navigation; Cancel does not publish.

Before posting an attached company creative, show the exact public derivative and audience. Posts do not reveal private source files, hidden layers, unpublished briefs or account reports. Attaching a performance result uses an explicit shareable snapshot with chosen fields. A feedback post is never an approval prerequisite for downloading an ad.

### Threads

Open post details in a dialog with expand/full-view and close controls, full content, comment count, comments/replies, mention links and a comment composer. Include image/video comment attachments, like and thanks actions, Jump to latest and follow/unfollow notifications. Make focus trapping, Escape and keyboard navigation work. Counts come from stored records, not display-only counters.

### Right rail

- **Community:** actual membership count, View members and Invite colleagues. Invites grant only the explicitly selected community/company role; platform participation must not grant company-data access.
- **Upcoming Events:** next eligible training sessions, viewer timezone and View all events. Empty state when none are scheduled.
- **Recent Published Ads:** thumbnail grid linking to the existing shared Winning Ads detail. Only published records appear. A company remix stays private.

### Supporting community destinations

Directory: search, meaningful sorting, contribution/new-member filters, profiles and optional presence preference. Do not show Message until messaging exists. Leaderboard: contributor and published-ad views, defined period and visible scoring. The observed scoring formula can be the initial configurable rule; use deduplicated qualifying events and remove invalidated activity. Referral ranking remains disabled until a referral program is explicitly defined.

Member counters, reaction totals and participation rankings are not evidence of ad performance. Winning Ads remains the canonical place for metric definitions and evidence.

## 3. Classroom layout and behavior

### Catalog

Match the observed heading, short introduction, full-width search, category pills and three-column cards. Responsive layouts become two and one columns. Every card has a 16:9 thumbnail, Tutorial/type badge, title, category, short clamped description and **Watch Tutorial** action.

Our initial categories map to actual supported work: All, Getting Started, Static Ads, Video & UGC, Remix, Meta & Insights, Brand System. Do not advertise Zuops-specific agency/CRM/Google Ads/website-building features as part of our app just because those tutorial categories exist there.

Search eligible titles, descriptions and tags; category/search combine, with Clear filters and a truthful no-results state. Preserve selections when returning from a lesson. Show the Live coaching archive beneath the unfiltered catalog, matching the source structure.

### Lesson detail

Return to Classroom, updated date, title/category, large accessible video player and About this tutorial. Add available caption/transcript and downloadable resources for our owned lessons. These resources are our planned additions, not verified Zuops features.

Use **Try it in Static Studio**, **Open Video & UGC**, **Connect Meta**, or **Explore Winning Ads** where relevant. These links carry the viewer's own company context; a lesson cannot overwrite their campaign or trigger paid generation by opening a link.

User playback position/resume is a useful implementation addition, subject to player support. Quizzes, certificates and enforced training completion are not required. Clients can create and download without completing a lesson.

### Archives and live events

Two entries: **Past Events** and **Help Sessions** (Zuops calls the second Random Help). Both use searchable cards with thumbnail, date, title, description and Watch Recording. Recording pages show a player, description and related eligible recordings.

The events page includes date/time in the viewer's timezone, description, host and valid access/join link when available, plus recent recordings. Use entitlement checks only for real content access rules. Do not copy Zuops's plan badges into our subscription model or invent a scheduled training calendar.

## 4. Shared versus company-specific

- **Feed:** a shared cross-company community in each client's branded UI. This follows the user's shared discovery direction. Company participation and public profile identity are explicit.
- **Platform Classroom:** common product lessons available to subscribed companies.
- **Company training:** lessons about that company's assets, brand rules, offers and workflows visible only to its authorized members. Mark cards with the company name, and keep the same catalog/player design.
- **Personal state:** bookmarks, drafts, playback position and notification preferences belong to the user and applicable company membership.

The assistant may retrieve eligible lesson descriptions/transcripts and cite them. Community opinions remain attributed opinions. Private company training and account facts cannot be included in a shared post automatically.

## 5. Renewal starter curriculum — content to produce

1. Create your first monthly campaign from an offer brief.
2. Make a static ad using real window and home assets.
3. Build a video with company footage and AI scenes.
4. Create presenter/UGC-style ads with branded captions and end cards.
5. Remix an ad into Renewal's design system.
6. Connect Meta and interpret actual results.
7. Compare lead costs with qualified appointments.
8. Use the Renewal asset library, typography, approved logo and offer terms — company-only lesson.

These are proposed original lessons. Source Zuops videos and member posts are research references, not imported course content. The mockup contains sample titles and fictional contributors, not a claim these courses or posts already exist.

## 6. Content operations and backend

Our setup console needs a lesson/recording editor: title, description, thumbnail, video source, captions/transcript, category/tags, resources, audience, publish state, updated date and related-tool target. Platform staff manage common training; authorized company administrators manage company-specific materials.

Records: community profile, category, post/version, public media derivative, comment/reply, mention, reaction, poll/choice/vote, follow, notification preference/event, event, lesson/version, recording, eligibility, playback position, content report and moderation action.

Community publishing and membership are distinct from company asset permissions. Enforce eligibility on lists, search, detail, player/resource URLs and assistant retrieval. Sanitize rich text, validate uploaded media and use trusted/sanitized video embed sources. Prevent cross-company mentions from exposing private member lists. Invite links expire and grant an explicit role.

Support author edit/delete, staff moderation, reporting and auditable removal; define what remains in existing replies after deletion. Community moderation does not create a creative-export approval gate. Notification delivery respects follows, mentions and preferences with deduplication. No automatic promotion of every generated ad into the Feed or shared library.

## 7. Acceptance

- Same Feed/catalog/detail/archive structure as the inspected Zuops experience, with company theme applied consistently.
- Post → category → thread → reply/poll/reaction flows work with real persistence and correct counts.
- Private asset links never become public through a community attachment.
- Shared published ad opens its evidence view and remixes into the viewer's own private company.
- Catalog search/category filters combine correctly and survive return from a lesson.
- A different company cannot list, play, download or retrieve another company's training.
- Player failure/captions, empty archives and no upcoming events are handled honestly.
- Published content has real media or an explicit unavailable state; sample mockups are not shipped as real training.
- Two different company themes pass responsive and keyboard checks.
- Learning and feedback never block creation or immediate download.

## Visuals

- [Feed concept](ui-concepts/09-community-feed.png)
- [Classroom concept](ui-concepts/10-classroom.png)
- [Generation prompts](ui-concepts/COMMUNITY-PROMPTS.md)

Raster studies illustrate layout and content direction. Production uses exact approved identity assets and working controls.
