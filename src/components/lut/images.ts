/** 24 HD cinematic frames preloaded during the loading sequence. */
const IDS = [
  "1485846234645-a62644f84728",
  "1478720568477-152d9b164e26",
  "1517604931442-7e0c8ed2963c",
  "1524712245354-2c4e5e7121c0",
  "1500530855697-b586d89ba3ee",
  "1536440136628-849c177e76a1",
  "1504674900247-0877df9cc836",
  "1502134249126-9f3755a50d78",
  "1470071459604-3b5ec3a7fe05",
  "1506905925346-21bda4d32df4",
  "1519681393784-d120267933ba",
  "1465101162946-4377e57745c3",
  "1451187580459-43490279c0fa",
  "1518709268805-4e9042af2176",
  "1533134486753-c833f0ed4866",
  "1478760329108-5c3ed9d495a0",
  "1493804714600-6edb1cd93080",
  "1526779259212-939e64788e3c",
  "1516035069371-29a1b244cc32",
  "1499363536502-87642509e31b",
  "1550745165-9bc0b252726f",
  "1478432780021-b8d273730d8c",
  "1520769945061-0a448c463865",
  "1531306728370-e2ebd9d7bb99",
];

export const HD_IMAGES = IDS.map(
  (id) =>
    `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1920&q=80`,
);

/** Deterministic shuffle helper so SSR and client agree on ordering. */
export function pick(count: number, offset = 0) {
  return Array.from(
    { length: count },
    (_, i) => HD_IMAGES[(i * 7 + offset) % HD_IMAGES.length]!,
  );
}
