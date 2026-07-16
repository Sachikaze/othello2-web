import {
    initializeApp
}from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getDatabase, ref, set, onValue, onDisconnect, remove,get
}from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyA984Ds3LCEKDW3f39HjUW7QS14sgVLwjo",
    authDomain: "othello2-online.firebaseapp.com",
    databaseURL: "https://othello2-online-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "othello2-online",
    storageBucket: "othello2-online.firebasestorage.app",
    messagingSenderId: "605863873503",
    appId: "1:605863873503:web:a22605e966ea9475a6126a"
};
const app=initializeApp(firebaseConfig);
const db=getDatabase(app);
window.fbRef=ref;
window.fbSet=set;
window.fbOnValue=onValue;
window.fbDb=db;
window.fbOnDisconnect=onDisconnect;
window.fbRemove=remove;
window.fbGet=get;
console.log("Firebase 接続しました")