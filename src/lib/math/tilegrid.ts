/** TileDigest — receipt the Br×Bc schedule. Residual-vs-naive can hold while the grid lies. */

export type Tile = { i0: number; i1: number; j0: number; j1: number };

export function tileSchedule(n: number, Br: number, Bc: number): Tile[] {
  const br = Math.max(1, Br | 0);
  const bc = Math.max(1, Bc | 0);
  const tiles: Tile[] = [];
  for (let i0 = 0; i0 < n; i0 += br) {
    const i1 = Math.min(n, i0 + br);
    for (let j0 = 0; j0 < n; j0 += bc) {
      tiles.push({ i0, i1, j0, j1: Math.min(n, j0 + bc) });
    }
  }
  return tiles;
}

export function scheduleCover(n: number, tiles: Tile[]): boolean {
  const hit: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (const t of tiles) {
    for (let i = t.i0; i < t.i1; i++) {
      for (let j = t.j0; j < t.j1; j++) hit[i][j] += 1;
    }
  }
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (hit[i][j] !== 1) return false;
    }
  }
  return tiles.length > 0;
}

function djb2(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, "0");
}

export function digestTiles(n: number, d: number, Br: number, Bc: number, tiles: Tile[]): string {
  return djb2(JSON.stringify({ n, d, Br, Bc, tiles }));
}

export type GridTamper = 0 | 1 | 2;

/** 0 clean · 1 claim a coarser Br · 2 drop the last K-tile (cover hole). */
export function runTileGrid(n: number, d: number, Br: number, Bc: number, tamper: number = 0) {
  const ran = tileSchedule(n, Br, Bc);
  const ranDig = digestTiles(n, d, Br, Bc, ran);
  let claimedBr = Br;
  let claimedBc = Bc;
  let claimed = ran;
  if (tamper === 1) {
    claimedBr = Math.max(2, Br === 2 ? 4 : Br - 2);
    claimedBc = claimedBr;
    claimed = tileSchedule(n, claimedBr, claimedBc);
  } else if (tamper === 2) {
    claimed = ran.length > 1 ? ran.slice(0, -1) : ran;
  }
  const claimDig = digestTiles(n, d, claimedBr, claimedBc, claimed);
  const cover = scheduleCover(n, claimed) ? 1 : 0;
  const gridBreaks = ranDig === claimDig && cover === 1 ? 0 : 1;
  return {
    n,
    d,
    Br,
    Bc,
    claimedBr,
    claimedBc,
    ran,
    claimed,
    ranDig,
    claimDig,
    cover,
    gridBreaks,
    tileCount: claimed.length,
  };
}
