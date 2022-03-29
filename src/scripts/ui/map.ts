import terminator from '@joergdietrich/leaflet.terminator';
import * as Leaf from 'leaflet';
import { antPath } from 'leaflet-ant-path';
import { DataCenter, PowerSource, PowerSourceType } from '../simulation';
import { ajax } from '../utils';

export class MapManager {
  map: Leaf.Map;
  dataCenters!: DataCenter[];
  powerSources!: PowerSource[];
  dataCenterIcons!: DataCenterIcon[];
  powerSourceIcons!: PowerSourceIcon[];
  onDataCenterPressed: Function | undefined;
  onPowerSourcePressed: Function | undefined;
  terminator: any;
  constructor() {
    this.map = new Leaf.Map('map', {
      center: new Leaf.LatLng(49.023, 13.271),
      zoom: 5,
    });
    const tileServerUrl = 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png';
    Leaf.tileLayer(tileServerUrl, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    this.initTerminator();
  }

  setComponents(dataCenters: DataCenter[], powerSources: PowerSource[]) {
    this.dataCenters = dataCenters;
    this.powerSources = powerSources;
  }

  initIcons() {
    this.dataCenterIcons = this.dataCenters.map(
      (dc) => new DataCenterIcon(dc, this)
    );
    this.powerSourceIcons = this.powerSources.map(
      (es) => new PowerSourceIcon(es, this)
    );
    this.dataCenterIcons.forEach((dci) => dci.connect());
  }

  initTerminator() {
    this.terminator = terminator({ resolution: 100 }).addTo(this.map);
  }

  getIconForDataCenter(dataCenter: DataCenter) {
    return this.dataCenterIcons.find((dci) => dci.modelObject == dataCenter);
  }

  getIconForPowerSource(powerSource: PowerSource) {
    return this.powerSourceIcons.find((psi) => psi.modelObject == powerSource);
  }

  getIconForNode(node: PowerSource | DataCenter) {
    return [...this.powerSourceIcons, ...this.dataCenterIcons].find(
      (n) => n.modelObject == node
    );
  }
}

abstract class MapIcon {
  marker: Leaf.Marker | undefined;
  overlay: Leaf.SVGOverlay | undefined;
  modelObject!: DataCenter | PowerSource;
  isSelected: boolean;

  mapManager: MapManager;
  constructor(mapManager: MapManager) {
    this.mapManager = mapManager;
    this.isSelected = false;
  }

  get iconPath(): string {
    return 'subclass responsibility!';
  }

  async getIcon(): Promise<string> {
    return await ajax(this.iconPath);
  }

  get width() {
    return 2;
  }

  get height() {
    return 2;
  }

  get bounds() {
    let position = new Leaf.LatLng(
      this.modelObject.position[0],
      this.modelObject.position[1]
    );
    let corner1 = new Leaf.LatLng(
      position.lat - this.width / 2,
      position.lng - this.height / 2
    );
    let corner2 = new Leaf.LatLng(
      position.lat + this.width / 2,
      position.lng + this.height / 2
    );
    return new Leaf.LatLngBounds(corner1, corner2);
  }

  async createOverlay() {
    let svgElement = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg'
    );
    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgElement.setAttribute('viewBox', '0 0 250 220');

    let icon = await this.getIcon();
    svgElement.innerHTML = icon;
    let svgElementBounds = this.bounds;
    this.overlay = new Leaf.SVGOverlay(svgElement, svgElementBounds, {
      interactive: true,
    });

    this.overlay.setZIndex(10);
    this.addNodeSpecificLines();
    this.overlay.addTo(this.mapManager.map);
    this.createEventListeners();
  }

  addNodeSpecificLines() { }

  createEventListeners() {
    throw new Error('Subclass responsibility');
  }

  generateMarker() {
    if (this.marker) {
      this.marker.remove();
    }

    this.marker = new Leaf.Marker(this.modelObject.position, {
      opacity: 0.001,
    });
    this.marker.bindTooltip(this.modelObject.name, {
      permanent: true,
      className: 'data-center-tooltip',
    });
    this.marker.addTo(this.mapManager.map);
  }
}

export class DataCenterIcon extends MapIcon {
  lines: Leaf.Polyline[] | undefined;
  powerLines!: Leaf.Polyline[];
  declare modelObject: DataCenter;
  constructor(dataCenter: DataCenter, mapManager: MapManager) {
    super(mapManager);
    this.modelObject = dataCenter;
    this.createOverlay();
  }

  createEventListeners() {
    if (this.overlay) {
      this.overlay.on('click', (event) => {
        Leaf.DomEvent.stopPropagation(event);
        if (this.mapManager.onDataCenterPressed)
          this.mapManager.onDataCenterPressed(this.modelObject);
      });
      this.overlay.on('mouseover', () => {
        this.drawConnectionsWithPowerSources();
      });
      this.overlay.on('mouseout', () => {
        if (!this.isSelected) {
          this.removeConnectionsWithPowerSources();
        }
      });
    }
  }

  get iconPath(): string {
    return 'assets/dataCenter.svg';
  }

  connect() {
    this.lines = this.mapManager.dataCenterIcons
      .filter((dcI) => dcI != this)
      .map((dataCenterIcon) =>
        antPath(
          [dataCenterIcon.modelObject.position, this.modelObject.position],
          { color: '#0088AA' }
        )
      );
    this.lines.forEach((line) => line.addTo(this.mapManager.map));
  }

  addNodeSpecificLines(): void {
    this.powerLines = this.modelObject.powerSources.map((powerSource) =>
      antPath([powerSource.position, this.modelObject.position], {
        color: '#00AA00',
        interactive: false,
        opacity: 0,
      })
    );
    this.powerLines.forEach((line) => line.addTo(this.mapManager.map));
  }

  drawConnectionsWithPowerSources() {
    this.powerLines.forEach((powerLine) => powerLine.setStyle({ opacity: 1 }));
  }

  removeConnectionsWithPowerSources() {
    this.powerLines.forEach((powerLine) => powerLine.setStyle({ opacity: 0 }));
  }
}

export class PowerSourceIcon extends MapIcon {
  declare modelObject: PowerSource;
  constructor(powerSource: PowerSource, mapManager: MapManager) {
    super(mapManager);
    this.modelObject = powerSource;
    this.createOverlay();
  }

  createEventListeners(): void {
    if (this.overlay) {
      this.overlay.on('click', (event) => {
        Leaf.DomEvent.stopPropagation(event);
        if (this.mapManager.onPowerSourcePressed)
          this.mapManager.onPowerSourcePressed(this.modelObject);
      });
    }
  }

  get iconPath(): string {
    switch (this.modelObject.powerType) {
      case PowerSourceType.SUN: {
        return 'assets/sun.svg';
      }
      case PowerSourceType.WIND: {
        return 'assets/wind.svg';
      }
      case PowerSourceType.HYDRO: {
        return 'assets/hydro.svg';
      }
      case PowerSourceType.THERMAL: {
        return 'assets/hydro.svg';
      }
      case PowerSourceType.OTHER: {
        return 'assets/hydro.svg';
      }
    }
  }
}
