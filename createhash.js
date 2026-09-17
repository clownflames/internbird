const bcrypt = require("bcryptjs");

const text = "12345678";

const saltRounds = 10;
const hash = bcrypt.hashSync(text, saltRounds);

console.log("Plain text :", text);
console.log("Hash       :", hash);