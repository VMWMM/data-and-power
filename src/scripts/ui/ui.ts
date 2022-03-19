//const map = require("./map.ts")

import { MapManager, MockDataCenter, MockPowerSource, PowerSourceTypes } from "./map";

class UIManager {
  mapManager: MapManager;
  controlPanel: ControlPanel;
  constructor() {
    this.mapManager = new MapManager();
    this.controlPanel = new ControlPanel();
    this.mapManager.onDataCenterPressed = ((dataCenter: MockDataCenter) => this.onDataCenterPressed(dataCenter))
    this.mapManager.onPowerSourcePressed = ((powerSource: MockPowerSource) => this.onPowerSourcePressed(powerSource))
  }
  onDataCenterPressed(dataCenter: MockDataCenter) {
    this.controlPanel.headline.innerHTML = dataCenter.name;
    this.controlPanel.desc.innerHTML = `A data center.`;
  }
  onPowerSourcePressed(powerSource: MockPowerSource) {
    this.controlPanel.headline.innerHTML = powerSource.name;
    this.controlPanel.desc.innerHTML = `A source of ${this.getDescriptionForPowerSource(powerSource)} power.`;
  }

  getDescriptionForPowerSource(powerSource: MockPowerSource) {
    switch (powerSource.type) {
      case PowerSourceTypes.HYDRO: {
        return "hydroelectric"
      }
      case PowerSourceTypes.SUN: {
        return "solar"
      }
      case PowerSourceTypes.WIND: {
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
