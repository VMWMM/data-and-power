//const map = require("./map.ts")

import { EnergySourceTypes, MapManager, MockDataCenter, MockEnergySource } from "./map";

class UIManager {
  mapManager: MapManager;
  controlPanel: ControlPanel;
  constructor() {
    this.mapManager = new MapManager();
    this.controlPanel = new ControlPanel();
    this.mapManager.onDataCenterPressed = ((dataCenter: MockDataCenter) => this.onDataCenterPressed(dataCenter))
    this.mapManager.onEnergySourcePressed = ((energySource: MockEnergySource) => this.onEnergySourcePressed(energySource))
  }
  onDataCenterPressed(dataCenter: MockDataCenter) {
    this.controlPanel.headline.innerHTML = dataCenter.name;
    this.controlPanel.desc.innerHTML = `A data center.`;
  }
  onEnergySourcePressed(energySource: MockEnergySource) {
    this.controlPanel.headline.innerHTML = energySource.name;
    this.controlPanel.desc.innerHTML = `A source of ${this.getDescriptionForPowerSource(energySource)} power.`;
  }

  getDescriptionForPowerSource(powerSource: MockEnergySource) {
    switch (powerSource.type) {
      case EnergySourceTypes.HYDRO: {
        return "hydroelectric"
      }
      case EnergySourceTypes.SUN: {
        return "solar"
      }
      case EnergySourceTypes.WIND: {
        return "wind"
      }
    }
  }
}

class ControlPanel {
  headline: HTMLElement;
  desc: HTMLElement;
  constructor() {
    this.headline = document.getElementById("control-bar-headline")!;
    this.desc = document.getElementById("control-bar-desc")!;
  }
}

new UIManager();
