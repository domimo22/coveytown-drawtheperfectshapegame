import InvalidParametersError, {
  GAME_NOT_IN_PROGRESS_MESSAGE,
  GAME_ID_MISSMATCH_MESSAGE,
  INVALID_COMMAND_MESSAGE,
} from '../../../lib/InvalidParametersError';
import Player from '../../../lib/Player';
import {
  DrawThePerfectShapeDifficulty,
  DrawThePerfectShapeGameState,
  DrawThePerfectShapePixel,
  DrawThePerfectShapeTitle,
  GameInstance,
  InteractableCommand,
  InteractableCommandReturnType,
  InteractableType,
} from '../../../types/CoveyTownSocket';
import DrawThePerfectShapeGame from './DrawThePerfectShapeGame';
import GameArea from '../GameArea';
import Shape from './Shapes/Shape';

/**
 * Dummy comment
 */
export default class DrawThePerfectShapeGameArea extends GameArea<DrawThePerfectShapeGame> {
  private _stateUpdated(updatedState: GameInstance<DrawThePerfectShapeGameState>) {
    if (updatedState.state.status === 'OVER') {
      // If we haven't yet recorded the outcome, do so now.
      const gameID = this._game?.id;
      if (gameID && !this._history.find(eachResult => eachResult.gameID === gameID)) {
        const { player1, player2 } = updatedState.state;
        if (player1 && player2) {
          const p1Name =
            this._occupants.find(eachPlayer => eachPlayer.id === player1)?.userName || player1;
          const p2Name =
            this._occupants.find(eachPlayer => eachPlayer.id === player2)?.userName || player2;
          this._history.push({
            gameID,
            scores: {
              [p1Name]: updatedState.state.winner === player1 ? 1 : 0,
              [p2Name]: updatedState.state.winner === player2 ? 1 : 0,
            },
          });
        }
      }
    }
    this._emitAreaChanged();
  }

  public handleCommand<CommandType extends InteractableCommand>(
    command: CommandType,
    player: Player,
  ): InteractableCommandReturnType<CommandType> {
    if (command.type === 'GameMove') {
      const game = this._game;
      if (!game) {
        throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
      }
      if (this._game?.id !== command.gameID) {
        throw new InvalidParametersError(GAME_ID_MISSMATCH_MESSAGE);
      }
      game.applyMove({
        move: command.move,
        playerID: player.id,
        gameID: command.gameID,
      });
      this._stateUpdated(game.toModel());
      return undefined as InteractableCommandReturnType<CommandType>;
    }
    if (command.type === 'JoinGame') {
      let game = this._game;
      if (!game || game.state.status === 'OVER') {
        // No game in progress, make a new one
        game = new DrawThePerfectShapeGame();
        this._game = game;
      }
      game.join(player);
      this._stateUpdated(game.toModel());
      return { gameID: game.id } as InteractableCommandReturnType<CommandType>;
    }
    if (command.type === "PickDifficulty") {
      const game = this._game;
      if (!game) {
        throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
      }
      if (this._game?.id !== command.gameID) {
        throw new InvalidParametersError(GAME_ID_MISSMATCH_MESSAGE);
      }
      this.handleDifficulty(command.gameDifficulty)
      this._stateUpdated(game.toModel());
      return undefined as InteractableCommandReturnType<CommandType>;
    }
    if (command.type === 'LeaveGame') {
      const game = this._game;
      if (!game) {
        throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
      }
      if (this._game?.id !== command.gameID) {
        throw new InvalidParametersError(GAME_ID_MISSMATCH_MESSAGE);
      }
      game.leave(player);
      this._stateUpdated(game.toModel());
      return undefined as InteractableCommandReturnType<CommandType>;
    }
    throw new InvalidParametersError(INVALID_COMMAND_MESSAGE);
  }

  protected getType(): InteractableType {
    return 'DrawThePerfectShapeArea';
  }

  private handleDifficulty(gameDifficulty: DrawThePerfectShapeDifficulty): void {
    let difficulties: DrawThePerfectShapeTitle[] = [];
    if (gameDifficulty === 'Easy') {
      difficulties = ['Circle', 'Square' , 'Star']
    }
    if (gameDifficulty === 'Medium') {
      difficulties = ['Umbrella', 'House', 'Christmas Tree']
    }
    if (gameDifficulty === 'Hard') {
      difficulties = ['Helicopter', 'Car', 'Husky']
    }
    if (difficulties.length > 0) {
      const randomShape = this.getRandomShape(difficulties);
      const traceShapePixels = this.getTraceShapePixels(randomShape);
      const traceDrawThePerfectShapeShape = new Shape(
        randomShape,
        gameDifficulty,
        traceShapePixels
      )
      if (this.game && this.game.state) {
        this.game.state.trace_shape = traceDrawThePerfectShapeShape;
      }
    }
  }

  private getRandomShape(shapes: DrawThePerfectShapeTitle[]): DrawThePerfectShapeTitle {
    return shapes[Math.floor(Math.random() * shapes.length)];
  }

  private getTraceShapePixels(traceShape: DrawThePerfectShapeTitle): DrawThePerfectShapePixel[] {
    // Need to change for all different pictures
    const pixels: DrawThePerfectShapePixel[] = [];
    return pixels;
  }
}
