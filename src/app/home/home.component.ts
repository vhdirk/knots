import { Observable } from 'rxjs'
import { Component, OnInit } from '@angular/core'
import { Application} from '@nativescript/core';
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

  public locationPermission$!: Observable<boolean>;
  public locationPermission: boolean = false;

  constructor(public events: EventsService,
    public settingsService: SettingsService,
    public permissionsService: PermissionsService,
    public neighborhoodQuery: NeighborhoodQuery,
    public neighborhoodService: NeighborhoodService) {
  }

  ngOnInit(): void {
    // Init your component properties here.
    console.log("home: onInit");


    this.locationPermission$ = this.permissionsService.requestPermission(PERMISSIONS.LOCATION, "We use this permission to show you your current location and to give you the ability to track your rides.");

    this.locationPermission$.pipe(untilDestroyed(this)).subscribe(permission => {
      this.locationPermission = permission;
    });

     this.neighborhoodQuery.select().pipe(untilDestroyed(this)).subscribe(neighborhood => {
      if (this.mapView) {
        this.drawNeighborhood(neighborhood);
      }
    });
  }

  async drawNeighborhood(neighborhood: NeighborhoodState) {
    await this.drawRoutes(neighborhood.routes, neighborhood.networkIds);
    await this.drawNodes(neighborhood.nodes, neighborhood.networkIds);
  }

  async drawRoutes(routeCollections: FeatureCollection[], networkIds: number[]) {
    for (let i = 0; i < routeCollections.length; i++) {
      const routeCollection = routeCollections[i];
      const networkId = networkIds[i];
      const sourceId = `routes-${networkId}`;

      await this.mapView.addSource(sourceId, {
        'type': 'geojson',
        'data': routeCollection,
      });

      await this.mapView.addLayer({
        'id': `${sourceId}-lines`,
        'type': 'line',
        'source': sourceId,
        "minzoom": this.minZoomLevel,
        'paint': {
          'line-color': this.routeColor
        },
        // 'filter': ['==', '$type', 'LineString']
      });

    }
  }

  async drawNodes(nodeCollections: FeatureCollection[], networkIds: number[]) {

    for (let i = 0; i < nodeCollections.length; i++) {
      const nodeCollection = nodeCollections[i];
      const networkId = networkIds[i];

      const sourceId = `nodes-${networkId}`;
      await this.mapView.addSource(sourceId, {
        'type': 'geojson',
        'data': nodeCollection,
        'cluster': {
          'radius': this.nodeRadius,
          'maxZoom': this.maxClusterZoomLevel,
          'properties': {
            'number': [["coalesce", ["accumulated"], ["get", "number"]], ["get", "number"]],
            'connections': [["coalesce", ["accumulated"], ["get", "connections"]], ["get", "connections"]]
          }
        },
      });


      await this.mapView.addLayer({
        'id': `${sourceId}-circles`,
        'type': 'circle',
        'source': sourceId,
        "minzoom": this.minZoomLevel,
        'paint': {
          'circle-radius': this.nodeRadius,
          'circle-color': '#ffffff',
          'circle-stroke-width': this.nodeStrokeWidth,
          'circle-stroke-color': this.nodeColor,
        },
      }
      );
      this.mapView.onMapEvent('click', `${sourceId}-circles`, (event) => {
        this.onMapClick(event, networkId);
      } );


      await this.mapView.addLayer({
        'id': `${sourceId}-text`,
        'type': 'symbol',
        'source': sourceId,
        "minzoom": this.minZoomLevel,
        'layout': {
          'text-field': ['get', 'number'],
          'text-allow-overlap': true,
        },

        'paint': {
          'icon-color': this.nodeColor,
        }
      }
      );
    }
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
    console.log("onMapClick:", $event, networkId);
    const feature = $event[0];

    if (feature.geometry.type !== 'Point') {
      return;
    }

    this.mapView.addMarkers([
      {
        id: feature.properties.number,
        title: feature.properties.number,
        lat: feature.geometry.coordinates[1],
        lng: feature.geometry.coordinates[0],
      }
    ]);


  }

  goBack() {

  }

  openSettings() {

  }

}




