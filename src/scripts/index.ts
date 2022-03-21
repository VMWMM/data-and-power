import { SimulationManager } from './simulation';
import { UIManager } from './ui/ui';

let simulationManager = new SimulationManager();
simulationManager.initialize();

let uiManager = new UIManager(simulationManager);
