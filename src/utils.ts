import util from 'util';
export const hl = (...args) => console.log(util.inspect(args,false,30,true));
