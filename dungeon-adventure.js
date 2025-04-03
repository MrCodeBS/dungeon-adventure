const readline = require('readline');

// Create interface for reading from terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Game state
const gameState = {
  playerName: '',
  playerHealth: 100,
  playerInventory: ['rusty dagger', 'torch'],
  currentRoom: 'entrance',
  visitedRooms: new Set(['entrance']),
  gameOver: false
};

// Map of the dungeon
const rooms = {
  entrance: {
    description: "You stand at the entrance of a dark, musty dungeon. Stone walls drip with moisture, and the air feels heavy. Paths lead north and east.",
    exits: {
      north: 'hallway',
      east: 'treasureRoom'
    },
    items: ['coin']
  },
  hallway: {
    description: "A long, narrow hallway stretches before you. Torches flicker on the walls, casting eerie shadows. There's a strange scratching sound coming from somewhere.",
    exits: {
      south: 'entrance',
      north: 'monsterRoom',
      west: 'trapRoom'
    },
    items: []
  },
  treasureRoom: {
    description: "Glittering gold and jewels are scattered across the floor. This must be the treasure room! But it seems too easy...",
    exits: {
      west: 'entrance',
      north: 'trapRoom'
    },
    items: ['gold key', 'silver necklace', 'health potion']
  },
  trapRoom: {
    description: "As you enter, the door slams shut behind you. Poisonous darts shoot from the walls! Quick, you need to find a way out!",
    exits: {
      east: 'hallway',
      south: 'treasureRoom'
    },
    items: ['ancient scroll'],
    trap: true,
    trapTriggered: false
  },
  monsterRoom: {
    description: "A massive troll guards this chamber. It growls as it spots you, raising its club. Behind it, you can see a golden door.",
    exits: {
      south: 'hallway',
      north: 'exitRoom'
    },
    items: ['steel sword'],
    monster: true,
    monsterDefeated: false
  },
  exitRoom: {
    description: "An ornate golden door stands before you. Sunlight streams through cracks around its edges. This must be the way out!",
    exits: {},
    lockedExit: true,
    keyRequired: 'gold key',
    exitMessage: "You insert the gold key into the lock. With a satisfying click, the door swings open. Fresh air rushes in as you step out into the sunlight. Congratulations, you've escaped the dungeon!"
  }
};

// Display the current room description
function describeRoom() {
  const room = rooms[gameState.currentRoom];
  console.log(`\n${room.description}`);
  
  // List items in the room
  if (room.items && room.items.length > 0) {
    console.log(`\nYou see: ${room.items.join(', ')}`);
  }
  
  // List available exits
  const exits = Object.keys(room.exits);
  if (exits.length > 0) {
    console.log(`\nExits: ${exits.join(', ')}`);
  }
}

// Handle player movement
function movePlayer(direction) {
  const currentRoom = rooms[gameState.currentRoom];
  
  // Check if direction is valid
  if (currentRoom.exits[direction]) {
    const nextRoom = currentRoom.exits[direction];
    
    // Special case for exit room when locked
    if (nextRoom === 'exitRoom' && !gameState.playerInventory.includes('gold key')) {
      console.log("\nThe door is locked. You need a gold key to open it.");
      return;
    }
    
    // Special case for monster room if monster is not defeated
    if (nextRoom === 'monsterRoom' && !rooms.monsterRoom.monsterDefeated) {
      if (gameState.playerInventory.includes('steel sword')) {
        console.log("\nYou defeat the troll with your steel sword! The path ahead is now clear.");
        rooms.monsterRoom.monsterDefeated = true;
        rooms.monsterRoom.description = "The troll lies defeated on the ground. The path to the north is clear now.";
      } else {
        console.log("\nThe troll attacks you! Without a proper weapon, you're forced to retreat.");
        gameState.playerHealth -= 20;
        console.log(`You took damage. Health: ${gameState.playerHealth}`);
        if (gameState.playerHealth <= 0) {
          endGame("You've been defeated by the troll. Game over!");
        }
        return;
      }
    }
    
    // Handle trap room
    if (nextRoom === 'trapRoom' && !rooms.trapRoom.trapTriggered) {
      console.log("\nDarts fly from the walls, striking you!");
      gameState.playerHealth -= 30;
      console.log(`You took damage. Health: ${gameState.playerHealth}`);
      rooms.trapRoom.trapTriggered = true;
      
      if (gameState.playerHealth <= 0) {
        endGame("You've been killed by poison darts. Game over!");
        return;
      }
    }
    
    gameState.currentRoom = nextRoom;
    
    // Mark room as visited
    gameState.visitedRooms.add(nextRoom);
    
    // If this is the exit room and player has the key
    if (nextRoom === 'exitRoom' && gameState.playerInventory.includes('gold key')) {
      console.log(`\n${rooms.exitRoom.exitMessage}`);
      endGame("You win!");
      return;
    }
    
    // Describe the new room
    describeRoom();
  } else {
    console.log("\nYou can't go that way.");
  }
}

// Handle taking items
function takeItem(itemName) {
  const room = rooms[gameState.currentRoom];
  const itemIndex = room.items.indexOf(itemName);
  
  if (itemIndex !== -1) {
    // Remove item from room
    room.items.splice(itemIndex, 1);
    // Add to inventory
    gameState.playerInventory.push(itemName);
    
    console.log(`\nYou picked up: ${itemName}`);
    
    // Special case for health potion
    if (itemName === 'health potion') {
      gameState.playerHealth = Math.min(100, gameState.playerHealth + 50);
      console.log(`You drink the health potion. Health restored to ${gameState.playerHealth}.`);
    }
  } else {
    console.log("\nYou don't see that here.");
  }
}

// Display inventory
function showInventory() {
  console.log(`\nInventory: ${gameState.playerInventory.join(', ') || 'empty'}`);
  console.log(`Health: ${gameState.playerHealth}`);
}

// End the game
function endGame(message) {
  console.log(`\n${message}`);
  console.log(`\nExploration rate: ${Math.round((gameState.visitedRooms.size / Object.keys(rooms).length) * 100)}%`);
  console.log(`Items collected: ${gameState.playerInventory.length}`);
  gameState.gameOver = true;
  rl.close();
}

// Process user commands
function processCommand(command) {
  const commandParts = command.toLowerCase().trim().split(' ');
  const action = commandParts[0];
  
  switch (action) {
    case 'go':
    case 'move':
    case 'north':
    case 'south':
    case 'east':
    case 'west':
      const direction = action === 'go' || action === 'move' ? commandParts[1] : action;
      movePlayer(direction);
      break;
      
    case 'take':
    case 'get':
      const item = commandParts.slice(1).join(' ');
      takeItem(item);
      break;
      
    case 'inventory':
    case 'i':
      showInventory();
      break;
      
    case 'look':
      describeRoom();
      break;
      
    case 'help':
      console.log("\nCommands:");
      console.log("  go [direction] - Move in a direction (north, south, east, west)");
      console.log("  take [item] - Pick up an item");
      console.log("  inventory - Show your inventory");
      console.log("  look - Look around");
      console.log("  help - Show this help");
      console.log("  quit - Exit the game");
      break;
      
    case 'quit':
    case 'exit':
      endGame("Thanks for playing!");
      break;
      
    default:
      console.log("\nI don't understand that command. Type 'help' for a list of commands.");
  }
}

// Start the game
function startGame() {
  console.log("\n==== DUNGEON ADVENTURE ====\n");
  console.log("Welcome to the dangerous depths of the ancient dungeon!");
  console.log("Your goal is to find the exit and escape with as much treasure as you can.");
  console.log("Type 'help' for a list of commands.\n");
  
  rl.question("What is your name, brave adventurer? ", (name) => {
    gameState.playerName = name;
    console.log(`\nGood luck, ${name}! Your adventure begins now...\n`);
    
    describeRoom();
    
    gameLoop();
  });
}

// Main game loop
function gameLoop() {
  rl.question("\n> ", (command) => {
    processCommand(command);
    
    if (!gameState.gameOver) {
      gameLoop();
    }
  });
}

// Start the game
startGame();