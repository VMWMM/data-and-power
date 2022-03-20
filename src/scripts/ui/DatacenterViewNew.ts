import * as Plotly from 'plotly.js';
import { Datacenter, DeadlineTask } from '../simulation';
var plotEl = document.getElementById('plotly')! as any;
// layout.shapes.push();
var layout = {
  margin: { t: 0 },
  xaxis: { fixedrange: true },
  yaxis: { fixedrange: true },
  showlegend: false,
  // hovermode: 'closest'
  //shapes??
  shapes: [] as any
};

var shapeTaskIds: number[] = []; //shapeIndex -> taskId


var config = { responsive: true, staticPlot: false, displayModeBar: false };

var plot = Plotly.newPlot(plotEl, [{
  x: [1, 2, 3, 4, 5],
  y: [1, 2, 4, 8, 16]
}], layout, config);



function addRect(x: number, y: number, w: number, h: number, color: string, isInProgress: boolean, taskId: number): void {
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
    if (dc.tasks[i] instanceof DeadlineTask) {
      var task = dc.tasks[i] as DeadlineTask;
      addRect(task.startTime, 0, task.duration, task.workLoad, '#ff0000', task.active, task.id);
    } else {
      addRect(0, 0, 24, dc.tasks[i].workLoad, '#ff0000', dc.tasks[i].active, dc.tasks[i].id);
    }
  }
}

export { plotDatacenter };

