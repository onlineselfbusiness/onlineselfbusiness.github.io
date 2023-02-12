// Check for support.
let optionHistoryDB;

let CHANGE_IN_OI = 1
let CLOSING_PRICE = 2
let LAST_TRADED_PRICE = 3
let OPENING_PRICE = 4
let OPEN_INT = 5
let SETTLE_PRICE = 6
let TIMESTAMP = 7
let TRADE_HIGH_PRICE = 8
let TRADE_LOW_PRICE = 9
let UNDERLYING_VALUE = 10
let EXPIRY_DT = 11

async function initializeDB() {
    let promise = new Promise((resolve, reject) => {
        if ('indexedDB' in window) {
            //console.log("This browser support IndexedDB.");
            const request = indexedDB.open('OptionHistoryDB', 1);
            request.onerror = (event) => {
                console.error("onerror")
                resolve('done')
            };
            request.onupgradeneeded = (event) => {
                console.log("onupgradeneeded");
                optionHistoryDB = event.target.result;
                if (!optionHistoryDB.objectStoreNames.contains('optionHistoryStore')) {
                    let objectStore = optionHistoryDB.createObjectStore("optionHistoryStore");
                    objectStore.transaction.oncomplete = (event) => {
                        console.dir('transaction completed successfully')
                    };
                }
                optionHistoryDB.onerror = (event) => {
                    console.error(`Database error: ${event.target.errorCode}`);
                    event.preventDefault(); // don't abort the transaction
                    event.stopPropagation(); // don't bubble error up, "chew" it
                };
                resolve('done')
            };
            request.onsuccess = (event) => {
                //console.log("onsuccess")
                optionHistoryDB = event.target.result
                resolve('done')
            };
        } else {
            resolve('done')
        }
    })
    return promise;
}

function putDataOptionHistoryStore(d, k) {
    const transaction = optionHistoryDB.transaction("optionHistoryStore", "readwrite");
    const dataObjectStore = transaction.objectStore("optionHistoryStore");

    transaction.oncomplete = (event) => {
        console.log("putDataOptionHistoryStore transaction complete");
    };
    transaction.onerror = (event) => {
        console.log("putDataOptionHistoryStore transaction onerror");
    };
    return dataObjectStore.put(d, k);
}

function getDataOptionHistoryStore(k) {
    const transaction = optionHistoryDB.transaction("optionHistoryStore", "readwrite");
    const dataObjectStore = transaction.objectStore("optionHistoryStore");
    transaction.oncomplete = (event) => {
        console.log("getDataOptionHistoryStore transaction complete");
    };
    transaction.onerror = (event) => {
        console.log("getDataOptionHistoryStore transaction onerror");
    };
    return dataObjectStore.get(k);
}

async function putDataSyncOptionHistoryStore(d, k) {
    let promise = new Promise((resolve, reject) => {
        const transaction = optionHistoryDB.transaction("optionHistoryStore", "readwrite");
        const dataObjectStore = transaction.objectStore("optionHistoryStore");
        let objectStore = dataObjectStore.put(d, k);
        objectStore.onsuccess = () => {
            resolve(true)
        };
        objectStore.onerror = () => {
            resolve(false)
        };
    });
    return promise;
}

async function getDataSyncOptionHistoryStore(k) {
    let promise = new Promise((resolve, reject) => {
        const transaction = optionHistoryDB.transaction("optionHistoryStore", "readwrite");
        const dataObjectStore = transaction.objectStore("optionHistoryStore");
        let objectStore = dataObjectStore.get(k);
        objectStore.onsuccess = () => {
            resolve(objectStore.result)
        };
        objectStore.onerror = () => {
            resolve(undefined)
        };
    });
    return promise;
}

async function getAllDataSyncOptionHistoryStore() {
    let promise = new Promise((resolve, reject) => {
        const transaction = optionHistoryDB.transaction("optionHistoryStore", "readwrite");
        const dataObjectStore = transaction.objectStore("optionHistoryStore");
        let objectStore = dataObjectStore.getAll();
        objectStore.onsuccess = () => {
            resolve(objectStore.result)
        };
        objectStore.onerror = () => {
            resolve(undefined)
        };
    });
    return promise;
}