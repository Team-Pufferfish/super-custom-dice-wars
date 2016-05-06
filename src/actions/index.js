export const add = () => ({
  type: 'ADD'
});

export const remove = () => ({
  type: 'REMOVE'
});

export const setBoardSize = (width,height) => ({
  type: 'SET_BOARD_SIZE',
  width,
  height
});


export const setDiceCount = (count) => ({
  type: 'SET_DICE_COUNT',
  count
});

export const setDiceRollTiming = (timing) => ({
  type: 'SET_DICE_ROLL_TIMING',
  timing
})

export const setBonusDiceCount = (count) => ({
  type: 'SET_BONUS_DICE_COUNT',
  count
});

export const setBonusDiceVariety = (variety) => ({
  type: 'SET_BONUS_DICE_VARIETY',
  variety
});

export const setMovementVariety = (variety) => ({
  type: 'SET_DICE_MOVEMENT',
  variety
});

export const setCombatTradingVariety = (variety) => ({
  type: 'SET_COMBAT_TRADING_VARIETY',
  variety
});
