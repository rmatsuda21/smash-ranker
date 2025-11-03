import { PlayerInfo } from "@/types/top8/Result";

declare module "fabric" {
  interface Group {
    _objects: FabricObject[];
  }

  interface FabricObject {
    id?: string;
    playerInfo?: PlayerInfo;
    locked?: boolean;
    name?: string;
    _objects: FabricObject[];
  }

  interface SerializedObjectProps {
    id?: string;
    playerInfo?: PlayerInfo;
    locked?: boolean;
    name?: string;
    _objects: FabricObject[];
  }
}

export {};
