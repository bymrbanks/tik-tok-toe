import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import OIcon from "./OIcon";
import XIcon from "./XIcon";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SERVER_URL = "https://tik-tok-toe-server-production.up.railway.app/"; // Use your server's URL

type GameState = {
  id: string;
  board: (string | null)[][];
  players: string[];
  winner: string | null;
  currentTurn: string | null;
  isPublic: boolean;
  isFinished: boolean;
  rounds: number;
  points: { [playerId: string]: number };
};

function TicTacToe() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameId, setGameId] = useState<string>("");
  const socket = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to the server
    socket.current = io(SERVER_URL);

    // Handle server events here...
    socket.current.on("gameState", (data: GameState) => {
      setGameState(data);
    });

    socket.current.on("gameCreated", (data: { gameId: string }) => {
      setGameId(data.gameId);
    });

    socket.current.on("roundOver", (data: GameState) => {
      toast.info(
        `Round Over! ${
          data.winner === socket.current?.id ? "You won!" : "You lost."
        }`,
        {
          position: "bottom-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        }
      );
      setGameState(data);
    });

    socket.current.on("matchOver", (winner: string) => {
      toast.success(
        `Match Over! ${
          winner === socket.current?.id ? "You won!" : "You lost."
        }`,
        {
          position: "bottom-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        }
      );
      setGameState(null);
    });

    socket.current.on("exitGame", () => {
      setGameState(null); // Reset game state, this should kick the user out of the game
    });

    socket.current.on("draw", (data: GameState) => {
      toast.warning("Round Over! It was a draw.", {
        position: "bottom-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      setGameState({ ...data, board: createEmptyBoard() }); // Clear the local state
    });

    // Cleanup on unmount
    return () => {
      socket.current?.disconnect();
    };
  }, []);

  const createEmptyBoard = (): (string | null)[][] => {
    return Array<null>(3)
      .fill(null)
      .map(() => Array<string | null>(3).fill(null));
  };
  const createGame = (isPublic: boolean) => {
    socket.current?.emit("createGame", isPublic);
  };

  const joinGame = () => {
    if (gameId) {
      socket.current?.emit("joinGame", gameId);
    }
  };

  const makeMove = (position: [number, number]) => {
    if (gameState && socket.current?.id === gameState.currentTurn) {
      socket.current?.emit("move", { row: position[0], col: position[1] });
    }
  };

  console.log(socket.current?.id);
  console.log(gameState?.currentTurn);
  // Render your component...
  return (
    <div>
      <div className="game-title">
        <h1>Tic Tac Toe</h1>
      </div>
      {!gameState && (
        <div className="room-controls">
          <input
            type="text"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            placeholder="Game ID"
          />
          <div className="buttons">
            <button
              className="btn btn-primary"
              onClick={() => createGame(true)}
            >
              Create Public Game
            </button>
            <button className="btn " onClick={joinGame}>
              Join Game
            </button>
          </div>
        </div>
      )}
      {gameState && (
        <div>
          <p className="rounds-text">Rounds: {gameState.rounds}</p>
          <div className="board">
            <div className="player-info-box">
              {gameState.players.map((playerId, index) => (
                <div
                  className={`player-info player-info-${index} ${
                    gameState.currentTurn === playerId ? "current-turn" : ""
                  }`}
                  key={playerId}
                >
                  <span>{index === 0 ? <XIcon /> : <OIcon />}</span>

                  {socket.current?.id === playerId ? "You" : `Opponent`}
                  <br />
                  {gameState.points[playerId]}
                </div>
              ))}
              <div className="vs-text">VS</div>
            </div>
          </div>

          <div className="game-board">
            {gameState.board.map((row, rowIndex) => (
              <div className="cell-row" key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <button
                    className="cell"
                    key={cellIndex}
                    onClick={() => makeMove([rowIndex, cellIndex])}
                    disabled={
                      gameState.isFinished ||
                      gameState.currentTurn !== socket.current?.id
                    }
                  >
                    {cell === gameState.players[0] && <XIcon />}
                    {cell === gameState.players[1] && <OIcon />}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <ToastContainer />
          {gameState.isFinished && (
            <p>
              {gameState.winner === socket.current?.id
                ? "You won!"
                : "You lost."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default TicTacToe;
