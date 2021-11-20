import {gameShoot, gameError} from "../slices/game";
import {selectGameGridDescription, selectPlayerShotsHistory} from "../selectors";
import validateGameShoot from "./validate-game-shoot";
import {GameError} from "../../custom-errors";

const gameShootMiddleware = store => next => action => {
    if (action.type === `${gameShoot}`) {
        // action validation
        const state = store.getState();
        const shotsHistory = selectPlayerShotsHistory(state, action.payload.playerId);
        const gridDescription = selectGameGridDescription(state);

        try {
            validateGameShoot(action, shotsHistory, gridDescription);
        } catch (e) {
            if (!(e instanceof GameError)) {
                throw e;
            }

            return store.dispatch(gameError(e));
        }
    }

    return next(action);
};

export default gameShootMiddleware;