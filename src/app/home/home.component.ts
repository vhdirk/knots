import { distinctUntilChanged, Observable, Subject } from 'rxjs'
import { Component, OnInit } from '@angular/core'
import { Application } from '@nativescript/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Feature, FeatureCollection } from 'geojson';
import { MapboxApi, MapStyle } from '@nativescript-community/ui-mapbox';
import { RadSideDrawer } from 'nativescript-ui-sidedrawer';
import { EventsService } from '../services/events.service';
import { SettingsService } from '../services/settings.service';
import { PermissionsService, PERMISSIONS } from '../services/permissions.service';
import { NeighborhoodQuery } from '../services/neighborhood.query';
import { NeighborhoodService } from '../services/neighborhood.service';
import { NeighborhoodState } from '../services/neighborhood.store';
import equal from 'fast-deep-equal/es6';

import { PlannerQuery } from '../services/planner.query';
import { PlannerService } from '../services/planner.service';
import { PlannerState } from '../services/planner.store';


import { OperatorFunction, SchedulerLike, concat } from "rxjs";
import { asyncScheduler } from "rxjs/internal/scheduler/async";
import { debounceTime, publish, take, throttle, throttleTime } from "rxjs/operators";

export function debounceTimeAfter(
  amount: number,
  dueTime: number,
  scheduler: SchedulerLike = asyncScheduler,
): OperatorFunction<number, number> {
  return publish(value =>
    concat(
      value.pipe(take(amount)),
      value.pipe(debounceTime(dueTime, scheduler))),
  );
}

export function debounceTimeAfterFirst(
  dueTime: number,
  scheduler: SchedulerLike = asyncScheduler,
): OperatorFunction<number, number> {
  return debounceTimeAfter(1, dueTime, scheduler);
}

@UntilDestroy()
@Component({
  selector: 'Home',
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {

  MapStyle: typeof MapStyle = MapStyle;
  public mapView: MapboxApi;
  public minZoomLevel = 10;
  public maxClusterZoomLevel = 20;
  public nodeColor = '#5e7d50';
  public nodeRadius = 15;
  public routeColor = this.nodeColor;
  public nodeStrokeWidth = this.nodeRadius / 5;
  public routeStrokeWidth = 1;

  public locationPermission$!: Observable<boolean>;
  public locationPermission: boolean = false;

  public nodes: Feature[] = [];

  protected mapClick: Subject<Feature> = new Subject();

  constructor(public events: EventsService,
    public settingsService: SettingsService,
    public permissionsService: PermissionsService,
    public neighborhoodQuery: NeighborhoodQuery,
    public neighborhoodService: NeighborhoodService,
    public plannerQuery: PlannerQuery,
    public plannerService: PlannerService) {

  }

  ngOnInit(): void {
    this.locationPermission$ = this.permissionsService.requestPermission(PERMISSIONS.LOCATION, "We use this permission to show you your current location and to give you the ability to track your rides.");

    this.locationPermission$.pipe(untilDestroyed(this)).subscribe(permission => {
      this.locationPermission = permission;
    });

    this.neighborhoodQuery.select().pipe(untilDestroyed(this)).subscribe(neighborhood => {
      if (this.mapView) {
        console.log('got neighborhood');
        this.drawNeighborhood(neighborhood);
      }
    });

    this.plannerQuery.select().pipe(distinctUntilChanged(equal),untilDestroyed(this)).subscribe(pathState => {
      if (this.mapView) {
        this.drawPath(pathState);
      }
    });


    this.mapClick.asObservable().pipe(throttleTime(300), untilDestroyed(this)).subscribe(feature => {
      this.handleMapClick(feature);
    });












  }

  async drawNeighborhood(neighborhood: NeighborhoodState) {
    console.log('drawing neighborhood');

    await this.drawRoutes(neighborhood.routes, neighborhood.networkIds);
    await this.drawNodes(neighborhood.nodes, neighborhood.networkIds);
  }

  async removeRouteLines(layerPrefix: string) {
    await this.mapView.removeLayer(`${layerPrefix}-lines`);
  }

  async drawRouteLines(sourceId: string, layerPrefix: string, color = this.routeColor, width = this.routeStrokeWidth) {

    await this.mapView.addLayer({
      'id': `${layerPrefix}-lines`,
      'type': 'line',
      'source': sourceId,
      "minzoom": this.minZoomLevel,
      'paint': {
        'line-color': color,
        'line-width': width
      },
      'filter': ['==', '$type', 'LineString']
    });
  }


  async drawRoutes(routeCollections: FeatureCollection[], networkIds: number[]) {
    console.log('drawing routes', routeCollections?.length, networkIds.length);

    for (let i = 0; i < routeCollections.length; i++) {
      const routeCollection = routeCollections[i];
      const networkId = networkIds[i];
      const sourceId = `routes-${networkId}`;

      await this.mapView.addSource(sourceId, {
        'type': 'geojson',
        'data': routeCollection,
      });

      await this.drawRouteLines(sourceId, sourceId);
    }
  }

  async removeNodeCircles(layerPrefix: string) {
    await this.mapView.removeLayer(`${layerPrefix}-circles`);
    await this.mapView.removeLayer(`${layerPrefix}-text`);
  }

  async addNodeSource(sourceId: string, collection: any) {
    await this.mapView.addSource(sourceId, {
      'type': 'geojson',
      'data': collection,
      'cluster': {
        'radius': this.nodeRadius,
        'maxZoom': this.maxClusterZoomLevel,
        'properties': {
          'id': [["coalesce", ["accumulated"], ["get", "id"]], ["get", "id"]],
          'number': [["coalesce", ["accumulated"], ["get", "number"]], ["get", "number"]],
          'connections': [["coalesce", ["accumulated"], ["get", "connections"]], ["get", "connections"]]
        }
      },
    });
  }

  async addRouteSource(sourceId: string, collection: any) {
    await this.mapView.addSource(sourceId, {
      'type': 'geojson',
      'data': collection
    });
  }

  async drawNodeCircles(sourceId: string, layerPrefix: string, color = this.nodeColor, radius = this.nodeRadius, strokeWidth = this.nodeStrokeWidth) {

    await this.mapView.addLayer({
      'id': `${layerPrefix}-circles`,
      'type': 'circle',
      'source': sourceId,
      "minzoom": this.minZoomLevel,
      'paint': {
        'circle-radius': radius,
        'circle-color': '#ffffff',
        'circle-stroke-width': strokeWidth,
        'circle-stroke-color': color,
      },
      'filter': ['==', '$type', 'Point']

    }
    );

    await this.mapView.addLayer({
      'id': `${layerPrefix}-text`,
      'type': 'symbol',
      'source': sourceId,
      "minzoom": this.minZoomLevel,
      'layout': {
        'text-field': ['get', 'number'],
        'text-allow-overlap': true,
      },

      'paint': {
        'icon-color': color,
      },
      'filter': ['==', '$type', 'Point']
    }
    );

  }

  async drawNodes(nodeCollections: FeatureCollection[], networkIds: number[]) {
    console.log('drawing nodes', nodeCollections?.length, networkIds.length);

    for (let i = 0; i < nodeCollections.length; i++) {
      const nodeCollection = nodeCollections[i];
      const networkId = networkIds[i];

      const sourceId = `nodes-${networkId}`;
      await this.addNodeSource(sourceId, nodeCollection);

      this.mapView.onMapEvent('click', `${sourceId}-circles`, (event) => {
        this.onMapClick(event, networkId);
      });

      await this.drawNodeCircles(sourceId, sourceId);
    }
  }

  async drawPath(pathState: PlannerState) {

    try {
      await this.removeNodeCircles('path');
      await this.removeRouteLines('path');

      await this.mapView.removeSource('path-routes');
      await this.mapView.removeSource('path-nodes');
    } catch (e) { }

    if (!pathState.paths?.length) {
      return;
    }

    // TODO: draw start flag
    const nodes = pathState.paths.map(p => p.nodes).flat();
    const routes = pathState.paths.map(p => p.routes).flat();

    const routeCollection = {
      type: 'FeatureCollection',
      features: routes
    }

    console.log('draw routes', pathState.paths[0]?.routes?.length);

    await this.addRouteSource('path-routes', routeCollection);

    const nodeCollection = {
      type: 'FeatureCollection',
      features: nodes
    }

    await this.addNodeSource('path-nodes', nodeCollection);


    await this.drawRouteLines('path-routes', 'path', '#ff00ff', 10);
    await this.drawNodeCircles('path-nodes', 'path', '#ff00ff');
  }

  onDrawerButtonTap(): void {
    const sideDrawer = <RadSideDrawer>Application.getRootView()
    sideDrawer.showDrawer()
  }


  async onMapReady($event) {
    this.mapView = $event;

  }

  async onCameraChanged($event): Promise<void> {
    let viewport = await this.mapView.getViewport();
    if (viewport.zoomLevel < this.minZoomLevel) {
      return;
    }

    this.neighborhoodService.setViewport(viewport);
  }

  onMapClick($event: Feature[], networkId: number): void {
    const feature = $event[0];

    if (feature.geometry.type !== 'Point') {
      return;
    }

    this.mapClick.next(feature);
  }

  handleMapClick(feature: Feature) {
    this.plannerService.addDestination(feature);
  }

  goBack(){}

  undoLastDestination() {
    this.plannerService.removeLastDestination();
  }

}




