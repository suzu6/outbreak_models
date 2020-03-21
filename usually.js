function setup() {
    canvas_width = 600;
    canvas_height = 600;
  
    turn = 0;
    simulation_period = 1000;
    population = 200;
    spread_period = 400;
    stay_rate = 0.0;
    transfer_rate = 0.0;
    infect_rate = 1.0;
  
    set_first_patient = true;
    first_x = 300;
    first_y = 400;
  
  　healthy_speed = 1.7;
    sickness_speed = 1.7;
    no_symptom_rate = 1.0; 

    // seed = 'test';
    // randomSeed(seed);

    canvas = new Canvas();
    canvas.createCanvas();
    space = new Space(canvas);
    cluster = new Cluster(population, space);
    score = new Score(canvas);
    score.draw(cluster);
    graph = new Graph(canvas, score);
    graph.draw(cluster, simulation_period);
  
    halls = [];
    // conventionModel();
    // localModel();
}
function conventionModel(){
    
    let left = 225;
    let top = 325;
    let w = 150;
    let h = 150;
    halls.push(new Hall(200, 
                        transfer_rate, 
                        left, top, 
                        w, h));
}
function localModel(){
    let grid = 5;
    let w = space.w / grid;
    let h = space.h / grid;
  
    for(let i=0; i<grid; i++){
      for(let j=0; j<grid; j++){
        halls.push(new Hall(simulation_period+2, 
                            transfer_rate, 
                            space.left+w*i+10, 
                            space.top+h*j+10, 
                            w-20, h-20));
      }
    }
}

function draw() {
    turn++;
    if (turn > simulation_period) noLoop();

    space.drawSpace();
    for(let hall of halls){
      hall.draw(turn);
    }

    cluster.action();
    cluster.pushStats();

    score.draw(cluster);
    graph.draw(cluster, simulation_period);
}

class Canvas {
    constructor() {
        this.w = canvas_width;
        this.h = canvas_height;
        this.header_h = 170;
    }

    createCanvas() {
        createCanvas(this.w, this.h);
        background(255);
    }
}

class Score {
    constructor(canvas) {
        this.margin = 5;
        this.right = 120;
        this.left = this.margin;
        this.top = 0;
        this.bottom = canvas.header_h - this.margin;
        this.h = this.bottom - this.top;
        this.w = this.right - this.left;
        this.status = new Status(0);
    }

    draw(cluster) {
        fill(color(255));
        noStroke();
        rect(this.left - this.margin, this.top, this.w + 2 * this.margin, this.h);

        let quarter = (this.bottom - this.top) / 4;
        fill(color('#000000'));
        textSize(17);
        textStyle(NORMAL);
        textAlign(LEFT);
        text('人数', this.left, quarter * 1);

        textSize(15);
        textStyle(NORMAL);
        text('回復した人', this.left, quarter * 2);
        text('健康な人', this.left, quarter * 3);
        text('感染者', this.left, quarter * 4);

        textAlign(RIGHT);
        textStyle(BOLD);;
        fill(this.status.color(this.status.recovered));
        text(cluster.num_of_recovered.toString(), this.right, quarter * 2);
        fill(this.status.color(this.status.healty));
        text(cluster.num_of_healthy.toString(), this.right, quarter * 3);
        fill(this.status.color(this.status.sick));
        text(cluster.num_of_sick.toString(), this.right, quarter * 4);
    }
}

class Graph {
    constructor(canvas, score, sim_period) {
        this.right = canvas.w;
        this.left = score.right + 15;
        this.top = 0;
        this.bottom = canvas.header_h - 5;

        let quarter = (this.bottom - this.top) / 4;
        this.header_h = quarter;

        this.g_l = this.left;
        this.g_w = this.right - this.left;
        this.g_t = this.header_h + 5;
        this.g_h = this.bottom - this.g_t;
        this.sim_period = sim_period;
        this.status = new Status(0);
    }

    draw(cluster, sim_period) {
        this.drawHeader();
        this.drawGraph(cluster, sim_period);
    }

    drawHeader() {
        fill(color(255));
        noStroke();
        rect(this.left, this.top, this.g_w, this.header_h + 5);

        fill(color('#000000'));
        textSize(17);
        textStyle(NORMAL);
        textAlign(LEFT);
        text('時間の経過による変化', this.left, this.header_h);
    }

    drawGraph(cluster, sim_period) {
        let t = this.g_w / (sim_period + 1);
        let dh = this.g_h / cluster.population;

        // for pad scratches. グラフを明瞭にするための幅。
        let tw = max(t, 1);

        noStroke();
        let i = cluster.stats.length - 1;

        let h = cluster.stats[i][this.status.healthy];
        let s = cluster.stats[i][this.status.sick];
        let r = cluster.stats[i][this.status.recovered];

        fill(this.status.color(this.status.recovered));
        rect(this.g_l + t * i, this.g_t, tw, r * dh);
        fill(this.status.color(this.status.healty));
        rect(this.g_l + t * i, this.g_t + (r) * dh, tw, h * dh);
        fill(this.status.color(this.status.sick));
        rect(this.g_l + t * i, this.g_t + (r + h) * dh, tw, s * dh);
    }
}

class Space {
    constructor(canvas) {
        this.boder = 1;
        this.right = canvas.w;
        this.left = 0;
        this.top = canvas.header_h;
        this.bottom = canvas.h;
        this.w = this.right-this.left;
        this.h = this.bottom-this.top;
    }

    drawSpace() {
        noStroke();
        fill(255);
        rect(this.left, this.top - 5, this.right, this.bottom);
        fill(230);
        rect(this.left, this.top, this.right, this.bottom);
        fill(255);
        rect(this.left + this.boder,
            this.top + this.boder,
            this.right - this.boder * 2,
            this.bottom - this.top - this.boder * 2);
    }

    xColited(x) {
        return x < this.left || x >= this.right;
    }
    yColited(y) {
        return y < this.top || y >= this.bottom;
    }
}

class Hall {
    constructor(period, transfer_rate, left=200, top=250, width=200, height=200) {
        this.boder = 2;
        this.left = left;
        this.top = top;
        this.w = width;
        this.h = height;
        this.right = this.left + this.w;
        this.bottom = this.top + this.h;
      
        this.period = period;
        this.exist = true;
      
        this.transfer_rate = transfer_rate;
    }

    draw(turn) {
        this.open(turn);
        if(!this.exist) return;
        noStroke();
        fill(255 * this.transfer_rate);
        rect(this.left - this.boder,
            this.top - this.boder,
            this.w + this.boder * 2,
            this.h + this.boder * 2);
        fill(255);
        rect(this.left, this.top, this.w, this.h);
    }

    move(p){
      if(!this.exist) return false;
      let out = this.inHall(p.pre_x, p.pre_y) && !this.inHall(p.x, p.y);
      if(!out || random(0, 100)/100 > 1-this.transfer_rate) return false;
      
      if(p.x < this.left || p.x > this.right) p.v_x = -p.v_x;
      if(p.y < this.top || p.y > this.bottom) p.v_y = -p.v_y;
      p.move(); 
    }
  
    inHall(x, y){
      if(x < this.left) return false;
      if(x > this.right) return false;
      if(y < this.top) return false;
      if(y > this.bottom) return false;
      return true;
    }
  
    open(turn){
        if(this.period <= turn){
          this.exist = false;
        }
    }
}

class Cluster {
    constructor(population, space) {
        this.population = population;
        this.points = [];

        this.num_of_sick = 1;
        this.num_of_healthy = this.total - this.num_of_sick;
        this.num_of_recovered = 0;
        this.initPoints();

        this.stats = [];
        this.pushStats();
    }

    initPoints() {
        for (let i = 0; i < this.population; i++) {
            if (i < this.num_of_sick) {
                this.points[i] = new Point(space, new Status(1));
                continue;
            }
            if (i < this.num_of_sick+this.population*stay_rate) {
                this.points[i] = new Point(space, new Status(0),true);
                continue;
            }
            this.points[i] = new Point(space, new Status(0));
        }
    }

    pushStats() {
        let s = [0, 0, 0];
        for (let p of this.points) {
            s[p.status.condition]++;
        }
        this.stats.push(s);
        this.num_of_sick = s[1];
        this.num_of_healthy = s[0];
        this.num_of_recovered = s[2];
    }

    action() {
        for (let i = 0; i < this.points.length; i++) {
            let pi = this.points[i];
            pi.move();
            for(let hall of halls){
              hall.move(pi);
            }

            for (let j = i+1; j < this.points.length; j++) {
            // for (let j = 0; j < this.points.length; j++) {
                if (i == j) continue;
                let pj = this.points[j];
                if (pi.colitedPoint(pj)) {
                    pi.infect(pj);
                    pj.infect(pi);
                    for(let hall of halls){
                      hall.move(pi);
                    }
                }
            }
            pi.recover();
            pi.draw();
        }
    }
}

class Point {
    constructor(space, status, is_stay=false) {
        this.space = space;
        this.status = status;
        this.r = 5;
        this.x = random(this.space.left, this.space.right);
        this.y = random(this.space.top, this.space.bottom);
      
        if(set_first_patient && 
           this.status.condition == this.status.sick){
          this.x = first_x;
          this.y = first_y;
        }
        this.is_stay = is_stay;

        angleMode(RADIANS);
        this.direction = PI * random(-100, 100) / 100;
        this.velocity = healthy_speed;
        if(status.condition == status.sick){
          this.velocity = sickness_speed;
        }
        if(this.is_stay){
          this.velocity = 0;
        }
        this.v_x = this.velocity * cos(this.direction);
        this.v_y = this.velocity * sin(this.direction);
        this.pre_x = this.x;
        this.pre_y = this.y;
    }

    move() {
        this.pre_x = this.x;
        this.pre_y = this.y;
        this.x += this.v_x;
        this.y += this.v_y;
        this.colitedSpace();
    }

    colitedSpace() {
        if (this.space.xColited(this.x)) {
            this.v_x = -this.v_x;
            this.pre_x = this.x;
            this.x += this.v_x * this.r;
        }
        if (this.space.yColited(this.y)) {
            this.v_y = -this.v_y;
            this.pre_y = this.y;
            this.y += this.v_y * this.r;
        }
    }

    colitedPoint(p) {
        let distance = sqrt(pow(this.x - p.x, 2) + pow(this.y - p.y, 2));
        if (distance > this.r + p.r) return false;

        let alpha = PI * randomGaussian(-100, 100)/200;
        let at = atan2(this.x - p.x, this.y - p.y) - HALF_PI+alpha;
        this.v_x = this.velocity * cos(this.direction + at);
        this.v_y = this.velocity * sin(this.direction + at);
        this.move();

        at = at + HALF_PI;
        p.v_x = p.velocity * cos(p.direction + at);
        p.v_y = p.velocity * sin(p.direction + at);
        // p.move();

        return true;
    }
  
    infect(p){
      if(this.status.infect(p.status)){
        if(random(0, 100)/100 > no_symptom_rate)
          this.velocity = sickness_speed;
          if(this.is_stay){
            this.velocity = 0;
          }
      }
    }
  
    recover(p){
      if(this.status.recover()){
        this.velocity = healthy_speed;
        if(this.is_stay){
          this.velocity = 0;
        }
      }
    }

    draw() {
        noStroke();
        fill(this.status.color());
        circle(this.x, this.y, this.r * 2);
    }
}

class Status {
    constructor(condition) {
        this.condition = condition;

        this.healthy = 0;
        this.sick = 1;
        this.recovered = 2;

        this.turn = 0;
        this.period = spread_period;
    }

    check() {
        this.recover();
        return this.condition;
    }

    color(c = this.condition) {
        switch (c) {
            case this.healthy:
                return color('#AAC6CA');
            case this.sick:
                return color('#BB641D');
            case this.recovered:
                return color('#CB8AC0');
        }
        console.error('no condition');
        return color('#000000');
    }

    beSick() {
        this.condition = this.sick;
        return true;
    }

    recover() {
        if (this.condition != this.sick) return false;
        this.turn++;
        if (this.turn >= this.period) {
            this.condition = this.recovered;
            return true;
        }
        return false;
    }
    infect(status) {
        if (status.condition == this.sick &&
            this.condition == this.healthy &&
            random(0, 100)/100 < infect_rate) {
            return this.beSick();
        }
        return false;
    }
}