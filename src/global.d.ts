declare module "fabric" {
  interface Group {
    _objects: FabricObject[];
  }

  interface FabricObject {
    id?: string;
    playerId?: string;
    playerName?: string;
    characterId?: string;
    placement?: number;
    alt?: Player["alt"];
    locked?: boolean;
    name?: string;
    _objects: FabricObject[];
  }
  interface SerializedObjectProps {
    id?: string;
    playerId?: string;
    playerName?: string;
    characterId?: string;
    placement?: number;
    alt?: Player["alt"];
    locked?: boolean;
    name?: string;
    _objects: FabricObject[];
  }
}

export {};
