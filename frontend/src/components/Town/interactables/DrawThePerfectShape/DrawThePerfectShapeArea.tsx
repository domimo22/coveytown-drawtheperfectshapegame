import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Heading,
  List,
  ListItem,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useToast,
} from '@chakra-ui/react';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import {
  CombinedGameResult,
  DrawThePerefectShapeGameResult,
  DrawThePerfectShapeDifficulty,
  DrawThePerfectShapePixel,
  DrawThePerfectShapeShape,
  GameStatus,
  InteractableID,
} from '../../../../types/CoveyTownSocket';
import React, { useCallback, useEffect, useState } from 'react';
import GameAreaInteractable from '../GameArea';
import { useInteractable, useInteractableAreaController } from '../../../../classes/TownController';
import useTownController from '../../../../hooks/useTownController';
import Canvas from './Canvas';
import DrawThePerfectShapeController from '../../../../classes/interactable/DrawThePerfectShape/DrawThePerfectShapeAreaController';
import DifficultyDropDown from './DifficultyDropDown';
import PlayerController from '../../../../classes/PlayerController';
import DrawThePerfectShapeLeaderboard from '../DrawThePerfectShapeLeaderboard';
function DrawThePerfectShapeArea({
  interactableID,
}: {
  interactableID: InteractableID;
}): JSX.Element {
  const gameAreaController =
    useInteractableAreaController<DrawThePerfectShapeController>(interactableID);
  const townController = useTownController();
  const toast = useToast();
  const [playerOne, setPlayerOne] = useState<string | undefined>(
    gameAreaController.playerOne?.userName,
  );
  const [playerTwo, setPlayerTwo] = useState<string | undefined>(
    gameAreaController.playerTwo?.userName,
  );
  const [status, setStatus] = useState<GameStatus>(gameAreaController.status); // Initialize status to the current status of the game
  const [difficulty, setDifficulty] = useState<DrawThePerfectShapeDifficulty>(
    gameAreaController.difficulty,
  );
  const [traceShape, setTraceShape] = useState<DrawThePerfectShapeShape | undefined>(
    gameAreaController.traceShape,
  ); // the shape to be traced

  const [timer, setTimer] = useState<number>(gameAreaController.timer); // the timer for the game

  const [player1Pixels, setPlayer1Pixels] = useState<DrawThePerfectShapePixel[]>(
    gameAreaController.playerOneShape?.pixels || [],
  );
  const [player2Pixels, setPlayer2Pixels] = useState<DrawThePerfectShapePixel[]>(
    gameAreaController.playerTwoShape?.pixels || [],
  );
  const [observers, setObservers] = useState<PlayerController[]>(gameAreaController.observers);

  const [player1Accuracy, setPlayer1Accuracy] = useState(gameAreaController.playerOneAccuracy);
  const [player2Accuracy, setPlayer2Accuracy] = useState(gameAreaController.playerTwoAccuracy);
  const [history, setHistory] = useState<DrawThePerefectShapeGameResult[]>(
    gameAreaController.history,
  );

  /**
   * Handles when a user presses the 'Join Game' button
   */
  const handleJoinGame = async () => {
    try {
      await gameAreaController.joinGame();
      setTraceShape(gameAreaController.traceShape);
    } catch (err) {
      console.log('error');
    }
  };

  /**
   * Handles when a user presses the 'Start Game' button
   */
  const handleStartGame = async () => {
    try {
      await gameAreaController.startGame();
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * Handles when a user presses the 'Change Difficulty' button
   */
  const handleChangeDifficulty = async (newDifficulty: DrawThePerfectShapeDifficulty) => {
    setDifficulty(newDifficulty);
    try {
      await gameAreaController.pickDifficulty(newDifficulty);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    function updateGameState() {
      setHistory(gameAreaController.history);
      setPlayerOne(gameAreaController.playerOne?.userName);
      setPlayerTwo(gameAreaController.playerTwo?.userName);
      setStatus(gameAreaController.status);
      setObservers(gameAreaController.observers);
    }

    function onGameEnd() {
      const winner = gameAreaController.winner;
      const playerOneAccuracyInfo = 'Player 1 accuracy: ' + Math.round(100 * player1Accuracy) + '%';
      const playerTwoAccuracyInfo = 'Player 2 accuracy: ' + Math.round(100 * player2Accuracy) + '%';
      console.log('InGAmeEnd');
      if (!gameAreaController.isPlayer) {
        console.log('OBSERVERS');
        toast({
          title: 'Game over',
          description:
            winner?.userName +
            ' has won' +
            '\n' +
            playerOneAccuracyInfo +
            '\n' +
            playerTwoAccuracyInfo,
          status: 'info',
        });
      } else if (winner?.id === townController.ourPlayer.id) {
        toast({
          title: 'Game over',
          description: 'You won!' + '\n' + playerOneAccuracyInfo + '\n' + playerTwoAccuracyInfo,
          status: 'success',
        });
      } else {
        toast({
          title: 'Game over',
          description: 'You lost :(' + '\n' + playerOneAccuracyInfo + '\n' + playerTwoAccuracyInfo,
          status: 'error',
        });
      }
    }

    gameAreaController.addListener('gameUpdated', updateGameState);
    gameAreaController.addListener('difficultyChanged', setDifficulty);
    gameAreaController.addListener('traceShapeChanged', setTraceShape);
    gameAreaController.addListener('timerChanged', setTimer);
    gameAreaController.addListener('gameOver', onGameEnd);
    gameAreaController.addListener('player1Accuracy', setPlayer1Accuracy);
    gameAreaController.addListener('player2Accuracy', setPlayer2Accuracy);
    return () => {
      gameAreaController.removeListener('gameOver', onGameEnd);
      gameAreaController.removeListener('gameUpdated', updateGameState);
      gameAreaController.removeListener('difficultyChanged', setDifficulty);
      gameAreaController.removeListener('traceShapeChanged', setTraceShape);
      gameAreaController.removeListener('timerChanged', setTimer);
      gameAreaController.removeListener('player1Accuracy', setPlayer1Accuracy);
      gameAreaController.removeListener('player2Accuracy', setPlayer2Accuracy);
    };
  }, [gameAreaController, toast, townController, player1Accuracy, player2Accuracy]);

  useEffect(() => {
    gameAreaController.addListener('playerTwoPixelChanged', setPlayer2Pixels);
    const sendPlayerOnePixels = async () => {
      await gameAreaController.makeMove(1, player1Pixels);
    };
    if (gameAreaController.isPlayerOne) {
      if (timer > 0 && status === 'GAME_STARTED') {
        const intervalId = setInterval(sendPlayerOnePixels, 500);
        return () => {
          clearInterval(intervalId);
        };
      }
    }
    return () => {
      gameAreaController.removeListener('playerTwoPixelChanged', setPlayer2Pixels);
    };
  }, [gameAreaController, status, timer, player1Pixels]);

  useEffect(() => {
    gameAreaController.addListener('playerOnePixelChanged', setPlayer1Pixels);
    const sendPlayerTwoPixels = async () => {
      await gameAreaController.makeMove(2, player2Pixels);
    };
    if (gameAreaController.isPlayerTwo) {
      if (timer > 0 && status === 'GAME_STARTED') {
        const intervalId = setInterval(sendPlayerTwoPixels, 500);
        return () => {
          clearInterval(intervalId);
        };
      }
    }
    return () => {
      gameAreaController.removeListener('playerOnePixelChanged', setPlayer1Pixels);
    };
  }, [gameAreaController, player2Pixels, status, timer]);

  const areaStyles: React.CSSProperties = { width: '100%', height: '650px' };
  const canvasRowStyles: React.CSSProperties = {
    width: '100%',
    height: 'fit-content',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  };

  const canvasStyles: React.CSSProperties = {
    marginTop: '20px',
    fontSize: '15px',
    fontWeight: 'bolder',
  };

  const buttonStyles: React.CSSProperties = {
    marginLeft: 'auto',
    marginRight: '10px',
    color: '#FFF',
    padding: '10px',
    borderRadius: '20px',
  };

  const textStyles: React.CSSProperties = {
    fontFamily: 'Futura, sans-serif',
    color: '#3CAEA3',
  };

  const statusMessage = () => {
    switch (status) {
      case 'WAITING_TO_START':
        return 'Waiting for Players to Join';
      case 'IN_PROGRESS':
        return 'Waiting to Start the Game';
      case 'GAME_STARTED':
        return 'Game in Progress';
      case 'OVER':
        return 'Game is over';
    }
  };

  const observersArea = (
    <List aria-label='list of observers in the game'>
      {observers.map(player => {
        return <ListItem key={player.id}>{player.userName}</ListItem>;
      })}
    </List>
  );

  const game = (
    <>
      <div style={{ ...textStyles, marginLeft: '25px' }}>Game Status: {statusMessage()}</div>
      <div
        style={{
          ...textStyles,
          justifyContent: 'center',
          textAlign: 'center',
          fontSize: '20px',
          minHeight: '24px',
        }}>
        {traceShape &&
          status !== 'WAITING_TO_START' &&
          'Shape: ' + gameAreaController.traceShape?.title}
      </div>
      <div style={canvasRowStyles}>
        <div style={{ ...canvasStyles, marginLeft: '50px', color: '#20639B' }}>
          Player 1: {playerOne ? playerOne : 'Waiting For Player'}
          {gameAreaController.isPlayerOne && (
            <Canvas
              penColor='blue'
              canPaint={gameAreaController.isPlayerOne && status === 'GAME_STARTED'}
              tracePixels={traceShape && status !== 'WAITING_TO_START' ? traceShape.pixels : []}
              sendPixels={setPlayer1Pixels}
            />
          )}
          {!gameAreaController.isPlayerOne && (
            <Canvas
              penColor='blue'
              canPaint={false}
              tracePixels={traceShape && status !== 'WAITING_TO_START' ? traceShape.pixels : []}
              backendPixels={player1Pixels}
            />
          )}
        </div>
        {status !== 'WAITING_TO_START' && status !== 'IN_PROGRESS' && (
          <div
            style={{
              ...textStyles,
              marginTop: 'auto',
              marginBottom: 'auto',
              fontSize: '48px',
              border: '3px solid',
              borderRadius: '50%',
              padding: '20px',
              lineHeight: '55px',
              height: '100px',
              width: '100px',
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}>
            {Math.max(Math.trunc(timer), 0)}
          </div>
        )}
        <div style={{ ...canvasStyles, marginRight: '50px', color: '#ED553B' }}>
          Player 2: {playerTwo ? playerTwo : 'Waiting For Player'}
          {gameAreaController.isPlayerTwo && (
            <Canvas
              penColor='red'
              canPaint={gameAreaController.isPlayerTwo && status === 'GAME_STARTED'}
              tracePixels={traceShape && status !== 'WAITING_TO_START' ? traceShape.pixels : []}
              sendPixels={setPlayer2Pixels}
            />
          )}
          {!gameAreaController.isPlayerTwo && (
            <Canvas
              penColor='red'
              canPaint={false}
              tracePixels={traceShape && status !== 'WAITING_TO_START' ? traceShape.pixels : []}
              backendPixels={player2Pixels}
            />
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'row', marginTop: '25px', marginLeft: '25px' }}>
        {gameAreaController.isPlayer && status === 'IN_PROGRESS' && (
          <DifficultyDropDown
            difficulty={difficulty}
            handleSelectDifficulty={handleChangeDifficulty}
          />
        )}
        {(status === 'OVER' ||
          (status !== 'IN_PROGRESS' &&
            status !== 'GAME_STARTED' &&
            !gameAreaController.isPlayer)) && (
          <button
            style={{ ...buttonStyles, backgroundColor: '#3CAEA3', marginRight: '25px' }}
            onClick={async () => handleJoinGame()}>
            Join Game
          </button>
        )}
        {gameAreaController.isPlayer && status === 'IN_PROGRESS' && (
          <button
            style={{ ...buttonStyles, backgroundColor: '#0B6E4F', marginRight: '25px' }}
            onClick={async () => handleStartGame()}>
            Start Game
          </button>
        )}
      </div>
    </>
  );
  const area = (
    <div style={areaStyles}>
      <Tabs>
        <TabList>
          <Tab>Game</Tab>
          <Tab>Leaderboard</Tab>
          <Tab>Observers</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>{game}</TabPanel>
          <TabPanel>
            <DrawThePerfectShapeLeaderboard results={history} />
          </TabPanel>

          <TabPanel>{observersArea}</TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
  return area;
}

export default function DrawThePerfectShapeAreaWrapper(): JSX.Element {
  const gameArea = useInteractable<GameAreaInteractable>('gameArea');
  const townController = useTownController();
  const toast = useToast();
  const closeModal = useCallback(() => {
    if (gameArea) {
      townController.interactEnd(gameArea);
      const controller = townController.getGameAreaController(gameArea);
      townController.unPause();
      try {
        controller.leaveGame();
      } catch (err) {
        toast({
          title: 'Player not in game',
          description: 'Player is not in the current game',
          status: 'info',
        });
      }
    }
  }, [townController, gameArea, toast]);

  if (gameArea && gameArea.getData('type') === 'DrawThePerfectShape') {
    townController.pause();
    return (
      <Modal isOpen={true} onClose={closeModal} closeOnOverlayClick={false} size='5xl'>
        <ModalOverlay />
        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore */}
        <ModalContent>
          <ModalHeader>{gameArea.name}</ModalHeader>
          <ModalCloseButton />
          <DrawThePerfectShapeArea interactableID={gameArea.name} />
        </ModalContent>
      </Modal>
    );
  }
  return <></>;
}
