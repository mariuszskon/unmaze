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
                this.maze[i][j] = {type: MAZE.WALL};
            }
        }
    }

    setStart(x, y) {
        this.start = {x: x, y: y};
    }

    setEnd(x, y) {
        this.maze[x][y].type = MAZE.END;
    }

    robotToStart() {
        this.robot.x = this.start.x;
        this.robot.y = this.start.y;
    }

    resetRobot() {
        this.robotToStart();
        for (let i = 0; i < this.width; i++) {
            for (let j= 0; j < this.height; j++) {
                if (this.maze[i][j].type === MAZE.TRAIL) {
                    this.maze[i][j].type = MAZE.FREE;
                }
            }
        }
    }
}

const SOLVE_STATUS = {
    EXPLORING: 0,
    SOLVED: 1,
    FAILED: 2,
    RETRACING: 3
};

class MazeSolver {
    constructor(maze) {
        this.maze = maze;
        this.status = SOLVE_STATUS.EXPLORING;
        this.junction_memory = [];
    }

    adjacent() {
        let up, right, down, left;

        if (this.maze.robot.y === 0) {
            up = MAZE.WALL;
        } else {
            up = this.maze.maze[this.maze.robot.x][this.maze.robot.y - 1].type;
        }

        if (this.maze.robot.x === this.maze.width - 1) {
            right = MAZE.WALL;
        } else {
            right = this.maze.maze[this.maze.robot.x + 1][this.maze.robot.y].type;
        }

        if (this.maze.robot.y === this.maze.height - 1) {
            down = MAZE.WALL;
        } else {
            down = this.maze.maze[this.maze.robot.x][this.maze.robot.y + 1].type;
        }

        if (this.maze.robot.x === 0) {
            left = MAZE.WALL;
        } else {
            left = this.maze.maze[this.maze.robot.x - 1][this.maze.robot.y].type;
        }

        return {up, right, down, left};
    }

    isSolved() {
        if (this.maze.maze[this.maze.robot.x][this.maze.robot.y].type === MAZE.END) {
            return true;
        } else {
            return false;
        }
    }

    possibleNext(adjacent) {
        let possibilities = [];
        for (let key in adjacent) {
            if (adjacent[key] === MAZE.FREE || adjacent[key] === MAZE.END) {
                possibilities.push(key);
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

    move(direction) {
        if (direction === "up") {
            this.maze.robot.y -= 1;
        } else if (direction === "right") {
            this.maze.robot.x += 1;
        } else if (direction === "down") {
            this.maze.robot.y += 1;
        } else if (direction === "left") {
            this.maze.robot.x -= 1;
        }
    }

    explore(possibilities) {
        if (this.isJunction(possibilities)) {
            // new junction!
            let direction = possibilities[0];
            this.junction_memory.push([direction]);
            // set down trail to avoid considering this a new junction if there is a loop
            this.maze.maze[this.maze.robot.x][this.maze.robot.y].type = MAZE.TRAIL;
            this.move(direction);
        } else if (this.isDeadEnd(possibilities)) {
            // TODO: implement
            this.status = SOLVE_STATUS.RETRACING;
        } else {
            // move to the next available space
            // but first, set down a trail tile (BEFORE moving)
            this.maze.maze[this.maze.robot.x][this.maze.robot.y].type = MAZE.TRAIL;
            this.move(possibilities[0]);
        }
    }

    goBack(adjacent) {
        if (this.junction_memory.length === 0) {
            // there is no junction to go back to, therefore there are no solutions
            this.status = SOLVE_STATUS.FAILED;
        } else {
            let direction = null;
            for (let key in adjacent) {
                if (adjacent[key] === MAZE.TRAIL) {
                    direction = key;
                }
            }
            this.move(direction);
            // remove trail
            this.maze.maze[this.maze.robot.x][this.maze.robot.y].type = MAZE.FREE;
        }
    }

    retrace(adjacent, possibilities) {
        if (this.isJunction(possibilities)) {
            // TODO: choose a direction we have not been in before, or continue retracing if there is none
            let junction_paths = this.junction_memory.pop();
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
                this.goBack(adjacent);
            } else {
                junction_paths.push(direction);
                this.junction_memory.push(junction_paths);
                this.maze.maze[this.maze.robot.x][this.maze.robot.y].type = MAZE.TRAIL;
                this.status = SOLVE_STATUS.EXPLORING;
                this.move(direction);
            }
        } else {
            this.goBack(adjacent);
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
        }

        return this.status;
    }
}
