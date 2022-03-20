class SimulationManager {
  datacenters!: Datacenter[];
  powersources!: Powersource[];
  tasks!: Task[];
  currentTime!: number;
  coalFactor!: number;
  points!: number;

  constructor() {}
  initialize() {
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
    this.datacenters = [
      new Datacenter(
        0,
        "Berlin",
        [52, 13],
        10,
        100,
        1,
        [1, 5],
        [this.powersources[2], this.powersources[0]]
      ),
      new Datacenter(
        1,
        "Paris",
        [48.8, 2.3],
        30,
        200,
        2,
        [1, 3],
        [this.powersources[3]]
      ),
      new Datacenter(
        2,
        "Ireland",
        [53.3, -6.6],
        5,
        50,
        1.5,
        [5, 3],
        [this.powersources[4]]
      ),
    ];
    this.tasks = [
      new DeadlineTask(1, "AI-Training", 30, 5, 0, 10),
      new ContinuousTask(0, "OpenHPI-Website", 20, 20, 1),
    ];
    this.tasks[0].assignTask(this.datacenters[0]);
    this.tasks[1].assignTask(this.datacenters[0]);
    this.currentTime = 0;
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
    console.log("Time: " + this.currentTime);
    this.datacenters.forEach((dc) => {
      console.log(
        "Datacenter: " + dc.name + ", Workload: " + dc.getCurrentWorkload()
      );
      dc.tasks.forEach((t) => {
        console.log(" Task: " + t.name);
      });
    });
  }

  //not yet used since we dont update any of the visuals based on the logic
  updateUI() {
    //draw things
  }

  calculateCoalUsage(): number[] {
    var coalUsage: number[] = [];
    for (var i: number = 0; i < this.datacenters.length; i++) {
      var d: Datacenter = this.datacenters[i];
      var workNeeded: number = d.getCurrentWorkload();
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
        //p.makeNewForecasts();
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
    var points: number = 0;
    for (var i: number = 0; i < this.datacenters.length; i++) {
      var d: Datacenter = this.datacenters[i];
      points -= coalUsed[i] * this.coalFactor;
      for (var j: number = 0; j < d.tasks.length; j++) {
        var t = d.tasks[j];
        if (t instanceof ContinuousTask) {
          points += (1 - 2 * t.delay) * t.workLoad;
        } else {
          var finished: boolean = false;
          if (this.currentTime >= t.deadline) {
            if (t.startTime + t.duration <= t.deadline) {
              finished = true;
            }
            points += this.removeTask(d.tasks[j], finished);
          } else {
            if (this.currentTime - t.duration > t.startTime) {
              finished = true;
              points += this.removeTask(d.tasks[j], finished);
            }
          }
        }
      }
    }
    return points;
  }

  //check for each task whether they are now active or already over
  //TODO: check if task was fulfilled or stopped by deadline (could be done earlier)
  updateTasks(atTime: number) {
    this.tasks.forEach((t) => {
      if (t instanceof DeadlineTask) {
        if (t.startTime <= atTime) {
          if (t.startTime + t.duration <= atTime) {
            this.points += this.removeTask(t, true);
          } else
            t.active = true;
        }
      }
    });
  }

  //remove task from global and data center list
  removeTask(t: Task, finished: boolean) {
    var points = t.workLoad;
    this.tasks.splice(this.tasks.indexOf(t), 1);
    t.datacenter.tasks.splice(t.datacenter.tasks.indexOf(t), 1);
    if (finished) {
      return points;
    } else {
      return -points;
    }
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

  //sum workload of all active tasks for datacenter
  getCurrentWorkload(): number {
    let sum = 0;
    this.tasks.forEach(t => {
      if(t.active)
        sum += t.workLoad;
    })
    return sum * this.workloadToPowerFac;
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
  name: string;
  position: [number, number];
  powerType: PowersourceType;
  powerHistory: number[];
  lastForecastDiff: number;
  // estPowerAtTime: powerAtTimeFunction = (time: number) => 0;
  // estPowerOverTime: number[] = [];
  constructor(
    name: string,
    position: [number, number],
    powerType: PowersourceType
    //estPowerOverTime: number[],
  ) {
    this.name = name;
    this.position = position;
    this.powerType = powerType;
    this.powerHistory = [];
    this.lastForecastDiff = 0;
    //this.estPowerOverTime = [];
  }

  makeNewForecast(): void {}
}

class Task {
  id: number;
  name: string;
  workLoad: number;
  active: boolean;
  datacenter!: Datacenter;
  constructor(id: number, name: string, workLoad: number, active: boolean) {
    this.id = id;
    this.name = name;
    this.workLoad = workLoad;
    this.active = active;
  }

  assignTask(dc: Datacenter) {
    dc.tasks.push(this);
    this.datacenter = dc;
  }
}

class DeadlineTask extends Task {
  duration: number;
  startTime: number;
  deadline: number;
  constructor(
    id: number,
    name: string,
    workLoad: number,
    duration: number,
    startTime: number,
    deadline: number
  ) {
    super(id, name, workLoad, false);
    this.startTime = startTime;
    this.duration = duration;
    this.deadline = deadline;
  }

  getEndTime(): number {
    return this.startTime + this.duration;
  }
}

class ContinuousTask extends Task {
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
    super(id, name, workLoad, true);
    this.mean = mean;
    this.variance = variance;
    this.delay = 0;
  }
}

function randn_bm() {
  var u = 0,
    v = 0;
  while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export { SimulationManager, Datacenter, Powersource, PowersourceType };
