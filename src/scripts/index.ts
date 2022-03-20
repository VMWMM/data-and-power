//test graph plot
const dcV = require("../scripts/ui/DatacenterView.ts");
// Scripts
import { SimulationManager } from "./simulation";
import { UIManager } from "./ui/ui";

var simulationManager = new SimulationManager();
simulationManager.initialize();
simulationManager.updateUI();

var uiManager = new UIManager(simulationManager);

