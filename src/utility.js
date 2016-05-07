import Random from 'random-js'

export function rollDie(){
  var random = new Random();
  return random.integer(1,6);
}

export function getRandomInBounds(x,y,w,h){
  if (!h) h = w;
  var random = new Random();
  var nx = random.integer(x, x+w);
  var ny = random.integer(y, y+h);
  return [nx,ny];
}

export function getRandomInsideBounds(x,y,w,h,box){
  if (!h) h = w;
  var random = new Random();
  var nx = random.integer(x, x+w);
  if(nx + box > x + w) nx -= box;
  var ny = random.integer(y, y+h);
  if (ny + box > y+h) ny = y+h-box;
  return [nx,ny];
}

export function getRandomWithinPoints(pointA, pointB){
  return getRandomInBounds(pointA.x,pointA.y,pointB.x-pointA.x,pointB.y-pointA.y);
}
