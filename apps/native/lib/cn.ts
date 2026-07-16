import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import { tv as tvBase } from "tailwind-variants";

const twMergeConfig = {
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "m1",
            "m2",
            "m3",
            "m4",
            "p1",
            "p2",
            "p3",
            "p4",
            "p5",
            "p6",
          ],
        },
      ],
    },
  },
};

const twMerge = extendTailwindMerge(twMergeConfig);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const tv: typeof tvBase = (options, config) =>
  tvBase(options, { ...config, twMergeConfig: twMergeConfig.extend });
