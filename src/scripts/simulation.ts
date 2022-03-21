import * as sc from '@hebcal/solar-calc';
import * as data from '../simulationData.json';

let startDate: Date | null = null;
class SimulationManager {
  datacenters!: Datacenter[];
  powersources!: Powersource[];
  tasks!: Task[];
  currentTime!: number;
  coalFactor!: number;
  points!: number;
  simulationStartDate!: Date;
  nextTaskID: number = 0;

  constructor() {
    this.points = 0;
    this.currentTime = 0;
  }
  randomDeadLineTask(): DeadlineTask {
    let duration = this.currentTime + Math.random() * 48 + 1;
    let d = new DeadlineTask(
      this.nextTaskID,
      deadlineTaskNames[
        Math.round(Math.random() * (deadlineTaskNames.length - 1))
      ],
      Math.round(Math.random() * 100 + 1),
      duration,
      duration * (Math.random() + 1.5)
    );
    return d;
  }
  initialize() {
    /*
    this.powersources = [
      new Powersource(
        "German Bay Offshore Wind Park",
        [54.6, 7.2],
        PowersourceType.WIND
      ),
      new Powersource("Alpine Dams", [47.3, 10.1], PowersourceType.HYDRO),
      new Powersource(
        "Norwegian Hydropower",
        [61.9, 7.1],
        PowersourceType.HYDRO
      ),
      new Powersource("French Solar", [45.3, 1.6], PowersourceType.SUN),
      new Powersource(
        "Walney Offshore Wind Farm",
        [53.9, -3.57],
        PowersourceType.WIND
      ),
    ];
    */
    /*
    this.datacenters = [
      new Datacenter(
        0,
        "Berlin",
        [52, 13],
        10,
        100,
        1,
        [0, 1, 5],
        [this.powersources[2], this.powersources[0]]
      ),
      new Datacenter(
        1,
        "Paris",
        [48.8, 2.3],
        30,
        200,
        2,
        [1, 0, 3],
        [this.powersources[3]]
      ),
      new Datacenter(
        2,
        "Ireland",
        [53.3, -6.6],
        5,
        50,
        1.5,
        [5, 3, 0],
        [this.powersources[4]]
      ),
    ];
    */
    /*
       this.tasks = [
      new DeadlineTask(1, "AI-Training", 30, 5, 10),
      new ContinuousTask(0, "OpenHPI-Website", 20, 20, 1),
    ];
    */
    this.powersources = [];
    data.powersources.forEach((ps) => {
      this.powersources.push(
        new Powersource(ps.id, ps.name, ps.position, PowersourceType[ps.type])
      );
    });
    this.datacenters = [];
    data.datacenters.forEach((dc) => {
      this.datacenters.push(
        new Datacenter(
          dc.id,
          dc.name,
          dc.position,
          dc.baseconsumption,
          dc.maxWorkLoad,
          dc.workLoadToPowerFac,
          dc.distToDataCenters,
          []
        )
      );
    });
    data.datacenters.forEach((dc) => {
      let sources = [];
      dc.powersources.forEach((ps) => {
        sources.push(this.powersources[ps]);
      });
      this.datacenters[dc.id].powersources = sources;
    });
    this.tasks = [];
    data.tasks.forEach((t) => {
      if (t.type == 'CONTINUOUS') {
        this.tasks.push(
          new ContinuousTask(t.id, t.name, t.workload, t.mean, t.variance)
        );
      } else if (t.type == 'DEADLINE') {
        this.tasks.push(
          new DeadlineTask(t.id, t.name, t.workload, t.duration, t.deadline)
        );
      }
    });
    console.log(this.datacenters);
    //this.tasks[0].assignTask(this.datacenters[0]);
    //this.tasks[1].assignTask(this.datacenters[0]);
    this.currentTime = 0;
    this.simulationStartDate = new Date(Date.now());
    this.simulationStartDate.setHours(12);
    this.simulationStartDate.setMinutes(0);
    startDate = this.simulationStartDate;
    this.coalFactor = 10;
  }

  simulateTurn() {
    this.updateTasks(this.currentTime);
    this.calculateWorkLoad();
    //update Simulation Logic
    //simulate tasks
    //simulate power
    let coalUsage: number[] = this.calculateCoalUsage();
    //simulate task work
    //calculate energy cost
    //update UI
    //calculate points (task completed / time??)
    this.points += this.calculatePoints(coalUsage);
    //wait
    //generate new incoming tasks
    //generate new func
    this.currentTime++;
    this.printState();
  }

  //helper function as we dont have dashboards yet
  printState() {
    console.log('Time: ' + this.currentTime);
    this.datacenters.forEach((dc) => {
      console.log(
        'Datacenter: ' +
          dc.name +
          ', Workload: ' +
          dc.getCurrentWorkload(this.currentTime)
      );
      dc.tasks.forEach((t) => {
        console.log(' Task: ' + t.name);
      });
    });
    console.log('Score: ' + this.points);
  }

  //not yet used since we dont update any of the visuals based on the logic
  updateUI() {
    //draw things
  }

  calculateCoalUsage(): number[] {
    var coalUsage: number[] = [];
    for (var i: number = 0; i < this.datacenters.length; i++) {
      coalUsage[i] = 0;
      var d: Datacenter = this.datacenters[i];
      var workNeeded: number = d.getCurrentWorkload(this.currentTime);
      let energyAvailable: number = 0;
      for (var j: number = 0; j < d.powersources.length; j++) {
        var p: Powersource = d.powersources[j];
        let variance: number = 1;
        switch (p.powerType) {
          case PowersourceType.WIND:
            variance = 3;
            break;
          case PowersourceType.THERMAL:
            variance = 0.2;
            break;
          case PowersourceType.SUN:
            variance = 5;
            break;
          case PowersourceType.HYDRO:
            variance = 0.4;
            break;
          default:
            break;
        }
        let energyVal = Math.max(
          0,
          randn_bm() * variance +
            p.powerHistory[this.currentTime] +
            p.lastForecastDiff
        );
        p.lastForecastDiff = energyVal - p.powerHistory[this.currentTime];
        p.powerHistory[this.currentTime] = energyVal;
        energyAvailable += energyVal;
        p.makeNewForecast(this.currentTime);
      }
      if (workNeeded > 0) {
        energyAvailable -= d.baseConsumption;
        if (workNeeded > d.maxWorkload) {
          this.points = this.points - d.maxWorkload;
        }
        energyAvailable -= workNeeded * d.workloadToPowerFac;
        coalUsage[i] = Math.max(energyAvailable * -2, 0);
      } else {
        coalUsage[i] = 0;
      }
    }
    return coalUsage;
  }

  //sets a semi-random workload attribute for all Continuous Tasks
  calculateWorkLoad() {
    for (var i: number = 0; i < this.datacenters.length; i++) {
      var d: Datacenter = this.datacenters[i];
      for (var j: number = 0; j < d.tasks.length; j++) {
        var t = d.tasks[j];
        if (t instanceof ContinuousTask) {
          t.workLoad = Math.max(randn_bm() * t.variance + t.mean, 0);
        }
      }
    }
  }

  calculatePoints(coalUsed: number[]): number {
    var addPoints: number = 0;
    for (var i: number = 0; i < this.datacenters.length; i++) {
      var d: Datacenter = this.datacenters[i];
      addPoints -= coalUsed[i] * this.coalFactor;
      for (var j: number = 0; j < d.tasks.length; j++) {
        var t = d.tasks[j];
        if (t instanceof ContinuousTask) {
          addPoints += (1 - 2 * t.delay) * t.workLoad;
        } else if (t instanceof DeadlineTask) {
          var finished: boolean = false;
          if (this.currentTime >= t.deadline) {
            if (t.startTime + t.duration <= t.deadline) {
              finished = true;
            }
            addPoints += this.removeTask(d.tasks[j], finished);
          } else {
            if (this.currentTime - t.duration > t.startTime) {
              finished = true;
              addPoints += this.removeTask(d.tasks[j], finished);
            }
          }
        }
      }
    }
    console.log('additional points:' + addPoints);
    return addPoints;
  }

  //check for each task whether they are now active or already over
  //TODO: check if task was fulfilled or stopped by deadline (could be done earlier)
  updateTasks(atTime: number) {
    this.tasks.forEach((t) => {
      if (t instanceof DeadlineTask) {
        if (t.startTime <= atTime) {
          if (t.startTime + t.duration <= atTime) {
            this.points += this.removeTask(t, true);
          } else t.active = true;
        } else if (t.deadline < atTime) {
          this.points += this.removeTask(t, true);
        }
      } else if (t instanceof ContinuousTask) {
        if (t.scheduled) t.active = true;
      }
    });
  }

  //remove task from global and data center list
  removeTask(t: Task, finished: boolean) {
    var points = t.workLoad;
    this.tasks.splice(this.tasks.indexOf(t), 1);
    if (t.scheduled)
      t.datacenter.tasks.splice(t.datacenter.tasks.indexOf(t), 1);
    if (finished) {
      return points;
    } else {
      return -points;
    }
  }

  getDateFromSimTime(): Date {
    const date = new Date(this.simulationStartDate.toString());
    date.setHours(date.getHours() + this.currentTime);
    return date;
  }
}

class Datacenter {
  id: number;
  name: string;
  position: [number, number];
  baseConsumption: number;
  maxWorkload: number;
  workloadToPowerFac: number; //efficiency
  distToDatacenters: number[];

  powersources: Powersource[];
  tasks: Task[];

  //additional
  //add effectiency
  constructor(
    id: number,
    name: string,
    position: [number, number],
    baseConsumption: number,
    maxWorkload: number,
    workloadToPowerFac: number,
    distToDatacenters: number[],
    powersources: Powersource[]
  ) {
    this.id = id;
    this.name = name;
    this.position = position;
    this.maxWorkload = maxWorkload;
    this.baseConsumption = baseConsumption;
    this.workloadToPowerFac = workloadToPowerFac;
    this.distToDatacenters = distToDatacenters;
    this.powersources = powersources;
    this.tasks = [];
  }
  getCurrentPowerReq(atTimeStep: number): number {
    return (
      this.getCurrentWorkload(atTimeStep) * this.workloadToPowerFac +
      this.baseConsumption
    );
    this.tasks = [];
  }

  //sum workload of all active tasks for datacenter
  getCurrentWorkload(currentTime: number): number {
    let sum = 0;

    this.tasks.forEach((t) => {
      if (t.active) {
        //TODO WENN zwischen Timesteps deadline task fertig, nicht die volle workload
        let factor = 1;
        if (
          t instanceof DeadlineTask &&
          t.startTime + t.duration <= currentTime
        ) {
          factor = 1 - (currentTime - t.startTime + t.duration);
        }
        sum += t.workLoad * factor;
      }
    });
    return sum;
  }
}

enum PowersourceType {
  SUN,
  WIND,
  HYDRO,
  THERMAL,
  OTHER,
}

type powerAtTimeFunction = (time: number) => number;

class Powersource {
  id: number;
  name: string;
  position: [number, number];
  powerType: PowersourceType;
  powerHistory: number[];
  lastForecastDiff: number;
  // estPowerAtTime: powerAtTimeFunction = (time: number) => 0;
  // estPowerOverTime: number[] = [];
  constructor(
    id: number,
    name: string,
    position: [number, number],
    powerType: PowersourceType

    //estPowerOverTime: number[],
  ) {
    this.id = id;
    this.name = name;
    this.position = position;
    this.powerType = powerType;
    this.powerHistory = [];
    this.lastForecastDiff = 0;
    switch (powerType) {
      case PowersourceType.WIND:
        this.powerHistory[0] = windDefault[0];
        break;
      case PowersourceType.THERMAL:
        this.powerHistory[0] = thermalDefault[0];
        break;
      case PowersourceType.SUN:
        this.powerHistory[0] = getSunValue(0, this.position);
        break;
      case PowersourceType.HYDRO:
        this.powerHistory[0] = waterDefault[0];
        break;
      default:
        break;
    }
    //this.estPowerOverTime = [];
  }

  makeNewForecast(time: number): void {
    for (let i = 0; i < 24; i++) {
      let estimatedDiff = 0;
      switch (this.powerType) {
        case PowersourceType.WIND:
          estimatedDiff =
            windDefault[(i + 1 + time) % 24] - windDefault[(i + time) % 24];
          break;
        case PowersourceType.THERMAL:
          estimatedDiff =
            thermalDefault[(i + 1 + time) % 24] -
            thermalDefault[(i + time) % 24];
          break;
        case PowersourceType.SUN:
          estimatedDiff =
            getSunValue(i + 1 + time, this.position) -
            getSunValue(i + time, this.position);
          break;
        case PowersourceType.HYDRO:
          estimatedDiff =
            waterDefault[(i + 1 + time) % 24] - waterDefault[(i + time) % 24];
          break;
        default:
          break;
      }
      this.powerHistory[time + i + 1] =
        estimatedDiff +
        this.powerHistory[time + i] +
        ((0.5 * (24 - i)) / 24) * this.lastForecastDiff;
    }
  }
}

export class Task {
  id: number;
  name: string;
  workLoad: number;
  active: boolean;
  scheduled: boolean;
  datacenter!: Datacenter;
  constructor(id: number, name: string, workLoad: number, active: boolean) {
    this.id = id;
    this.name = name;
    this.workLoad = workLoad;
    this.active = active;
    this.scheduled = false;
  }

  assignTask(dc: Datacenter, currentTime: number): boolean {
    let dist = 0;
    if ((this.scheduled, this.active)) {
      console.log(this.datacenter);
      dist = this.datacenter.distToDatacenters[dc.id];
    }
    let currentLoad = dc.getCurrentPowerReq(currentTime);
    if (currentLoad + this.workLoad * dc.workloadToPowerFac <= dc.maxWorkload) {
      dc.tasks.push(this);
      this.datacenter = dc;
      this.scheduled = true;
      let delay = 2 + 0.1 * dist * dist;
      if (this instanceof ContinuousTask) {
        this.delay = delay;
      } else if (this instanceof DeadlineTask) {
        this.startTime += delay;
      }

      return true;
    } else {
      return false;
    }
  }
}

export class DeadlineTask extends Task {
  duration: number;
  startTime!: number;
  deadline: number;
  constructor(
    id: number,
    name: string,
    workLoad: number,
    duration: number,
    deadline: number
  ) {
    super(id, name, workLoad, false);
    this.duration = duration;
    this.deadline = deadline;
  }

  assignDeadlineTask(dc: Datacenter, atTime: number): boolean {
    /*let currentLoad = dc.getCurrentWorkload(currentTime);
    if(currentLoad + this.workLoad * dc.workloadToPowerFac <= dc.maxWorkload) {
      dc.tasks.push(this);
      console.log(dc.tasks)
      this.active = true;
      this.datacenter = dc;
      this.startTime = atTime;
      this.scheduled = true;
      return true;
    } else {
      return false;
    }*/

    if (super.assignTask(dc, atTime)) {
      this.startTime = atTime;
      if (atTime == this.startTime) this.active = true;
      return true;
    } else {
      return false;
    }
  }

  getEndTime(): number {
    return this.startTime + this.duration;
  }

  isInProgress(atTime: number): boolean {
    return this.startTime <= atTime && this.getEndTime() >= atTime;
  }
}

export class ContinuousTask extends Task {
  mean: number;
  variance: number;
  delay: number;
  constructor(
    id: number,
    name: string,
    workLoad: number,
    mean: number,
    variance: number
  ) {
    super(id, name, workLoad, false);
    this.mean = mean;
    this.variance = variance;
    this.delay = 0;
  }

  assignContinuousTask(dc: Datacenter, currentTime: number): boolean {
    let currentLoad = dc.getCurrentWorkload(currentTime);
    if (currentLoad + this.workLoad * dc.workloadToPowerFac <= dc.maxWorkload) {
      dc.tasks.push(this);
      this.datacenter = dc;
      this.scheduled = true;
      return true;
    } else {
      return false;
    }
  }
}

function randn_bm() {
  var u = 0,
    v = 0;
  while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function getSunValue(time: number, position: [number, number]) {
  if (startDate) {
    let date = new Date(startDate.toISOString());
    date.setHours(date.getHours() + time);
    let solarCalculator = new sc.SolarCalc(date, position[0], position[1]);
    if (solarCalculator.sunrise.getTime() > date.getTime()) {
      // Before and after sunrise, there is no sun
      return 0;
    } else {
      // TODO: Add diminishing factors near night
      return [
        0.9, 0.8, 0.8, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.1, 0.1, 0.1,
        0.1, 0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8,
      ][time % 24];
    }
  }
  return 0;
}
const thermalDefault: number[] = [
  0.8, 0.8, 0.8, 0.9, 0.85, 0.92, 1, 0.98, 1.1, 1.07, 1.05, 1.1, 1.2, 1.15, 1.3,
  1.4, 1.34, 1.45, 1.5, 1.4, 1.2, 0.9, 0.75, 0.8,
];
const windDefault: number[] = [
  1.2, 1.3, 1.6, 2.0, 2.2, 1.9, 1.6, 1.4, 1.0, 0.6, 0.5, 0.3, 0.3, 0.6, 0.7,
  0.9, 1.0, 1.2, 1.3, 1.0, 0.7, 0.5, 0.3, 0.2,
];
const waterDefault: number[] = [
  1.25, 1.25, 1.25, 1.25, 1.25, 1.25, 1.25, 1.25, 1.25, 1.0, 1.0, 1.25, 1.25,
  1.5, 1.5, 1.25, 1.25, 1.25, 1.25, 1.25, 1.25, 1.25, 1.25, 1.25,
];
const deadlineTaskNames: string[] = [
  'genome calculation',
  'Pi digits calculation',
  'Stockfish',
  'AI Training',
];
export { SimulationManager, Datacenter, Powersource, PowersourceType };
