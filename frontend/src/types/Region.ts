export interface RegionNode {
  gameUUID: string | null;
  winner: string | null;
  left: RegionNode | null;
  right: RegionNode | null;
  name?: string;
  seed?: number;
}

export interface Region {
  root: RegionNode;
} 