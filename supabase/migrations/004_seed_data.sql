-- =============================================================================
-- Migration: 004_seed_data.sql
-- Initial seed data for style presets
-- =============================================================================

-- =============================================================================
-- STYLE PRESETS
-- =============================================================================

INSERT INTO style_presets (id, name, description, prompt_layer, hidden_ref_url, category, is_premium, sort_order)
VALUES
  -- LUXURY CATEGORY
  (
    'LUXURY_MINIMAL_V1',
    'Ethereal Luxury',
    'High-key, soft diffused lighting, spa-like atmosphere with clean aesthetics.',
    'shot on Phantom Flex, soft diffused lighting, 8k resolution, slow motion, commercial aesthetic, clean white background, premium product photography',
    'https://storage.longevity-valley.com/styles/ref_luxury_minimal_v1.jpg',
    'luxury',
    FALSE,
    10
  ),
  (
    'LUXURY_GOLD_V1',
    'Golden Hour Opulence',
    'Warm golden tones, rich textures, high-end fashion photography feel.',
    'golden hour lighting, warm amber tones, bokeh background, luxury fashion photography, shot on medium format, rich shadows, elegant composition',
    'https://storage.longevity-valley.com/styles/ref_luxury_gold_v1.jpg',
    'luxury',
    TRUE,
    11
  ),

  -- TECH CATEGORY
  (
    'TECH_NOIR_V1',
    'Cyberpunk Tech',
    'Dark environment, neon rim lighting (blue/magenta), futuristic dystopian feel.',
    'neon rim lights, deep blacks, blue and magenta contrast, volumetric fog, cyberpunk aesthetic, futuristic, blade runner inspired',
    'https://storage.longevity-valley.com/styles/ref_tech_noir_v1.jpg',
    'tech',
    FALSE,
    20
  ),
  (
    'TECH_CLEAN_V1',
    'Apple Minimal',
    'Clean, minimalist tech aesthetic. White/grey backgrounds, precise lighting.',
    'clean white background, precise studio lighting, minimalist composition, Apple product photography style, sharp focus, 8k, commercial',
    'https://storage.longevity-valley.com/styles/ref_tech_clean_v1.jpg',
    'tech',
    FALSE,
    21
  ),
  (
    'TECH_HOLOGRAM_V1',
    'Holographic Future',
    'Iridescent, holographic materials, sci-fi interface elements.',
    'holographic materials, iridescent reflections, sci-fi aesthetic, floating UI elements, cyan and purple color scheme, volumetric lighting',
    'https://storage.longevity-valley.com/styles/ref_tech_hologram_v1.jpg',
    'tech',
    TRUE,
    22
  ),

  -- NATURE CATEGORY
  (
    'NATURE_SERENE_V1',
    'Zen Garden',
    'Peaceful, natural lighting, organic textures, calming atmosphere.',
    'natural soft lighting, organic textures, zen garden aesthetic, peaceful atmosphere, earth tones, shallow depth of field, National Geographic style',
    'https://storage.longevity-valley.com/styles/ref_nature_serene_v1.jpg',
    'nature',
    FALSE,
    30
  ),
  (
    'NATURE_DRAMATIC_V1',
    'Storm Chaser',
    'Dramatic skies, powerful natural forces, high contrast.',
    'dramatic storm clouds, moody lighting, high contrast, powerful atmosphere, epic scale, cinematic wide shot, nature documentary style',
    'https://storage.longevity-valley.com/styles/ref_nature_dramatic_v1.jpg',
    'nature',
    TRUE,
    31
  ),

  -- URBAN CATEGORY
  (
    'URBAN_STREET_V1',
    'Street Culture',
    'Raw urban energy, graffiti, street photography aesthetic.',
    'street photography, urban environment, raw authentic feel, graffiti backgrounds, natural lighting, documentary style, 35mm film grain',
    'https://storage.longevity-valley.com/styles/ref_urban_street_v1.jpg',
    'urban',
    FALSE,
    40
  ),
  (
    'URBAN_NIGHT_V1',
    'Neon Nights',
    'Night cityscape, neon signs, wet streets reflecting lights.',
    'night photography, neon signs, wet streets reflecting lights, urban nightlife, cinematic color grading, Tokyo aesthetic',
    'https://storage.longevity-valley.com/styles/ref_urban_night_v1.jpg',
    'urban',
    FALSE,
    41
  ),

  -- MINIMAL CATEGORY
  (
    'MINIMAL_MONO_V1',
    'Monochrome',
    'Black and white, high contrast, architectural precision.',
    'black and white photography, high contrast, architectural precision, minimalist composition, geometric shapes, fine art photography',
    'https://storage.longevity-valley.com/styles/ref_minimal_mono_v1.jpg',
    'minimal',
    FALSE,
    50
  ),
  (
    'MINIMAL_PASTEL_V1',
    'Pastel Dreams',
    'Soft pastel colors, airy composition, dreamy aesthetic.',
    'soft pastel colors, airy composition, dreamy aesthetic, light and shadow play, feminine elegance, editorial fashion photography',
    'https://storage.longevity-valley.com/styles/ref_minimal_pastel_v1.jpg',
    'minimal',
    FALSE,
    51
  ),

  -- DRAMATIC CATEGORY
  (
    'DRAMATIC_CINEMA_V1',
    'Cinematic Epic',
    'Wide aspect ratio, dramatic lighting, movie poster quality.',
    'cinematic lighting, anamorphic lens flare, 2.39:1 aspect ratio, movie poster quality, dramatic shadows, epic scale, Hollywood blockbuster',
    'https://storage.longevity-valley.com/styles/ref_dramatic_cinema_v1.jpg',
    'dramatic',
    TRUE,
    60
  ),
  (
    'DRAMATIC_NOIR_V1',
    'Film Noir',
    'Classic noir lighting, venetian blind shadows, mysterious mood.',
    'film noir lighting, venetian blind shadows, high contrast black and white, mysterious mood, 1940s detective aesthetic, smoke and fog',
    'https://storage.longevity-valley.com/styles/ref_dramatic_noir_v1.jpg',
    'dramatic',
    TRUE,
    61
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  prompt_layer = EXCLUDED.prompt_layer,
  hidden_ref_url = EXCLUDED.hidden_ref_url,
  category = EXCLUDED.category,
  is_premium = EXCLUDED.is_premium,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- =============================================================================
-- TEST USER (for development only)
-- =============================================================================

-- This will be skipped in production via environment check
DO $$
BEGIN
  IF current_setting('app.environment', TRUE) = 'development' THEN
    INSERT INTO users (id, email, name, plan, credits_remaining)
    VALUES (
      '00000000-0000-0000-0000-000000000001',
      'test@longevity-valley.com',
      'Test User',
      'pro',
      100
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
