// src/modules/legal/DisclaimerScreen.tsx — eager in-app disclosure route.
// Renders canonical disclaimer copy via <Disclaimer> (the single render path,
// FR61). Real static stable URLs (/privacy, /affiliate-disclosure) are also
// Netlify-served HTML per architecture.md:505; this in-app route satisfies the
// "Disclaimer routes eagerly loaded" acceptance criterion.
import { Placeholder } from '@/components/Placeholder';
import { Disclaimer } from '@/components/Disclaimer';

export default function DisclaimerScreen() {
  return (
    <Placeholder title="Affiliate Disclosure">
      <Disclaimer kind="parking" />
      <Disclaimer kind="ftc" />
    </Placeholder>
  );
}
