"use client"

import { useState, useEffect, useRef } from "react"

export default function WeddingDash() {
  const [isJumping, setIsJumping] = useState(false)
  const [playerBottom, setPlayerBottom] = useState(0)
  const [obstacles, setObstacles] = useState([])
  const [powerUps, setPowerUps] = useState([])
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [playerEmoji, setPlayerEmoji] = useState("👰")
  const [nearMiss, setNearMiss] = useState(false)
  const [speedMultiplier, setSpeedMultiplier] = useState(1)
  const [canJump, setCanJump] = useState(true)
  const gravity = 2
  const jumpPower = 16
  const jumpCooldown = useRef(false)
  const gameRef = useRef(null)
  const spawnerTimeout = useRef(null)
  const powerUpTimeout = useRef(null)

  const resetGame = () => {
    setObstacles([])
    setPowerUps([])
    setScore(0)
    setPlayerBottom(0)
    setGameOver(false)
    setGameStarted(false)
    setNearMiss(false)
    setSpeedMultiplier(1)
    setCanJump(true)
    clearTimeout(spawnerTimeout.current)
    clearTimeout(powerUpTimeout.current)
  }

  useEffect(() => {
    if (!gameStarted || gameOver) return

    const gameLoop = setInterval(() => {
      setObstacles((prev) =>
        prev.map((obs) => ({ ...obs, left: obs.left - 20 * speedMultiplier })).filter((obs) => obs.left > -50),
      )
      setPowerUps((prev) =>
        prev.map((p) => ({ ...p, left: p.left - 20 * speedMultiplier })).filter((p) => p.left > -50),
      )
      setScore((prev) => prev + 1)
      setSpeedMultiplier((prev) => Math.min(prev + 0.002 + Math.floor(score / 500) * 0.02, 5))
    }, 100)

    const scheduleObstacle = () => {
      const delay = 1500 + Math.random() * 2000
      spawnerTimeout.current = setTimeout(() => {
        setObstacles((prev) => [...prev, { left: window.innerWidth }])
        scheduleObstacle()
      }, delay)
    }

    const schedulePowerUp = () => {
      const delay = 5000 + Math.random() * 5000
      powerUpTimeout.current = setTimeout(() => {
        setPowerUps((prev) => [...prev, { left: window.innerWidth }])
        schedulePowerUp()
      }, delay)
    }

    scheduleObstacle()
    schedulePowerUp()

    return () => {
      clearInterval(gameLoop)
      clearTimeout(spawnerTimeout.current)
      clearTimeout(powerUpTimeout.current)
    }
  }, [gameStarted, gameOver])

  useEffect(() => {
    const gravityEffect = setInterval(() => {
      setPlayerBottom((bottom) => {
        const newBottom = Math.max(bottom - gravity, 0)
        if (bottom > 0 && newBottom === 0) setCanJump(true)
        return newBottom
      })
    }, 20)
    return () => clearInterval(gravityEffect)
  }, [])

  useEffect(() => {
    const playerLeft = 40
    const playerTop = 300 - playerBottom - 40
    const playerRight = playerLeft + 40
    const playerBottomEdge = playerTop + 40

    let nearMissDetected = false

    obstacles.forEach((obs) => {
      const obstacleLeft = obs.left
      const obstacleTop = 300 - 32
      const obstacleRight = obstacleLeft + 32
      const obstacleBottom = obstacleTop + 32

      const horizontalOverlap = playerLeft < obstacleRight && playerRight > obstacleLeft
      const verticalOverlap = playerTop < obstacleBottom && playerBottomEdge > obstacleTop

      if (horizontalOverlap && verticalOverlap) {
        setGameOver(true)
      } else {
        const horizontalDistance = Math.max(0, Math.max(obstacleLeft - playerRight, playerLeft - obstacleRight))
        const verticalDistance = Math.max(0, Math.max(obstacleTop - playerBottomEdge, playerTop - obstacleBottom))
        const distance = Math.sqrt(horizontalDistance ** 2 + verticalDistance ** 2)

        if (distance <= 10) {
          nearMissDetected = true
        }
      }
    })

    powerUps.forEach((p, index) => {
      const pLeft = p.left
      const pTop = 300 - 32
      const pRight = pLeft + 32
      const pBottom = pTop + 32

      const overlap = playerLeft < pRight && playerRight > pLeft && playerTop < pBottom && playerBottomEdge > pTop

      if (overlap) {
        setPowerUps((prev) => prev.filter((_, i) => i !== index))
        setScore((s) => s + 50)
      }
    })

    setNearMiss(nearMissDetected)
  }, [obstacles, powerUps, playerBottom])

  const handleKeyPress = (e) => {
    if (!gameStarted && e.code === "Space") {
      setGameStarted(true)
      return
    }

    if (gameOver) return

    if (e.code === "Space" && !isJumping && !jumpCooldown.current && canJump) {
      setIsJumping(true)
      setCanJump(false)
      jumpCooldown.current = true
      let velocity = jumpPower

      const jumpInterval = setInterval(() => {
        setPlayerBottom((bottom) => {
          const newBottom = bottom + velocity
          velocity -= 1
          if (velocity <= 0) {
            clearInterval(jumpInterval)
            setIsJumping(false)
            setTimeout(() => (jumpCooldown.current = false), 200)
          }
          return newBottom
        })
      }, 20)
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [gameStarted, gameOver, canJump])

  return (
    <div className="w-full h-[300px] bg-pink-100 relative overflow-hidden rounded-2xl shadow-xl" ref={gameRef}>
      {!gameStarted && !gameOver && (
        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center text-pink-600 text-xl p-4 text-center">
          <p className="font-bold text-2xl mb-4">🎮 Welcome to Wedding Dash!</p>
          <p>Help the bride or groom jump over the flying bouquets.</p>
          <p className="mb-2">Collect 🎁 presents for bonus points! Each one gives you +50 points.</p>
          <p className="mb-2">Choose your character:</p>
          <div className="flex gap-4 text-3xl mb-4">
            <button onClick={() => setPlayerEmoji("👰")}>👰</button>
            <button onClick={() => setPlayerEmoji("🤵")}>🤵</button>
          </div>
          <p>
            Press <span className="font-bold">Space</span> to jump and start!
          </p>
          <p className="mt-4 animate-bounce">Press Space to Start</p>
        </div>
      )}

      <div
        className="absolute w-10 h-10 flex items-center justify-center text-3xl"
        style={{ bottom: `${playerBottom}px`, left: "40px" }}
      >
        {playerEmoji}
      </div>

      {obstacles.map((obs, index) => (
        <div
          key={`obstacle-${index}`}
          className="absolute text-2xl"
          style={{ left: `${obs.left}px`, bottom: "0px", width: "32px", height: "32px" }}
        >
          💐
        </div>
      ))}

      {powerUps.map((p, index) => (
        <div
          key={`powerup-${index}`}
          className="absolute text-2xl"
          style={{ left: `${p.left}px`, bottom: "65px", width: "32px", height: "32px" }}
        >
          🎁
        </div>
      ))}

      {nearMiss && !gameOver && (
        <div className="absolute top-10 right-10 px-3 py-1 bg-yellow-300 text-yellow-900 font-bold rounded shadow">
          Near Miss!
        </div>
      )}

      {gameOver && (
        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center text-pink-600 text-xl">
          <p>💥 Oops! You hit an obstacle!</p>
          <p className="mt-2 font-bold">Final Score: {score}</p>
          <button
            className="mt-4 px-4 py-2 bg-pink-500 text-white rounded-xl shadow-md hover:bg-pink-600"
            onClick={resetGame}
          >
            Retry
          </button>
        </div>
      )}

      {!gameOver && gameStarted && <div className="absolute top-2 left-2 text-pink-600 font-bold">Score: {score}</div>}
    </div>
  )
}

