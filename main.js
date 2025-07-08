const GRAPH_SETTINGS = {
    xMin: -15,
    xMax: 15,
    yMin: -15,
    yMax: 15,
    lineColor: 'rgb(79, 17, 223)',
    tension: 0.1,
};

let useRadians = true;

let xValues = [];
let yValues = [];
let chart = null;

function sanitizeInput(rawEquation) {
    let result = rawEquation;

    const trigFunctions = ['sin', 'cos', 'tan'];

    for (let func of trigFunctions) {
        const regex = new RegExp(`${func}\\(([^)]+)\\)`, 'g');
        result = result.replace(regex, (match, innerExpr) => {
            if (useRadians) {
                return `Math.${func}(${innerExpr})`;
            } else {
                return `Math.${func}((${innerExpr}) * Math.PI / 180)`;
            }
        });
    }

    result = result.replace(/sqrt/g, 'Math.sqrt');
    result = result.replace(/log/g, 'Math.log');
    result = result.replace(/\^/g, '**');
    result = result.replace(/-x\*\*(\d+)/g, '-(x**$1)');
    return result;
}

document.addEventListener('DOMContentLoaded', function () {
    const eq1 = document.getElementById('eq1');
    const graph = document.getElementById('graph-canvas').getContext('2d');

    function handleEventChange(event) {
        xValues = [];
        yValues = [];

        const rawEquation = event.target.value;
        const parsedEquation = sanitizeInput(rawEquation);
        console.log("Parsed:", parsedEquation);

        let x = GRAPH_SETTINGS.xMin;
        while (x <= GRAPH_SETTINGS.xMax) {
            try {
                const y = eval(`(() => { let x = ${x}; return ${parsedEquation}; })()`);
                if (!isFinite(y) || Math.abs(y) > 1e5) {
                    yValues.push(null);
                } else {
                    yValues.push(y);
                }
            } catch (error) {
                yValues.push(null);
            }
            xValues.push(x);
            x += .5;
        }

        if (chart) {
            chart.destroy();
        }

        chart = new Chart(graph, {
            type: 'line',
            data: {
                labels: xValues,
                datasets: [{
                    label: rawEquation,
                    data: yValues,
                    borderColor: GRAPH_SETTINGS.lineColor,
                    borderWidth: 2,
                    tension: GRAPH_SETTINGS.tension,
                    fill: false
                }]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: 'x'
                        },
                        ticks: {
                            stepSize: 1
                        }
                        // min/max can be removed for full panning freedom
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'y'
                        },
                        // min/max can be removed for auto zoom scaling
                    }
                },
                plugins: {
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'xy',
                            modifierKey: 'ctrl'
                        },
                        zoom: {
                            wheel: {
                                enabled: true
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'xy'
                        },
                        limits: {
                            y: { minRange: 0.1 },
                            x: { minRange: 0.1 }
                        }
                    }
                }
            }
        });
    }
    eq1.addEventListener('input', handleEventChange);
});