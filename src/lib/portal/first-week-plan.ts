export interface FirstWeekPlanItem {
  title: string;
  detail: string;
}

export function buildCreatorSnapshotFirstWeekPlan(input: {
  connected: boolean;
  thinContent: boolean;
  cadenceInferred: boolean;
  typicalDays: string[];
  streamTimesInferred: boolean;
  streamTimesLabel: string | null;
  primaryPlatform: string | null;
}): FirstWeekPlanItem[] {
  if (!input.connected) {
    return [
      {
        title: "Connect Twitch or Kick",
        detail:
          "The snapshot fills in from your real channel data. YouTube is available for testers until Google verifies the app.",
      },
      {
        title: "Publish something this week",
        detail:
          "Stream or upload as you already would. We only infer best days and times after we have enough VODs — we will not guess.",
      },
      {
        title: "Come back after a few VODs",
        detail:
          "Audience and views show as soon as you connect. Week-over-week growth appears after we store a second daily snapshot.",
      },
    ];
  }

  if (input.thinContent) {
    const platform = input.primaryPlatform ?? "your connected channel";
    return [
      {
        title: `Keep posting on ${platform}`,
        detail:
          "We need about 8 recent streams or videos before we can infer typical days. Until then we only show counts we actually have.",
      },
      {
        title: "Treat this snapshot as a baseline",
        detail:
          "Current audience and recent views are live reads, not forecasts. Growth % stays hidden until a second history point exists.",
      },
      {
        title: "Skip YouTube unless you are a tester",
        detail:
          "Google still shows an unverified-app warning and caps testers. Twitch and Kick are the supported path for now.",
      },
    ];
  }

  const items: FirstWeekPlanItem[] = [];

  if (input.cadenceInferred && input.typicalDays.length > 0) {
    items.push({
      title: `Keep your ${input.typicalDays.join(" / ")} cadence`,
      detail:
        "Those are the days you actually posted most often in the last eight weeks — not a target we invented.",
    });
  }

  if (input.streamTimesInferred && input.streamTimesLabel) {
    items.push({
      title: "Your recent streams cluster here",
      detail: `${input.streamTimesLabel}. Times are UTC from VOD publish timestamps.`,
    });
  }

  items.push({
    title: "Review the three insights above",
    detail:
      "Every number on this page comes from a connected account or stored history. If a figure is missing, we leave it blank.",
  });

  if (items.length < 3) {
    items.push({
      title: "Record this week as your baseline",
      detail:
        "We save audience and view totals daily. After two captures you will see week-over-week change — not before.",
    });
  }

  return items.slice(0, 3);
}
