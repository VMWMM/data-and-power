//const map = require("./map.ts")

import { MapManager, MockDataCenter, MockEnergySource } from "./map";

class UIManager {
  mapManager: MapManager;
  controlPanel: ControlPanel;
  constructor() {
    this.mapManager = new MapManager();
    this.controlPanel = new ControlPanel();
    this.mapManager.onDataCenterPressed = ((dataCenter: MockDataCenter) => this.onDataCenterPressed(dataCenter))
    this.mapManager.onEnergySourcePressed = ((energySource: MockEnergySource) => this.onDataCenterPressed(energySource))
  }
  onDataCenterPressed(dataCenter: MockDataCenter) {
    this.controlPanel.headline.innerHTML = dataCenter.name;
  }
  onEnergySourcePressed(energySource: MockEnergySource) {
    this.controlPanel.headline.innerHTML = energySource.name;
  }
}

class ControlPanel {
  headline: HTMLElement;
  constructor() {
    this.headline = document.getElementById("control-bar-headline")!;

  }
}

new UIManager();
