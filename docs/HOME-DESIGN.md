# Renewal Home reference treatment

September 17, 2026. User direction: match the supplied Zuops Home's spacious assistant, rounded composer, toolkit pills and recognizable provider/model cards, while retaining Renewal identity and colors.

## Delivered

Home uses the existing exact Renewal logo in the sidebar, Renewal Green (#6CC14C) for controls and section accents, black text on the green send button, neutral typography and restrained surface shadows. The sidebar uses the same Renewal green glow following the user’s subsequent brand correction. Provider artwork keeps its native colors. The intentional Arial fallback remains until supplied Franklin Gothic webfont usage is approved.

Eight toolkit shortcuts open existing modules. Remix now opens the dedicated Remix route. Six model cards use names, descriptions, artwork and order from the shared model inventory. Clicking a card searches the catalog; search persists through refresh. Official identities are verified independently of integration: no endpoint, generation capability, account access or live-provider status is enabled by this change. Unknown entries remain in the complete catalog without invented logos.

## Logo provenance and identity sources

Unmodified source files live in `app/public/provider-logos/`. `provenance.json` records original URLs, source pages, checked date and SHA-256 hashes. Assets are served locally, with no browser request to a third-party logo service. Failed images fall back to a task icon.

- **OpenAI:** official [OpenAI GitHub organization](https://github.com/openai) avatar, referenced by the organization API. The [brand guidelines](https://openai.com/brand/) establish the Blossom treatment. Used as a provider mark for [GPT Image 2](https://developers.openai.com/api/docs/models/gpt-image-2).
- **Google Gemini:** exact SVG published in [Google DeepMind's navigation](https://deepmind.google/models/gemini-image/). That page identifies Nano Banana Pro and Nano Banana 2 as Gemini image models.
- **Google Veo:** exact Veo SVG from the same official navigation; [Veo 3.1](https://deepmind.google/models/veo/) establishes model identity and the general video/audio description.
- **ByteDance Seed:** native multi-resolution icon linked by the official Seed site, used as provider identity for [Seedance 2.5](https://seed.bytedance.com/en/seedance2_5) and [Seedance 2.0](https://seed.bytedance.com/en/seedance2_0). This is a provider mark, not a recreated model logo.

The featured selection preserves the full observed catalog. Sora is not featured: its [official announcement](https://openai.com/index/sora-2/) now states that the product is no longer available. No promotional “new”/“pro” badges or unsupported duration/resolution promises were copied from the screenshot.

## Verification

- TypeScript and Vite production build passed; logo files included in build output.
- Chrome desktop: composer, toolkit and all six cards inspected; six provider images loaded successfully.
- Chrome 390 × 844: responsive composer, wrapping toolkit and one-column cards inspected; document width and scroll width both 390px.
- Seedance 2.5 card opens a one-result catalog search; refresh preserves the query; generation control stays disabled.
- No company data or credentials changed. No deployment performed. The existing local server remains available at `http://127.0.0.1:8787`; normal setup/start instructions remain in README.
