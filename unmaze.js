/* Main unmaze library
   Copyright 2017 Mariusz Skoneczko
   Licensed under the MIT license
*/

const MAZE = {
    FREE: 0,
    WALL: 1,
    END: 2,
    TRAIL: 3
};

class Maze {
    constructor(width, height) {
        if (width < 2 || height < 2) {
            throw new RangeError("Dimensions too small");
        }
        this.width = width;
        this.height = height;

        this.maze = new Array(width);
        // create 'matrix' maze where maze[x][y] such that x < width, y < height
        for (let i = 0; i < width; i++) {
            this.maze[i] = new Array(height);
        }
        this.allWall();
        this.start = {x: null, y: null};
        this.robot = {x: null, y: null};
    }

    allWall() {
        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                this.maze[i][j] = MAZE.WALL;
            }
        }
    }

    setStart(x, y) {
        this.start = {x: x, y: y};
    }

    setEnd(x, y) {
        this.maze[x][y] = MAZE.END;
    }

    robotToStart() {
        this.robot.x = this.start.x;
        this.robot.y = this.start.y;
    }

    resetRobot() {
        this.robotToStart();
        for (let i = 0; i < this.width; i++) {
            for (let j= 0; j < this.height; j++) {
                if (this.maze[i][j] === MAZE.TRAIL) {
                    this.maze[i][j] = MAZE.FREE;
                }
            }
        }
    }

    save() {
        return btoa(JSON.stringify({
            maze: this.maze,
            start: this.start
        }));
    }

    load(savedata) {
        let loaddata = JSON.parse(atob(savedata));
        this.maze = loaddata.maze;
        this.start = loaddata.start;
        this.robotToStart();
        this.width = this.maze.length;
        this.height = this.maze[0].length;
    }
}

const SOLVE_STATUS = {
    EXPLORING: 0,
    SOLVED: 1,
    FAILED: 2,
    RETRACING: 3
};

const DIRECTION = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
};

const INVERT_DIRECTION = {
    [DIRECTION.UP]: DIRECTION.DOWN,
    [DIRECTION.RIGHT]: DIRECTION.LEFT,
    [DIRECTION.DOWN]: DIRECTION.UP,
    [DIRECTION.LEFT]: DIRECTION.RIGHT
};

class MazeSolver {
    constructor(maze) {
        this.maze = maze;
        this.status = SOLVE_STATUS.EXPLORING;
        this.junction_memory = {};
        this.move_memory = [];
        this.last_direction = null;
        this.steps = 0;
    }

    adjacent() {
        let up, right, down, left;

        if (this.maze.robot.y === 0) {
            up = MAZE.WALL;
        } else {
            up = this.maze.maze[this.maze.robot.x][this.maze.robot.y - 1];
        }

        if (this.maze.robot.x === this.maze.width - 1) {
            right = MAZE.WALL;
        } else {
            right = this.maze.maze[this.maze.robot.x + 1][this.maze.robot.y];
        }

        if (this.maze.robot.y === this.maze.height - 1) {
            down = MAZE.WALL;
        } else {
            down = this.maze.maze[this.maze.robot.x][this.maze.robot.y + 1];
        }

        if (this.maze.robot.x === 0) {
            left = MAZE.WALL;
        } else {
            left = this.maze.maze[this.maze.robot.x - 1][this.maze.robot.y];
        }

        return {
            [DIRECTION.UP]: up,
            [DIRECTION.RIGHT]: right,
            [DIRECTION.DOWN]: down,
            [DIRECTION.LEFT]: left
        };
    }

    isSolved() {
        if (this.maze.maze[this.maze.robot.x][this.maze.robot.y] === MAZE.END) {
            return true;
        } else {
            return false;
        }
    }

    possibleNext(adjacent) {
        let possibilities = [];
        for (let key in adjacent) {
            if (adjacent[key] === MAZE.FREE || adjacent[key] === MAZE.END) {
                possibilities.push(parseInt(key));
            }
        }
        return possibilities;
    }

    isJunction(possibilities) {
        if (possibilities.length > 1) {
            return true;
        } else {
            return false;
        }
    }

    isDeadEnd(possibilities) {
        if (possibilities.length === 0) {
            return true;
        } else {
            return false;
        }
    }

    move(direction, log=true) {
        if (log) this.move_memory.push(direction);
        this.last_direction = direction;
        if (direction === DIRECTION.UP) {
            this.maze.robot.y -= 1;
        } else if (direction === DIRECTION.RIGHT) {
            this.maze.robot.x += 1;
        } else if (direction === DIRECTION.DOWN) {
            this.maze.robot.y += 1;
        } else if (direction === DIRECTION.LEFT) {
            this.maze.robot.x -= 1;
        }
    }

    explore(possibilities) {
        if (this.isJunction(possibilities)) {
            if (this.junction_memory[[this.maze.robot.x, this.maze.robot.y].toString()] === undefined) {
                // new junction!
                let direction = possibilities[0];
                this.junction_memory[[this.maze.robot.x, this.maze.robot.y].toString()] = [direction];
                // set down trail to avoid considering this a new junction if there is a loop
                this.maze.maze[this.maze.robot.x][this.maze.robot.y] = MAZE.TRAIL;
                this.move(direction);
            } else {
                // we already handled this junction before
                this.move(INVERT_DIRECTION[this.move_memory.pop()], false);
                this.maze.maze[this.maze.robot.x][this.maze.robot.y] = MAZE.FREE;
                this.status = SOLVE_STATUS.RETRACING;
            }
        } else if (this.isDeadEnd(possibilities)) {
            // move back to last position and THEN retrace: handles loops correctly
            this.move(INVERT_DIRECTION[this.move_memory.pop()], false);
            // remove trail
            this.maze.maze[this.maze.robot.x][this.maze.robot.y] = MAZE.FREE;
            this.status = SOLVE_STATUS.RETRACING;
        } else {
            // move to the next available space
            // but first, set down a trail tile (BEFORE moving)
            this.maze.maze[this.maze.robot.x][this.maze.robot.y] = MAZE.TRAIL;
            this.move(possibilities[0]);
        }
    }

    goBack() {
        if (this.maze.robot.x === this.maze.start.x && this.maze.robot.y === this.maze.start.y) {
            this.status = SOLVE_STATUS.FAILED;
        } else {
            let direction = INVERT_DIRECTION[this.move_memory.pop()];
            this.move(direction, false);
            // remove trail
            this.maze.maze[this.maze.robot.x][this.maze.robot.y] = MAZE.FREE;
        }
    }

    retrace(adjacent, possibilities) {
        if (this.isJunction(possibilities)) {
            // choose a direction we have not been in before, or continue retracing if there is none
            let junction_paths = this.junction_memory[[this.maze.robot.x, this.maze.robot.y].toString()];
            let direction = null;
            for (let possibility of possibilities) {
                // possibility that we have not been to before
                if (junction_paths.indexOf(possibility) === -1) {
                    direction = possibility;
                    break;
                }
            }
            if (direction === null) {
                // we have been everywhere possible from this junction
                this.goBack();
            } else {
                junction_paths.push(direction);
                this.maze.maze[this.maze.robot.x][this.maze.robot.y] = MAZE.TRAIL;
                this.status = SOLVE_STATUS.EXPLORING;
                this.move(direction);
            }
        } else {
            this.goBack();
        }
    }

    ai() {
        let adjacent = this.adjacent();
        let possibilities = this.possibleNext(adjacent);

        if (this.isSolved()) {
            this.status = SOLVE_STATUS.SOLVED;
            return;
        }

        if (this.status === SOLVE_STATUS.EXPLORING) {
            this.explore(possibilities);
        } else if (this.status === SOLVE_STATUS.RETRACING) {
            this.retrace(adjacent, possibilities);
        }
    }

    done() {
        if (this.status === SOLVE_STATUS.SOLVED || this.status === SOLVE_STATUS.FAILED) {
            return true;
        } else {
            return false;
        }
    }

    step() {
        if (!this.done()) {
            this.ai();
            this.steps += 1;
        }

        return this.status;
    }
}
