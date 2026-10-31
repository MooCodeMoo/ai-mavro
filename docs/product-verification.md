# Product cross-reference — 31 October 2026

Only official Mavro product pages and linked technical sheets were used. The application stores source URLs and source-check dates with each rule. Summaries are translated into SL/HR/EN/NL; product names remain unchanged. This is a source review, not laboratory validation of an image diagnosis or a manufacturer sign-off on an individual project.

| Product | Official reference | Application decision |
| --- | --- | --- |
| FacadeClean HC | https://mavro-int.shop/en/facadeclean-hc | Light 1:2, medium 1:1, heavy undiluted; optional rinsing after 20–45 min. Removed old blanket 1:2–1:3 advice. |
| Uniclean Low Foaming | https://mavro-int.shop/en/uniclean-low-foaming | General mineral-surface dirt; dilution up to 1:30. No numeric coverage guessed. |
| Alu Clean | https://mavro-int.shop/pub/media/wysiwyg/Documentation_en/Alu_Clean_TDS_20230608_EN_1.pdf | Bare aluminium fouling/oxidation; immediate rinse. Removed unconditional 5–15 min dwell and generic aluminium override. Contains ammonium bifluoride; full current SDS remains required. |
| Strip-Off Plus | https://mavro-int.shop/en/strip-off-plus | Paint stripping, including wood. 30–60 min; consumption stays in kg. Pressure must suit the substrate. |
| Graffiti Remover Gel | https://mavro-int.shop/en/graffiti-remover-gel | Separate graffiti workflow on mineral substrates; no arbitrary paint-stripper alternative. Metal/coated-wood graffiti is referred for technical review in this version. |
| Cement Residue Remover | https://mavro-int.shop/pub/media/wysiwyg/Documentation_en/Cement_Residue_Remover_TDS_20200915_EN_2.pdf | Acid-resistant brick/tiles only after confirmation; no automatic acid recommendation on soft natural stone. |
| Oil Remover | https://mavro-int.shop/sl/sredstvo-odstranjevanje-oljnih-madezev | Mineral-surface oil deposits; undiluted or 1:1; keep wet for 5–30 min. |
| Rust Remover | https://mavro-int.shop/en/rust-remover | Iron/steel rust; no automatic use for an unspecified stain on stone. Repainting has a distinct rinse instruction; consult TDS. |
| Wood Renovator | https://mavro-int.shop/pub/media/wysiwyg/Documentation_en/Wood_Renovator_TDS_20240122_EN.pdf | Weathered grey wood only, undiluted, 10–15 min. No paint-stripping recommendation. |
| MavroSeal WB Extra Strong | https://mavro-int.shop/en/mavroseal-wb-extra-strong | Optional impregnation candidate on absorbent dry mineral surfaces; page specifies undiluted use and 1–2 m²/L. Do not carry an earlier 1:1 / 350–400 m² per 25 L commercial assumption into this calculation without the exact regional TDS/concentration being confirmed. |
| Graffitiguard Permanent | https://mavro-int.shop/en/graffitiguard-permanent | Optional anti-graffiti protection candidate on porous mineral surfaces after cleaning and drying; do not conflate with Permanent HD or 2C. |

## Deliberate gaps

- Algen Remover and biocidal claims are not automatically added without verifying the exact locally authorised product and label for the destination market.
- Soft/hard stone alone does not establish acid resistance, finish, existing coating or substrate condition. Unknown cement/rust combinations go to review.
- Specialist rail cleaners, solar products, other coatings and the rest of the assortment need additional source-backed rules before being offered.
- No live price/stock synchronisation or webshop API credentials were available. The product page is the purchase destination and commercial source of truth.
- Public product pages and PDFs can change. Refresh the source check when revising rules, and verify the current SDS before use. Existing cases retain their original source and revision.

## Pending deployment checks

Remote libSQL credentials, the production host, SMTP delivery and the real Anthropic account must be verified in that deployment environment. No live email, Asana task or customer submission is part of the code checks.

## AI model maintenance

The previous `claude-sonnet-4-20250514` was retired on 15 June 2026 according to [Anthropic's model lifecycle documentation](https://platform.claude.com/docs/en/about-claude/model-deprecations). The default is now the active `claude-sonnet-4-6`, configurable with `ANTHROPIC_MODEL`. Real image accuracy and account access still require evaluation with the deployment's API key; local tests do not claim a live model evaluation.
