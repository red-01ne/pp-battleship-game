import {createSlice, nanoid} from "@reduxjs/toolkit";

import {
    selectPlayerUndeployedShips,
    selectPlayerAvailableDeploymentAnchors,
    selectPlayerNextShotsCoords,
    selectPlayersIds,
    selectScoreToWin,
    selectPlayerScore,
    selectPlayerShotsHistory,
    selectPlayerDeploymentMap,
    selectPlayerShotsMap,
} from "../game-selectors";

import {DIRECTIONS} from "../../constants";
import {GameError} from "../../custom-errors";

const {HORIZONTAL, VERTICAL} = DIRECTIONS;

const gameSlice = createSlice({
    name: "game",
    initialState: createInitState(),
    reducers: {
        deploy: {
            reducer(state, action) {
                const {playerId, deploymentHistoryRecord} = action.payload;

                state.players.entities[playerId].deploymentHistory.push(deploymentHistoryRecord);
            },
            prepare(playerId, deploymentHistoryRecord) {
                return {
                    payload: {
                        playerId,
                        deploymentHistoryRecord,
                    }
                };
            }
        },
        shoot: {
            reducer(state, action) {
                const {playerId, shotsHistoryRecord} = action.payload;

                state.players.entities[playerId].shotsHistory.push(shotsHistoryRecord);
            },
            prepare(playerId, shotsHistoryRecord) {
                return {
                    payload: {
                        playerId,
                        shotsHistoryRecord,
                    }
                };
            }
        },
        reset(state) {
            Object.values(state.players.entities).forEach(entity => {
                entity.deploymentHistory = [];
                entity.shotsHistory = [];
            });
        },
        error: {
            reducer(state, action) {
                state.errors.push(action.payload);
            },
            prepare(error) {
                const {message, cause} = error;

                return {
                    payload: {
                        message,
                        cause,
                    }
                };
            }
        },
    }
});

export const {
    deploy: gameDeploy,
    shoot: gameShoot,
    reset: gameReset,
    error: gameError,
} = gameSlice.actions;

export const gameAutoDeploy = playerId => (dispatch, getState) => {
    const state = getState();
    const undeployedShips = selectPlayerUndeployedShips(state, playerId);

    if (!undeployedShips.length) return;

    const shipEntityToDeploy = undeployedShips.length === 1 ?
        undeployedShips[0] :
        undeployedShips[getRandomInteger(0, undeployedShips.length - 1)];

    let deploymentDirection = [HORIZONTAL, VERTICAL][getRandomInteger(0, 1)];

    let availableDeploymentAnchors = selectPlayerAvailableDeploymentAnchors(
        state,
        playerId,
        shipEntityToDeploy.length,
        deploymentDirection,
    );

    // switch deployment direction in case when there are no available spots to deploy with previous direction
    if (!availableDeploymentAnchors.length) {
        deploymentDirection = deploymentDirection === HORIZONTAL ? VERTICAL : HORIZONTAL;

        availableDeploymentAnchors = selectPlayerAvailableDeploymentAnchors(
            state,
            playerId,
            shipEntityToDeploy.length,
            deploymentDirection,
        );
    }

    if (!availableDeploymentAnchors.length) {
        const errorMessage = "Unable to perform ship auto-deployment in any direction.";
        const errorCause = {
            playerId,
            deploymentMap: selectPlayerDeploymentMap(state, playerId),
            ship: shipEntityToDeploy,
        };

        dispatch(gameError(new GameError(errorMessage, errorCause)));

        return;
    }

    const deploymentHistoryRecord = {
        anchorCoords: availableDeploymentAnchors.length === 1 ?
            availableDeploymentAnchors[0] :
            availableDeploymentAnchors[getRandomInteger(0, availableDeploymentAnchors.length - 1)],
        angle: deploymentDirection === HORIZONTAL ? .5 : 0,
        shipId: shipEntityToDeploy.id,
    }

    dispatch(gameDeploy(
        playerId,
        deploymentHistoryRecord
    ));
};

export const gameAutoShot = playerId => (dispatch, getState) => {
    const state = getState();
    const nextShotCoords = selectPlayerNextShotsCoords(state, playerId);

    if (!nextShotCoords.length) {
        const errorMessage = "Unable to perform auto-shot.";
        const errorCause = {
            playerId,
            shotsMap: selectPlayerShotsMap(state, playerId),
        };

        dispatch(gameError(new GameError(errorMessage, errorCause)));

        return;
    }

    const shotsHistoryRecord = {
        coords: nextShotCoords.length === 1 ?
            nextShotCoords[0] : nextShotCoords[getRandomInteger(0, nextShotCoords.length - 1)],
    };

    dispatch(gameShoot(
        playerId,
        shotsHistoryRecord
    ));
};

export const gameAutoMove = () => (dispatch, getState) => {
    const state = getState();

    const [playerOneId, playerTwoId] = selectPlayersIds(state);
    const scoreToWin = selectScoreToWin(state);

    const playerOneScore = selectPlayerScore(state, playerOneId);
    const playerTwoScore = selectPlayerScore(state, playerTwoId);

    if (playerOneScore === scoreToWin || playerTwoScore === scoreToWin) {
        dispatch(gameReset());

        return;
    }

    const playerOneUndeployedShipsIds = selectPlayerUndeployedShips(state, playerOneId);
    const playerTwoUndeployedShipsIds = selectPlayerUndeployedShips(state, playerTwoId);

    if (playerOneUndeployedShipsIds.length || playerTwoUndeployedShipsIds.length) {
        if (playerOneUndeployedShipsIds.length === playerTwoUndeployedShipsIds.length) {
            dispatch(gameAutoDeploy(playerOneId));
        } else {
            dispatch(gameAutoDeploy(playerTwoId))
        }

        return;
    }

    const playerOneShotsHistory = selectPlayerShotsHistory(state, playerOneId);
    const playerTwoShotsHistory = selectPlayerShotsHistory(state, playerTwoId);

    if (playerOneShotsHistory.length === playerTwoShotsHistory.length) {
        dispatch(gameAutoShot(playerOneId));
    } else {
        dispatch(gameAutoShot(playerTwoId));
    }
}

export default gameSlice.reducer;

// *** SUPPLEMENTS ***

function createInitState() {
    const initPlayersEntities = createInitPlayersEntities();
    const shipsEntities = createShipsEntities();

    return {
        settings: {
            gridDescription: {
                // grid coordinates range is from (0, 0) to (width - 1, height - 1)
                width: 10,
                height: 10,
            },
            ships: {
                ids: Object.keys(shipsEntities),
                entities: shipsEntities,
            },
        },
        players: {
            ids: Object.keys(initPlayersEntities),
            entities: initPlayersEntities,
        },
        errors: [],
    };
}

function createShipsEntities() {
    const entities = {};

    for (let length = 4, amount = 1; length > 0; length--, amount++) {
        for (let i = 1; i <= amount; i++) {
            const id = nanoid();

            entities[id] = {
                id,
                length,
            };
        }
    }

    return entities;
}

function createInitPlayersEntities() {
    const playerOneEntity = {
        id: nanoid(),
    };
    const playerTwoEntity = {
        id: nanoid(),
    }

    playerOneEntity.opponentId = playerTwoEntity.id;
    playerTwoEntity.opponentId = playerOneEntity.id;

    return [playerOneEntity, playerTwoEntity].reduce((acc, entity) => {
        entity.deploymentHistory = [];
        entity.shotsHistory = [];

        acc[entity.id] = entity;

        return acc;
    }, {});
}

function getRandomInteger(min, max) {
    const rand = min + Math.random() * (max + 1 - min);

    return Math.floor(rand);
}
