import * as Plotly from 'plotly.js';
import { Datacenter, ScheduledTask } from '../simulation';
var plotEl = document.getElementById('plotly')! as any;
// layout.shapes.push();
var layout = {
  margin: { t: 0 },
  xaxis: { fixedrange: true },
  yaxis: { fixedrange: true },
  showlegend: false,
  // hovermode: 'closest'
  //shapes??
  shapes: []
};

var shapeTaskIds: number[] = []; //shapeIndex -> taskId


var config = { responsive: true, staticPlot: false, displayModeBar: false };

var plot = Plotly.newPlot(plotEl, [{
  x: [1, 2, 3, 4, 5],
  y: [1, 2, 4, 8, 16]
}], layout, config);




function addRect(x: number, y: number, w: number, h: number, color: string, isInProgress: boolean, taskId: number) {
  let dashType = isInProgress ? 'dot' : 'solid';
  layout.shapes.push(
    {
      type: 'rect',
      // x-reference is assigned to the x-values
      // xref: 'x',
      // // y-reference is assigned to the plot paper [0,1]
      // yref: 'paper',
      x0: x,
      y0: y,
      x1: x + w,
      y1: y + h,
      fillcolor: color,
      opacity: 0.2,
      dash: dashType
      //   line: {
      //     color: 'rgb(55, 128, 191)',
      //     width: 3
      //     //dash: 'dot'
      //   }

    });
  shapeTaskIds.push(taskId);
}


//move up maybe?
plotEl.on('plotly_click', function (data: any) {
  // do something;
  clickedAtTime(data.points[0].x);
});
function clickedAtTime(timeSelected: number) {
  console.log("clicked at time ", timeSelected);
  //call other stuff
}

//mouse click down in general
plotEl.onclick = function (e: any) {
  if (e) {
    var rect = e.target.getBoundingClientRect();
    var x = e.clientX - rect.left; //x position within the element.
    var y = e.clientY - rect.top;  //y position within the element.
    console.log("Left? : " + x + " ; Top? : " + y + ".");
    //find in which task the click happened

  }
};

function plotDatacenter(dc: Datacenter, time: number) {
  layout.shapes = [];
  shapeTaskIds = [];
  for (let i = 0; i < dc.tasks.length; i++) {
    addRect(dc.tasks[i].startTime, 0, dc.tasks[i].duration, dc.tasks[i].workload, '#ff0000', dc.tasks[i].isInProgress(time), dc.tasks[i].id);
  }
}


// Plotly.addFrames(TESTER, [{
//   x: [x, x + width, x + width, x, x],
//   y: [y, y, y + height, y + height, y],
//   fill: 'toself',
//   fillcolor: color,
//   type: 'scatter',
//   mode: 'lines',
//   line: {
//     width: 1
//   }
// }]);
// }

const testDatacenter = new Datacenter(0, "Test", [0, 0], 50, 1000, 1, []);
testDatacenter.tasks = [new ScheduledTask(1, 100, -1, 4), new ScheduledTask(40, 0, -1, 0)];
plotDatacenter(testDatacenter, 4);

  // Plotly.addTraces(TESTER, [{
  //   x: [0, 0, 1, 1],
  //   y: [0, 1, 1, 0],
  //   type: 'rect',
  //   fillcolor: 'rgba(0,0,0,0)',
  //   line: {
  //     color: 'rgba(0,0,0,0)',
  //     width: 0
  //   }
  // }]);

