// Window size
const width = 800;
const height = 600;
const fps = 0;
const startBeta = 1;

// Polynomial coefficients
let betas = [startBeta, startBeta];
let startOrder = 2;
let learningRate = 1e-3;
let drawStep = 0.001;

// Datapoints
let data = [];
let sys = null;

function CoordinateSystem() {
    const w2 = width / 2;
    const h2 = height / 2;

    let xtick = null;
    let ytick = null;
    let xtickNum = 20;
    let ytickNum = 20;

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
        let guess = poly(x);
        let error = y - guess;

        for (let j = 0; j < betas.length; j++) {
            betas[j] += Math.pow(x, j) * error * learningRate;  // Derivative of polynomial
        }

        /*
        betas[0] += (1) * error * learningRate;       // D(b0 + b1*x + b2*x*x, b0) = 1
        betas[1] += (x) * error * learningRate;       // D(b0 + b1*x + b2*x*x, b1) = x
        betas[2] += (x * x) * error * learningRate;   // D(b0 + b1*x + b2*x*x, b2) = x^2
        */
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
    for (let i = 0; i < n; i++) {
        betas.push(startBeta);
    }
}

function setup() {
    frameRate(fps);
    createCanvas(width + 1, height + 1);
    sys = CoordinateSystem();
    orderSlider = createSlider(1, 10, startOrder);
    lrInput = createInput();
    lrInput.value(learningRate);

    setInterval(() => {
        let n = orderSlider.value();
        if (betas.length !== n) {
            resetBetas(n);
        }
        let lr = parseFloat(lrInput.value());
        if (lr !== learningRate) {
            learningRate = lr;
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