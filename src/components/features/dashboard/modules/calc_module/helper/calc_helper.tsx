export const formatForMathJS = (expr: string) => {
  return expr
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/π/g, "pi")
    .replace(/√\(/g, "sqrt(")
    .replace(/nCr\(/g, "combinations(")
    .replace(/nPr\(/g, "permutations(")
    .replace(/log\(/g, "log10(")
    .replace(/ln\(/g, "log(");
};

export const formatForNerdamer = (expr: string) => {
  return expr
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/π/g, "pi")
    .replace(/√\(/g, "sqrt(")
    .replace(/log\(/g, "log10(")
    .replace(/ln\(/g, "log(")
    .replace(/\|(.+?)\|/g, "abs($1)");
};

export const formatForGraph = (expr: string) => {
  return expr
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/π/g, "PI")
    .replace(/\be\b/g, "2.718281828")
    .replace(/√\(/g, "sqrt(");
};

export const formatResult = (num: any) => {
  if (typeof num !== "number") return num;
  return String(Math.round(num * 1000000000) / 1000000000);
};
