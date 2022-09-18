// Check for support.
let optionHistoryDB;
if ('indexedDB' in window) {
    console.log("This browser support IndexedDB.");
    const request = indexedDB.open('OptionHistoryDB', 1);
    request.onerror = (event) => {
        console.error("onerror");
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
    };
    request.onsuccess = (event) => {
        console.log("onsuccess");
        optionHistoryDB = event.target.result;
    };
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