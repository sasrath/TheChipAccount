import { listChips } from "@/lib/data";
import { computeFootprint } from "@/lib/compute";
import { ChipPicker } from "@/components/chip-picker";
import { Dashboard } from "@/components/dashboard";
import { Footer } from "@/components/footer";
import { GreeneryBackground } from "@/components/greenery-background";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ chip?: string }>;
}

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const chips = listChips();
  const selectedChipId = params.chip;

  const selectedChip = selectedChipId
    ? chips.find((c) => c.id === selectedChipId)
    : undefined;

  const footprint = selectedChip ? computeFootprint(selectedChip) : undefined;

  return (
    <main className="relative flex-1">
      <GreeneryBackground />

      {/* Hero */}
      <section className="relative z-10 border-b border-border bg-gradient-to-b from-primary/5 to-background/80">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground text-balance">
            TheChipAccount
          </h1>
          <p className="mt-3 max-w-2xl text-base sm:text-lg text-muted-foreground">
            What does it cost the planet to manufacture a single chip? Pick a
            chip below and see the water, energy, and emissions behind every
            transistor — every number backed by a cited source.
          </p>
        </div>
      </section>

      {/* Chip Picker */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        <h2 className="text-lg font-semibold mb-4">Choose a chip</h2>
        <ChipPicker chips={chips} selectedId={selectedChipId} />
      </section>

      {/* Dashboard */}
      {footprint && (
        <section className="relative z-10 mx-auto max-w-6xl px-4 pb-16">
          <Dashboard footprint={footprint} />
        </section>
      )}

      <Footer />
    </main>
  );
}
