import 

options = {
    const setBoardSize = (width,height) => ({
    type: 'SET_BOARD_SIZE',
    width,
    height
  });

    const setDiceCount = (count) => ({
    type: 'SET_DICE_COUNT',
    count
  });

    const setDiceRollTiming = (timing) => ({
    type: 'SET_DICE_ROLL_TIMING',
    timing
  })

    const setBonusDiceCount = (count) => ({
    type: 'SET_BONUS_DICE_COUNT',
    count
  });

    const setBonusDiceVariety = (variety) => ({
    type: 'SET_BONUS_DICE_VARIETY',
    variety
  });

    const setMovementVariety = (variety) => ({
    type: 'SET_DICE_MOVEMENT',
    variety
  });

    const setCombatTradingVariety = (variety) => ({
    type: 'SET_COMBAT_TRADING_VARIETY',
    variety
  });

    const setCombatTradingResult = (result) => ({
    type: 'SET_COMBAT_TRADING_RESULT',
    result
  });

}

export default
{
  options;
}
