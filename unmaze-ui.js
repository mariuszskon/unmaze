/* unmaze canvas user interface
   Copyright 2017 Mariusz Skoneczko
   Licensed under the MIT license
*/

const TILE_SIZE = 20;

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

let canvas, ctx, ui_maze, ui_mode;

let cursor_pos = {x: null, y: null};

canvas = document.getElementById("unmaze-canvas");

ctx = canvas.getContext("2d");

const MAZE_WIDTH = canvas.width / TILE_SIZE;

const MAZE_HEIGHT = canvas.height / TILE_SIZE;

function maze_setup() {
    ui_maze = new Maze(MAZE_WIDTH, MAZE_HEIGHT);

    ui_maze.setStart(0, 0);
    ui_maze.setEnd(MAZE_WIDTH - 1, MAZE_HEIGHT - 1);
    ui_maze.robotToStart();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < MAZE_WIDTH; i++) {
        for (let j = 0; j < MAZE_HEIGHT; j++) {
            ctx.fillStyle = TYPE2COLOR[ui_maze.maze[i][j].type];
            ctx.fillRect(i * TILE_SIZE, j * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }

    ctx.fillStyle = ROBOT_COLOR;
    ctx.fillRect(ui_maze.robot.x * TILE_SIZE, ui_maze.robot.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

    if (cursor_pos.x !== null && cursor_pos.y !== null) {
        ctx.strokeStyle = CURSOR_COLOR;
        ctx.strokeRect(cursor_pos.x * TILE_SIZE, cursor_pos.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
}

function set_cursor_pos(e) {
    let rect = canvas.getBoundingClientRect();
    cursor_pos.x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
    cursor_pos.y = Math.floor((e.clientY - rect.top) / TILE_SIZE);
}

function move_mouse(e) {
    set_cursor_pos(e);
    render();
}

function toggle_tile(e) {
    set_cursor_pos(e);
    if (ui_maze.maze[cursor_pos.x][cursor_pos.y].type === MAZE.FREE) {
        ui_maze.maze[cursor_pos.x][cursor_pos.y].type = MAZE.WALL;
    } else if (ui_maze.maze[cursor_pos.x][cursor_pos.y].type === MAZE.WALL) {
        ui_maze.maze[cursor_pos.x][cursor_pos.y].type = MAZE.FREE;
    }
    render();
}

function no_cursor() {
    cursor_pos = {x: null, y: null};
    render();
}

function editing_mode() {
    ui_mode = UI_MODE.EDITING;
    canvas.addEventListener("mousemove", move_mouse);
    canvas.addEventListener("click", toggle_tile);
    canvas.addEventListener("mouseout", no_cursor);
}

function watching_mode() {
    ui_mode = UI_MODE.WATCHING;
    canvas.removeEventListener("mousemove", move_mouse);
    canvas.removeEventListener("click", toggle_tile);
    canvas.removeEventListener("mouseout", no_cursor);
}

function full_reset() {
    maze_setup();
    render();
}

document.getElementById("reset-button").addEventListener("click", full_reset);

maze_setup();
editing_mode();
render();

