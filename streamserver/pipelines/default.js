const {parser} = require('stream-json/Parser');
const {streamValues} = require('stream-json/streamers/StreamValues');
const {chain}  = require('stream-chain');
const CUSTOM_PIPELINE = require('./custom.js');

function _injectCtx (arr,ctx) {
  return arr.map(fn => fn(ctx));
}

function sanityCheck(arr) {
  let length = arr.length;
  return Array.isArray(arr) && arr.filter(fn => typeof(fn) === "function").length === length;
}

function compose(ctx) {
  let pipeline = [
    parser({jsonStreaming: true}),
    streamValues()
  ];
  if (sanityCheck(CUSTOM_PIPELINE)) {
    pipeline.push(..._injectCtx(CUSTOM_PIPELINE,ctx));
  } else {
    console.log(`Default Pipeline setup...[Skipping custom pipeline]`);
    if (CUSTOM_PIPELINE.length > 0) {
      console.warn(`Something is wrong : Please review your custom pipeline`);
      process.exit(12);
    }
  }

  return pipeline;
}

module.exports = compose;
