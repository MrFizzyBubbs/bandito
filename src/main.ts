import { print, pvpAttacksLeft } from "kolmafia";
import { get, set } from "libram";
import { Season } from "./season";

/* eslint-disable @typescript-eslint/no-unused-vars */
function weightedRandom<T>(items: T[], weights: number[]): T {
  const cumulativeWeights: number[] = [];
  for (let i = 0; i < weights.length; i += 1) {
    cumulativeWeights[i] = weights[i] + (cumulativeWeights[i - 1] || 0);
  }

  const maxCumulativeWeight = cumulativeWeights[cumulativeWeights.length - 1];
  const randomNumber = Math.random() * maxCumulativeWeight;

  for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
    if (cumulativeWeights[itemIndex] >= randomNumber) {
      return items[itemIndex];
    }
  }
  return items[items.length - 1];
}

export function main(): void {
  const epsilonProperty = "bandit_currentEpsilon";

  const season = Season.current();
  if (season.id === 0) return;

  while (pvpAttacksLeft() > 0) {
    const epsilon = 1000 * get(epsilonProperty, 0.9);
    const bestMini = season.bestMini();
    let mini;
    if (Math.random() * 1000 > epsilon) {
      print("Exploiting", "green");
      mini = bestMini;
    } else {
      print("Exploring", "green");
      const minis = season.minis.filter((x) => x !== bestMini);
      const weights = minis.map((x) => x.winningPercentage());
      mini = weightedRandom(minis, weights); // TODO handle 0 wins/losses case
    }
    mini.run();
    season.save();
    set(epsilonProperty, Math.max(epsilon / 1000.0 - 0.001, 0.1));
  }
}
