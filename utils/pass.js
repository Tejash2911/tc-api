import CryptoJS from "crypto-js";
import { config } from "../config/config.js";

export const decryptPass = (pass) => CryptoJS.AES.decrypt(pass, config.cryptoJsSecretKey).toString(CryptoJS.enc.Utf8);

export const encryptPass = (pass) => CryptoJS.AES.encrypt(pass, config.cryptoJsSecretKey).toString();
