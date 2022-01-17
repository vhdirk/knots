import { Injectable } from "@angular/core";
import { EntityStore, Store, StoreConfig } from '@datorama/akita';
import { NeighbourhoodState } from '../neighborhood.types';

export function createInitialState(): NeighbourhoodState {
  return {
    networkIds: [],
    nodes: null,
    routes: null,
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'neighbourhood',
  resettable: true,
})
export class NeighbourhoodStore extends Store<NeighbourhoodState>{
  constructor() {
    super(createInitialState());
  }
}
