// Window size
const width = 600;
const height = 600;
const fps = 0;
const startBeta = 0.1;

// 0: Stochastic gradient descent, 1: Momentum, 2: Nesterov
let descentStrategy = 2;

// Polynomial coefficients
let betas = [];
let startOrder = 1;
let learningRate = 1e-3;
let drawStep = 0.01;

// For momentum
let friction = 0.9;
let velocities = [];

// Datapoints
let data = [];
let sys = null;

function CoordinateSystem() {
    const w2 = width / 2;
    const h2 = height / 2;

    let xtick = null;
    let ytick = null;
    let xtickNum = 10;
    let ytickNum = 10;

    function drawGrid() {
        // Cross
        line(w2, 0, w2, height);
        line(0, h2, width, h2);

        // Ticks X
        xtick = width / xtickNum;
        for (let i = 0; i < xtickNum; i++) {
            line(i * xtick, h2 - 5, i * xtick, h2 + 5);
        }

        // Ticks Y
        ytick = width / ytickNum;
        for (let i = 0; i < ytickNum; i++) {
            line(w2 - 5, i * ytick, w2 + 5, i * ytick);
        }
    }

    function toPixel(x, y) {
        return {
            x: x * xtick + w2,
            y: height - y * ytick - h2
        };
    }

    function toCoordinate(x, y) {
        return {
            x: (x - w2) / xtick,
            y: (height - y - h2) / ytick
        };
    }

    return {
        toCoordinate: toCoordinate,
        toPixel: toPixel,
        point: (x, y) => {
            let c = toPixel(x, y);
            point(c.x, c.y);
        },
        drawGrid: drawGrid,
        xtickNum: xtickNum
    };
}

function mousePressed() {
    if (mouseX < width && mouseY < height) {
        data.push(sys.toCoordinate(mouseX, mouseY));
    }
}

function poly(x) {
    let sum = 0;
    let p = 1;
    for (let i = 0; i < betas.length; i++) {
        sum += betas[i] * p;
        p *= x;
    }
    return sum;
}

function gradientDescent() {
    for (let i = 0; i < data.length; i++) {
        let x = data[i].x;
        let y = data[i].y;
        let error = -1;

        // pow(x, j) will be the gradient for the j'th coefficient:
        // D(b0 + b1*x + b2*x*x, b0) = 1, D(b0 + b1*x + b2*x*x, b1) = x, D(b0 + b1*x + b2*x*x, b2) = x^2

        for (let j = 0; j < betas.length; j++) {
            error = y - poly(x);

            switch (descentStrategy) {
                case 1:
                    // Momentum
                    velocities[j] = velocities[j] * friction + learningRate * pow(x, j) * error;
                    betas[j] += velocities[j];
                    break;
                case 2:
                    // Nesterov
                    let xAhead = x + friction * velocities[j];
                    let dxAhead = pow(xAhead, j);
                    velocities[j] = velocities[j] * friction + learningRate * dxAhead * error;
                    betas[j] += velocities[j];
                    break;
                default:
                    // Vanilla stochastic gradient descent
                    betas[j] += pow(x, j) * error * learningRate;
                    break;
            }
        }
    }
    drawPoints();
    drawPoly();
}

function drawPoints() {
    for (let i = 0; i < data.length; i++) {
        let c = sys.toPixel(data[i].x, data[i].y);
        ellipse(c.x, c.y, 10, 10);
    }
}

function drawPoly() {
    const min = -sys.xtickNum / 2;
    const max = sys.xtickNum / 2;

    /*for (let x = 0; x < width; x++) {
        let c = sys.toCoordinate(x, 0);
        sys.point(c.x, poly(c.x));
    }*/

    for (let x = min; x < max; x += drawStep) {
        sys.point(x, poly(x));
    }
}

function resetBetas(n) {
    betas = [];
    velocities = [];
    for (let i = 0; i < n; i++) {
        betas.push(startBeta);
        velocities.push(0);
    }
}

function setup() {
    frameRate(fps);
    let canvas = createCanvas(width + 1, height + 1);
    canvas.parent('sketch-holder');
    
    sys = CoordinateSystem();

    // Buttons and inputs
    orderInput = createInput();
    orderInput.value(startOrder);
    lrInput = createInput();
    lrInput.value(learningRate);
    gradDescInput = createInput();
    gradDescInput.value(descentStrategy);
    frictionInput = createInput();
    frictionInput.value(friction);

    resetBetas(startOrder);
    setInterval(() => {
        let n = parseInt(orderInput.value());
        if (betas.length !== n) {
            resetBetas(n);
        }
        let lr = parseFloat(lrInput.value());
        if (lr !== learningRate) {
            learningRate = lr;
            resetBetas(n);
        }
        let st = parseInt(gradDescInput.value());
        if (st !== descentStrategy) {
            descentStrategy = st;
            resetBetas(n);
        }
        let mu = parseFloat(frictionInput.value());
        if (mu !== friction) {
            friction = mu;
            resetBetas(n);
        }
    }, 1000);
}

function draw() {
    background(153);

    var fps = frameRate();
    fill(255);
    stroke(0);
    text("FPS: " + fps.toFixed(2), 10, height - 10);

    sys.drawGrid();
    if (data.length > 1) {
        gradientDescent();
    } else {
        drawPoints();
    }
    let order = betas.length - 1;
    text("Order: " + order, 10, 10);
    text("Learning rate: " + learningRate, 10, 30);
    text("Betas: " + JSON.stringify(betas.map(e => Math.floor(e *= 1000) / 1000)), 10, 50);
}