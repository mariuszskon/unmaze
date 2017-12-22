/* unmaze canvas user interface
   Copyright 2017 Mariusz Skoneczko
   Licensed under the MIT license
*/

let tile_size = 20;

const UI_MODE = {
    WATCHING: 0,
    EDITING: 1
};

const TYPE2COLOR = {};
TYPE2COLOR[MAZE.FREE] = "white";
TYPE2COLOR[MAZE.WALL] = "black";
TYPE2COLOR[MAZE.END] = "green";
TYPE2COLOR[MAZE.TRAIL] = "orange";

const CURSOR_COLOR = "gray";

const ROBOT_COLOR = "red";

let ui_maze, ui_mode, ui_maze_solver;

let cursor_pos = {x: null, y: null};
let last_cursor_pos = {x: null, y: null};

let hold_state = null;

let canvas = document.getElementById("unmaze-canvas");

let ctx = canvas.getContext("2d");

let control_panel = document.getElementById("control-panel");

let status_span = document.getElementById("status-span");
let solve_animate_button = document.getElementById("solve-animate");
let quick_solve_button = document.getElementById("quick-solve");
let step_button = document.getElementById("step-button");
let robot_reset_button = document.getElementById("robot-reset-button");
let save_button = document.getElementById("save-button");
let load_button = document.getElementById("load-button");
let resetup_canvas_button = document.getElementById("resetup-canvas");
let full_reset_button = document.getElementById("full-reset-button");
let toggle_control_panel_button = document.getElementById("toggle-control-panel");

let buttons_to_disable = [solve_animate_button, quick_solve_button, step_button, robot_reset_button, save_button, load_button, full_reset_button];

let speed_slider = document.getElementById("speed-slider");

let maze_width_input = document.getElementById("maze-width");
let maze_height_input = document.getElementById("maze-height");
let tile_size_input = document.getElementById("tile-size");

let wait_time = 100;

const SPEED2WAITTIME = [
    1000,
    500,
    100,
    50,
    17
];

let maze_width = 25;

let maze_height = 25;

function canvas_setup() {
    canvas.width = maze_width * tile_size;
    canvas.height = maze_height * tile_size;
}

function solver_setup() {
    ui_maze_solver = new MazeSolver(ui_maze);
}

function maze_setup() {
    ui_maze = new Maze(maze_width, maze_height);

    ui_maze.setStart(0, 0);
    ui_maze.setEnd(maze_width - 1, maze_height - 1);
    ui_maze.robotToStart();

    solver_setup();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < maze_width; i++) {
        for (let j = 0; j < maze_height; j++) {
            ctx.fillStyle = TYPE2COLOR[ui_maze.maze[i][j]];
            ctx.fillRect(i * tile_size, j * tile_size, tile_size, tile_size);
        }
    }

    ctx.fillStyle = ROBOT_COLOR;
    ctx.fillRect(ui_maze.robot.x * tile_size, ui_maze.robot.y * tile_size, tile_size, tile_size);

    if (cursor_pos.x !== null && cursor_pos.y !== null) {
        ctx.strokeStyle = CURSOR_COLOR;
        ctx.strokeRect(cursor_pos.x * tile_size, cursor_pos.y * tile_size, tile_size, tile_size);
    }
}

function set_cursor_pos(e) {
    last_cursor_pos.x = cursor_pos.x;
    last_cursor_pos.y = cursor_pos.y;
    let rect = canvas.getBoundingClientRect();
    cursor_pos.x = Math.floor((e.clientX - rect.left) / tile_size);
    cursor_pos.y = Math.floor((e.clientY - rect.top) / tile_size);
}

function new_tile_hovered() {
    return cursor_pos.x !== last_cursor_pos.x || cursor_pos.y !== last_cursor_pos.y;
}

function should_update_tile() {
    return hold_state !== null &&
        [MAZE.FREE, MAZE.WALL].indexOf(ui_maze.maze[cursor_pos.x][cursor_pos.y]) > -1 &&
        ui_maze.maze[cursor_pos.x][cursor_pos.y] !== hold_state;
}

function move_mouse(e) {
    set_cursor_pos(e);
    if (new_tile_hovered()) {
        change_tile();
        render();
    }
}

function change_tile() {
    if (should_update_tile()) {
            ui_maze.maze[cursor_pos.x][cursor_pos.y] = hold_state;
    }
}

function hold_on(e) {
    set_cursor_pos(e);
    if (ui_maze.maze[cursor_pos.x][cursor_pos.y] === MAZE.FREE) {
        hold_state = MAZE.WALL;
    } else {
        hold_state = MAZE.FREE;
    }
    change_tile();
    render();
}

function hold_off(e) {
    hold_state = null;
}

function no_cursor() {
    cursor_pos = {x: null, y: null};
    render();
}

function editing_mode() {
    ui_mode = UI_MODE.EDITING;
    for (let i = 0; i < buttons_to_disable.length; i++) {
        buttons_to_disable[i].disabled = false;
    }
    canvas.addEventListener("mousemove", move_mouse);
    canvas.addEventListener("mousedown", hold_on);
    canvas.addEventListener("mouseup", hold_off);
    canvas.addEventListener("mouseout", no_cursor);
}

function watching_mode() {
    ui_mode = UI_MODE.WATCHING;
    for (let i = 0; i < buttons_to_disable.length; i++) {
        buttons_to_disable[i].disabled = true;
    }
    canvas.removeEventListener("mousemove", move_mouse);
    canvas.removeEventListener("mousedown", hold_on);
    canvas.removeEventListener("mouseup", hold_off);
    canvas.removeEventListener("mouseout", no_cursor);
}

const SOLVE_STATUS2TEXT = {};
SOLVE_STATUS2TEXT[null] = "None";
SOLVE_STATUS2TEXT[SOLVE_STATUS.EXPLORING] = "Exploring...";
SOLVE_STATUS2TEXT[SOLVE_STATUS.SOLVED] = "Solved!";
SOLVE_STATUS2TEXT[SOLVE_STATUS.FAILED] = "No solution!";
SOLVE_STATUS2TEXT[SOLVE_STATUS.RETRACING] = "Retracing...";

let last_status = null;

function ui_status_update(status) {
    if (status !== last_status) {
        status_span.innerHTML = SOLVE_STATUS2TEXT[status];
        last_status = status;
    }
}

function update_dimensions() {
    maze_width = parseInt(maze_width_input.value);
    maze_height = parseInt(maze_height_input.value);
    tile_size = parseInt(tile_size_input.value);
}

function full_reset() {
    update_dimensions();
    canvas_setup();
    maze_setup();
    editing_mode();
    ui_status_update(null);
    render();
}

function robot_reset() {
    ui_status_update(null);
    ui_maze.resetRobot();
    solver_setup(); // clear any solution/junction memory
    render();
}

function ui_step() {
    ui_maze_solver.step();
    render();
    ui_status_update(ui_maze_solver.status);
}

function solve_animate_continue() {
    if (!ui_maze_solver.done()) {
        ui_step();
        setTimeout(solve_animate_continue, wait_time);
    } else {
        editing_mode();
    }
}

function solve_animate() {
    watching_mode();
    solve_animate_continue();
}

function quick_solve() {
    watching_mode(); // just in case
    while (!ui_maze_solver.done()) {
        ui_maze_solver.step();
    }
    ui_status_update(ui_maze_solver.status);
    render();
    editing_mode();
}

function save_to_url() {
    robot_reset();
    window.location.hash = "#" + ui_maze.save();
}

function load_from_url() {
    robot_reset();
    ui_maze.load(window.location.hash.slice(1));
    maze_width_input.value = ui_maze.maze.length;
    maze_height_input.value = ui_maze.maze[0].length;
    update_dimensions();
    canvas_setup();
    render();
}

function resetup_canvas() {
    tile_size = parseInt(tile_size_input.value);
    canvas_setup();
    render();
}

function update_speed() {
    wait_time = SPEED2WAITTIME[parseInt(speed_slider.value)];
    console.log(wait_time);
}

function toggle_control_panel() {
    if (control_panel.style.display === "none") {
        control_panel.style.display = "inline";
    } else {
        control_panel.style.display = "none";
    }
}

full_reset_button.addEventListener("click", full_reset);
robot_reset_button.addEventListener("click", robot_reset);
step_button.addEventListener("click", ui_step);
solve_animate_button.addEventListener("click", solve_animate);
quick_solve_button.addEventListener("click", quick_solve);
save_button.addEventListener("click", save_to_url);
load_button.addEventListener("click", load_from_url);
resetup_canvas_button.addEventListener("click", resetup_canvas);
toggle_control_panel_button.addEventListener("click", toggle_control_panel);

speed_slider.addEventListener("input", update_speed);

full_reset();
