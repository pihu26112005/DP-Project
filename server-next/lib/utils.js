import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}


export const hdr = {
  0: {
    minErrorFile: {
      filename: "DK_25.38.csv",
      frequencies: [1, 2, 3],
      values: [1, 2, 3]
    },
    error: [{ filename: "DK_9.76.csv", error: 64.77 }, { filename: "DK_12.13.csv", error: 120.5 }, { filename: "DK_14.85.csv", error: 73.66 }, { filename: "DK_17.95.csv", error: 84.565 }, { filename: "DK_21.45.csv", error: 150.6 }, { filename: "DK_25.33.csv", error: 16.98 }, { filename: "DK_29.77.csv", error: 91.00 }, { filename: "DK_34.63.csv", error: 99.637 }, { filename: "DK_40.0.csv", error: 83.7473 }, { filename: "DK_6.0.csv", error: 140.65 }]
  },
  1: {
    minErrorFile: {
      filename: "DK_34.63.csv",
      frequencies: [1, 2, 3],
      values: [1, 2, 3]
    },
    error: [{ filename: "DK_9.76.csv", error: 74.77 }, { filename: "DK_12.13.csv", error: 80.5 }, { filename: "DK_14.85.csv", error: 173.66 }, { filename: "DK_17.95.csv", error: 78.735 }, { filename: "DK_21.45.csv", error: 70.634 }, { filename: "DK_25.33.csv", error: 160.74 }, { filename: "DK_29.77.csv", error: 83.48 }, { filename: "DK_34.63.csv", error: 19.364 }, { filename: "DK_40.0.csv", error: 93.473 }, { filename: "DK_6.0.csv", error: 60.945 }]
  }
};
