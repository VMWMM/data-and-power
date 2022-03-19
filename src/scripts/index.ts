// Scripts
import { SimulationManager } from "./simulation";
import { UIManager } from "./ui/ui";

var simulationManager = new SimulationManager();
simulationManager.initialize();
simulationManager.updateUI();

var uiManager = new UIManager(simulationManager);
