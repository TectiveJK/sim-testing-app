"use client";

import { PageHeader } from "@/components/page-header";
import { LinkButton } from "@/components/link-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppData } from "@/components/data-provider";

export default function MissionsPage() {
  const { catalog } = useAppData();
  const grouped = new Map<string, typeof catalog.missions>();
  for (const mission of catalog.missions) {
    const list = grouped.get(mission.category) ?? [];
    list.push(mission);
    grouped.set(mission.category, list);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Mission-based testing"
        title="Scenarios"
        description="A mission is an ordered checklist. Read each step here, do it in SkyCommand, then record the result and move to the next step."
      />
      <div className="space-y-8">
        {[...grouped.entries()].map(([category, missions]) => (
          <section key={category}>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {category}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {missions.map((mission) => (
                <Card key={mission.id}>
                  <CardHeader>
                    <CardTitle>{mission.name}</CardTitle>
                    <CardDescription>{mission.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                      {mission.steps.map((step) => {
                        const test = catalog.tests.find((item) => item.id === step.testCaseId);
                        return (
                          <li key={step.testCaseId}>
                            <span className="text-foreground">{test?.name || step.testCaseId}</span>
                          </li>
                        );
                      })}
                    </ol>
                    <LinkButton href={`/missions/${mission.id}`} variant="outline" size="sm">
                      Open mission
                    </LinkButton>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
