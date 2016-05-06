
import { combineReducers } from 'redux';

const appstate = (state = 0, action) => {
  switch (action.type) {
    case 'ADD':
      return state + 1;
    case 'REMOVE':
      return state - 1;
    default:
      return state;
  }
};

const diceOptions = (state = {}, action) => {
  switch (action.type) {
    case 'SET_DICE_COUNT':
      return Object.assign({}, state,{
        Count: action.count
      });
    case 'SET_BONUS_DICE_COUNT':
      return Object.assign({}, state, {
        BonusCount: action.count
      });

    case 'SET_DICE_ROLL_TIMING':
      return Object.assign({}, state, {
        RollTiming: action.timing
      });

    case 'SET_BONUS_DICE_VARIETY':
      return Object.assign({}, state, {
        BonusVariety: action.variety
      })
    case 'SET_DICE_MOVEMENT':
      return Object.assign({}, state, {
        MovementVariety: action.variety
      })

    default:
      return state;
  }
}

const combatOptions = (state = {}, action) => {
  switch (action.type) {
      case 'SET_COMBAT_TRADING_VARIETY':
        return Object.assign({}, state, {
          TradingVariety: action.variety
        });
      case 'SET_COMBAT_TRADING_RESULT':
        return Object.assign({}, state, {
          TradingResult: action.result
        });
      default:
        return state;
  }
}

const boardOptions = (state = {}, action) => {
  switch (action.type) {
    case 'SET_BOARD_SIZE':
      return Object.assign({}, state,{
        BoardWidth: action.width,
        BoardHeight: action.height
      });
    default:
      return state;
  }
}

const options = combineReducers({
  dice: diceOptions,
  board: boardOptions,
  combat: combatOptions
})

const reducers = combineReducers({
  appstate,
  options
})

export default reducers;
