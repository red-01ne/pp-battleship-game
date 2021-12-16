import React, {Component} from "react";

import GameGrid from "../generic/game-grid";

const DEMO_GAME_SESSION = "demoGameSession";

class DemoGame extends Component {
    constructor(props) {
        super(props);

        this.state = {
            moveDelay: 2e2
        };

        this.moveTimerId = null;

        this.saveDemoGameSession = this.saveDemoGameSession.bind(this);
    }

    saveDemoGameSession() {
        const {gameSession} = this.props;

        const persistedDemoGameSessionString = JSON.stringify(gameSession);

        sessionStorage.setItem(DEMO_GAME_SESSION, persistedDemoGameSessionString);
    }

    componentDidMount() {
        const {moveDelay} = this.state;
        const {makeMove, onGameReset, onGameContinue} = this.props;

        let persistedDemoGameSessionString = sessionStorage.getItem(DEMO_GAME_SESSION);

        if (persistedDemoGameSessionString) {
            onGameContinue(persistedDemoGameSessionString);
        } else {
            onGameReset();
        }

        this.moveTimerId = setInterval(makeMove, moveDelay);

        window.addEventListener("unload", this.saveDemoGameSession);
    }

    componentWillUnmount() {
        if (this.moveTimerId) {
            clearInterval(this.moveTimerId);
            this.moveTimerId = null;
        }

        this.saveDemoGameSession();

        window.removeEventListener("unload", this.saveDemoGameSession);
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

export default DemoGame;
