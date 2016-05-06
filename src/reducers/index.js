
import { combineReducers } from 'redux';
import { options } from './options';

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



const reducers = combineReducers({
  appstate,
  options
})

export default reducers;
