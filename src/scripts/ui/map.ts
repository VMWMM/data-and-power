import * as Leaf from 'leaflet';
import { Datacenter, Powersource, PowersourceType } from '../simulation';

export class MapManager {
  map: Leaf.Map;
  datacenters!: Datacenter[];
  powersources!: Powersource[];
  datacenterIcons!: DatacenterIcon[];
  powersourceIcons!: PowersourceIcon[];
  onDatacenterPressed: Function | undefined;
  onPowersourcePressed: Function | undefined;
  constructor() {
    this.map = new Leaf.Map('map', {
      center: new Leaf.LatLng(49.023, 13.271),
      zoom: 5,
    });
    const tileServerUrl = "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png";
    Leaf.tileLayer(tileServerUrl, {
      attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors"
    }).addTo(this.map);
  }

  setComponents(datacenters: Datacenter[], powersources: Powersource[]) {
    this.datacenters = datacenters;
    this.powersources = powersources;
  }

  initIcons() {
    this.datacenterIcons = this.datacenters.map(dc => new DatacenterIcon(dc, this));
    this.powersourceIcons = this.powersources.map(es => new PowersourceIcon(es, this));
    this.datacenterIcons.forEach(dci => dci.connect());
  }
}

abstract class MapIcon {

  marker: Leaf.Marker | undefined;
  overlay: Leaf.SVGOverlay | undefined;
  modelObject!: Datacenter | Powersource;

  mapManager: MapManager;
  constructor(mapManager: MapManager) {
    this.mapManager = mapManager;
  }

  get iconPath(): string {
    return "subclass responsibility!";
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
    let corner1 = new Leaf.LatLng(position.lat - this.width / 2, position.lng - this.height / 2);
    let corner2 = new Leaf.LatLng(position.lat + this.width / 2, position.lng + this.height / 2);
    return new Leaf.LatLngBounds(corner1, corner2);
  }

  async createOverlay() {
    let svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgElement.setAttribute("viewBox", "0 0 250 220");

    let icon = await this.getIcon();
    svgElement.innerHTML = icon;
    let svgElementBounds = this.bounds;
    this.overlay = new Leaf.SVGOverlay(svgElement, svgElementBounds, { interactive: true });

    this.overlay.setZIndex(10);
    this.addNodeSpecificLines();
    this.overlay.addTo(this.mapManager.map);
    this.createEventListeners();
  }

  addNodeSpecificLines() {

  }

  createEventListeners() {
    throw new Error("Subclass responsibility")
  }

  generateMarker() {
    if (this.marker) {
      this.marker.remove();
    }

    this.marker = new Leaf.Marker(this.modelObject.position, { opacity: 0.001 });
    this.marker.bindTooltip(this.modelObject.name, { permanent: true, className: "data-center-tooltip" });
    this.marker.addTo(this.mapManager.map);
  }
}

class DatacenterIcon extends MapIcon {
  lines: Leaf.Polyline[] | undefined;
  powerLines!: Leaf.Polyline[];
  declare modelObject: Datacenter;
  constructor(datacenter: Datacenter, mapManager: MapManager) {
    super(mapManager);
    this.modelObject = datacenter;
    this.createOverlay();
  }

  createEventListeners() {
    if (this.overlay) {
      this.overlay.on("click", event => { Leaf.DomEvent.stopPropagation(event); if (this.mapManager.onDatacenterPressed) this.mapManager.onDatacenterPressed(this.modelObject) });
      this.overlay.on("mouseover", () => this.drawConnectionsWithPowerSources());
      this.overlay.on("mouseout", () => this.removeConnectionsWithPowerSources());
    }
  }

  get iconPath(): string {
    return "/assets/datacenter.svg"
  }

  connect() {
    this.lines = this.mapManager.datacenterIcons
      .filter(dcI => dcI != this)
      .map(datacenterIcon =>
        new Leaf.Polyline([datacenterIcon.modelObject.position, this.modelObject.position], { color: "#0088AA" })
      );
    this.lines.forEach(line => line.addTo(this.mapManager.map));
  }

  addNodeSpecificLines(): void {
    this.powerLines = this.modelObject.powersources.map(powerSource => new Leaf.Polyline([powerSource.position, this.modelObject.position], { color: "#00AA00", interactive: false, opacity: 0 }));
    this.powerLines.forEach(line => line.addTo(this.mapManager.map));
  }

  drawConnectionsWithPowerSources() {
    this.powerLines.forEach(powerLine => powerLine.setStyle({ opacity: 1 }));
  }

  removeConnectionsWithPowerSources() {
    this.powerLines.forEach(powerLine => powerLine.setStyle({ opacity: 0 }));
  }
}

class PowersourceIcon extends MapIcon {
  declare modelObject: Powersource;
  constructor(powersource: Powersource, mapManager: MapManager) {
    super(mapManager);
    this.modelObject = powersource;
    this.createOverlay();
  }

  createEventListeners(): void {
    if (this.overlay) {
      this.overlay.on("click", event => {
        Leaf.DomEvent.stopPropagation(event);
        if (this.mapManager.onPowersourcePressed) this.mapManager.onPowersourcePressed(this.modelObject)
      })
    }
  }

  get iconPath(): string {
    var path: string = "";
    switch (this.modelObject.powerType) {
      case PowersourceType.SUN: {
        path = "/assets/sun.svg"
      }
      case PowersourceType.WIND: {
        path = "/assets/wind.svg"
      }
    }
    return path;
  }
}

async function ajax(path: string): Promise<string> {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(this.responseText);
    };
    xhr.onerror = reject;
    xhr.open("GET", path);
    xhr.send();
  });
}
