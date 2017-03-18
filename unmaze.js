/* Main unmaze library
   Copyright 2017 Mariusz Skoneczko
   Licensed under the MIT license
*/

const MAZE = {
    FREE: 0,
    WALL: 1,
    START: 2,
    END: 3,
    TRAIL: 4
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
        this.maze[x][y].type = MAZE.START;
    }

    setEnd(x, y) {
        this.maze[x][y].type = MAZE.END;
    }

    robotToStart() {
        this.robot.x = this.start.x;
        this.robot.y = this.start.y;
    }
}

class MazeSolver {
    constructor(maze) {
        this.maze = maze;
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

    isSolved(adjacent) {
        for (let key in adjacent) {
            if (adjacent[key] === MAZE.END) {
                return true;
            }
        }
        return false;
    }

    possibleNext(adjacent) {
        let possibilities = [];
        for (let key in adjacent) {
            if (adjacent[key] === MAZE.FREE) {
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
}
