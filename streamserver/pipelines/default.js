const {parser} = require('stream-json/Parser');
const {streamValues} = require('stream-json/streamers/StreamValues');
const {chain}  = require('stream-chain');
const CUSTOM_PIPELINE = require('./custom.js');

function _injectCtx (arr,ctx) {
  return arr.map(fn => fn(ctx));
}

function compose(ctx) {
  let pipeline = [
    parser({jsonStreaming: true}),
    streamValues()
  ];
  if (CUSTOM_PIPELINE.length > 0) {
    pipeline.push(..._injectCtx(CUSTOM_PIPELINE,ctx));
  }

  return pipeline;
}

module.exports = compose;
