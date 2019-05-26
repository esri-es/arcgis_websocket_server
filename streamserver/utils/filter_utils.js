const regexgen = require('regexgen');
var opsExt = '(AND|OR)';
var opsInt = '(NOT)?(=|<>|LIKE|IS)(NOT)?';
var reOpsExt = new RegExp(`\\)\\s${opsExt}\\s\\(`,"gi");
var reOpsInt = new RegExp(`\\s${opsInt}\\s`,"gi");
const util = require("util");

function buildQuery(field, op, value) {
  return `(${field} ${op} ${value})`;
}

function normalizeValue (str) {

   let safestr = str.replace(/'/g,"").replace("%","");
   let result = safestr;
   if (/(true|false)/i.test(safestr)) {
      result = safestr.replace(/'/g,"").toLowerCase() === "false" ? false : true;
   }
   if (/null/i.test(safestr)) {
       result = null;
   }
   if (/\b[0-9]+\b/.test(safestr)) {
       result = parseInt(safestr);
   }
   if (/\b[0-9\.]+\b/.test(safestr)) {
       result = parseFloat(safestr);
   }
   return result;
}

var operators = {
    "=" : function(data,op1,op2) {
        let op2fixed = normalizeValue(op2);
        return data.hasOwnProperty(op1) && data[op1] === op2fixed;
    },
    "IS" : function(data,op1,op2) {
        let op2fixed = normalizeValue(op2);
        let cond = data[op1] === false && op2fixed === null
            ? true
            : data[op1] == op2fixed;
        return data.hasOwnProperty(op1) && cond;
    },
    "<>" : function(data,op1,op2) {
        let op2fixed = normalizeValue(op2);
        return data.hasOwnProperty(op1) && data[op1] !== op2
    },
    "IS NOT" : function(data,op1,op2) {
        let op2fixed = normalizeValue(op2);
        let cond = data[op1] === false && op2fixed === null
            ? true
            : data[op1] == op2fixed;
        return data.hasOwnProperty(op1) && data[op1] !== op2fixed
    },
    "LIKE" : function(data,op1,op2) {
        let op2fixed = normalizeValue(op2);
        let re = new RegExp(op2fixed,"gi");
        return data.hasOwnProperty(op1) && re.test(data[op1])
    },
    "NOT LIKE" : function(data,op1,op2) {
        let op2fixed = normalizeValue(op2);
        let re = new RegExp(op2fixed,"gi");
        return data.hasOwnProperty(op1) && !re.test(data[op1])
    },
    "CONTAINS" : function(data,op1,op2) {
        let op2fixed = normalizeValue(op2);
        let re = new RegExp(op2fixed, "gi");
        return data.hasOwnProperty(op1) && re.test(data[op1])
    },
    "NOT CONTAINS" : function(data,op1,op2) {
        let op2fixed = normalizeValue(op2);
        let re = new RegExp(op2fixed, "gi");
        return data.hasOwnProperty(op1) && !re.test(data[op1])
    }
}

function translate (d,arr) {
   return operators[arr[1]](d,arr[0],arr[2]);
}

function evaluateQuery(d, queryStr) {
   let operatorChain = queryStr.split(/[^(AND|OR)]/).filter(el => /(AND|OR)/.test(el));
   var lista = queryStr.split(reOpsExt)
    .map(exp => exp.replace(/(\(|\))/g,""))
    .filter(el => !/(AND|OR)/.test(el.replace(/"/g, "")))
    .map(exp => exp.split(/(NOT LIKE|LIKE|IS NOT|IS|NOT CONTAINS|CONTAINS|=|<>)/))
    .map(exp => exp.map(el => el.trim().replace("%","")))
    .map(exp => translate(d,exp));

   let result = lista.length === 1
     ? lista[0]
     : lista.reduce((old,cur,i,arr) => {
       if(i < operatorChain.length) {
            old = i < arr.length
              ? operatorChain[i] === "AND"
                   ? arr[i] && arr[i+1]
                   : arr[i] || arr[i+1]
              : old;
            return old;
       } else {
           return old;
       }
    },true);

    //console.log(`data : [${util.inspect(d, { compact: true, depth: 5, breakLength: 80 })}]\nquery [${queryStr}] -> ${lista} -> ${result}` );

    return result;

}

module.exports = evaluateQuery;
