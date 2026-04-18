import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listSources } from "@/lib/data";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default function AboutPage() {
  const sources = listSources();

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to app
        </Link>

        <h1 className="text-3xl font-bold mb-2">Methodology</h1>
        <p className="text-muted-foreground mb-8">
          How the numbers in TheChipAccount were derived, calibrated, and
          validated.
        </p>

        <div className="prose prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">What we compute</h2>
            <p className="text-sm leading-relaxed text-foreground">
              The app answers one question: <em>&quot;how much water, electricity, and
              greenhouse gas is released to manufacture one chip of type X?&quot;</em>
            </p>
            <p className="text-sm leading-relaxed text-foreground mt-2">
              The pipeline: per-process-step coefficients × step count →
              per-wafer totals ÷ good dies per wafer → per-die totals. We cover
              front-end-of-line and middle-of-line only — no packaging, no
              upstream mining, no use-phase energy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Key assumptions</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-foreground">
              <li>
                Global-average grid intensity of 0.42 kg CO₂e/kWh used for
                Scope 2 emissions.
              </li>
              <li>
                Abatement (destruction/removal) efficiency for fluorinated gases
                assumed at ~95%.
              </li>
              <li>
                Yield values per chip based on published estimates where
                available, otherwise conservative defaults (70% baseline).
              </li>
              <li>
                300mm wafer with 70,000 mm² usable area and 3 mm² scribe
                allowance per die.
              </li>
              <li>
                Water numbers show <strong>gross process water</strong>, not net
                withdrawal. TSMC recycles &gt;95% internally — net would be
                5-20× smaller.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Calibration</h2>
            <p className="text-sm leading-relaxed text-foreground">
              Coefficients were calibrated against three independent anchors:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-foreground mt-2">
              <li>
                <strong>IMEC 2025:</strong> ~1,600 kg CO₂eq per wafer for a 2nm
                logic node.
              </li>
              <li>
                <strong>Hu 2023:</strong> ~5,750 L water per wafer (8.22 L/cm² ×
                700 cm²).
              </li>
              <li>
                <strong>Bardon 2020:</strong> N28→N2 scaling: 3.46× electricity,
                2.3× water, 2.5× GHG.
              </li>
            </ul>
            <p className="text-sm leading-relaxed text-foreground mt-2">
              All values are within ±18% of published anchors. Deltas are
              documented and transparent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">What these numbers are NOT</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-foreground">
              <li>Not suitable for regulatory reporting (CSRD, SEC, SB 253).</li>
              <li>Not suitable for carbon offset claims.</li>
              <li>
                Not a comparison between specific foundries or chipmakers.
              </li>
              <li>Not a full life-cycle assessment.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">What they ARE</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-foreground">
              <li>
                Illustrative estimates for public education about orders of
                magnitude.
              </li>
              <li>A tool for comparing process nodes against each other.</li>
              <li>
                A reference for understanding which process families dominate
                which impact categories.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Sources</h2>
            <div className="space-y-3">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="rounded-lg border border-border p-3"
                >
                  <h4 className="text-sm font-medium">{source.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {source.org} · {source.year}
                    {source.authors && ` · ${source.authors}`}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-[10px]">
                      {source.type}
                    </Badge>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View source →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Acknowledgments</h2>
            <p className="text-sm leading-relaxed text-foreground">
              This tool relies on the pioneering sustainability work of IMEC&apos;s
              SSTS program, TSMC&apos;s ESG reporting, SEMI&apos;s sustainability
              publications, and the US EPA fluorinated gas partnership. The
              semiconductor industry has historically been opaque about
              environmental data — these organizations are changing that.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
