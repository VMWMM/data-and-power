//test graph plot
// const dcV = require("../scripts/ui/DatacenterView.ts");
// Scripts
import { SimulationManager } from "./simulation";
import { UIManager } from "./ui/ui";

var simulationManager = new SimulationManager();
simulationManager.initialize();

var uiManager = new UIManager(simulationManager);


//for(let i=0; i<10; i++){
//  simulationManager.simulateTurn();
//}

