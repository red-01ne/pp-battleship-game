import React, {Component} from "react";
import {connect} from "react-redux";

import {gameAutoMove, gameReset} from "../../store/slices/game";
import {selectIsGameOngoing, selectPlayerGameGridMap, selectPlayersIds} from "../../store/game-selectors";

import GameGrid from "../generic/game-grid";

class DemoGame extends Component {
    constructor(props) {
        super(props);

        this.state = {
            moveDelay: 2e3
        };

        this.moveTimerId = null;
    }

    componentDidMount() {
        const {moveDelay} = this.state;
        const {makeMove, isGameOngoing, onGameReset} = this.props;

        if (isGameOngoing) onGameReset();

        this.moveTimerId = setInterval(makeMove, moveDelay);
    }

    componentWillUnmount() {
        const {isGameOngoing, onGameReset} = this.props;

        if (this.moveTimerId) {
            clearInterval(this.moveTimerId);
            this.moveTimerId = null;
        }

        if (isGameOngoing) onGameReset();
    }

    render() {
        const {
            playerOneGameGridMap,
            playerTwoGameGridMap,
        } = this.props;

        return (
            <div>
                <GameGrid gridMap={playerOneGameGridMap}/>
                <GameGrid gridMap={playerTwoGameGridMap}/>
            </div>
        );
    }
}

export default connect(
    state => ({
        isGameOngoing: selectIsGameOngoing(state),
        playerOneGameGridMap: selectPlayerGameGridMap(state, selectPlayersIds(state)[0]),
        playerTwoGameGridMap: selectPlayerGameGridMap(state, selectPlayersIds(state)[1])
    }),
    {
        onGameReset: gameReset,
        makeMove: gameAutoMove,
    }
)(DemoGame);